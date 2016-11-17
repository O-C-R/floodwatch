-- add demographic categories

WITH cat AS (INSERT INTO demographic.category (name)
             VALUES ('religion')
             RETURNING id)
INSERT INTO demographic.demographic (category_id, name)
  VALUES ((SELECT id FROM cat), 'Islam'),
         ((SELECT id FROM cat), 'Judaism'),
         ((SELECT id FROM cat), 'Buddhism'),
         ((SELECT id FROM cat), 'Christianity'),
         ((SELECT id FROM cat), 'Hinduism'),
         ((SELECT id FROM cat), 'Agnostic'),
         ((SELECT id FROM cat), 'None/Atheist'),
         ((SELECT id FROM cat), 'Other');

WITH cat AS (INSERT INTO demographic.category (name)
             VALUES ('race')
             RETURNING id)
INSERT INTO demographic.demographic (category_id, name)
  VALUES ((SELECT id FROM cat), 'American Indian or Alaska Native'),
         ((SELECT id FROM cat), 'Hispanic, Latino, or Spanish origin'),
         ((SELECT id FROM cat), 'White'),
         ((SELECT id FROM cat), 'Asian'),
         ((SELECT id FROM cat), 'Middle Eastern or North African'),
         ((SELECT id FROM cat), 'Black or African American'),
         ((SELECT id FROM cat), 'Native Hawaiian or Other Pacific Islander'),
         ((SELECT id FROM cat), 'Other');
--
WITH cat AS (INSERT INTO demographic.category (name)
             VALUES ('gender')
             RETURNING id)
INSERT INTO demographic.demographic (category_id, name)
  VALUES ((SELECT id FROM cat), 'Female'),
         ((SELECT id FROM cat), 'Male'),
         ((SELECT id FROM cat), 'Trans'),
         ((SELECT id FROM cat), 'Nonbinary'),
         ((SELECT id FROM cat), 'Other');

-- add demographics to person

ALTER TABLE person.person ADD COLUMN birth_year int DEFAULT NULL;
ALTER TABLE person.person ADD COLUMN geonameid bigint DEFAULT NULL;
