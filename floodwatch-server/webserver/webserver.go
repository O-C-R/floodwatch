package webserver

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/http/httputil"
	"net/url"
	"regexp"
	"strconv"
	"strings"

	"github.com/O-C-R/auth/httpauth"
	"github.com/O-C-R/auth/session"
	"github.com/O-C-R/singlepage"
	awsSession "github.com/aws/aws-sdk-go/aws/session"

	"github.com/gorilla/handlers"
	"github.com/gorilla/mux"

	"github.com/O-C-R/floodwatch/floodwatch-server/backend"
	"github.com/O-C-R/floodwatch/floodwatch-server/email"
	"github.com/O-C-R/floodwatch/floodwatch-server/screenshot"
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
		log.Println("err: ", err)
	}

	if code >= 500 {
		http.Error(w, "an error occurred", code)
		return
	}

	if err != nil {
		http.Error(w, err.Error(), code)
	} else {
		http.Error(w, strconv.Itoa(code), code)
	}
}

func WriteJSON(w http.ResponseWriter, value interface{}) {
	w.Header().Set("content-type", "application/json")
	if err := json.NewEncoder(w).Encode(value); err != nil {
		log.Println(err)
	}
}

type Options struct {
	Port         int
	RedirectPort int
	Backend      *backend.Backend
	Emailer      email.Emailer
	Hostname     string
	Screenshot   screenshot.Screenshotter

	SessionStore                *session.SessionStore
	AWSSession                  *awsSession.Session
	S3Bucket                    string
	S3GalleryBucket             string
	SQSClassifierInputQueueURL  string
	SQSClassifierOutputQueueURL string
	Insecure                    bool
	StaticPath                  string
	TwofishesHost               string
	FromEmail                   string
}

type Webserver struct {
	options *Options
	server  *http.Server
}

func secureRoute(h http.Handler, auth *SessionAuthenticator, secure bool) http.Handler {
	h = handlers.CompressHandler(h)
	if secure {
		h = httpauth.TokenCookieAuthenticationHandler(h, auth, sessionKey{}, CookieName)
	}

	return h
}

func New(options *Options) (*Webserver, error) {

	r := http.NewServeMux()

	apiRouter := mux.NewRouter().PathPrefix("/api").Subrouter().StrictSlash(false)
	auth := NewSessionAuthenticator(options.SessionStore)
	secure := !options.Insecure

	r.Handle("/api/", apiRouter)

	apiRouter.Handle("/register", RateLimitHandler(Register(options), options, 10/60e9, 30)).Methods("POST")
	apiRouter.Handle("/login", RateLimitHandler(Login(options), options, 10/60e9, 30)).Methods("POST")
	apiRouter.Handle("/logout", secureRoute(Logout(options), auth, secure)).Methods("POST")

	apiRouter.Handle("/reset_password/start", StartPasswordReset(options)).Methods("POST")
	apiRouter.Handle("/reset_password/complete", ResetPassword(options)).Methods("POST")

	apiRouter.Handle("/person/current", secureRoute(PersonCurrent(options), auth, secure)).Methods("GET")
	apiRouter.Handle("/person/demographics", secureRoute(UpdatePersonDemographics(options), auth, secure)).Methods("POST")

	// The /ads endpoint is for pushing ads to the server - it's
	// baked into the FW extension.
	apiRouter.Handle("/ads", secureRoute(Ads(options), auth, secure)).Methods("POST")

	// The /recorded_ads endpoint is for getting ads out of the
	// server. Named this way to avoid ad blockers.
	apiRouter.Handle("/recorded_ads/filtered", secureRoute(FilteredAdStats(options), auth, secure)).Methods("POST")
	apiRouter.Handle("/recorded_ads/screenshot", secureRoute(GenerateScreenshot(options), auth, secure)).Methods("POST")

	apiRouter.Handle("/gallery/image/{imageID}", RateLimitHandler(GetGalleryImage(options), options, 10/60e9, 30)).Methods("GET")

	url, err := url.Parse(options.TwofishesHost)
	if err != nil {
		return nil, err
	}

	twofishesHandler := http.StripPrefix("/api/twofishes", httputil.NewSingleHostReverseProxy(url))
	apiRouter.Handle("/twofishes", secureRoute(twofishesHandler, auth, secure)).Methods("GET")

	if options.StaticPath != "" {
		application, err := regexp.Compile(`^/.*$`)
		if err != nil {
			return nil, err
		}

		longtermCache, err := regexp.Compile(`\.(?:css|js)(?:\.gz)?$`)
		if err != nil {
			return nil, err
		}

		replacer := func(req *http.Request, raw []byte) ([]byte, error) {
			out := raw

			// The same between all pages.
			out = bytes.Replace(out, []byte("__META_URL__"), []byte(options.Hostname+req.URL.Path), -1)
			out = bytes.Replace(out, []byte("__META_TITLE__"), []byte("Floodwatch"), -1)
			out = bytes.Replace(out, []byte("__META_DESCRIPTION__"), []byte("Floodwatch collects the ads you see as you browse the internet, in order to track how advertisers are categorizing and tracking you."), -1)

			if strings.HasPrefix(req.URL.Path, "/gallery/image/") {
				pathParts := strings.Split(req.URL.Path, "/")
				imageId := pathParts[len(pathParts)-1]

				out = bytes.Replace(
					out,
					[]byte("__META_IMAGE_URL__"),
					[]byte(fmt.Sprintf("https://s3.amazonaws.com/%s/%s.png", options.S3GalleryBucket, imageId)),
					-1,
				)
			} else {
				out = bytes.Replace(
					out,
					[]byte("__META_IMAGE_URL__"),
					[]byte(options.Hostname+"/static/img/share.jpg"),
					-1,
				)
			}

			return out, nil
		}

		r.Handle("/", singlepage.NewSinglePageApplication(singlepage.SinglePageApplicationOptions{
			Root:          http.Dir(options.StaticPath),
			Application:   application,
			LongtermCache: longtermCache,

			Replacer: &replacer,
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
		Addr:    fmt.Sprintf(":%d", options.Port),
		Handler: handler,
	}

	return webserver, nil
}

func (w *Webserver) ListenAndServe() error {
	go handleClassifierOutput(w.options)

	log.Printf("Listening on %d", w.options.Port)
	return w.server.ListenAndServe()
}
