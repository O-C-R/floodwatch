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

	personDemographicDelete = `DELETE FROM person.person_demographic WHERE person_id = ? AND demographic_id NOT IN (?)`
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

	addPerson, upsertPerson, updatePerson sqlutil.ValueFunc

	upsertPersonVerification                        sqlutil.ValueFunc
	getPersonVerification, deletePersonVerification *sqlx.Stmt

	personDemographics, upsertPersonDemographic, deleteAllDemographics *sqlx.Stmt

	addAdCategory, upsertAdCategory, updateAdCategory sqlutil.ValueFunc

	addAd, upsertAd, updateAd sqlutil.ValueFunc
	updateAdFromClassifier    *sql.Stmt

	upsertImpression sqlutil.ValueFunc
	upsertSite       sqlutil.ValueFunc

	addGalleryImage       sqlutil.ValueFunc
	getGalleryImageBySlug *sqlx.Stmt

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

	b.upsertPersonVerification, err = sqlutil.UpsertFunc(b.db.DB, data.PersonVerification{}, `person.verification`, `person_id`)
	if err != nil {
		return nil, err
	}

	personVerificationSelect, err := sqlutil.Select(data.PersonVerification{}, nil, `WHERE password_reset_token = $1`)
	if err != nil {
		return nil, err
	}

	b.getPersonVerification, err = b.db.Preparex(personVerificationSelect)
	if err != nil {
		return nil, err
	}

	b.deletePersonVerification, err = b.db.Preparex(`DELETE FROM person.verification WHERE person_id = $1`)
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

	b.addGalleryImage, err = sqlutil.InsertFunc(b.db.DB, data.GalleryImage{}, `gallery.image`)
	if err != nil {
		return nil, err
	}

	galleryImageSelect, err := sqlutil.Select(data.GalleryImage{}, nil, `WHERE gallery.image.slug = $1`)
	if err != nil {
		return nil, err
	}

	b.getGalleryImageBySlug, err = b.db.Preparex(galleryImageSelect)
	if err != nil {
		return nil, err
	}

	b.upsertSite, err = sqlutil.UpsertFunc(b.db.DB, data.Site{}, `site.site`, `hostname`)
	if err != nil {
		return nil, err
	}

	b.personDemographics, err = b.db.Preparex(`SELECT demographic_id FROM person.person_demographic WHERE person_id = $1`)
	if err != nil {
		return nil, err
	}

	b.deleteAllDemographics, err = b.db.Preparex(`DELETE FROM person.person_demographic WHERE person_id = $1`)
	if err != nil {
		return nil, err
	}

	b.upsertPersonDemographic, err = b.db.Preparex(`INSERT INTO person.person_demographic (person_id, demographic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`)
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

func (b *Backend) PersonDemographics(personId id.ID) ([]int, error) {
	demographicIds := []int{}

	err := b.personDemographics.Select(&demographicIds, personId)
	if err != nil {
		return nil, err
	}

	return demographicIds, nil
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
	if err, ok := err.(*pq.Error); ok && err.Code.Name() == "unique_violation" && err.Constraint == "person_username_idx" {
		return UsernameInUseError
	}

	return err
}

func (b *Backend) UpsertPerson(person *data.Person) error {
	_, err := b.upsertPerson(person)
	return err
}

func (b *Backend) UpsertPersonVerification(personVerification *data.PersonVerification) error {
	_, err := b.upsertPersonVerification(personVerification)
	return err
}

func (b *Backend) GetPersonVerification(resetToken id.ID) (*data.PersonVerification, error) {
	personVerification := &data.PersonVerification{}
	if err := b.getPersonVerification.Get(personVerification, resetToken); err != nil {
		return nil, err
	}
	return personVerification, nil
}

func (b *Backend) DeletePersonVerification(personId id.ID) error {
	_, err := b.deletePersonVerification.Exec(personId)
	return err
}

