-- Migrate ad categories, preserving data.

CREATE TEMPORARY TABLE ad_category_temp (
  id serial PRIMARY KEY,
  old_id bytea NOT NULL,
  name varchar(80) NOT NULL
);
INSERT INTO ad_category_temp (old_id, name) SELECT id as old_id, name FROM ad.category;

CREATE TEMPORARY TABLE ad_temp AS
  SELECT ad.id as id, ad_category_temp.id as category_id
  FROM ad.ad
  JOIN ad_category_temp ON ad.category_id = ad_category_temp.old_id;
ALTER TABLE ad.ad DROP COLUMN category_id;

DROP TABLE ad.category;
CREATE TABLE ad.category (
  id serial PRIMARY KEY,
  name varchar(80) NOT NULL
);
INSERT INTO ad.category (id, name) SELECT id, name FROM ad_category_temp;
CREATE UNIQUE INDEX ON ad.category (name);

ALTER TABLE ad.ad ADD COLUMN category_id int REFERENCES ad.category (id);
CREATE INDEX ON ad.ad (category_id);
UPDATE ad.ad SET (category_id) = (SELECT category_id FROM ad_temp WHERE ad.ad.id = ad_temp.id);

-- Migrate site categories, destroying data.

ALTER TABLE site.site DROP COLUMN category_id;
DROP TABLE site.category;
CREATE TABLE site.category (
  id serial PRIMARY KEY,
  name varchar(80) NOT NULL
);
CREATE UNIQUE INDEX ON site.category (name);
ALTER TABLE site.site ADD COLUMN category_id int REFERENCES site.category (id);

-- Migrate demographics, destroying data.

ALTER TABLE person.person_demographic DROP COLUMN demographic_id CASCADE;
DROP TABLE demographic.demographic;
DROP TABLE demographic.category;

CREATE TABLE demographic.category (
	id SERIAL PRIMARY KEY,
	name varchar(80) NOT NULL
);
CREATE UNIQUE INDEX ON demographic.category (name);

CREATE TABLE demographic.demographic (
	id SERIAL PRIMARY KEY,
	category_id int REFERENCES demographic.category (id) NOT NULL,
	name varchar(80) NOT NULL
);
CREATE INDEX ON demographic.demographic (category_id);
CREATE UNIQUE INDEX ON demographic.demographic (category_id, name);

ALTER TABLE person.person_demographic ADD COLUMN demographic_id int REFERENCES demographic.demographic (id) NOT NULL;
CREATE UNIQUE INDEX ON person.person_demographic (person_id, demographic_id);
CREATE INDEX ON person.person_demographic (demographic_id);
