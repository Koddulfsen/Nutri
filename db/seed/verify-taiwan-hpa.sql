-- Taiwan DRI 8th edition spot-check

SELECT c.name AS compound,
       v.value, v.value_min, v.value_max, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months, v.activity_level,
       LEFT(v.value_note, 80) AS note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'TAIWAN'
  AND (
    -- 1. Protein M 19-30 RDA: 70 g
    (c.name = 'Protein' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 2. Iron F 19-30 RDA: 15 mg (menstruating)
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 228 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 3. Iron preg T3: 45 mg (15 + 30)
    OR (c.name = 'Iron (Total)' AND v.life_stage = 'PREGNANT_T3' AND v.value_type = 'RDA')
    -- 4. Calcium M 13-15: 1200 mg AI
    OR (c.name = 'Calcium (Total)' AND v.sex = 'MALE' AND v.age_min_months = 156 AND v.value_type = 'AI')
    -- 5. Sodium CDRR adults: 2300 mg
    OR (c.name = 'Sodium' AND v.value_type = 'CDRR' AND v.age_min_months = 228 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
    -- 6. Energy M 19-30 light activity: 2150 kcal
    OR (c.name = 'Energy' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 7. Vitamin D 51-70: 15 µg (elderly boost)
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 612 AND v.value_type = 'AI')
    -- 8. Folate preg T1: 600 (+200 over F 19-30 400)
    OR (c.name = 'Folate (Total)' AND v.life_stage = 'PREGNANT_T1' AND v.value_type = 'RDA')
    -- 9. Choline M 19-30: 450 AI
    OR (c.name = 'Choline (Total)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.value_type = 'AI')
    -- 10. Carb preg T2 RDA: 175
    OR (c.name = 'Carbohydrates' AND v.life_stage = 'PREGNANT_T2' AND v.value_type = 'RDA')
    -- 11. Vitamin A M 16-18: 700 µg RE
    OR (c.name = 'Vitamin A (RAE)' AND v.sex = 'MALE' AND v.age_min_months = 192 AND v.value_type = 'RDA')
    -- 12. LA AMDR: 4-8%
    OR (c.name = 'LA' AND v.value_type = 'AMDR' AND v.age_min_months = 228 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.value_type;

SELECT v.value_type, COUNT(*) AS n
FROM reference_daily_values v
WHERE v.source_region = 'TAIWAN'
GROUP BY v.value_type ORDER BY n DESC;

SELECT COUNT(*) AS total_taiwan FROM reference_daily_values WHERE source_region = 'TAIWAN';
