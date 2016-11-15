package webserver

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/aws/aws-sdk-go/aws/session"
	"github.com/gorilla/handlers"

	"github.com/O-C-R/auth/httpauth"
	"github.com/O-C-R/floodwatch-server/floodwatch-server/backend"
)

const (
	CookieName = "floodwatch"
)

func InvalidForm(w http.ResponseWriter, errs map[string]string) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(400)
	if err := json.NewEncoder(w).Encode(errs); err != nil {
		log.Println(err)
	}
}

func Error(w http.ResponseWriter, err error, code int) {
	if code >= 400 {
		log.Println(err)
	}

	if code >= 500 {
		http.Error(w, "an error occurred", code)
		return
	}

	http.Error(w, err.Error(), code)
}

func WriteJSON(w http.ResponseWriter, value interface{}) {
	w.Header().Set("content-type", "application/json")
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Println(err)
	}
}

type Options struct {
	Addr    string
	Backend *backend.Backend

	SessionStore                *backend.SessionStore
	AWSSession                  *session.Session
	S3Bucket                    string
	SQSClassifierInputQueueURL  string
	SQSClassifierOutputQueueURL string
	Insecure                    bool
}

type Webserver struct {
	options *Options
	server  *http.Server
}

func New(options *Options) (*Webserver, error) {

	mux := http.NewServeMux()
	mux.Handle("/api/register", RateLimitHandler(Register(options), options, 1/60e9, 3))
	mux.Handle("/api/login", RateLimitHandler(Login(options), options, 10/60e9, 10))
	mux.Handle("/api/logout", Logout(options))

	authenticatedMux := http.NewServeMux()
	authenticatedMux.Handle("/api/person/current", PersonCurrent(options))
	authenticatedMux.Handle("/api/ads", Ads(options))

	authenticatedHandler := http.Handler(authenticatedMux)
	authenticatedHandler = RateLimitHandler(authenticatedHandler, options, 100/60e9, 100)
	if !options.Insecure {
		sessionAuthenticator := NewSessionAuthenticator(options.SessionStore)
		authenticatedHandler = httpauth.TokenCookieAuthenticationHandler(authenticatedHandler, sessionAuthenticator, sessionKey{}, CookieName)
	}

	mux.Handle("/api/", authenticatedHandler)

	handler := http.Handler(mux)
	handler = handlers.CompressHandler(handler)
	handler = handlers.CORS(
		handlers.AllowCredentials(),
		handlers.AllowedOrigins([]string{"https://floodwatch.me", "http://localhost:3000"}),
	)(handler)

	webserver := &Webserver{
		options: options,
	}

	webserver.server = &http.Server{
		Addr:    options.Addr,
		Handler: handler,
	}

	return webserver, nil
}

func (w *Webserver) ListenAndServe() error {
	go handleClassifierOutput(w.options)

	log.Println(w.options.Addr)
	return w.server.ListenAndServe()
}