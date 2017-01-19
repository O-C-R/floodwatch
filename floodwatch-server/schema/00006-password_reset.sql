-- Add ability to reset password

CREATE TABLE person.verification (
  person_id bytea REFERENCES person.person (id),
  password_reset_token bytea,
  password_reset_token_expiry
);

CREATE UNIQUE INDEX person_verification_person_id ON person.verification (person_id);
CREATE UNIQUE INDEX person_verification_password_reset_token ON person.verification (password_reset_token);
