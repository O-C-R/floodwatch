package main

import (
	"flag"
	"log"
	"os"
	"time"

	"github.com/aws/aws-sdk-go/aws"
	"github.com/aws/aws-sdk-go/aws/session"

	"github.com/O-C-R/floodwatch/floodwatch-server/backend"
	"github.com/O-C-R/floodwatch/floodwatch-server/webserver"
)

var (
	config struct {
		addr, staticPath, backendURL, sessionStoreAddr, sessionStorePassword, s3Bucket, sqsClassifierInputQueueURL, sqsClassifierOutputQueueURL string
		insecure                                                                                                                                bool
	}
)

func init() {
	flag.StringVar(&config.backendURL, "backend-url", "postgres://localhost/floodwatch?sslmode=disable", "postgres backend URL")
	flag.StringVar(&config.sessionStoreAddr, "session-store-address", "localhost:6379", "redis session store address")
	flag.StringVar(&config.sessionStorePassword, "session-store-password", "", "redis session store password")
	flag.StringVar(&config.addr, "a", "127.0.0.1:8080", "address to listen on")
	flag.StringVar(&config.s3Bucket, "bucket", "floodwatch-ads", "S3 bucket")
	flag.StringVar(&config.sqsClassifierInputQueueURL, "input-queue-url", "https://sqs.us-east-1.amazonaws.com/963245043784/classifier-input", "S3 bucket")
	flag.StringVar(&config.sqsClassifierOutputQueueURL, "output-queue-url", "https://sqs.us-east-1.amazonaws.com/963245043784/classifier-output", "S3 bucket")
	flag.StringVar(&config.staticPath, "static", "", "static path")
	flag.BoolVar(&config.insecure, "i", false, "insecure (no user authentication)")
}

func main() {
	flag.Parse()

	if backendURL := os.Getenv("BACKEND_URL"); backendURL != "" {
		config.backendURL = backendURL
	}

	if sessionStoreAddr := os.Getenv("SESSION_STORE_ADDRESS"); sessionStoreAddr != "" {
		config.sessionStoreAddr = sessionStoreAddr
	}

	if sessionStorePassword := os.Getenv("SESSION_STORE_PASSWORD"); sessionStorePassword != "" {
		config.sessionStorePassword = sessionStorePassword
	}

	if bucket := os.Getenv("BUCKET"); bucket != "" {
		config.s3Bucket = bucket
	}

	if inputQueueURL := os.Getenv("INPUT_QUEUE_URL"); inputQueueURL != "" {
		config.sqsClassifierInputQueueURL = inputQueueURL
	}

	if outputQueueURL := os.Getenv("OUTPUT_QUEUE_URL"); outputQueueURL != "" {
		config.sqsClassifierOutputQueueURL = outputQueueURL
	}

	b, err := backend.New(config.backendURL)
	if err != nil {
		log.Fatal(err)
	}

	sessionStore, err := backend.NewSessionStore(backend.SessionStoreOptions{
		Addr:            config.sessionStoreAddr,
		Password:        config.sessionStorePassword,
		SessionDuration: time.Hour * 24 * 365,
	})
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

	server, err := webserver.New(&webserver.Options{
		Addr:                        config.addr,
		Backend:                     b,
		SessionStore:                sessionStore,
		AWSSession:                  awsSession,
		S3Bucket:                    config.s3Bucket,
		SQSClassifierInputQueueURL:  config.sqsClassifierInputQueueURL,
		SQSClassifierOutputQueueURL: config.sqsClassifierOutputQueueURL,
		Insecure:                    config.insecure,
		StaticPath:                  config.staticPath,
	})
	if err != nil {
		log.Fatal(err)
	}

	log.Fatal(server.ListenAndServe())
}
