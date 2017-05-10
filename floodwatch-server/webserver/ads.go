package webserver

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/O-C-R/auth/id"
	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/service/s3"
	"github.com/aws/aws-sdk-go/service/sqs"

	"github.com/O-C-R/floodwatch/floodwatch-server/data"
)

func handleClassifierOutput(options *Options) {
	sqsClient := sqs.New(options.AWSSession)

	for {
		receiveMessageInput := &sqs.ReceiveMessageInput{
			QueueUrl:            aws.String(options.SQSClassifierOutputQueueURL), // Required
			MaxNumberOfMessages: aws.Int64(1),
			MessageAttributeNames: []*string{
				aws.String("id"),
			},
			VisibilityTimeout: aws.Int64(10),
		}

		response, err := sqsClient.ReceiveMessage(receiveMessageInput)
		if err != nil {
			log.Println(err)
		}

		for _, message := range response.Messages {
			if _, ok := message.MessageAttributes["id"]; !ok {
				log.Println("sqs message missing id")
				continue
			}

			adID := id.ID{}
			if err := adID.UnmarshalText([]byte(*message.MessageAttributes["id"].StringValue)); err != nil {
				log.Println(err)
				continue
			}

			classificationOutput := []byte(*message.Body)
			classificationResponse := &data.ClassificationResponse{}
			if err := json.Unmarshal(classificationOutput, classificationResponse); err != nil {
				log.Println(err)
				continue
			}

			adCategoryName, _ := classificationResponse.MostProbableCategory()
			adCategory := &data.AdCategory{
				Name: adCategoryName,
			}

			currentAdCategoryID, err := options.Backend.UpsertAdCategory(adCategory)
			if err != nil {
				log.Println(err)
				continue
			}

			if err := options.Backend.UpdateAdFromClassifier(adID, currentAdCategoryID, classificationOutput); err != nil {
				log.Println(err)
				continue
			}

			deleteMessageInput := &sqs.DeleteMessageInput{
				QueueUrl:      aws.String(options.SQSClassifierOutputQueueURL),
				ReceiptHandle: message.ReceiptHandle,
			}

			if _, err := sqsClient.DeleteMessage(deleteMessageInput); err != nil {
				log.Println(err)
			}
		}
	}
}

func handleAdRequest(options *Options, s3Client *s3.S3, sqsClient *sqs.SQS, personID id.ID, adRequest *data.AdRequest, adResponseCh chan *data.AdResponse) {
	adResponse := &data.AdResponse{
		ID:      adRequest.Capture.Image.ID,
		LocalID: adRequest.Ad.LocalID,
	}

	defer func() {
		adResponseCh <- adResponse
		close(adResponseCh)
	}()

	reader, err := adRequest.Capture.Image.Reader()
	if err != nil {
		adResponse.Error = err.Error()
		return
	}

	adID := adRequest.Capture.Image.ID
	adIDString := adID.String()
	key := adIDString + ".png"
	putObjectInput := &s3.PutObjectInput{
		Body:          reader,
		Key:           aws.String(key),
		ContentType:   aws.String("image/png"),
		CacheControl:  aws.String("max-age=31536000"),
		ContentLength: aws.Int64(int64(reader.Len())),
		Bucket:        aws.String(options.S3Bucket),
	}

	if _, err := s3Client.PutObject(putObjectInput); err != nil {
		adResponse.Error = err.Error()
		return
	}

	ad, err := options.Backend.Ad(adRequest.Capture.Image.ID)
	if err != nil {
		adResponse.Error = err.Error()
		return
	}

	if ad == nil {
		ad = &data.Ad{
			ID: adID,
		}

		if err := options.Backend.AddAd(ad); err != nil {
			adResponse.Error = err.Error()
			return
		}
	}

	siteURL, err := url.Parse(adRequest.Ad.TopURL)
	if err != nil {
		adResponse.Error = err.Error()
		return
	}

	siteID, err := id.New()
	if err != nil {
		adResponse.Error = err.Error()
		return
	}

	site := &data.Site{
		ID:       siteID,
		Hostname: siteURL.Host,
	}

	currentSiteID, err := options.Backend.UpsertSite(site)
	if err != nil {
		adResponse.Error = err.Error()
		return
	}

	currentSiteIDVal, ok := currentSiteID.(id.ID)
	if !ok {
		adResponse.Error = "Bad ID"
		return
	}

	impressionID, err := id.New()
	if err != nil {
		adResponse.Error = err.Error()
		return
	}

	impression := &data.Impression{
		ID:       impressionID,
		SiteID:   currentSiteIDVal,
		PersonID: personID,
		LocalID:  adRequest.Ad.LocalID,
		AdID:     adID,
		// AdURLS:      adRequest.Ad.AdURLS,
		TopURL:      adRequest.Ad.TopURL,
		CaptureType: adRequest.Capture.CaptureType,
		MediaType:   adRequest.Ad.MediaType,
		HTML:        adRequest.Ad.HTML,
		Timestamp:   time.Now(),
	}

	if _, err := options.Backend.UpsertImpression(impression); err != nil {
		adResponse.Error = err.Error()
		return
	}

	sendMessageInput := &sqs.SendMessageInput{
		MessageBody: aws.String(" "),
		QueueUrl:    aws.String(options.SQSClassifierInputQueueURL),
		MessageAttributes: map[string]*sqs.MessageAttributeValue{
			"id": {
				DataType:    aws.String("String"),
				StringValue: aws.String(adIDString),
			},
			"bucket": {
				DataType:    aws.String("String"),
				StringValue: aws.String(options.S3Bucket),
			},
			"key": {
				DataType:    aws.String("String"),
				StringValue: aws.String(key),
			},
		},
	}

	if _, err := sqsClient.SendMessage(sendMessageInput); err != nil {
		adResponse.Error = err.Error()
		return
	}

	if ad.CategoryID != nil {
		adCategory, err := options.Backend.AdCategory(*ad.CategoryID)
		if err != nil {
			adResponse.Error = err.Error()
			return
		}

		if adCategory != nil {
			adResponse.CategoryName = adCategory.Name
		}
	}
}

