-- person-demographic join array view
-- maybe someday materialize it

CREATE VIEW person.person_demographic_aggregate AS
  (SELECT person_id,
          array_agg(demographic_id) AS demographic_ids
   FROM person.person_demographic
   GROUP BY person_id);
