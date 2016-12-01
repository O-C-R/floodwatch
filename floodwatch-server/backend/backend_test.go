package backend

import (
	"testing"

	"github.com/O-C-R/auth/id"
	"github.com/O-C-R/floodwatch/floodwatch-server/data"
)

// func TestFilter(t *testing.T) {
// 	b, err := New("postgres://localhost/floodwatch?sslmode=disable")
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	minAge := 1
// 	ageFilter := data.RangeFilter{
// 		Min: &minAge,
// 	}
// 	f := data.PersonFilter{
// 		Age: &ageFilter,
// 		Demographics: []data.DemographicFilter{
// 			data.DemographicFilter{
// 				Logic:  "or",
// 				Values: []int{7},
// 			},
// 		},
// 	}

// 	_, err = b.FilteredAds(f)
// 	if err != nil {
// 		t.Error(err)
// 	}
// }

func TestSite(t *testing.T) {
	b, err := New("postgres://localhost/floodwatch?sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}

	siteID, err := id.New()
	if err != nil {
		t.Fatal(err)
	}

	site := &data.Site{
		ID:       siteID,
		Hostname: "test.com",
	}

	currentSiteID, err := b.UpsertSite(site)
	if err != nil {
		t.Fatal(err)
	}

	_, ok := currentSiteID.(id.ID)
	if !ok {
		t.Fatalf("Unexpected type %T", currentSiteID)
	}
}
