-- Add table to record screenshots

CREATE SCHEMA IF NOT EXISTS gallery;

CREATE TABLE gallery.image (
  id bytea PRIMARY KEY,
  creator_id bytea REFERENCES person.person (id) NOT NULL,
  data jsonb,
  created_at timestamp
);
