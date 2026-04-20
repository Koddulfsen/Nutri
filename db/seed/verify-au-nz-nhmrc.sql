-- NHMRC NRV 2006 (+ 2017 updates) spot-check

SELECT c.name AS compound,
       v.value, v.value_min, v.value_max, v.unit, v.value_type, v.sex, v.life_stage,
       v.age_min_months, v.age_max_months, v.activity_level,
       LEFT(v.value_note, 80) AS note
FROM reference_daily_values v
JOIN compounds c ON c.id = v.compound_id
WHERE v.source_region = 'AU_NZ'
  AND (
    -- 1. Iron F 19-30: RDI 18 mg (menstruating adolescent->adult)
    (c.name = 'Iron (Total)' AND v.sex = 'FEMALE' AND v.age_min_months = 228 AND v.value_type = 'RDA')
    -- 2. Calcium M 19-30: RDI 1000 (pre-51y)
    OR (c.name = 'Calcium (Total)' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.value_type = 'RDA')
    -- 3. Vitamin D M >70: AI 15 µg
    OR (c.name = 'Vitamin D (Total)' AND v.sex = 'MALE' AND v.age_min_months = 852 AND v.value_type = 'AI')
    -- 4. Folate F pregnancy 19-30: RDI 600
    OR (c.name = 'Folate (Total)' AND v.life_stage = 'PREGNANT' AND v.age_min_months = 228 AND v.value_type = 'RDA')
    -- 5. Sodium adult UL 2017: 2300 mg
    OR (c.name = 'Sodium' AND v.value_type = 'UL' AND v.age_min_months = 228 AND v.sex = 'MALE')
    -- 6. Sodium SDT: 2000 mg
    OR (c.name = 'Sodium' AND v.value_type = 'SDT' AND v.age_min_months = 228 AND v.sex = 'MALE')
    -- 7. Sodium AI range: 460-920
    OR (c.name = 'Sodium' AND v.value_type = 'AI' AND v.age_min_months = 228 AND v.sex = 'MALE')
    -- 8. Energy adult M 19-30 at PAL 1.6: 2629 kcal
    OR (c.name = 'Energy' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.value_type = 'EAR')
    -- 9. Omega-3 LC: AI 160 mg for men 19-30
    OR (c.name = 'Omega-3' AND v.sex = 'MALE' AND v.age_min_months = 228 AND v.value_type = 'AI')
    -- 10. Protein RDI pregnancy 19-30: 60 g
    OR (c.name = 'Protein' AND v.life_stage = 'PREGNANT' AND v.age_min_months = 228 AND v.value_type = 'RDA')
    -- 11. Fluoride 2017 UL 4-8 y: 4.4 mg
    OR (c.name = 'Fluoride' AND v.age_min_months = 48 AND v.value_type = 'UL')
  )
ORDER BY c.name, v.sex, v.age_min_months, v.value_type;

-- Row distribution by value_type
SELECT v.value_type, COUNT(*) AS n
FROM reference_daily_values v
WHERE v.source_region = 'AU_NZ'
GROUP BY v.value_type
ORDER BY n DESC;

-- Total
SELECT COUNT(*) AS total_au_nz_rows FROM reference_daily_values WHERE source_region = 'AU_NZ';
