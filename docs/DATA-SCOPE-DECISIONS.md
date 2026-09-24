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
