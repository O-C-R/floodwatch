package data

import (
	"testing"

	"golang.org/x/crypto/bcrypt"
)

const (
	testPassword            = "password"
	testPasslibPasswordHash = "$6$rounds=615293$qIFB88g9CYLY42Se$D3rSnpMtHvfVQlUD7q6CqdIC5EKqLqZL8UCJPC5oNQZKhJCS2j3jBWvkw2rFYPWErt2CpZYv65M..yELyZ6OV0"
)

func TestPasslibPassword(t *testing.T) {
	user := &User{Password: []byte(testPasslibPasswordHash)}

	if err := user.CheckPassword(testPassword); err != nil {
		t.Fatal(err)
	}

	if err := bcrypt.CompareHashAndPassword(user.Password, []byte(testPassword)); err != nil {
		t.Error(err)
	}
}

func TestPasslibEmail(t *testing.T) {
	user := &User{Email: []byte(testPasslibPasswordHash)}

	if err := user.CheckEmail(testPassword); err != nil {
		t.Fatal(err)
	}

	if err := bcrypt.CompareHashAndPassword(user.Email, []byte(testPassword)); err != nil {
		t.Error(err)
	}
}
