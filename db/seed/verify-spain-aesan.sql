-- AESAN 2019 spot-check

SELECT c.name AS compound,
       v.value, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months,
       LEFT(v.value_note, 70) AS note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'SPAIN'
  AND (
    -- 1. Vitamin D M 20-29: 12.5 µg (Spain-tiered)
    (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 240 AND v.life_stage = 'NONE')
    -- 2. Vitamin D >70: 15 µg
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 840 AND v.life_stage = 'NONE')
    -- 3. Iron F 20-29 menstruating: 18 mg
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 240 AND v.life_stage = 'NONE')
    -- 4. Iron preg: 27 mg
    OR (c.name = 'Iron (Total)' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 5. Fluoride 0-6 mo: 0.25 mg (notably higher than WHO)
    OR (c.name = 'Fluoride' AND v.age_min_months = 0 AND v.age_max_months = 5)
    -- 6. Calcium M 20-29: 950
    OR (c.name = 'Calcium (Total)' AND v.sex = 'MALE' AND v.age_min_months = 240 AND v.life_stage = 'NONE')
    -- 7. Folate preg: 500 µg
    OR (c.name = 'Folate (Total)' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 8. Iodine preg: 200 µg
    OR (c.name = 'Iodine' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 9. Sodium adult: 1500 mg (EFSA-aligned)
    OR (c.name = 'Sodium' AND v.sex = 'MALE' AND v.age_min_months = 240 AND v.life_stage = 'NONE')
    -- 10. Vitamin A lact: 1300 µg
    OR (c.name = 'Vitamin A (RAE)' AND v.life_stage = 'LACTATING')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.life_stage;

SELECT v.value_type, COUNT(*) AS n FROM reference_daily_values v
WHERE v.source_region = 'SPAIN' GROUP BY v.value_type ORDER BY n DESC;

SELECT COUNT(*) AS total_spain FROM reference_daily_values WHERE source_region = 'SPAIN';
