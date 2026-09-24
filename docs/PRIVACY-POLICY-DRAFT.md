# Nutri Privacy Policy — DRAFT

**Status: DRAFT prepared by Claude Code, 2026-09-23, for Jens to review and publish.** Not yet published anywhere in the app. This should be reviewed against the actual app behavior each time a feature changes, and ideally by a lawyer before public alpha launch. It follows the mandatory disclosure list under GDPR Articles 13/14.

*Last updated: [fill in on publish]*

---

## Who we are

Nutri is operated by Jens ("we", "us"), based in Norway. If you have questions about this policy or your data, contact: **[Jens to add a contact email here before publishing]**.

We have not appointed a formal Data Protection Officer — as the controller, Jens is your point of contact for privacy questions and data subject requests.

## What we collect, and why

| Data | Why we collect it | Legal basis |
|---|---|---|
| Email and password | To create and secure your account | Necessary to provide the service (contract) |
| The foods and meals you log | The core feature of the app | Necessary to provide the service (contract) |
| Birth year and month (not full date) | To personalize your daily nutrient targets by age group | Your consent — optional, the app works without it |
| Biological sex | To personalize your daily nutrient targets | Your consent — optional |
| Pregnancy or lactation status | To adjust your daily nutrient targets, which genuinely differ during pregnancy/lactation | **Your explicit, separate consent** — this is health data, and we ask for it on its own, never bundled with other permissions |
| Messages you type to the AI food-logging assistant | To let you log food by typing naturally instead of searching | **Your explicit, separate consent** — nothing you type is sent anywhere until you turn this on in Settings |
| Custom nutrient targets you set yourself | To respect your own overrides instead of our defaults | Necessary to provide the feature you asked for |
| IP address and browser type, kept only in a truncated/pseudonymized form | To detect abuse and investigate security incidents | Our legitimate interest in keeping the service secure |

We do **not** collect symptom or wellness journal data — that feature is not currently active, even though some database tables for it exist from earlier development; they are not used and nothing writes to them.

We never ask for more than we need: for example, we ask for your birth year and month, not your exact birth date, because the exact day isn't used for anything and would only make you easier to identify.

## Who we share it with

We use a small number of service providers to run Nutri. We do not sell your data, and we do not share it for anyone else's marketing.

- **Supabase** (database and login hosting) — stores essentially all of the data listed above, in the EU (Ireland).
- **Anthropic** (the AI assistant behind the food-logging chat feature) — receives only the messages you type into that feature, and only if you've turned on "AI-Assisted Logging" in Settings. Anthropic is based in the United States; transfers to them are covered by Standard Contractual Clauses, the EU's standard mechanism for sending data to a US company lawfully. Anthropic does not use API data to train their models, and retains it for a limited period rather than indefinitely.
- **Food database providers** (e.g. the USDA's food database, Canada's Nutrient File, and similar public food-composition sources) — receive only the food name you're searching for, not your personal messages or health information.

## How long we keep it

We keep your data for as long as your account is active — including your full meal history, for as long as you want to look back on it. We don't quietly delete anything after a fixed period.

**If you delete your account, we delete your data immediately** — your profile, meal logs, consent records, and login credentials are all removed right away, permanently, with no waiting period. This is not reversible.

## Your rights

Under GDPR, you have the right to:

- **Access** the personal data we hold about you
- **Correct** it if it's wrong
- **Erase** it (see "How long we keep it" above — you can do this yourself, instantly, from Settings)
- **Export** a copy of your data in a portable format (available from Settings > Privacy)
- **Restrict** or **object** to certain processing
- **Withdraw consent** at any time for anything we asked your consent for (demographics, pregnancy/lactation status, AI-assisted logging) — this doesn't affect the lawfulness of what we did before you withdrew it
- **Complain** to a supervisory authority. In Norway, that's **Datatilsynet** (Postboks 458 Sentrum, 0105 Oslo, Norway; https://www.datatilsynet.no). We'd appreciate the chance to fix a problem directly first, but you're never required to come to us before complaining to them.

## Automated decisions

We don't make any automated decision about you that has a legal or similarly significant effect. The AI food-logging assistant helps you log food faster; it doesn't make decisions about your account, your access, or anything else on your behalf.

## Children

Nutri is currently limited to users aged 16 and up. If you believe a younger person has created an account, contact us and we'll look into it.

## Changes to this policy

If we change what we collect or how we use it, we'll update this page and, for any material change, tell you directly (e.g. by email or an in-app notice) before it takes effect.

---

**Before publishing, Jens still needs to:**
1. Add a real contact email.
2. Confirm the Anthropic DPA/SCCs are active on the actual API account being used (see `docs/DPIA-2026-09-23.md` §2.2/§6).
3. Decide whether to also publish a separate Terms of Service (payment terms, acceptable use, etc. — this document only covers privacy/data).
4. Have a lawyer review before this is the operative policy for a paid product.
