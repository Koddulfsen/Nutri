-- EFSA DRV spot-checks

SELECT '--- spot checks ---' AS info;
SELECT c.name AS compound,
       r.age_min_months || '-' || COALESCE(r.age_max_months::text, 'inf') AS age_mo,
       r.sex, r.life_stage, COALESCE(r.activity_level::text,'—') AS activity,
       COALESCE(r.dietary_context::text,'—') AS diet, r.value_type,
       r.value || ' ' || r.unit AS value,
       COALESCE(r.value_min::text,'') || '-' || COALESCE(r.value_max::text,'') AS range,
       LEFT(COALESCE(r.value_note,''),50) AS note
FROM reference_daily_values r
JOIN compounds c ON c.id = r.compound_id
WHERE r.source_region = 'EU'
  AND (
    (c.name = 'Calcium (Total)'   AND r.age_min_months = 300 AND r.sex = 'MALE'   AND r.value_type = 'RDA' AND r.life_stage = 'NONE')
 OR (c.name = 'Iron (Total)'      AND r.age_min_months = 216 AND r.sex = 'FEMALE' AND r.value_type = 'RDA' AND r.life_stage = 'NONE')
 OR (c.name = 'Iron (Total)'      AND r.age_min_months = 612 AND r.sex = 'FEMALE' AND r.value_type = 'RDA')
 OR (c.name = 'Zinc (Total)'      AND r.age_min_months = 216 AND r.sex = 'MALE'   AND r.value_type = 'RDA' AND r.life_stage = 'NONE')
 OR (c.name = 'Energy'            AND r.age_min_months = 216 AND r.sex = 'MALE'   AND r.activity_level = 'SEDENTARY')
 OR (c.name = 'Energy'            AND r.age_min_months = 216 AND r.sex = 'MALE'   AND r.activity_level = 'VERY_ACTIVE')
 OR (c.name = 'Protein'           AND r.age_min_months = 216 AND r.sex = 'FEMALE' AND r.value_type = 'RDA' AND r.life_stage = 'NONE')
 OR (c.name = 'Vitamin D (Total)' AND r.age_min_months = 216 AND r.sex = 'MALE'   AND r.value_type = 'AI')
 OR (c.name = 'Total Fat'         AND r.age_min_months = 216 AND r.sex = 'MALE'   AND r.value_type = 'AMDR')
  )
ORDER BY c.name, r.sex, r.value_type, r.dietary_context;

SELECT '--- zinc phytate tiers (adult M) ---' AS info;
SELECT r.dietary_context, r.value, r.value_type
FROM reference_daily_values r
JOIN compounds c ON c.id = r.compound_id
WHERE r.source_region='EU' AND c.name='Zinc (Total)' AND r.age_min_months=216 AND r.sex='MALE' AND r.life_stage='NONE' AND r.value_type='RDA'
ORDER BY r.dietary_context;

SELECT '--- totals by source ---' AS info;
SELECT source_region, count(*) FROM reference_daily_values GROUP BY source_region ORDER BY source_region;

SELECT '--- EU value_type breakdown ---' AS info;
SELECT value_type, count(*) FROM reference_daily_values WHERE source_region='EU' GROUP BY value_type ORDER BY value_type;
