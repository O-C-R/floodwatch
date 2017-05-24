package data

import (
	"encoding/json"
	"fmt"
	"time"

	"github.com/O-C-R/auth/id"
	"github.com/jmoiron/sqlx/types"
	"github.com/pkg/errors"
	"github.com/ventu-io/go-shortid"
)

type GalleryImageData struct {
	FilterA       PersonFilter        `json:"filter_a"`
	FilterB       PersonFilter        `json:"filter_b"`
	DataA         *FilterResponseItem `json:"data_a"`
	DataB         *FilterResponseItem `json:"data_b"`
	CurCategoryId *int                `json:"cur_category_id"`
}

type GalleryImage struct {
	Slug      string         `db:"slug"`
	CreatorID id.ID          `db:"creator_id"`
	Data      types.JSONText `db:"data"`
	CreatedAt time.Time      `db:"created_at"`
}

type GalleryImageResponse struct {
	Slug      string           `json:"slug"`
	Data      GalleryImageData `json:"data"`
	CreatedAt time.Time        `json:"created_at"`
	URL       string           `json:"url"`
}

const (
	seed = 8910215121992
)

func init() {
	sid := shortid.MustNew(0, shortid.DefaultABC, seed)
	shortid.SetDefault(sid)
}

func GenerateGalleryImageSlug() (string, error) {
	return shortid.Generate()
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
	url := fmt.Sprintf("https://s3.amazonaws.com/%s/%s.png", bucket, g.Slug)

	data, err := g.GetData()
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &GalleryImageResponse{
		Slug:      g.Slug,
		Data:      *data,
		CreatedAt: g.CreatedAt,
		URL:       url,
	}, nil
}
