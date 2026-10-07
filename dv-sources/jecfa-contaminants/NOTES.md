# JECFA — contaminant tolerable intakes

**Authority:** Joint FAO/WHO Expert Committee on Food Additives (JECFA)
**Region code:** `WHO_FAO` — JECFA is the FAO/WHO committee, so its values load with the rest of
WHO/FAO's rather than under a region of their own. The transcription lives in
`dv-sources/who-fao/extract.ts`, which already carries several WHO/FAO documents.
**Retrieved:** 2026-10-07

## What is stored, and what deliberately is not

Only **cadmium**. That is not for want of looking — it is what the committee's own values permit.

| Contaminant | JECFA's position | Stored? |
|---|---|---|
| **Cadmium** | **PTMI 25 µg/kg bw per month**, 73rd meeting (2010). The PTWI of 7 µg/kg bw was withdrawn at the same meeting | ✅ yes |
| Inorganic mercury | PTWI 4 µg/kg bw/week, 72nd meeting (2010), replacing the 5 µg/kg bw total-mercury PTWI | ❌ see below |
| Methylmercury | PTWI 1.6 µg/kg bw/week, 61st meeting (2003), confirmed at the 67th (2006) | ❌ see below |
| **Lead** | PTWI 25 µg/kg bw **withdrawn** (73rd, 2010): no threshold could be identified | ❌ none to store |
| **Inorganic arsenic** | PTWI 15 µg/kg bw **withdrawn** (72nd, 2010). What exists instead is a BMDL0.5 of 3.0 µg/kg bw per day for lung cancer | ❌ none to store |
| Inorganic tin | A PTWI exists but was not verified against a primary document in this pass | ❌ not yet |

### Why mercury is not stored, though JECFA publishes two values for it

JECFA splits mercury by food category, and says so in the 72nd meeting report: the inorganic PTWI
*"was considered applicable to dietary exposure to total mercury from foods other than fish and
shellfish. For dietary exposure to mercury from these foods the previously established PTWI for
methyl mercury should be applied."*

`merged_nutrients` holds one **total mercury** figure per food, across all food types. Neither limit
can be applied to that: using the inorganic value on fish understates the risk, and using the
methylmercury value on everything else overstates it. There is no `Methylmercury` compound, and
creating one would not help — no food data maps to it.

So mercury gets no daily value, for the same reason lead and inorganic arsenic get none: the bar says
"No DV", which is the truth. Storing a number that is right for some foods and wrong for others would
be the more expensive mistake.

**To change this**, the food side would need mercury split by species — methylmercury for fish and
shellfish, total for everything else. That is a food-data change, not a DV one.

## Shape of the values

- **Per kilogram of body weight** (`per_kg_body_weight`), so they resolve against the user's weight or
  the published reference weight, like protein and the amino acids.
- **Averaged over a month** (`averaging_days: 30`) for cadmium, which is the whole point of a PTMI:
  cadmium's half-life in the kidney is measured in decades, and the committee moved off a weekly basis
  deliberately. A daily bar would misrepresent it.
- Value type **PTMI**. Not a UL: a UL is a nutrient's upper level set by a nutrition body, this is a
  contaminant ceiling set by a toxicology committee, and `lib/dv/resolve.ts` treats both as ceilings
  while keeping the distinction visible.

## Sources held

- `source/who-food-additives-series-64-cadmium.pdf` — WHO Food Additives Series 64, CADMIUM (addendum),
  the 73rd meeting evaluation. Section 10 is where the PTMI is established; the relevant pages are also
  extracted to `source/was64-cadmium-evaluation.txt`.
- `source/jecfa-72-summary-report.pdf` — JECFA/72/SC, the summary report carrying the arsenic withdrawal
  and the inorganic mercury PTWI.

Verbatim, from each:

> "The PTMI established was 25 μg/kg bw." … "The PTWI of 7 μg/kg bw was therefore withdrawn."
> — WHO Food Additives Series 64, cadmium evaluation

> "The Committee noted that the provisional tolerable weekly intake (PTWI) of 15 µg/kg bw (equivalent to
> 2.1 µg/kg bw per day) is in the region of the BMDL0.5 and therefore was no longer appropriate. The
> Committee withdrew the previous PTWI." — JECFA/72/SC, inorganic arsenic

> "The Committee established a PTWI for inorganic mercury of 4 µg/kg bw. The previous PTWI of 5 µg/kg bw
> for total mercury, established at the sixteenth meeting, was withdrawn." — JECFA/72/SC, mercury
