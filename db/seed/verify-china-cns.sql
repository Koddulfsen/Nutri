-- CNS 2023 spot-check

SELECT c.name AS compound,
       v.value, v.value_min, v.value_max, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months,
       LEFT(v.value_note, 70) AS note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'CHINA'
  AND (
    -- 1. Energy M 18-29 PAL II: 2550 kcal
    (c.name = 'Energy' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.value_type = 'EAR' AND v.life_stage = 'NONE')
    -- 2. Protein F 18-29 RDA: 55
    OR (c.name = 'Protein' AND v.sex = 'FEMALE' AND v.age_min_months = 216 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 3. Calcium adult RDA: 800
    OR (c.name = 'Calcium (Total)' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 4. Iron F 18-29 menstruating: 18
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 216 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 5. Sodium PI-NCD adult (18-29): ≤2000
    OR (c.name = 'Sodium' AND v.value_type = 'CDRR' AND v.age_min_months = 216 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
    -- 6. Potassium PI-NCD adult: 3600
    OR (c.name = 'Potassium' AND v.value_type = 'CDRR' AND v.age_min_months = 216 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
    -- 7. Vitamin C PI-NCD: 200 mg
    OR (c.name = 'Vitamin C (Total)' AND v.value_type = 'CDRR' AND v.age_min_months = 216 AND v.sex = 'MALE' AND v.life_stage = 'NONE')
    -- 8. Vitamin D adult: 10 µg
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 9. Water adult M total: 3000 mL
    OR (c.name = 'Water' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.value_type = 'AI' AND v.life_stage = 'NONE')
    -- 10. Folate preg T1: 600 µg (400 + 200)
    OR (c.name = 'Folate (Total)' AND v.life_stage = 'PREGNANT_T1' AND v.value_type = 'RDA')
    -- 11. Vitamin A M 18-29: 770 µg RAE
    OR (c.name = 'Vitamin A (RAE)' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 12. Zinc M 18-29: 12
    OR (c.name = 'Zinc (Total)' AND v.sex = 'MALE' AND v.age_min_months = 216 AND v.value_type = 'RDA' AND v.life_stage = 'NONE')
    -- 13. Choline F 18-29: 380
    OR (c.name = 'Choline (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 216 AND v.value_type = 'AI' AND v.life_stage = 'NONE')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.value_type, v.life_stage;

SELECT v.value_type, COUNT(*) AS n FROM reference_daily_values v
WHERE v.source_region = 'CHINA' GROUP BY v.value_type ORDER BY n DESC;

SELECT COUNT(*) AS total_china FROM reference_daily_values WHERE source_region = 'CHINA';
