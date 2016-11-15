package backend

import (
	"testing"
	"time"

	"github.com/O-C-R/auth/id"

	"github.com/O-C-R/floodwatch-server/floodwatch-server/data"
)

func TestSession(t *testing.T) {
	sessionStore, err := NewSessionStore(SessionStoreOptions{
		Addr:            ":6379",
		SessionDuration: time.Hour,
	})
	if err != nil {
		t.Fatal(err)
	}

	userID, err := id.New()
	if err != nil {
		t.Fatal(err)
	}

	session := data.NewSession(userID)
	sessionID, err := id.New()
	if err != nil {
		t.Fatal(err)
	}

	if err := sessionStore.SetSession(sessionID, session); err != nil {
		t.Fatal(err)
	}

	returnedSession, err := sessionStore.Session(sessionID)
	if err != nil {
		t.Error(err)
	}

	if returnedSession.UserID != session.UserID {
		t.Errorf("incorrect user ID, %s, expected %s", returnedSession.UserID, session.UserID)
	}

	if err := sessionStore.DeleteSession(sessionID); err != nil {
		t.Fatal(err)
	}
}
