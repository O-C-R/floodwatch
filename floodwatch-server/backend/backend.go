package backend

import (
	"database/sql"
	"errors"

	"github.com/O-C-R/auth/id"
	"github.com/O-C-R/sqlutil"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"github.com/O-C-R/floodwatch/floodwatch-server/data"
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

func (b *Backend) AdCategory(id id.ID) (*data.AdCategory, error) {
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

func (b *Backend) UpsertAdCategory(adCategory *data.AdCategory) (id.ID, error) {
	return b.upsertAdCategory(adCategory)
}

func (b *Backend) UpsertImpression(impression *data.Impression) (id.ID, error) {
	return b.upsertImpression(impression)
}

func (b *Backend) UpsertSite(site *data.Site) (id.ID, error) {
	return b.upsertSite(site)
}

func (b *Backend) UpdateAdFromClassifier(adID, categoryID id.ID, classificationOutput []byte) error {
	_, err := b.updateAdFromClassifier.Exec(adID, categoryID, classificationOutput)
	return err
}

func (b *Backend) UnclassifiedAds() ([]data.Ad, error) {
	ads := []data.Ad{}
	b.db.Select(&ads, "SELECT * FROM ad.ad WHERE ad.ad.category_id IS NULL")
	return ads, nil
}

func init() {
	sqlutil.Register(data.Person{}, "person.person")
	sqlutil.Register(data.Ad{}, "ad.ad")
	sqlutil.Register(data.AdCategory{}, "ad.category")
	sqlutil.Register(data.Site{}, "site.site")
}
