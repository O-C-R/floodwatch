package backend

import (
	"database/sql"
	"errors"

	"github.com/O-C-R/sqlutil"
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"

	"github.com/O-C-R/floodwatch-server/api/data"
)

var (
	NotFoundError      = sql.ErrNoRows
	UsernameInUseError = errors.New("username in use")
)

type Backend struct {
	db *sqlx.DB

	user, userByUsername, userByEmail, updateUser, addUser *sqlx.Stmt
}

func New(url string) (*Backend, error) {
	b := &Backend{}

	var err error
	b.db, err = sqlx.Open("postgres", url)
	if err != nil {
		return nil, err
	}

	userSelect, err := sqlutil.Select(data.User{}, nil, `WHERE public.user.id = $1`)
	if err != nil {
		return nil, err
	}

	b.user, err = b.db.Preparex(userSelect)
	if err != nil {
		return nil, err
	}

	userByUsernameSelect, err := sqlutil.Select(data.User{}, nil, `WHERE public.user.username = $1`)
	if err != nil {
		return nil, err
	}

	b.userByUsername, err = b.db.Preparex(userByUsernameSelect)
	if err != nil {
		return nil, err
	}

	userByEmailSelect, err := sqlutil.Select(data.User{}, nil, `WHERE public.user.h_email = $1`)
	if err != nil {
		return nil, err
	}

	b.userByEmail, err = b.db.Preparex(userByEmailSelect)
	if err != nil {
		return nil, err
	}

	b.updateUser, err = b.db.Preparex(`UPDATE public.user SET username = $2, h_password = $3, h_email = $4, opt_in = $5, last_seen = $6 WHERE username = $1`)
	if err != nil {
		return nil, err
	}

	b.addUser, err = b.db.Preparex(`INSERT INTO public.user (username, h_password, h_email, opt_in, last_seen) VALUES ($1, $2, $3, $4, $5)`)
	if err != nil {
		return nil, err
	}

	return b, nil
}

func (b *Backend) User(id uint64) (*data.User, error) {
	user := &data.User{}
	if err := b.user.Get(user, id); err != nil {
		return nil, err
	}

	return user, nil
}

func (b *Backend) UserByUsername(username string) (*data.User, error) {
	user := &data.User{}
	if err := b.userByUsername.Get(user, username); err != nil {
		return nil, err
	}

	return user, nil
}

func (b *Backend) UserByEmail(email string) (*data.User, error) {
	user := &data.User{}
	if err := b.userByEmail.Get(user, email); err != nil {
		return nil, err
	}

	return user, nil
}

func (b *Backend) UpdateUser(user *data.User) error {
	_, err := b.updateUser.Exec(user.ID, user.Username, user.Password, user.Email, user.OptIn, user.LastSeen)
	return err
}

func (b *Backend) AddUser(user *data.User) error {
	_, err := b.addUser.Exec(user.Username, user.Password, user.Email, user.OptIn, user.LastSeen)
	if err, ok := err.(*pq.Error); ok && err.Code.Name() == "unique_violation" && err.Constraint == "user_username_key" {
		return UsernameInUseError
	}

	return err
}

func init() {
	sqlutil.Register(data.User{}, "public.user")
}
