package httpauth

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
)

type UserAuthenticator interface {
	AuthenticateUser(username, password string) (info interface{}, authentic bool, err error)
}

type SingleUserAuthenticator struct {
	username, password string
}

func NewSingleUserAuthenticator(username, password string) *SingleUserAuthenticator {
	return &SingleUserAuthenticator{
		username: username,
		password: password,
	}
}

func (s *SingleUserAuthenticator) AuthenticateUser(username, password string) (info interface{}, authentic bool, err error) {
	if username != s.username || password != s.password {
		return nil, false, nil
	}

	return username, true, nil
}

func BasicAuthentication(realm string, userAuthenticator UserAuthenticator, contextKey interface{}) AuthenticationFunc {
	authenticateHeader := "Basic realm=\"" + realm + "\""
	return func(w http.ResponseWriter, req *http.Request) (*http.Request, bool, error) {
		encodedUsernamePassword := ""
		if _, err := fmt.Sscanf(req.Header.Get("authorization"), "Basic %s", &encodedUsernamePassword); err != nil {
			w.Header().Set("www-authenticate", authenticateHeader)
			return req, false, nil
		}

		decodedUsernamePassword, err := base64.StdEncoding.DecodeString(encodedUsernamePassword)
		if err != nil {
			w.Header().Set("www-authenticate", authenticateHeader)
			return req, false, nil
		}

		usernamePassword := bytes.SplitN(decodedUsernamePassword, basicAuthenticationSep, 2)
		if len(usernamePassword) != 2 {
			return req, false, nil
		}

		username, password := string(usernamePassword[0]), string(usernamePassword[1])
		info, authentic, err := userAuthenticator.AuthenticateUser(username, password)
		if err != nil {
			w.Header().Set("www-authenticate", authenticateHeader)
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

		return req, authentic, nil
	}
}

func BasicAuthenticationHandler(handler http.Handler, realm string, userAuthenticator UserAuthenticator, contextKey interface{}) http.Handler {
	return AuthenticationHandler(handler, BasicAuthentication(realm, userAuthenticator, contextKey))
}
