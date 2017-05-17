package backend

import (
	"log"
	"testing"
	// "github.com/O-C-R/auth/id"
	// "github.com/O-C-R/floodwatch/floodwatch-server/data"
)

func TestPaged(t *testing.T) {
	b, err := New("postgres://localhost/floodwatch?sslmode=disable")
	if err != nil {
		t.Fatal(err)
	}

	person, err := b.UserByUsername("chris")
	if err != nil {
		t.Fatal(err)
	}

	res, err := b.PagedImpressions(person.ID, nil, 100)
	if err != nil {
		t.Error(err)
	}

	log.Printf("%+v\n", res)
}

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

// func TestSite(t *testing.T) {
// 	b, err := New("postgres://localhost/floodwatch?sslmode=disable")
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	siteID, err := id.New()
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	site := &data.Site{
// 		ID:       siteID,
// 		Hostname: "test.com",
// 	}

// 	currentSiteID, err := b.UpsertSite(site)
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	_, ok := currentSiteID.(id.ID)
// 	if !ok {
// 		t.Fatalf("Unexpected type %T", currentSiteID)
// 	}
// }

// func TestUpsertDemographics(t *testing.T) {
// 	b, err := New("postgres://localhost/floodwatch?sslmode=disable")
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	person, err := b.UserByUsername("chris")
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	err = b.UpdatePersonDemographics(person.ID, []int{10, 11, 19})
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	err = b.UpdatePersonDemographics(person.ID, []int{7, 10, 11, 18})
// 	if err != nil {
// 		t.Fatal(err)
// 	}
// }

// func TestPersonDemographics(t *testing.T) {
// 	b, err := New("postgres://localhost/floodwatch?sslmode=disable")
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	person, err := b.UserByUsername("chris")
// 	if err != nil {
// 		t.Fatal(err)
// 	}

// 	demographicIds, err := b.PersonDemographics(person.ID)
// 	if err != nil {
// 		t.Fatal(err)
// 	}
// }
