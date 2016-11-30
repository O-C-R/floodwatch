package backend

import (
	"testing"

	"github.com/O-C-R/floodwatch/floodwatch-server/data"
)

func TestFilter(t *testing.T) {
	b, err := New("postgres://localhost/floodwatch?sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}

	minAge := 1
	ageFilter := data.RangeFilter{
		Min: &minAge,
	}
	f := data.PersonFilter{
		Age: &ageFilter,
		Demographics: []data.DemographicFilter{
			data.DemographicFilter{
				Logic:  "or",
				Values: []int{7},
			},
		},
	}

	_, err = b.FilteredAds(f)
	if err != nil {
		t.Error(err)
	}
}
