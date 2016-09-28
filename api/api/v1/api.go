package v1

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/O-C-R/auth/httpauth"
	"github.com/O-C-R/auth/id"
	"github.com/gorilla/handlers"

	"github.com/O-C-R/floodwatch-server/api/backend"
	"github.com/O-C-R/floodwatch-server/api/data"
)

type Options struct {
	Backend      *backend.Backend
	SessionStore *backend.SessionStore
}

func InvalidForm(w http.ResponseWriter, errs map[string]string) {
	w.Header().Set("content-type", "application/json")
	w.WriteHeader(400)
	if err := json.NewEncoder(w).Encode(errs); err != nil {
		log.Println(err)
	}
}

func Error(w http.ResponseWriter, err error, code int) {
	if code >= 500 {
		log.Println(err)
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

type UserSessionAuthenticator struct {
	sessionStore *backend.SessionStore
}

func (u *UserSessionAuthenticator) AuthenticateToken(sessionID id.ID) (info interface{}, authentic bool, err error) {
	session, err := u.sessionStore.Session(sessionID)
	if err != nil {
		return nil, false, err
	}

	if session == nil {
		return nil, false, nil
	}

	return session, true, nil
}

type userSessionKey struct{}

func ContextSession(ctx context.Context) *data.Session {
	if session, ok := ctx.Value(userSessionKey{}).(*data.Session); ok {
		return session
	}

	return nil
}

func RateLimitHandler(handler http.Handler, options *Options, bucketRate, bucketCapacity float64) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		remoteAddr := req.RemoteAddr
		if forwardedFor := req.Header.Get("x-forwarded-for"); forwardedFor != "" {
			remoteAddrs := strings.Split(forwardedFor, ",")
			remoteAddr = strings.TrimSpace(remoteAddrs[0])
		}

		// Parse the remote address.
		remoteAddrComponents := strings.Split(remoteAddr, ":")
		remoteAddrHostname := remoteAddrComponents[0]

		err := options.SessionStore.RateLimitCount(remoteAddrHostname, bucketRate, bucketCapacity)
		if err == backend.RateLimitExceededError {
			Error(w, err, 429)
			return
		}

		if err != nil {
			Error(w, err, 500)
			return
		}

		handler.ServeHTTP(w, req)
	})
}

func NewHandler(options *Options) (http.Handler, error) {
	userSessionAuthenticator := &UserSessionAuthenticator{options.SessionStore}

	publicMux := http.NewServeMux()
	publicMux.Handle("/api/v1/register", RateLimitHandler(Register(options), options, 1/60e9, 3))
	publicMux.Handle("/api/v1/login", RateLimitHandler(Login(options), options, 10/60e9, 10))
	publicMux.Handle("/api/v1/logout", Logout(options))

	privateMux := http.NewServeMux()
	privateMux.Handle("/api/v1/user/current", UserCurrent(options))

	privateHandler := http.Handler(privateMux)
	privateHandler = httpauth.TokenCookieAuthenticationHandler(privateHandler, userSessionAuthenticator, userSessionKey{}, CookieName)
	privateHandler = RateLimitHandler(privateHandler, options, 100/60e9, 100)

	publicMux.Handle("/api/v1/", privateHandler)

	publicHandler := http.Handler(publicMux)
	publicHandler = handlers.CompressHandler(publicHandler)
	publicHandler = handlers.CORS(
		handlers.AllowCredentials(),
		handlers.AllowedOrigins([]string{"http://localhost:3000"}),
	)(publicHandler)

	return publicHandler, nil
}
