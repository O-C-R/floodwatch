package data

import (
	"encoding/json"
	"time"

	"github.com/O-C-R/auth/id"
	"github.com/jmoiron/sqlx/types"
)

type GalleryImageData struct {
	FilterA  PersonFilter        `json:"filterA"`
	FilterB  PersonFilter        `json:"filterB"`
	DataA    *FilterResponseItem `json:"dataA"`
	DataB    *FilterResponseItem `json:"dataB"`
	CurTopic int                 `json:"curTopic"`
}

type GalleryImage struct {
	ID        id.ID          `db:"id", json:"id"`
	CreatorID id.ID          `db:"creator_id" json:"creator_id"`
	Data      types.JSONText `db:"data" json:"data"`
	CreatedAt time.Time      `db:"created_at" json:"created_at"`
}

func (g *GalleryImage) SetData(data GalleryImageData) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	g.Data = jsonData
	return nil
}
