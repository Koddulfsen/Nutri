-- Russia MR 2.3.1.0253-21 spot-check

SELECT c.name AS compound,
       v.value, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months, v.activity_level,
       LEFT(v.value_note, 80) AS note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'RUSSIA'
  AND (
    -- 1. Energy M 18-29 sedentary KFA 1.4: 2400 kcal
    (c.name = 'Energy' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.activity_level = 'SEDENTARY')
    -- 2. Energy F 18-29 very active KFA 2.2: 3000 kcal
    OR (c.name = 'Energy' AND v.sex = 'FEMALE' AND v.age_min_months = 216 AND v.activity_level = 'VERY_ACTIVE')
    -- 3. Protein M 18-29 moderate KFA 1.6: 89 g
    OR (c.name = 'Protein' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.activity_level = 'MODERATE')
    -- 4. Iron F adult: 18 mg (uniquely retained at 18 for all adult women)
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 540 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 5. Iron F 65+: still 18 mg (unique to Russia — no post-menopausal reduction)
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 780 AND v.life_stage = 'NONE')
    -- 6. Iron preg: 33 mg (18 + 15)
    OR (c.name = 'Iron (Total)' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 7. Vitamin D M 65+: 20 µg (Russia higher for elderly)
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 780 AND v.life_stage = 'NONE')
    -- 8. Sodium M adult: 1300 mg (Russia sodium recommendation)
    OR (c.name = 'Sodium' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 9. Folate preg: 600 µg
    OR (c.name = 'Folate (Total)' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 10. Vitamin A M: 900 µg RE
    OR (c.name = 'Vitamin A (RAE)' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.value_type = 'RDA')
    -- 11. Added sugars CDRR: 10%
    OR (c.name = 'Added Sugars' AND v.value_type = 'CDRR' AND v.age_min_months = 216 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
    -- 12. Fiber adult: 22g
    OR (c.name = 'Dietary Fiber' AND v.value_type = 'AI' AND v.age_min_months = 216 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.activity_level, v.life_stage;

SELECT v.value_type, COUNT(*) AS n FROM reference_daily_values v
WHERE v.source_region = 'RUSSIA' GROUP BY v.value_type ORDER BY n DESC;

SELECT COUNT(*) AS total_russia FROM reference_daily_values WHERE source_region = 'RUSSIA';
