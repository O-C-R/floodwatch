package backend

import (
	"database/sql"
	"errors"
	"fmt"
	"strings"

	"github.com/O-C-R/auth/id"
	"github.com/O-C-R/sqlutil"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"github.com/O-C-R/floodwatch/floodwatch-server/data"
)

const (
	adFilterQuery = `SELECT
ad.category.id as category_id,
ad.category.name as category_name,
COUNT(DISTINCT person.impression.id) as count
FROM person.impression
INNER JOIN ad.ad ON ad.ad.id = person.impression.ad_id
INNER JOIN ad.category ON ad.category.id = ad.ad.category_id
INNER JOIN person.person ON person.person.id = person.impression.person_id
LEFT JOIN person.person_demographic_aggregate on person.person_demographic_aggregate.person_id = person.impression.person_id
%s
GROUP BY ad.category.id, ad.category.name
ORDER BY ad.category.id ASC;`
)

var (
	NotFoundError      = sql.ErrNoRows
	UsernameInUseError = errors.New("username in use")
)

type Backend struct {
	db *sqlx.DB

	person, personByUsername, personByEmail *sqlx.Stmt
	ad                                      *sqlx.Stmt
	adCategory                              *sqlx.Stmt

	addPerson, upsertPerson, updatePerson             sqlutil.ValueFunc
	addAdCategory, upsertAdCategory, updateAdCategory sqlutil.ValueFunc

	addAd, upsertAd, updateAd sqlutil.ValueFunc
	updateAdFromClassifier    *sql.Stmt

	upsertImpression sqlutil.ValueFunc
	upsertSite       sqlutil.ValueFunc

	filterValues *sqlx.Stmt
}

func New(url string) (*Backend, error) {
	b := &Backend{}

	var err error
	b.db, err = sqlx.Open("postgres", url)
	if err != nil {
		return nil, err
	}

	personSelect, err := sqlutil.Select(data.Person{}, nil, `WHERE person.person.id = $1`)
	if err != nil {
		return nil, err
	}

	b.person, err = b.db.Preparex(personSelect)
	if err != nil {
		return nil, err
	}

	personByUsernameSelect, err := sqlutil.Select(data.Person{}, nil, `WHERE person.person.username = $1`)
	if err != nil {
		return nil, err
	}

	b.personByUsername, err = b.db.Preparex(personByUsernameSelect)
	if err != nil {
		return nil, err
	}

	personByEmailSelect, err := sqlutil.Select(data.Person{}, nil, `WHERE person.person.email = $1`)
	if err != nil {
		return nil, err
	}

	b.personByEmail, err = b.db.Preparex(personByEmailSelect)
	if err != nil {
		return nil, err
	}

	b.addPerson, err = sqlutil.InsertFunc(b.db.DB, data.Person{}, `person.person`)
	if err != nil {
		return nil, err
	}

	b.upsertPerson, err = sqlutil.UpsertFunc(b.db.DB, data.Person{}, `person.person`, `username`)
	if err != nil {
		return nil, err
	}

	b.updatePerson, err = sqlutil.UpdateFunc(b.db.DB, data.Person{}, `person.person`, `id`)
	if err != nil {
		return nil, err
	}

	adSelect, err := sqlutil.Select(data.Ad{}, nil, `WHERE ad.ad.id = $1`)
	if err != nil {
		return nil, err
	}

	b.ad, err = b.db.Preparex(adSelect)
	if err != nil {
		return nil, err
	}

	b.upsertAd, err = sqlutil.UpsertFunc(b.db.DB, data.Ad{}, `ad.ad`, `id`)
	if err != nil {
		return nil, err
	}

	b.updateAdFromClassifier, err = b.db.DB.Prepare(`UPDATE ad.ad SET category_id = $2, category_source = 'classifier', classifier_output = $3 WHERE id = $1 AND (category_id IS NULL OR category_source = 'classifier')`)
	if err != nil {
		return nil, err
	}

	b.addAd, err = sqlutil.InsertFunc(b.db.DB, data.Ad{}, `ad.ad`)
	if err != nil {
		return nil, err
	}

	adCategorySelect, err := sqlutil.Select(data.AdCategory{}, nil, `WHERE ad.category.id = $1`)
	if err != nil {
		return nil, err
	}

	b.adCategory, err = b.db.Preparex(adCategorySelect)
	if err != nil {
		return nil, err
	}

	b.addAdCategory, err = sqlutil.InsertFunc(b.db.DB, data.AdCategory{}, `ad.category`)
	if err != nil {
		return nil, err
	}

	b.upsertAdCategory, err = sqlutil.UpsertFunc(b.db.DB, data.AdCategory{}, `ad.category`, `name`)
	if err != nil {
		return nil, err
	}

	b.updateAdCategory, err = sqlutil.UpdateFunc(b.db.DB, data.AdCategory{}, `ad.category`, `name`)
	if err != nil {
		return nil, err
	}

	b.upsertImpression, err = sqlutil.UpsertFunc(b.db.DB, data.Impression{}, `person.impression`, `person_id`, `local_id`)
	if err != nil {
		return nil, err
	}

	b.upsertSite, err = sqlutil.UpsertFunc(b.db.DB, data.Site{}, `site.site`, `hostname`)
	if err != nil {
		return nil, err
	}

	return b, nil
}

func (b *Backend) Person(id id.ID) (*data.Person, error) {
	person := &data.Person{}
	if err := b.person.Get(person, id); err != nil {
		return nil, err
	}

	return person, nil
}

func (b *Backend) UserByUsername(username string) (*data.Person, error) {
	person := &data.Person{}
	if err := b.personByUsername.Get(person, username); err != nil {
		return nil, err
	}

	return person, nil
}

