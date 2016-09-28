package data

import (
	"bytes"
	"time"

	"golang.org/x/crypto/bcrypt"
	passlib "gopkg.in/hlandau/passlib.v1"
)

const (
	bcryptCost = bcrypt.DefaultCost
)

var (
	passlibPrefix = []byte("$6")
)

func generateHashFromPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
}

func compareHashAndPassword(hash []byte, password string) ([]byte, error) {
	if !bytes.HasPrefix(hash, passlibPrefix) {
		return nil, bcrypt.CompareHashAndPassword(hash, []byte(password))
	}

	if err := passlib.VerifyNoUpgrade(password, string(hash)); err != nil {
		return nil, err
	}

	return generateHashFromPassword(password)
}

type User struct {
	ID       uint64    `db:"id" json:"-"`
	Username string    `db:"username" json:"username"`
	Email    []byte    `db:"h_email" json:"-"`
	Password []byte    `db:"h_password" json:"-"`
	OptIn    bool      `db:"opt_in" json:"opt_in"`
	LastSeen time.Time `db:"last_seen" json:"last_seen"`
}

func (u *User) SetPassword(password string) error {
	hashedPassword, err := generateHashFromPassword(password)
	if err != nil {
		return err
	}

	u.Password = hashedPassword
	return nil
}

func (u *User) CheckPassword(password string) error {
	hashedPassword, err := compareHashAndPassword(u.Password, password)
	if err != nil {
		return err
	}

	if hashedPassword != nil {
		u.Password = hashedPassword
	}

	return nil
}

func (u *User) SetEmail(email string) error {
	hashedEmail, err := generateHashFromPassword(email)
	if err != nil {
		return err
	}

	u.Email = hashedEmail
	return nil
}

func (u *User) CheckEmail(email string) error {
	hashedEmail, err := compareHashAndPassword(u.Email, email)
	if err != nil {
		return err
	}

	if hashedEmail != nil {
		u.Email = hashedEmail
	}

	return nil
}
