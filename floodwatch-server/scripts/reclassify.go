package scripts

import (
	"log"

	"github.com/aws/aws-sdk-go/aws"
	awsSession "github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"

	"github.com/O-C-R/floodwatch/floodwatch-server/backend"
	"github.com/O-C-R/floodwatch/floodwatch-server/data"
)

type ReclassifyOptions struct {
	Backend                     *backend.Backend
	AWSSession                  *awsSession.Session
	S3Bucket                    string
	SQSClassifierInputQueueURL  string
	SQSClassifierOutputQueueURL string
}

func reclassifyOne(sqsClient *sqs.SQS, inputQueueURL, s3Bucket string, ad data.Ad) {
	adIDString := ad.ID.String()
	key := adIDString + ".png"

	sendMessageInput := &sqs.SendMessageInput{
		MessageBody: aws.String(" "),
		QueueUrl:    aws.String(inputQueueURL),
		MessageAttributes: map[string]*sqs.MessageAttributeValue{
			"id": {
				DataType:    aws.String("String"),
				StringValue: aws.String(adIDString),
			},
			"bucket": {
				DataType:    aws.String("String"),
				StringValue: aws.String(s3Bucket),
			},
			"key": {
				DataType:    aws.String("String"),
				StringValue: aws.String(key),
			},
		},
	}

	if _, err := sqsClient.SendMessage(sendMessageInput); err != nil {
		log.Fatal(err)
		return
	}
}

func ReclassifyAll(options *ReclassifyOptions) {
	sqsClient := sqs.New(options.AWSSession)

	ads, err := options.Backend.UnclassifiedAds()
	if err != nil {
		log.Fatal(err)
	}

	log.Printf("Received %d ads to reclassify\n", len(ads))

	for idx, ad := range ads {
		if idx%10 == 0 {
			log.Printf("%d / %d (%.2f%%)\n", idx, len(ads), float64(idx)/float64(len(ads))*100)
		}

		reclassifyOne(sqsClient, options.SQSClassifierInputQueueURL, options.S3Bucket, ad)
	}

	log.Printf("Done!\n")
}
