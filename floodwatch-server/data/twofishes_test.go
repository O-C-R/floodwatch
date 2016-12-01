package data

import (
	"testing"
)

func TestTwofishes(t *testing.T) {
	host := "http://localhost:5999"
	twofishesId := "geonameid:4358598"

	countryCode, err := GetCountryCodeFromTwofishesId(host, twofishesId)
	if err != nil {
		t.Fatal(err)
	}

	if len(*countryCode) != 2 {
		t.Fatalf("%s does not have two characters", *countryCode)
	}
}
