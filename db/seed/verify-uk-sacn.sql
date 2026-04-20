-- UK SACN/COMA spot-check
-- Run: psql $DATABASE_URL -f db/seed/verify-uk-sacn.sql

SELECT c.name AS compound,
       v.value, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months,
       v.value_note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'UK'
  AND (
    -- 1. Vitamin C female 19-50: should be 40 mg
    (c.name = 'Vitamin C (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 2. Iron female 19-50: should be 14.8 mg with menstruation note
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 3. Calcium male 11-14: should be 1000 mg
    OR (c.name = 'Calcium (Total)' AND v.sex = 'MALE' AND v.age_min_months = 132 AND v.life_stage = 'NONE')
    -- 4. Vitamin D adult: 10 µg
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 5. Energy female 25-34: 2175 kcal
    OR (c.name = 'Energy' AND v.sex = 'FEMALE' AND v.age_min_months = 300 AND v.value_type = 'EAR')
    -- 6. Sodium CDRR (SACN 2003) 11+: 2360 mg
    OR (c.name = 'Sodium' AND v.value_type = 'CDRR' AND v.age_min_months = 132)
    -- 7. Free Sugars (Added Sugars) 2+: 5%
    OR (c.name = 'Added Sugars' AND v.value_type = 'CDRR')
    -- 8. Iron female 50+: 8.7 mg (postmenopausal)
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 612 AND v.life_stage = 'NONE')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.value_type;

-- Total row count by value_type
SELECT v.value_type, COUNT(*) AS n
FROM reference_daily_values v
WHERE v.source_region = 'UK'
GROUP BY v.value_type
ORDER BY n DESC;

-- Total
SELECT COUNT(*) AS total_uk_rows FROM reference_daily_values WHERE source_region = 'UK';
