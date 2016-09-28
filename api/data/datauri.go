package data

import (
	"bytes"
	"encoding/base64"
	"errors"
	"io"
)

const (
	dataURIPrefix = `data:image/png;base64,`
)

var (
	dataURIFormatError = errors.New("data URL format error")
	dataURIPrefixBytes = []byte(dataURIPrefix)
)

type DataURI struct {
	data []byte
}

func (d *DataURI) UnmarshalText(text []byte) error {
	if !bytes.HasPrefix(text, dataURIPrefixBytes) {
		return dataURIFormatError
	}

	text = text[len(dataURIPrefix):]
	dataDecoded := make([]byte, 0, base64.StdEncoding.DecodedLen(len(text)))
	if _, err := base64.StdEncoding.Decode(dataDecoded, text); err != nil {
		return err
	}

	d.data = dataDecoded
	return nil
}

func (d *DataURI) Reader() io.ReadSeeker {
	return bytes.NewReader(d.data)
}
