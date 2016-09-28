package data

type Session struct {
	UserID uint64
	Data   map[interface{}]interface{}
}

func NewSession(userID uint64) *Session {
	return &Session{
		UserID: userID,
		Data:   make(map[interface{}]interface{}),
	}
}
