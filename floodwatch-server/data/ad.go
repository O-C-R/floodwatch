package data

import (
	"github.com/O-C-R/auth/id"
)

type AdRequestData struct {
	LocalID     id.ID     `json:"localId"`
	HTML        *string   `json:"html,omitempty"`
	TopURL      string    `json:"topUrl"`
	AdURLS      *[]string `json:"adUrls,omitempty"`
	MediaType   string    `json:"mediaType"`
	CaptureType string    `json:"captureType"`
}

type AdRequestCapture struct {
	Image       *DataURI `json:"image"`
	CaptureType string   `json:"captureType"`
}

type AdRequest struct {
	Ad      *AdRequestData    `json:"ad"`
	Capture *AdRequestCapture `json:"capture"`
}

type AdsRequest struct {
	Ads []*AdRequest `json:"ads"`
}

type AdResponse struct {
	LocalID      id.ID  `json:"localId"`
	ID           id.ID  `json:"id,omitempty"`
	CategoryName string `json:"category,omitempty"`
	Error        string `json:"error,omitempty"`
}

type AdsResponse struct {
	Ads []*AdResponse `json:"ads"`
}

type AdCategory struct {
	ID   id.ID  `db:"id" json:"id"`
	Name string `db:"name" json:"name"`
}

type Ad struct {
	ID               id.ID   `db:"id" json:"id"`
	CategoryID       *id.ID  `db:"category_id" json:"category_id,omitempty"`
	CategorySource   *string `db:"category_source" json:"category_source,omitempty"`
	ClassifierOutput *string `db:"classifier_output" json:"classifier_output,omitempty"`
}
