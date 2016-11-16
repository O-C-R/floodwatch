package webserver

import (
	"context"
	"net/http"
	"strings"

	"github.com/O-C-R/auth/id"
	"github.com/O-C-R/floodwatch/floodwatch-server/backend"
	"github.com/O-C-R/floodwatch/floodwatch-server/data"
)

type SessionAuthenticator struct {
	sessionStore *backend.SessionStore
}

func NewSessionAuthenticator(sessionStore *backend.SessionStore) *SessionAuthenticator {
	return &SessionAuthenticator{sessionStore}
}

func (u *SessionAuthenticator) AuthenticateToken(sessionID id.ID) (info interface{}, authentic bool, err error) {
	session, err := u.sessionStore.Session(sessionID)
	if err != nil {
		return nil, false, err
	}

	if session == nil {
		return nil, false, nil
	}

	return session, true, nil
}

type sessionKey struct{}

func ContextSession(ctx context.Context) *data.Session {
	if session, ok := ctx.Value(sessionKey{}).(*data.Session); ok {
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