func (b *Backend) UserByEmail(email string) (*data.Person, error) {
	person := &data.Person{}
	if err := b.personByEmail.Get(person, email); err != nil {
		return nil, err
	}

	return person, nil
}

func (b *Backend) AddPerson(person *data.Person) error {
	_, err := b.addPerson(person)
	if err, ok := err.(*pq.Error); ok && err.Code.Name() == "unique_violation" && err.Constraint == "person_username_key" {
		return UsernameInUseError
	}

	return err
}

func (b *Backend) UpsertPerson(person *data.Person) error {
	_, err := b.upsertPerson(person)
	return err
}

func (b *Backend) UpdatePerson(person *data.Person) error {
	_, err := b.updatePerson(person)
	return err
}

func (b *Backend) Ad(id id.ID) (*data.Ad, error) {
	ad := &data.Ad{}

	err := b.ad.Get(ad, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return ad, nil
}

func (b *Backend) AddAd(ad *data.Ad) error {
	_, err := b.addAd(ad)
	return err
}

func (b *Backend) UpsertAd(ad *data.Ad) error {
	_, err := b.upsertAd(ad)
	return err
}

func (b *Backend) UpdateAd(ad *data.Ad) error {
	_, err := b.updateAd(ad)
	return err
}

func (b *Backend) AdCategory(id int) (*data.AdCategory, error) {
	adCategory := &data.AdCategory{}

	err := b.adCategory.Get(adCategory, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}

	if err != nil {
		return nil, err
	}

	return adCategory, nil
}

func (b *Backend) UpsertAdCategory(adCategory *data.AdCategory) (interface{}, error) {
	return b.upsertAdCategory(adCategory)
}

func (b *Backend) UpsertImpression(impression *data.Impression) (interface{}, error) {
	return b.upsertImpression(impression)
}

func (b *Backend) UpsertSite(site *data.Site) (interface{}, error) {
	return b.upsertSite(site)
}

func (b *Backend) UpdateAdFromClassifier(adID, categoryID interface{}, classificationOutput []byte) error {
	_, err := b.updateAdFromClassifier.Exec(adID, categoryID, classificationOutput)
	return err
}

func (b *Backend) UnclassifiedAds() ([]data.Ad, error) {
	ads := []data.Ad{}
	b.db.Select(&ads, "SELECT * FROM ad.ad WHERE ad.ad.category_id IS NULL")
	return ads, nil
}

type DBAdCatRow struct {
	CategoryId   int    `db:"category_id"`
	CategoryName string `db:"category_name"`
	Count        int    `db:"count"`
}

func (b *Backend) FilteredAds(f data.PersonFilter) (*data.FilterResponseItem, error) {
	whereClauses := make([]string, 0)
	itemData := make(map[string]interface{})

	if f.Age != nil {
		if f.Age.Min != nil {
			whereClauses = append(whereClauses, "EXTRACT(YEAR FROM CURRENT_TIMESTAMP) - person.person.birth_year >= :min_age")
			itemData["min_age"] = *f.Age.Min
		}
		if f.Age.Max != nil {
			whereClauses = append(whereClauses, "EXTRACT(YEAR FROM CURRENT_TIMESTAMP) - person.person.birth_year <= :max_age")
			itemData["max_age"] = *f.Age.Max
		}
	}

	// TODO: fix - this needs to actually use the in binding
	if f.Location != nil {
		whereClauses = append(whereClauses, "person.person.country_code IN (:country_codes)")
		itemData["country_codes"] = pq.Array(f.Location.CountryCodes)
	}

	for idx, df := range f.Demographics {
		key := fmt.Sprintf("demographic_%d", idx)
		if df.Logic == "and" {
			whereClauses = append(whereClauses, fmt.Sprintf("person.person_demographic_aggregate.demographic_ids @> :%s", key))
			itemData[key] = pq.Array(df.Values)
		} else if df.Logic == "or" {
			whereClauses = append(whereClauses, fmt.Sprintf("person.person_demographic_aggregate.demographic_ids && :%s", key))
			itemData[key] = pq.Array(df.Values)
		} else if df.Logic == "nor" {
			whereClauses = append(whereClauses, fmt.Sprintf("NOT person.person_demographic_aggregate.demographic_ids && :%s", key))
			itemData[key] = pq.Array(df.Values)
		} else {
			return nil, errors.New("Demographic logic was not and, or, nor nor")
		}
	}

	whereStr := ""
	if len(whereClauses) > 0 {
		whereStr = fmt.Sprintf("WHERE %s", strings.Join(whereClauses, " AND "))
	}
	query := fmt.Sprintf(adFilterQuery, whereStr)

	rows, err := b.db.NamedQuery(query, itemData)
	if err != nil {
		return nil, err
	}

	adCatRows := make([]DBAdCatRow, 0)
	for rows.Next() {
		adCatRow := DBAdCatRow{}
		err := rows.StructScan(&adCatRow)
		if err != nil {
			return nil, err
		}
		adCatRows = append(adCatRows, adCatRow)
	}

	ret := data.NewFilterResponseItem()
	for _, row := range adCatRows {
		ret.TotalCount += row.Count
	}
	for _, row := range adCatRows {
		ret.Categories[row.CategoryId] = float32(row.Count) / float32(ret.TotalCount)
	}

	return ret, nil
}

func init() {
	sqlutil.Register(data.Person{}, "person.person")
	sqlutil.Register(data.Ad{}, "ad.ad")
	sqlutil.Register(data.AdCategory{}, "ad.category")
	sqlutil.Register(data.Site{}, "site.site")
}
