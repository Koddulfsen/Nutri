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


---

## How the two bodies' cadmium limits behave together (2026-10-07)

EFSA's CONTAM Panel sets a **TWI of 2.5 µg/kg bw per week**; JECFA sets a **PTMI of 25 µg/kg bw per
month**. On a common basis EFSA's is about 10.7 µg/kg per month — roughly 2.3× stricter — but the
resolver does not put them on a common basis, by design: a weekly limit and a monthly one are different
statements, and JECFA chose monthly precisely because cadmium's half-life makes a short window
meaningless.

So `resolveBar` pools only values sharing a window, and with one body in each it currently shows:

```
limit 175 µg over 7 days, from EU
excluded: WHO_FAO — averaged over 30 days, and this bar is over 7
```

**That is safe but the tie is broken by accident.** The rule ranks windows by how many bodies back them
and then by window length, so with one body each the shorter window wins — which happens to be the
stricter limit, but by sort order rather than by judgement.

**Open decision for Jens.** Three options, none urgent:

1. Leave it. One body's limit, named, and it is the more cautious of the two.
2. Make the tie-break deliberate: when windows have equal support, show the one that is stricter per
   day. Same outcome here, but for a stated reason rather than by luck.
3. Show both. Needs the bar to carry two limits, which it currently cannot.

Option 2 is the smallest honest change and would survive a third body arriving with a daily RfD — which
EPA has, so this will come up again.

## Mercury — resolved 2026-10-07: the methylmercury limit is stored

The earlier pass stored neither of JECFA's two mercury limits, because the committee splits the
element by food category and `merged_nutrients` holds one total-mercury figure per food. That
reasoning was sound but it stopped one step short.

**What each body publishes** (both expressed as mercury):

| Body | Methylmercury | Inorganic mercury | Total mercury |
|---|---|---|---|
| JECFA | PTWI 1.6 µg/kg bw/week (61st 2003, confirmed 67th 2007) | PTWI 4 µg/kg bw/week (72nd 2010) | **withdrawn** (was 5 µg/kg bw, 72nd 2010) |
| EFSA CONTAM | TWI 1.3 µg/kg bw/week (2012, EFSA Journal 2012;10(12):2985) | TWI 4 µg/kg bw/week | — |

**Two facts decide it.**

1. *Nobody publishes a limit for what we measure.* JECFA withdrew the total-mercury PTWI outright.
   So the choice is not "a form limit or the right limit" — it is "a form limit or nothing".

2. *The two errors are not symmetric.* Methylmercury is a **subset** of total mercury, so a food's
   total-Hg figure is an upper bound on its methylmercury content — by definition, not as a claim
   about our particular data. Reading the methylmercury limit against total mercury therefore
   over-states exposure and can never under-state it. The inorganic limit has no such guarantee: it
   is the looser of the two, and the 72nd meeting report restricts it to "foods other than fish and
   shellfish", which is where almost no dietary mercury comes from.

So the methylmercury limit is stored, strictest-first like every other contaminant ceiling (EFSA's
1.3 wins over JECFA's 1.6). The bar is the correct ceiling for fish and a conservative one elsewhere.

**What this is not.** It is not a claim that we know a food's methylmercury content. If the food data
ever splits methyl from total, this becomes a real form limit — `FORM_LINKS` in
`lib/dv/compound-links.ts` is the mechanism, and `countsParentTotal` would then be the honest switch.

**Scale check against the 9 foods that carry a mercury figure** (µg/100 g): tuna canned 13.85,
oyster 4.0, salmon wild 3.0, salmon farmed 1.7, butter 0.9, strawberry 0.6, cheddar 0.5, shrimp 0.4,
whole-wheat bread 0.2. The limit at 70 kg is 91 µg/week. Six of the nine are seafood, where total ≈
methyl; the four non-seafood figures are under 1 µg/100 g and cannot move the bar meaningfully, so
the over-statement the subset argument allows is bounded as well as safe in direction.
