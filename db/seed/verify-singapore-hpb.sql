-- Singapore HPB spot-check

SELECT c.name AS compound,
       v.value, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months, v.activity_level,
       LEFT(v.value_note, 70) AS note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'SINGAPORE'
  AND (
    -- 1. Iron F 18-30: 18 mg (menstruating)
    (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 216 AND v.life_stage = 'NONE')
    -- 2. Iron F 60+: 8 mg (postmeno — Singapore drop)
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 720 AND v.life_stage = 'NONE')
    -- 3. Iron M 16-18: 6 mg (Singapore anomaly — low)
    OR (c.name = 'Iron (Total)' AND v.sex = 'MALE' AND v.age_min_months = 192 AND v.life_stage = 'NONE')
    -- 4. Vitamin D adult: 2.5 µg (notably low for Singapore)
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.life_stage = 'NONE')
    -- 5. Calcium 60+: 1000 mg
    OR (c.name = 'Calcium (Total)' AND v.sex = 'MALE' AND v.age_min_months = 720 AND v.life_stage = 'NONE')
    -- 6. Folate preg: 600 µg
    OR (c.name = 'Folate (Total)' AND v.life_stage = 'PREGNANT')
    -- 7. Vitamin C pregnancy: 100 mg
    OR (c.name = 'Vitamin C (Total)' AND v.life_stage = 'PREGNANT')
    -- 8. Energy M 18-30 moderate: 2700 kcal
    OR (c.name = 'Energy' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.activity_level = 'MODERATE' AND v.life_stage = 'NONE')
    -- 9. Energy F 18-30 active: 2840 kcal
    OR (c.name = 'Energy' AND v.sex = 'FEMALE' AND v.age_min_months = 216 AND v.activity_level = 'ACTIVE' AND v.life_stage = 'NONE')
    -- 10. Vitamin A lact: 1200 µg
    OR (c.name = 'Vitamin A (RAE)' AND v.life_stage = 'LACTATING_0_6M')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.life_stage, v.activity_level;

SELECT v.value_type, COUNT(*) AS n FROM reference_daily_values v
WHERE v.source_region = 'SINGAPORE' GROUP BY v.value_type ORDER BY n DESC;

SELECT COUNT(*) AS total_singapore FROM reference_daily_values WHERE source_region = 'SINGAPORE';
