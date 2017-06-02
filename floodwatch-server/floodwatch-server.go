package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/kelseyhightower/envconfig"

	"github.com/O-C-R/auth/session"

	"github.com/aws/aws-sdk-go/aws"
	awsSession "github.com/aws/aws-sdk-go/aws/session"

	"github.com/O-C-R/floodwatch/floodwatch-server/backend"
	"github.com/O-C-R/floodwatch/floodwatch-server/email"
	"github.com/O-C-R/floodwatch/floodwatch-server/screenshot"
	"github.com/O-C-R/floodwatch/floodwatch-server/scripts"
	"github.com/O-C-R/floodwatch/floodwatch-server/webserver"
)

type Config struct {
	Port         int    `default:"80"`
	RedirectPort int    `default:"8000" envconfig:"REDIRECT_PORT"`
	StaticPath   string `default:"./static" envconfig:"STATIC_PATH"`
	BackendURL   string `default:"postgres://localhost/floodwatch?sslmode=disable" envconfig:"BACKEND_URL"`

	SessionStoreAddr     string `default:"localhost:6379" envconfig:"SESSION_STORE_ADDRESS"`
	SessionStorePassword string `envconfig:"SESSION_STORE_PASSWORD"`

	AWSProfile                  string `default:"floodwatch" envconfig:"AWS_PROFILE"`
	AWSRegion                   string `default:"us-east-1" envconfig:"AWS_REGION"`
	S3Bucket                    string `default:"floodwatch-ads" envconfig:"S3_BUCKET"`
	S3GalleryBucket             string `default:"floodwatch-gallery" envconfig:"S3_SCREENSHOT_BUCKET"`
	SQSClassifierInputQueueURL  string `envconfig:"SQS_CLASSIFIER_INPUT_QUEUE_URL"`
	SQSClassifierOutputQueueURL string `envconfig:"SQS_CLASSIFIER_OUTPUT_QUEUE_URL"`

	TwofishesHost string `envconfig:"TWOFISHES_HOST"`
	Hostname      string `default:"http://localhost:8080"`
	FromEmail     string `default:"test@test.com" envconfig:"FROM_EMAIL"`
	Insecure      bool   `default:"false"`

	ChromeExe string `default:"/usr/bin/google-chrome" envconfig:"CHROME_EXE"`
}

var (
	help          bool
	verboseConfig bool
	script        string
)

func init() {
	flag.BoolVar(&help, "h", false, "print usage")
	flag.BoolVar(&verboseConfig, "c", false, "print config")
	flag.StringVar(&script, "script", "", "run a named script (possible: `reclassify`)")
}

func runWebserver(options *webserver.Options) {
	server, err := webserver.New(options)
	if err != nil {
		log.Fatal(err)
	}

	redirectServer := webserver.NewRedirectServer(options)

	errs := make(chan error)
	go func() {
		errs <- server.ListenAndServe()
	}()
	go func() {
		errs <- redirectServer.ListenAndServe()
	}()

	log.Fatal(<-errs)
}

func main() {
	flag.Parse()

	var config Config
	if help {
		envconfig.Usage("fw", &config)
		os.Exit(0)
	}

	if err := envconfig.Process("fw", &config); err != nil {
		panic(err)
	}

	if verboseConfig {
		fmt.Printf("CONFIG:\n%+v\n", config)
	}

	b, err := backend.New(config.BackendURL)
	if err != nil {
		log.Fatal(err)
	}

	sessionStore, err := session.NewSessionStore(session.SessionStoreOptions{
		Addr:            config.SessionStoreAddr,
		Password:        config.SessionStorePassword,
		SessionDuration: time.Hour * 24 * 365,
		MaxSessions:     100,
	})
	if err != nil {
		log.Fatal(err)
	}

	awsSession, err := awsSession.NewSessionWithOptions(awsSession.Options{
		Profile: config.AWSProfile,
		Config: aws.Config{
			Region: aws.String(config.AWSRegion),
			CredentialsChainVerboseErrors: aws.Bool(true),
		},
	})
	if err != nil {
		log.Fatal(err)
	}

	emailer := email.NewAWSSESEmailer(awsSession, config.Hostname, config.FromEmail)
	screenshotter := screenshot.Screenshotter{config.ChromeExe}

	if script == "" {
		options := &webserver.Options{
			Port:         config.Port,
			RedirectPort: config.RedirectPort,
			Backend:      b,
			Emailer:      emailer,
			Hostname:     config.Hostname,
			Screenshot:   screenshotter,

			SessionStore:                sessionStore,
			AWSSession:                  awsSession,
			S3Bucket:                    config.S3Bucket,
			S3GalleryBucket:             config.S3GalleryBucket,
			SQSClassifierInputQueueURL:  config.SQSClassifierInputQueueURL,
			SQSClassifierOutputQueueURL: config.SQSClassifierOutputQueueURL,
			FromEmail:                   config.FromEmail,
			Insecure:                    config.Insecure,
			StaticPath:                  config.StaticPath,
			TwofishesHost:               config.TwofishesHost,
		}
		runWebserver(options)
	} else if script == "reclassify" {
		options := &scripts.ReclassifyOptions{
			Backend:                     b,
			AWSSession:                  awsSession,
			S3Bucket:                    config.S3Bucket,
			SQSClassifierInputQueueURL:  config.SQSClassifierInputQueueURL,
			SQSClassifierOutputQueueURL: config.SQSClassifierOutputQueueURL,
		}
		scripts.ReclassifyAll(options)
	}
}
