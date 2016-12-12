package data

import (
	"time"

	"github.com/O-C-R/auth/id"
	"golang.org/x/crypto/bcrypt"
)

const (
	bcryptCost = bcrypt.DefaultCost
)

func generateHashFromPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), bcryptCost)
}

func compareHashAndPassword(hashedPassword []byte, password string) ([]byte, error) {
	if err := bcrypt.CompareHashAndPassword(hashedPassword, []byte(password)); err != nil {
		return nil, err
	}

	passwordBcryptCost, err := bcrypt.Cost(hashedPassword)
	if err != nil {
		return nil, err
	}

	if passwordBcryptCost != bcryptCost {
		return generateHashFromPassword(password)
	}

	return nil, nil
}

type Person struct {
	ID          id.ID     `db:"id" json:"-"`
	Username    string    `db:"username" json:"username"`
	Email       string    `db:"email" json:"-"`
	Password    []byte    `db:"password" json:"-"`
	Admin       bool      `db:"admin" json:"admin"`
	BirthYear   *int      `db:"birth_year" json:"birth_year"`
	TwofishesID *string   `db:"twofishes_id" json:"twofishes_id"`
	CountryCode *string   `db:"country_code" json:"country_code"`
	LastSeen    time.Time `db:"last_seen" json:"last_seen"`
}

func (p *Person) SetPassword(password string) error {
	hashedPassword, err := generateHashFromPassword(password)
	if err != nil {
		return err
	}

	p.Password = hashedPassword
	return nil
}

func (p *Person) CheckPassword(password string) error {
	hashedPassword, err := compareHashAndPassword(p.Password, password)
	if err != nil {
		return err
	}

	if hashedPassword != nil {
		p.Password = hashedPassword
	}

	return nil
}

type PersonDemographicRequest struct {
	BirthYear      *int    `json:"birth_year"`
	TwofishesID    *string `json:"twofishes_id"`
	DemographicIDs []int   `json:"demographic_ids"`
}

type PersonDemographic struct {
	PersonID      id.ID `db:"person_id"`
	DemographicID int   `db:"demographic_id"`
}

type PersonResponse struct {
	Username       string    `json:"username"`
	Admin          bool      `json:"admin"`
	BirthYear      *int      `json:"birth_year"`
	TwofishesID    *string   `json:"twofishes_id"`
	CountryCode    *string   `json:"country_code"`
	DemographicIDs []int     `json:"demographic_ids"`
	LastSeen       time.Time `json:"last_seen"`
}

func (p *Person) NewPersonResponse(demographicIds []int) PersonResponse {
	res := PersonResponse{
		Username:       p.Username,
		Admin:          p.Admin,
		BirthYear:      p.BirthYear,
		TwofishesID:    p.TwofishesID,
		CountryCode:    p.CountryCode,
		DemographicIDs: demographicIds,
		LastSeen:       p.LastSeen,
	}

	return res
}
