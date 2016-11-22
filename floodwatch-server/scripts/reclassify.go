package main // package scripts

import (
	"flag"
	"log"
	"os"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/aws/aws-sdk-go/service/sqs"

	"github.com/O-C-R/floodwatch/floodwatch-server/backend"
	"github.com/O-C-R/floodwatch/floodwatch-server/data"
)

var (
	config struct {
		addr, staticPath, backendURL, sessionStoreAddr, sessionStorePassword, s3Bucket, sqsClassifierInputQueueURL, sqsClassifierOutputQueueURL string
		insecure                                                                                                                                bool
	}
)

func init() {
	flag.StringVar(&config.backendURL, "backend-url", "postgres://localhost/floodwatch_v2?sslmode=disable", "postgres backend URL")
	flag.StringVar(&config.sessionStoreAddr, "session-store-address", "localhost:6379", "redis session store address")
	flag.StringVar(&config.sessionStorePassword, "session-store-password", "", "redis session store password")
	flag.StringVar(&config.addr, "a", "127.0.0.1:8080", "address to listen on")
	flag.StringVar(&config.s3Bucket, "bucket", "floodwatch-ads", "S3 bucket")
	flag.StringVar(&config.sqsClassifierInputQueueURL, "input-queue-url", "https://sqs.us-east-1.amazonaws.com/963245043784/classifier-input", "S3 bucket")
	flag.StringVar(&config.sqsClassifierOutputQueueURL, "output-queue-url", "https://sqs.us-east-1.amazonaws.com/963245043784/classifier-output", "S3 bucket")
	flag.StringVar(&config.staticPath, "static", "", "static path")
	flag.BoolVar(&config.insecure, "i", false, "insecure (no user authentication)")
}

func reclassify(sqsClient *sqs.SQS, ad data.Ad) {
	adIDString := ad.ID.String()
	key := adIDString + ".png"

	sendMessageInput := &sqs.SendMessageInput{
		MessageBody: aws.String(" "),
		QueueUrl:    aws.String(config.sqsClassifierInputQueueURL),
		MessageAttributes: map[string]*sqs.MessageAttributeValue{
			"id": {
				DataType:    aws.String("String"),
				StringValue: aws.String(adIDString),
			},
			"bucket": {
				DataType:    aws.String("String"),
				StringValue: aws.String(config.s3Bucket),
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

	log.Print(adIDString)
}

func main() {
	flag.Parse()

	if backendURL := os.Getenv("BACKEND_URL"); backendURL != "" {
		config.backendURL = backendURL
	}

	if bucket := os.Getenv("BUCKET"); bucket != "" {
		config.s3Bucket = bucket
	}

	if inputQueueURL := os.Getenv("INPUT_QUEUE_URL"); inputQueueURL != "" {
		config.sqsClassifierInputQueueURL = inputQueueURL
	}

	b, err := backend.New(config.backendURL)
	if err != nil {
		log.Fatal(err)
	}

	awsSession, err := session.NewSessionWithOptions(session.Options{
		Profile: "floodwatch",
		Config: aws.Config{
			Region: aws.String("us-east-1"),
			CredentialsChainVerboseErrors: aws.Bool(true),
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	sqsClient := sqs.New(awsSession)

	ads, err := b.UnclassifiedAds()
	if err != nil {
		log.Fatal(err)
	}

	for _, ad := range ads {
		reclassify(sqsClient, ad)
	}
}
