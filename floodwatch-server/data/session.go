package data

import (
	"github.com/O-C-R/auth/id"
)

type Session struct {
	UserID id.ID
	Data   map[interface{}]interface{}
}

func NewSession(userID id.ID) *Session {
	return &Session{
		UserID: userID,
		Data:   make(map[interface{}]interface{}),
	}
}
