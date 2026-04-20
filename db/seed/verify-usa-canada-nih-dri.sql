-- NIH DRI spot-checks against NCBI Bookshelf summary tables

SELECT '--- spot checks ---' AS info;
SELECT c.name AS compound,
       r.age_min_months || '-' || COALESCE(r.age_max_months::text, 'inf') AS age_mo,
       r.sex, r.life_stage, r.value_type,
       r.value || ' ' || r.unit AS value,
       COALESCE(r.value_min::text,'') || '-' || COALESCE(r.value_max::text,'') AS range,
       LEFT(COALESCE(r.value_note,''),55) AS note
FROM reference_daily_values r
JOIN compounds c ON c.id = r.compound_id
WHERE r.source_region = 'USA_CANADA'
  AND (
    (c.name = 'Calcium (Total)'   AND r.age_min_months = 228 AND r.sex = 'MALE'   AND r.value_type = 'RDA')
 OR (c.name = 'Iron (Total)'      AND r.age_min_months = 228 AND r.sex = 'FEMALE' AND r.value_type = 'RDA')
 OR (c.name = 'Vitamin D (Total)' AND r.age_min_months = 852 AND r.sex = 'MALE'   AND r.value_type = 'RDA')
 OR (c.name = 'Vitamin C (Total)' AND r.age_min_months = 228 AND r.sex = 'MALE'   AND r.value_type = 'RDA')
 OR (c.name = 'Folate (Total)'    AND r.life_stage = 'PREGNANT' AND r.age_min_months = 228 AND r.value_type = 'RDA')
 OR (c.name = 'Sodium'            AND r.age_min_months = 228 AND r.sex = 'MALE'   AND r.value_type = 'AI')
 OR (c.name = 'Sodium'            AND r.age_min_months = 228 AND r.sex = 'MALE'   AND r.value_type = 'CDRR')
 OR (c.name = 'Iron (Total)'      AND r.age_min_months = 228 AND r.sex = 'MALE'   AND r.value_type = 'UL')
 OR (c.name = 'Vitamin D (Total)' AND r.age_min_months = 228 AND r.sex = 'MALE'   AND r.value_type = 'UL')
 OR (c.name = 'Protein'           AND r.age_min_months = 228 AND r.sex = 'MALE'   AND r.value_type = 'AMDR')
  )
ORDER BY c.name, r.sex, r.value_type;

SELECT '--- totals by source ---' AS info;
SELECT source_region, count(*) FROM reference_daily_values GROUP BY source_region ORDER BY source_region;

SELECT '--- value_type breakdown for USA_CANADA ---' AS info;
SELECT value_type, count(*) FROM reference_daily_values WHERE source_region='USA_CANADA' GROUP BY value_type ORDER BY value_type;
