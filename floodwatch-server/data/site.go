package data

import (
	"github.com/O-C-R/auth/id"
)

type SiteCategory struct {
	ID   id.ID `db:"id" json:"id"`
	Name id.ID `db:"name" json:"name"`
}

type Site struct {
	ID         id.ID   `db:"id" json:"id"`
	CategoryID *id.ID  `db:"category_id" json:"id,omitempty"`
	Hostname   string  `db:"hostname" json:"hostname"`
	Name       *string `db:"name" json:"name,omitempty"`
}
