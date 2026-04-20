-- ICMR 2020 spot-checks against brief-note.pdf tables

SELECT '--- spot checks ---' AS info;
SELECT c.name AS compound,
       r.age_min_months || '-' || COALESCE(r.age_max_months::text, 'inf') AS age_mo,
       r.sex, r.life_stage, COALESCE(r.activity_level::text,'—') AS activity, r.value_type,
       r.value || ' ' || r.unit AS value,
       LEFT(COALESCE(r.value_note,''),55) AS note
FROM reference_daily_values r
JOIN compounds c ON c.id = r.compound_id
WHERE r.source_region = 'INDIA'
  AND (
    (c.name = 'Energy'              AND r.age_min_months = 216 AND r.sex = 'MALE' AND r.activity_level = 'SEDENTARY')
 OR (c.name = 'Energy'              AND r.age_min_months = 216 AND r.sex = 'MALE' AND r.activity_level = 'VERY_ACTIVE')
 OR (c.name = 'Protein'             AND r.age_min_months = 216 AND r.sex = 'MALE' AND r.value_type = 'RDA')
 OR (c.name = 'Protein'             AND r.life_stage = 'PREGNANT_T3' AND r.value_type = 'RDA')
 OR (c.name = 'Iron (Total)'        AND r.age_min_months = 216 AND r.sex = 'FEMALE' AND r.value_type = 'RDA')
 OR (c.name = 'Vitamin D (Total)'   AND r.age_min_months = 216 AND r.sex = 'MALE' AND r.value_type = 'RDA')
 OR (c.name = 'Folate (Total)'      AND r.age_min_months = 216 AND r.sex = 'MALE' AND r.value_type = 'EAR')
 OR (c.name = 'Calcium (Total)'     AND r.age_min_months = 216 AND r.sex = 'MALE' AND r.value_type = 'RDA')
  )
ORDER BY c.name, r.sex, r.value_type;

SELECT '--- totals by source ---' AS info;
SELECT source_region, count(*) FROM reference_daily_values GROUP BY source_region ORDER BY source_region;
