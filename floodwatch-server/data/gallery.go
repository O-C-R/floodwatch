package data

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/O-C-R/auth/id"
	"github.com/jmoiron/sqlx/types"
	"github.com/pkg/errors"
)

type GalleryImageData struct {
	FilterA  PersonFilter        `json:"filter_a"`
	FilterB  PersonFilter        `json:"filter_b"`
	DataA    *FilterResponseItem `json:"data_a"`
	DataB    *FilterResponseItem `json:"data_b"`
	CurTopic string              `json:"cur_topic"`
}

type GalleryImage struct {
	ID        id.ID          `db:"id" json:"id"`
	CreatorID id.ID          `db:"creator_id" json:"-"`
	Data      types.JSONText `db:"data" json:"data"`
	CreatedAt time.Time      `db:"created_at" json:"created_at"`
}

type GalleryImageResponse struct {
	ID        id.ID            `json:"id"`
	Data      GalleryImageData `json:"data"`
	CreatedAt time.Time        `json:"created_at"`
	URL       string           `json:"url"`
}

func (g *GalleryImage) SetData(data GalleryImageData) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	g.Data = jsonData
	return nil
}

func (g *GalleryImage) GetData() (*GalleryImageData, error) {
	var imageData GalleryImageData
	err := json.Unmarshal(g.Data, &imageData)
	if err != nil {
		return nil, errors.Wrap(err, "could not unmarshal image data")
	}

	return &imageData, nil
}

func (g *GalleryImage) ToResponse(bucket string) (*GalleryImageResponse, error) {
	idStr := g.ID.String()
	key := idStr + ".png"
	url := fmt.Sprintf("https://s3.amazonaws.com/%s/%s", bucket, key)

	data, err := g.GetData()
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &GalleryImageResponse{
		ID:        g.ID,
		Data:      *data,
		CreatedAt: g.CreatedAt,
		URL:       url,
	}, nil
}
