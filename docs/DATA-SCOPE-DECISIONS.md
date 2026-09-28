# Data scope decisions — alpha

Recorded 2026-09-23, decided by Jens in conversation with Claude. These are
deliberate calls, not defaults that happened to land this way — read this before
adding a field, changing retention, or reversing any of them.

## Wellness/symptom tracking: shelved, not deleted

`symptom_definitions` / `symptom_logs` stay in the schema but must remain
**provably inert**: no route writes to them, they're not in `ConsentManager.tsx`,
and they don't factor into the DPIA below. If wellness tracking comes back, that's
a new feature decision requiring its own consent flow and DPIA update — don't
wire it back up quietly because the tables already exist.

## life_stage (pregnancy/lactation): kept, intentionally

Jens's call, made with the tradeoff explained: `life_stage` makes Nutri hold
Article 9 (special-category) health data for real, not hypothetically. The
alternative — dropping it and shipping age+sex-only Daily Values — would have
avoided nearly all of the encryption/consent/DPIA work below. Kept anyway,
because pregnancy/lactation-adjusted DVs are a real product feature Jens wants
for alpha.

Consequence: `life_stage` requires its own explicit consent
(`sensitiveHealthData` in `user_consent`), is encrypted at rest
(`life_stage_encrypted` in `user_profiles`, decrypted via each user's own key in
`user_encryption_keys` — see `lib/services/daily-value-service.ts`), and is in
scope for the DPIA.

`biological_sex` and `birth_year`/`birth_month` are NOT encrypted — they're
milder alone, but are noted in the DPIA as quasi-identifiers that combine with
`life_stage` to narrow down individuals, especially at low alpha user counts.

## Alpha minimum age: 16

Norway's digital-consent age is 13, but this app also processes Article 9 health
data, where the consent-capacity line for a minor is murkier — not something
resolvable in code. 16 was chosen as a pragmatic default: it includes the
17-year-olds Jens specifically wants to serve, while avoiding the harder
under-16 parental-consent question for alpha. **This is not a lawyer's answer**
— revisit with real legal advice before relaxing it, especially before allowing
under-16 signups.

