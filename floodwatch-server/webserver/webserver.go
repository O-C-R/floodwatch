package webserver

import (
	"encoding/json"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"

	"github.com/O-C-R/auth/httpauth"
	"github.com/O-C-R/singlepage"
	"github.com/aws/aws-sdk-go/aws/session"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"

	"github.com/O-C-R/floodwatch/floodwatch-server/backend"
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
	Addr         string
	RedirectAddr string
	Backend      *backend.Backend

	SessionStore                *backend.SessionStore
	AWSSession                  *session.Session
	S3Bucket                    string
	SQSClassifierInputQueueURL  string
	SQSClassifierOutputQueueURL string
	Insecure                    bool
	StaticPath                  string
	TwofishesHost               string
}

type Webserver struct {
	options *Options
	server  *http.Server
}

func New(options *Options) (*Webserver, error) {

	r := http.NewServeMux()

	apiRouter := mux.NewRouter().PathPrefix("/api").Subrouter().StrictSlash(false)
	r.Handle("/api/", apiRouter)

	apiRouter.Handle("/register", RateLimitHandler(Register(options), options, 10/60e9, 30)).Methods("POST")
	apiRouter.Handle("/login", RateLimitHandler(Login(options), options, 10/60e9, 30)).Methods("POST")
	apiRouter.Handle("/logout", Logout(options)).Methods("POST")

	authApiRouter := apiRouter.PathPrefix("/").Subrouter()
	authApiRouter.Handle("/person/current", PersonCurrent(options)).Methods("GET")
	authApiRouter.Handle("/person/demographics", UpdatePersonDemographics(options)).Methods("POST")
	authApiRouter.Handle("/ads", Ads(options)).Methods("POST")
	authApiRouter.Handle("/ads/filtered", FilteredAdStats(options)).Methods("POST")

	url, err := url.Parse(options.TwofishesHost)
	if err != nil {
		return nil, err
	}

	twofishesHandler := http.StripPrefix("/api/twofishes", httputil.NewSingleHostReverseProxy(url))
	authApiRouter.Handle("/twofishes", twofishesHandler).Methods("GET")

	apiAuthHandler := http.Handler(authApiRouter)
	apiAuthHandler = handlers.CompressHandler(apiAuthHandler)
	if !options.Insecure {
		sessionAuthenticator := NewSessionAuthenticator(options.SessionStore)
		apiAuthHandler = httpauth.TokenCookieAuthenticationHandler(apiAuthHandler, sessionAuthenticator, sessionKey{}, CookieName)
	}
	apiRouter.Handle("/", authApiRouter)

	if options.StaticPath != "" {
		application, err := regexp.Compile(`^/.*$`)
		if err != nil {
			return nil, err
		}

		longtermCache, err := regexp.Compile(`\.(?:css|js)(?:\.gz)?$`)
		if err != nil {
			return nil, err
		}

		r.Handle("/", singlepage.NewSinglePageApplication(singlepage.SinglePageApplicationOptions{
			Root:          http.Dir(options.StaticPath),
			Application:   application,
			LongtermCache: longtermCache,
		}))
	}

	handler := http.Handler(r)
	handler = handlers.CORS(
		handlers.AllowCredentials(),
		handlers.AllowedOrigins([]string{"https://floodwatch.me", "http://localhost:3000"}),
	)(handler)
	handler = RateLimitHandler(handler, options, 1000/60e9, 1000)

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
