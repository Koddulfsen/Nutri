-- LARN 2014 spot-checks against SINU web tables

SELECT '--- spot checks ---' AS info;
SELECT c.name AS compound,
       r.age_min_months || '-' || COALESCE(r.age_max_months::text, 'inf') AS age_mo,
       r.sex, r.life_stage, r.value_type,
       r.value || ' ' || r.unit AS value,
       LEFT(COALESCE(r.value_note,''),60) AS note
FROM reference_daily_values r
JOIN compounds c ON c.id = r.compound_id
WHERE r.source_region = 'ITALY'
  AND (
    (c.name = 'Vitamin C (Total)' AND r.age_min_months = 360 AND r.sex = 'FEMALE')
 OR (c.name = 'Calcium (Total)'   AND r.age_min_months = 360 AND r.sex = 'MALE')
 OR (c.name = 'Iron (Total)'      AND r.age_min_months = 360 AND r.sex = 'FEMALE' AND r.life_stage = 'NONE')
 OR (c.name = 'Iron (Total)'      AND r.age_min_months = 132 AND r.sex = 'FEMALE' AND r.life_stage = 'NONE')
 OR (c.name = 'Iron (Total)'      AND r.life_stage = 'PREGNANT')
 OR (c.name = 'Sodium'            AND r.age_min_months = 360 AND r.sex = 'MALE')
 OR (c.name = 'Vitamin D (Total)' AND r.age_min_months = 900 AND r.sex = 'MALE')
 OR (c.name = 'Vitamin A (RAE)'   AND r.life_stage = 'LACTATING')
  )
ORDER BY c.name, r.sex, r.age_min_months, r.life_stage;

SELECT '--- totals by region ---' AS info;
SELECT source_region, count(*) FROM reference_daily_values GROUP BY source_region ORDER BY source_region;