func (b *Backend) UpdatePersonDemographics(personId id.ID, demographicIds []int) error {
	tx, err := b.db.Beginx()
	if err != nil {
		return err
	}

	if len(demographicIds) > 0 {
		query, args, err := sqlx.In(personDemographicDelete, personId, demographicIds)
		if err != nil {
			tx.Rollback()
			return err
		}

		query = tx.Rebind(query)
		_, err = tx.Exec(query, args...)
		if err != nil {
			tx.Rollback()
			return err
		}
	} else {
		deleteTx := tx.Stmtx(b.deleteAllDemographics)
		_, err = deleteTx.Exec(personId)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	insertTx := tx.Stmtx(b.upsertPersonDemographic)
	for _, demographicId := range demographicIds {
		_, err = insertTx.Exec(personId, demographicId)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
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

func (b *Backend) AddGalleryImage(galleryImage *data.GalleryImage) (interface{}, error) {
	return b.addGalleryImage(galleryImage)
}

func (b *Backend) GetGalleryImageBySlug(imageSlug string) (*data.GalleryImage, error) {
	galleryImage := &data.GalleryImage{}
	if err := b.getGalleryImageBySlug.Get(galleryImage, imageSlug); err != nil {
		return nil, err
	}
	return galleryImage, nil
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

func (b *Backend) FilteredAds(f data.PersonFilter, contextPersonId id.ID) (*data.FilterResponseItem, error) {
	whereClauses := make([]string, 0)
	params := make(map[string]interface{})

	if f.Personal != nil && *f.Personal {
		whereClauses = append(whereClauses, "person.id = :personId")
		params["personId"] = contextPersonId
	} else {
		if f.Age != nil {
			if f.Age.Min != nil {
				whereClauses = append(whereClauses, "EXTRACT(YEAR FROM CURRENT_TIMESTAMP) - person.person.birth_year >= :minAge")
				params["minAge"] = *f.Age.Min
			}
			if f.Age.Max != nil {
				whereClauses = append(whereClauses, "EXTRACT(YEAR FROM CURRENT_TIMESTAMP) - person.person.birth_year <= :maxAge")
				params["maxAge"] = *f.Age.Max
			}
		}

		// TODO: fix - this needs to actually use the in binding
		if f.Location != nil {
			whereClauses = append(whereClauses, "person.person.country_code IN (:countryCodes)")
			params["countryCodes"] = f.Location.CountryCodes
		}

		for idx, df := range f.Demographics {
			key := fmt.Sprintf("demographic_%d", idx)
			if df.Operator == "and" {
				whereClauses = append(whereClauses, fmt.Sprintf("person.person_demographic_aggregate.demographic_ids @> :%s", key))
				params[key] = pq.Array(df.Values)
			} else if df.Operator == "or" {
				whereClauses = append(whereClauses, fmt.Sprintf("person.person_demographic_aggregate.demographic_ids && :%s", key))
				params[key] = pq.Array(df.Values)
			} else if df.Operator == "nor" {
				whereClauses = append(whereClauses, fmt.Sprintf("NOT person.person_demographic_aggregate.demographic_ids && :%s", key))
				params[key] = pq.Array(df.Values)
			} else {
				return nil, errors.New("Demographic logic was not and, or, nor nor")
			}
		}
	}

	whereStr := ""
	if len(whereClauses) > 0 {
		whereStr = fmt.Sprintf("WHERE %s", strings.Join(whereClauses, " AND "))
	}
	query := fmt.Sprintf(adFilterQuery, whereStr)

	query, args, err := sqlx.Named(query, params)
	query, args, err = sqlx.In(query, args...)
	query = b.db.Rebind(query)
	rows, err := b.db.Queryx(query, args...)
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
	sqlutil.Register(data.PersonVerification{}, "person.verification")
	sqlutil.Register(data.GalleryImage{}, "gallery.image")
}
