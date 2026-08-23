-- WHO/FAO 2004 spot-check

SELECT c.name AS compound,
       v.value, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months,
       LEFT(v.value_note, 80) AS note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'WHO_FAO'
  AND (
    -- 1. Calcium adult 19-65 M: 1000 mg
    (c.name = 'Calcium (Total)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 2. Iron M 19-65: 7 mg (15% bioavail)
    OR (c.name = 'Iron (Total)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 3. Iron F 15-18: 21 mg (menstruating adolescent)
    OR (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 180 AND v.life_stage = 'NONE')
    -- 4. Iron preg T3: 10 mg
    OR (c.name = 'Iron (Total)' AND v.life_stage = 'PREGNANT_T3' AND v.value_type = 'RDA')
    -- 5. Vitamin A adult M: 600 µg RE
    OR (c.name = 'Vitamin A (RAE)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 6. Vitamin D 65+ M: 15 µg
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 780 AND v.life_stage = 'NONE')
    -- 7. Iodine preg: 200 µg
    OR (c.name = 'Iodine' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 8. Folate preg: 600 µg
    OR (c.name = 'Folate (Total)' AND v.life_stage = 'PREGNANT' AND v.value_type = 'RDA')
    -- 9. Pantothenate adult: 5 mg
    OR (c.name = 'Pantothenic Acid (B5)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
    -- 10. Selenium lactation 0-6 mo: 35 µg
    OR (c.name = 'Selenium (Total)' AND v.life_stage = 'LACTATING_0_6M')
    -- 11. Zinc F 19-50: 3.0 mg moderate bioavail
    OR (c.name = 'Zinc (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 228 AND v.age_max_months = 611 AND v.life_stage = 'NONE')
    -- 12. Vitamin B12 adult: 2.4 µg
    OR (c.name = 'Vitamin B12 (Total)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.life_stage = 'NONE')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.life_stage;

SELECT COUNT(*) AS total_who_fao FROM reference_daily_values WHERE source_region = 'WHO_FAO';