func Ads(options *Options) http.Handler {
	s3Client := s3.New(options.AWSSession)
	sqsClient := sqs.New(options.AWSSession)

	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		session := ContextSession(req.Context())
		if session == nil {
			Error(w, nil, 500)
		}

		var adsRequest data.AdsRequest
		if err := json.NewDecoder(req.Body).Decode(&adsRequest); err != nil {
			Error(w, err, 400)
			return
		}

		adResponseChs := make([]chan *data.AdResponse, len(adsRequest.Ads))
		for i, adRequest := range adsRequest.Ads {
			adResponseChs[i] = make(chan *data.AdResponse)
			go handleAdRequest(options, s3Client, sqsClient, session.UserID, adRequest, adResponseChs[i])
		}

		adsResponse := &data.AdsResponse{make([]*data.AdResponse, len(adsRequest.Ads))}
		for i, adResponseCh := range adResponseChs {
			adsResponse.Ads[i] = <-adResponseCh
		}

		WriteJSON(w, adsResponse)
	})
}

func FilteredAdStats(options *Options) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		session := ContextSession(req.Context())
		if session == nil {
			Error(w, nil, 401)
			return
		}

		decoder := json.NewDecoder(req.Body)
		var filterRequest data.FilterRequest
		err := decoder.Decode(&filterRequest)
		if err != nil {
			Error(w, err, 500)
		}
		defer req.Body.Close()

		resA, err := options.Backend.FilteredAds(filterRequest.FilterA, session.UserID)
		if err != nil {
			Error(w, err, 500)
		}

		resB, err := options.Backend.FilteredAds(filterRequest.FilterB, session.UserID)
		if err != nil {
			Error(w, err, 500)
		}

		res := data.FilterResponse{
			FilterA: resA,
			FilterB: resB,
		}

		WriteJSON(w, res)
	})
}

func GenerateScreenshot(options *Options) http.Handler {
	s3Client := s3.New(options.AWSSession)

	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		session := ContextSession(req.Context())
		if session == nil {
			Error(w, nil, 401)
			return
		}

		decoder := json.NewDecoder(req.Body)
		var generateRequest data.GenerateRequest
		err := decoder.Decode(&generateRequest)
		if err != nil {
			Error(w, err, 500)
		}
		defer req.Body.Close()

		resA, err := options.Backend.FilteredAds(generateRequest.FilterA, session.UserID)
		if err != nil {
			Error(w, err, 500)
		}

		resB, err := options.Backend.FilteredAds(generateRequest.FilterB, session.UserID)
		if err != nil {
			Error(w, err, 500)
		}

		galleryImageData := data.GalleryImageData{
			FilterA:  generateRequest.FilterA,
			FilterB:  generateRequest.FilterA,
			DataA:    resA,
			DataB:    resB,
			CurTopic: generateRequest.CurTopic,
		}

		buf := new(bytes.Buffer)
		encoder := json.NewEncoder(buf)
		err = encoder.Encode(galleryImageData)

		dataParam := buf.String()
		dataParam = strings.TrimSpace(dataParam)
		dataParam = url.QueryEscape(dataParam)

		generateUrl := fmt.Sprintf("%s/generate?data=%s", options.Hostname, dataParam)
		log.Printf("Generating image for: %s\n", generateUrl)

		screenshotImgData, err := options.Screenshot.Capture(generateUrl)
		if err != nil {
			Error(w, err, 500)
		}

		screenshotID, err := id.New()
		if err != nil {
			Error(w, err, 500)
			return
		}

		screenshotImgDataReader := bytes.NewReader(screenshotImgData)
		screenshotIDString := screenshotID.String()
		key := screenshotIDString + ".png"
		putObjectInput := &s3.PutObjectInput{
			Body:          screenshotImgDataReader,
			Key:           aws.String(key),
			ContentType:   aws.String("image/png"),
			CacheControl:  aws.String("max-age=31536000"),
			ContentLength: aws.Int64(int64(len(screenshotImgData))),
			Bucket:        aws.String(options.S3GalleryBucket),
		}

		if _, err := s3Client.PutObject(putObjectInput); err != nil {
			Error(w, err, 500)
		}

		galleryImage := &data.GalleryImage{
			ID:        screenshotID,
			CreatorID: session.UserID,
			CreatedAt: time.Now(),
		}
		galleryImage.SetData(galleryImageData)

		if _, err := options.Backend.AddGalleryImage(galleryImage); err != nil {
			Error(w, err, 500)
		}

		output := make(map[string]interface{})
		output["url"] = fmt.Sprintf("https://s3.amazonaws.com/%s/%s", options.S3GalleryBucket, key)

		WriteJSON(w, output)
	})
}
