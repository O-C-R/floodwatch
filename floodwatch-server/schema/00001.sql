-- people

CREATE SCHEMA IF NOT EXISTS person;

DROP TABLE IF EXISTS person.person CASCADE;
CREATE TABLE person.person (
	id bytea PRIMARY KEY,
	username varchar(80) NOT NULL,
	password bytea NOT NULL,
	email varchar(80),
	admin boolean NOT NULL DEFAULT false,
	last_seen timestamp NOT NULL
);

CREATE UNIQUE INDEX ON person.person (username);
CREATE INDEX ON person.person (email);


-- demographics

CREATE SCHEMA IF NOT EXISTS demographic;

DROP TABLE IF EXISTS demographic.category CASCADE;
CREATE TABLE demographic.category (
	id bytea PRIMARY KEY,
	name varchar(80) NOT NULL
);

CREATE UNIQUE INDEX ON demographic.category (name);

DROP TABLE IF EXISTS demographic.demographic CASCADE;
CREATE TABLE demographic.demographic (
	id bytea PRIMARY KEY,
	category_id bytea REFERENCES demographic.category (id) NOT NULL,
	name varchar(80) NOT NULL
);

CREATE INDEX ON demographic.demographic (category_id);
CREATE UNIQUE INDEX ON demographic.demographic (category_id, name);


-- person demographics

DROP TABLE IF EXISTS person.person_demographic CASCADE;
CREATE TABLE person.person_demographic (
	person_id bytea REFERENCES person.person (id) NOT NULL,
	demographic_id bytea REFERENCES demographic.demographic (id) NOT NULL
);

CREATE UNIQUE INDEX ON person.person_demographic (person_id, demographic_id);
CREATE INDEX ON person.person_demographic (person_id);
CREATE INDEX ON person.person_demographic (demographic_id);


-- site

CREATE SCHEMA IF NOT EXISTS site;

DROP TABLE IF EXISTS site.category CASCADE;
CREATE TABLE site.category (
	id bytea PRIMARY KEY,
	name varchar(80) NOT NULL
);

CREATE UNIQUE INDEX ON site.category (name);

DROP TABLE IF EXISTS site.site CASCADE;
CREATE TABLE site.site (
	id bytea PRIMARY KEY,
	category_id bytea REFERENCES site.category (id),
	hostname varchar(80) NOT NULL,
	name varchar(80)
);

CREATE UNIQUE INDEX ON site.site (hostname);


-- ads

CREATE SCHEMA IF NOT EXISTS ad;

DROP TABLE IF EXISTS ad.category CASCADE;
CREATE TABLE ad.category (
	id bytea PRIMARY KEY,
	name varchar(80) NOT NULL
);

CREATE UNIQUE INDEX ON ad.category (name);

DROP TYPE IF EXISTS media_type CASCADE;
CREATE TYPE category_source AS ENUM ('classifier', 'user', 'manual');

DROP TABLE IF EXISTS ad.ad CASCADE;
CREATE TABLE ad.ad (
	id bytea PRIMARY KEY,
	category_id bytea REFERENCES ad.category (id),
	category_source category_source,
	classifier_output jsonb
);

CREATE INDEX ON ad.ad (category_id);

-- impressions

DROP TYPE IF EXISTS media_type CASCADE;
CREATE TYPE media_type AS ENUM ('image', 'media', 'subdocument', 'object');

DROP TYPE IF EXISTS capture_type CASCADE;
CREATE TYPE capture_type AS ENUM ('image', 'screenshot');

DROP TABLE IF EXISTS person.impression CASCADE;
CREATE TABLE person.impression (
	id bytea PRIMARY KEY,
	local_id bytea NOT NULL,
	person_id bytea REFERENCES person.person (id) NOT NULL,
	site_id bytea REFERENCES site.site (id) NOT NULL,
	ad_id bytea REFERENCES ad.ad (id) NOT NULL,
	top_url varchar(2083) NOT NULL,
	ad_urls varchar(2083)[],
	html text,
	media_type media_type NOT NULL,
	capture_type capture_type NOT NULL,
	timestamp timestamp NOT NULL
);

CREATE UNIQUE INDEX ON person.impression (local_id, person_id);
CREATE INDEX ON person.impression (person_id);
