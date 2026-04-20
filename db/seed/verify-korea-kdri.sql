-- KDRI 2020 spot-check

SELECT c.name AS compound,
       v.value, v.value_min, v.value_max, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months,
       LEFT(v.value_note, 80) AS note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'KOREA'
  AND (
    -- 1. Vitamin A M 19-29 RNI: 800 µg RAE
    (c.name = 'Vitamin A (RAE)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 2. Iron F 19-29 RNI: 14 mg (menstruating adult)
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 228 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 3. Iron preg RNI: 24 mg (14 + 10)
    OR (c.name = 'Iron (Total)' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 4. Sodium CDRR adult: 2300 mg
    OR (c.name = 'Sodium' AND v.value_type = 'CDRR' AND v.age_min_months = 228 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
    -- 5. Carb RNI preg: 175 (errata 4: was 180)
    OR (c.name = 'Carbohydrates' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 6. Carb RNI lact: 210 (errata 4: was 215)
    OR (c.name = 'Carbohydrates' AND v.life_stage = 'LACTATING' AND v.value_type = 'RDA')
    -- 7. Energy M 19-29 EAR: 2600 kcal
    OR (c.name = 'Energy' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 8. Vitamin D M ≥75: 15 µg AI
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 900 AND v.value_type = 'AI')
    -- 9. Calcium M 12-14 RNI: 1000 mg (peak growth)
    OR (c.name = 'Calcium (Total)' AND v.sex = 'MALE' AND v.age_min_months = 144 AND v.value_type = 'RDA')
    -- 10. Added Sugars CDRR: 10% energy
    OR (c.name = 'Added Sugars' AND v.value_type = 'CDRR' AND v.age_min_months = 228 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
    -- 11. Cholesterol CDRR: 300 mg adults
    OR (c.name = 'Cholesterol' AND v.value_type = 'CDRR' AND v.age_min_months = 228 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
    -- 12. Zinc Lact RNI: 13 mg (8 + 5)
    OR (c.name = 'Zinc (Total)' AND v.life_stage = 'LACTATING' AND v.value_type = 'RDA')
    -- 13. Folate preg RNI: 620 µg
    OR (c.name = 'Folate (Total)' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 14. Sodium AI ≥75 female: 1100 mg (lower for elderly)
    OR (c.name = 'Sodium' AND v.value_type = 'AI' AND v.age_min_months = 900 AND v.sex = 'FEMALE' AND v.life_stage = 'NONE')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.value_type;

-- Row distribution
SELECT v.value_type, COUNT(*) AS n
FROM reference_daily_values v
WHERE v.source_region = 'KOREA'
GROUP BY v.value_type ORDER BY n DESC;

SELECT COUNT(*) AS total_korea FROM reference_daily_values WHERE source_region = 'KOREA';