Enforced at `app/api/user/demographics/route.ts` (the only place a birth date is
collected — there's no DOB field at signup).

## Retention: indefinite while active, immediate and complete on request

No auto-expiry, no grace period. A user's meal history, DV settings, and profile
persist for as long as the account exists (Jens's own use case: looking back
years of history). On a delete-account request, the standard is full deletion,
now, not a 30-day soft-delete window — CLAUDE.md task 2.8 tracks whether the
actual implementation lives up to this.

## Jurisdiction: Norway → GDPR applies directly

No separate US/UK compliance regime considered for alpha; data already lives in
Supabase eu-west-1, consistent with this.

## Body weight: collected, optional, one value, no history — PENDING SIGN-OFF

**Status: the storage path is built (migration 0059, encrypted, tested end to end) but no UI field
exists yet, so nothing is being collected. That is deliberate. Collecting begins only when Jens signs
off on this entry and the DPIA amendment below.**

**Why it is collected.** Eight of the sources publish values per kilogram of body weight: EFSA, DGE,
the Nordic council and the UK all state protein that way, WHO states every indispensable amino acid
that way, and every contaminant limit is per kg. Without a weight those values resolve only against a
published reference weight — the IOM's 70 kg for an adult man — which is an assumption about the
person, not a fact about them. With it, a 95 kg man's protein target is 65 g rather than 56.5 g. The
field does not enable a new feature; it makes an existing number true for the individual.

**What is collected:** one current body weight, in **whole kilograms**, optional, encrypted at rest with
AES-256-GCM, key in `user_encryption_keys` (the same treatment as `life_stage`).

**What is deliberately refused, and must not be added without reopening this decision:**

| Refused | Why |
|---|---|
| **History / a weight series** | A weight *trend* is a categorically more sensitive dataset: it can evidence an eating disorder, a pregnancy, a cancer, a relapse. Nothing in the read path needs it — a per-kg value needs today's weight, not last year's. |
| **Decimals** | At 0.83 g/kg one kilogram moves a protein target by 0.8 g. Finer precision buys no accuracy and sharpens a quasi-identifier. |
| **Height, BMI** | Nothing reads them. Note this has a cost we accept: DGE's protein footnote directs that *normal* weight be used above a BMI of 25, which we cannot compute, so DACH-derived protein resolves higher than the DGE intends for an overweight user. The caveat is carried in the value note rather than the field being added. |

**Classification.** Body weight alone is personal data and arguably not Article 9 on its own. In this
system it is health data in substance: it is collected for a health purpose, stored beside
`life_stage`, `biological_sex` and birth year/month, and used to compute health targets. It is
therefore treated as Article 9 throughout — encrypted, exportable, erasable — rather than argued down
to Article 6. Treating it as the more sensitive category costs nothing here and is the safer error.

**Lawful basis — and a blocker found while writing this.** The intended basis is the explicit consent
(Art. 9(2)(a)) already collected via the `sensitiveHealthData` flag. **That flag does not cover body
weight.** Checked in `app/components/settings/ConsentManager.tsx`: it is presented to the user as

> **Pregnancy / Lactation Status** — "Use your life-stage status to personalize your daily nutrient
> targets. Special-category health data under GDPR — used only for this purpose."

Consent has to be specific about what it covers, and "used only for this purpose" makes that explicit
and narrow. Collecting body weight under that toggle would be processing beyond the consent given —
the same shape of failure as an endpoint promising a deletion it does not perform.

**RESOLVED 2026-09-28: a separate toggle, `bodyMeasurements` (migration 0060).** Jens asked whether a
single checkbox at signup would be simpler. It would be less lawful, not less friction — see the note at
the end of this section. The two options considered were:

1. **Widen the existing toggle** to "Body measurements and life stage", with wording naming both. One
   toggle, but it bundles two disclosures — a user who wants per-kg targets must also disclose
   pregnancy status, and vice versa.
2. **A separate toggle** for body weight. Granular, which the GDPR prefers where purposes differ, and
   it keeps pregnancy status — the more sensitive of the two — independently refusable.

**Recommendation: (2).** They are different disclosures with different sensitivities, and the cost is
one more row in a consent table that already has seven flags. The nutrient-target purpose is identical,
but the data subject's exposure is not.

**Built:** `user_consent.body_measurements`, a toggle in `ConsentManager.tsx`, a 403 from the
demographics route when the flag is off, and — the part that actually matters — `getUserDemographics`
refuses to return a stored weight whose consent is absent or withdrawn. Enforcing it on the way *out*
means no call site can forget, because there is only one way to read a weight.

Writing the test for withdrawal found a real bug: demographics are cached for five minutes, so a
withdrawal went on being ignored for up to five minutes after the user made it. `/api/consent` now
invalidates that cache. A withdrawal that takes five minutes to bite is the system not keeping a promise
it makes in its own UI.

### Why not one checkbox at signup

Asked 2026-09-28. Three reasons it is the wrong shape, in order of how much they bite:

1. **Consent cannot be a condition of the service** (Art. 7(4)) for processing that is not necessary to
   deliver it. A tick-to-continue box at signup is presumptively not "freely given": the user has no
   real choice, so the consent is invalid, and processing on an invalid consent is processing without a
   lawful basis.
2. **Bundling purposes invalidates all of them.** Consent must be specific. One box covering pregnancy
   status, body weight and sending free text to Anthropic is not consent to any of the three — and this
   file already records that reasoning for `sensitiveHealthData` vs `thirdParty`.
3. **It collects what is not needed yet.** Asking at signup gathers data from users who will never use
   the feature, which is the opposite of data minimisation.

**Gating a *feature* behind its own consent is fine and is what we do.** Gating the *whole app* behind
consent to optional health processing is what is not. The frictionless version is to ask at the moment
the feature is used — the ask makes sense because the user just tried to do the thing — and to keep
signup free of it entirely.

**Rights.** Export returns it decrypted (`/api/user/export`); erasure deletes the row it lives on, with
the row-level deletion covered by a test. The full end-to-end erasure re-run against a throwaway
account (as CLAUDE.md 2.8 did) is still outstanding.

## What this unlocked / what it still requires

Because `life_stage` was kept, alpha cannot ship without:
- A DPIA (CLAUDE.md 5.1) — mandatory before processing begins, not after.
- A privacy policy covering this specifically (CLAUDE.md 5.2).
- The consent flags actually gating the code paths that use `life_stage` and
  that send user free text to Anthropic (`sensitiveHealthData`, `aiProcessing`
  in `user_consent` — done, see `app/api/user/demographics/route.ts` and
  `app/api/ai/log-food/route.ts`).
- Encryption at rest for `life_stage` (done — see above) with the key stored
  separately from the data (`user_encryption_keys`, done).
- Real delete/export (CLAUDE.md 2.8 — not yet done as of this writing).
