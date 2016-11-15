package data

import (
	"time"

	"github.com/O-C-R/auth/id"
)

type Impression struct {
	ID          id.ID     `db:"id" json:"id"`
	LocalID     id.ID     `db:"local_id" json:"localId"`
	PersonID    id.ID     `db:"person_id" json:"person_id"`
	SiteID      id.ID     `db:"site_id" json:"site_id"`
	AdID        id.ID     `db:"ad_id" json:"ad_id"`
	TopURL      string    `db:"top_url" json:"topUrl"`
	Timestamp   time.Time `db:"timestamp" json:"timestamp"`
	MediaType   string    `db:"media_type" json:"mediaType"`
	CaptureType string    `db:"capture_type" json:"captureType"`
	HTML        *string   `db:"html" json:"html,omitempty"`
	// AdURLS      *[]string `db:"ad_urls" json:"adUrls,omitempty"`
}
