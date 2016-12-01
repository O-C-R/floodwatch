-- Migrate to twofishes_id

ALTER TABLE person.person DROP COLUMN geonameid;
ALTER TABLE person.person ADD COLUMN twofishes_id varchar(127) DEFAULT NULL;
