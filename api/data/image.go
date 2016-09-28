package data

import (
	"time"
)

type Image struct {
	ID           string    `db:"id" json:"id"`
	URL          string    `db:"img_loc" json:"img_loc"`
	FirstSeen    time.Time `db:"first_seen" json:"first_seen"`
	Color        string    `db:"color" json:"color"`
	Tagged       bool      `db:"tagged" json:"tagged"`
	ThumbnailURL string    `db:"thm_loc" json:"thm_loc"`
	DOMColor     string    `db:"dom_color" json:"dom_color"`
}

type Impression struct {
	ID          uint64    `db:"id" json:"id"`
	UserID      uint64    `db:"user_id" json:"user_id"`
	PlacementID string    `db:"placement_id" json:"placement_id"`
	Time        time.Time `db:"time" json:"time"`
}

type Placement struct {
	ID         string `db:"id" json:"id"`
	ImageID    string `db:"img_id" json:"img_id"`
	AdURI      string `db:"ad_uri" json:"ad_uri"`
	AdRef      string `db:"ad_ref" json:"ad_ref"`
	PageURL    string `db:"page_url" json:"page_url"`
	AdAnchor   string `db:"ad_anchor" json:"ad_anchor"`
	NumberSeen uint64 `db:"num_seen" json:"num_seen"`
	PageTop    string `db:"page_top" json:"page_top"`
	TargetURL  string `db:"target_url" json:"target_url"`
}
