package data

import (
	"errors"
	"fmt"
)

type TwofishesFeature struct {
	ID          string `json:"id"`
	CountryCode string `json:"cc"`
	Name        string `json:"name"`
	DisplayName string `json:"displayName"`
}

type TwofishesInterpretation struct {
	Feature TwofishesFeature `json:"feature"`
}

type TwofishesGeocodeResponse struct {
	Interpretations []TwofishesInterpretation `json:"interpretations"`
}

func GetCountryCodeFromTwofishesID(twofishesHost string, twofishesId string) (*string, error) {
	url := fmt.Sprintf("%s?slug=%s", twofishesHost, twofishesId)

	res := TwofishesGeocodeResponse{}
	if err := GetJson(url, &res); err != nil {
		return nil, err
	}

	if len(res.Interpretations) == 0 {
		return nil, errors.New("No intepretations returned")
	}

	countryCode := res.Interpretations[0].Feature.CountryCode
	return &countryCode, nil
}
