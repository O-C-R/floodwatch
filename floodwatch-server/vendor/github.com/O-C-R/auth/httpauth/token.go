package httpauth

import (
	"context"
	"fmt"
	"net/http"

	"github.com/O-C-R/auth/id"
)

type TokenAuthenticator interface {
	AuthenticateToken(id.ID) (info interface{}, authentic bool, err error)
}

func authenticateToken(req *http.Request, tokenAuthenticator TokenAuthenticator, tokenString string, contextKey interface{}) (*http.Request, bool, error) {
	var token id.ID
	if err := token.UnmarshalText([]byte(tokenString)); err != nil {
		return req, false, nil
	}

	info, authentic, err := tokenAuthenticator.AuthenticateToken(token)
	if err != nil {
		return req, false, err
	}

	if !authentic {
		return req, false, nil
	}

	if contextKey != nil {
		ctx := req.Context()
		ctx = context.WithValue(ctx, contextKey, info)
		req = req.WithContext(ctx)
	}

	return req, true, nil
}

type SingleTokenAuthenticator struct {
	id id.ID
}

func NewSingleTokenAuthenticator(id id.ID) *SingleTokenAuthenticator {
	return &SingleTokenAuthenticator{id}
}

func (s *SingleTokenAuthenticator) AuthenticateToken(id id.ID) (interface{}, bool, error) {
	if id != s.id {
		return nil, false, nil
	}

	return id, true, nil
}

func BearerAuthentication(tokenAuthenticator TokenAuthenticator, contextKey interface{}) AuthenticationFunc {
	return func(w http.ResponseWriter, req *http.Request) (*http.Request, bool, error) {
		tokenString := req.FormValue("access_token")
		if tokenString == "" {
			if _, err := fmt.Sscanf(req.Header.Get("authorization"), "Bearer %s", &tokenString); err != nil {
				return req, false, nil
			}
		}

		return authenticateToken(req, tokenAuthenticator, tokenString, contextKey)
	}
}

func BearerAuthenticationHandler(handler http.Handler, tokenAuthenticator TokenAuthenticator, contextKey interface{}) http.Handler {
	return AuthenticationHandler(handler, BearerAuthentication(tokenAuthenticator, contextKey))
}

func TokenHeaderAuthentication(tokenAuthenticator TokenAuthenticator, contextKey interface{}, header string) AuthenticationFunc {
	return func(w http.ResponseWriter, req *http.Request) (*http.Request, bool, error) {
		return authenticateToken(req, tokenAuthenticator, req.Header.Get(header), contextKey)
	}
}

func TokenHeaderAuthenticationHandler(handler http.Handler, tokenAuthenticator TokenAuthenticator, contextKey interface{}, header string) http.Handler {
	return AuthenticationHandler(handler, TokenHeaderAuthentication(tokenAuthenticator, contextKey, header))
}

func TokenCookieAuthentication(tokenAuthenticator TokenAuthenticator, contextKey interface{}, cookieName string) AuthenticationFunc {
	return func(w http.ResponseWriter, req *http.Request) (*http.Request, bool, error) {
		cookie, err := req.Cookie(cookieName)
		if err != nil {
			return req, false, nil
		}

		return authenticateToken(req, tokenAuthenticator, cookie.Value, contextKey)
	}
}

func TokenCookieAuthenticationHandler(handler http.Handler, tokenAuthenticator TokenAuthenticator, contextKey interface{}, cookieName string) http.Handler {
	return AuthenticationHandler(handler, TokenCookieAuthentication(tokenAuthenticator, contextKey, cookieName))
}
