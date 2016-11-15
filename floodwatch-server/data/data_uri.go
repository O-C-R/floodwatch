package data

import (
	"bytes"
	"crypto/sha1"
	"encoding/base64"
	"errors"
	"image"
	"image/draw"
	_ "image/gif"
	_ "image/jpeg"
	"image/png"
	"regexp"

	"github.com/O-C-R/auth/id"
)

var (
	dataURIPrefixRegexp *regexp.Regexp
	dataURIFormatError  = errors.New("data URL format error")
	pngEncoder          = &png.Encoder{png.BestCompression}
)

func init() {
	dataURIPrefixRegexp = regexp.MustCompile(`^data:image/(?:png|jpeg|gif);base64,`)
}

type DataURI struct {
	ID  id.ID
	img *image.NRGBA
}

func (d *DataURI) UnmarshalText(text []byte) error {
	prefix := dataURIPrefixRegexp.Find(text)
	decoder := base64.NewDecoder(base64.StdEncoding, bytes.NewReader(text[len(prefix):]))
	img, _, err := image.Decode(decoder)
	if err != nil {
		return err
	}

	ok := false
	d.img, ok = img.(*image.NRGBA)
	if !ok {
		d.img = image.NewNRGBA(img.Bounds())
		draw.Draw(d.img, img.Bounds(), img, image.Pt(0, 0), draw.Src)
	}

	hash := sha1.New()
	hash.Write(d.img.Pix)
	if err := d.ID.UnmarshalBinary(hash.Sum(nil)); err != nil {
		return err
	}

	return nil
}

func (d *DataURI) Reader() (*bytes.Reader, error) {
	buffer := bytes.NewBuffer([]byte{})
	if err := pngEncoder.Encode(buffer, d.img); err != nil {
		return nil, err
	}

	return bytes.NewReader(buffer.Bytes()), nil
}
