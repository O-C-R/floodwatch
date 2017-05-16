-- Add table to record screenshots

CREATE SCHEMA IF NOT EXISTS gallery;

CREATE TABLE gallery.image (
  slug VARCHAR(9) PRIMARY KEY,
  creator_id bytea REFERENCES person.person (id) NOT NULL,
  data jsonb,
  created_at timestamp
);
