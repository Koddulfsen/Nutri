SELECT c.name AS compound,
       r.age_min_months || '-' || COALESCE(r.age_max_months::text, 'inf') AS age_mo,
       r.sex, r.life_stage, r.value_type,
       r.value || ' ' || r.unit AS value,
       r.is_provisional AS prov,
       LEFT(COALESCE(r.value_note,''),40) AS note
FROM reference_daily_values r
JOIN compounds c ON c.id = r.compound_id
WHERE r.source_region = 'NORDIC'
  AND (
    (c.name = 'Vitamin C (Total)'   AND r.age_min_months = 300 AND r.sex = 'FEMALE' AND r.value_type = 'RDA')
 OR (c.name = 'Calcium (Total)'     AND r.age_min_months = 300 AND r.sex = 'MALE'   AND r.value_type = 'RDA')
 OR (c.name = 'Iron (Total)'        AND r.age_min_months = 300 AND r.sex = 'FEMALE' AND r.value_type = 'RDA')
 OR (c.name = 'Vitamin D (Total)'   AND r.age_min_months = 852 AND r.sex = 'FEMALE' AND r.value_type = 'RDA')
 OR (c.name = 'Folate (Total)'      AND r.value_type = 'UL'   AND r.age_min_months = 300 AND r.sex = 'FEMALE')
 OR (c.name = 'Iron (Total)'        AND r.value_type = 'UL'   AND r.age_min_months = 300 AND r.sex = 'MALE')
 OR (c.name = 'Vitamin E (Total)'   AND r.age_min_months = 300 AND r.sex = 'MALE'   AND r.value_type = 'EAR')
  )
ORDER BY c.name, r.sex, r.value_type;

SELECT '--- totals by type ---' AS info;
SELECT value_type, count(*) FROM reference_daily_values WHERE source_region='NORDIC' GROUP BY value_type ORDER BY value_type;

SELECT '--- provisional count ---' AS info;
SELECT count(*) AS provisional_rows FROM reference_daily_values WHERE source_region='NORDIC' AND is_provisional = true;
