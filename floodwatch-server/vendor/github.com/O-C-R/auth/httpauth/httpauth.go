package httpauth

import (
	"net/http"
)

var (
	basicAuthenticationSep = []byte{':'}
)

type AuthenticationFunc func(w http.ResponseWriter, req *http.Request) (*http.Request, bool, error)

func AuthenticationHandler(handler http.Handler, authenticationFunc AuthenticationFunc) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		authenticationReq, authentic, err := authenticationFunc(w, req)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !authentic {
			w.WriteHeader(http.StatusUnauthorized)
			return
		}

		handler.ServeHTTP(w, authenticationReq)
	})
}

func AuthenticationFallbackHandler(handler http.Handler, authenticationFunc AuthenticationFunc, fallbackHandler http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		authenticationReq, authentic, err := authenticationFunc(w, req)
		if err != nil {
			w.WriteHeader(http.StatusInternalServerError)
			return
		}

		if !authentic {
			fallbackHandler.ServeHTTP(w, authenticationReq)
			return
		}

		handler.ServeHTTP(w, authenticationReq)
	})
}
