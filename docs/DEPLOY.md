# Deploying Nutri to Vercel

Written for someone who does not want to read code. Follow it top to bottom.
Nothing here needs a terminal.

**Before you start, have open in browser tabs:**

- <https://vercel.com> (logged in)
- <https://supabase.com/dashboard/project/knwfnixfanmydbeatamu> (your project)
- The `.env` file on your machine — you will copy values out of it

---

## Step 1 — Rotate the service role key (do this first)

This key bypasses every protection in the app. It has been sitting in a local
file for months and is on the list to be revoked. Rotating it now means the old
one stops working and you paste the fresh one into Vercel.

1. Supabase dashboard → **Project Settings** → **API Keys**
2. Find **`service_role`** → **Rotate** (or **Generate new key**)
3. Copy the new key somewhere for a minute — you need it twice: once for Vercel,
   once for your local `.env`
4. In your local `.env`, replace the value after `SUPABASE_SERVICE_ROLE_KEY=`
   with the new key, and save

If you skip this, the app still works. You are just deploying with a key that
should already be dead.

---

## Step 2 — Point Vercel at the repo

1. Vercel → **Add New** → **Project**
2. Choose **`Koddulfsen/Nutri`**
3. Framework should auto-detect as **Next.js**. Leave build settings alone.
4. **Do not click Deploy yet.** Open **Environment Variables** first — Step 3.

---

## Step 3 — Environment variables

Add each row below. Set every one to **all three** environments
(Production, Preview, Development) unless the row says otherwise.

### Required — the app will not start without these

| Name | Where the value comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Copy from your `.env` (line 2). Looks like `https://knwfnixfanmydbeatamu.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Copy from your `.env` (line 3). Safe to expose — it is meant for browsers |
| `SUPABASE_SERVICE_ROLE_KEY` | **The NEW key from Step 1.** Never expose this one |
| `DATABASE_URL` | Copy from your `.env` (line 10). ⚠️ Must be the **port 6543** pooler URL, not 5432 — see the warning below |
| `ADMIN_EMAILS` | Copy from your `.env`. Comma-separated. These accounts get `/admin`; everyone else gets the normal app |
| `NEXT_PUBLIC_APP_URL` | **You will not know this until after the first deploy.** Put `https://placeholder.vercel.app` for now and fix it in Step 5 |

> ⚠️ **The port matters.** Vercel runs many short-lived serverless functions, and
> each one opens its own database connection. Port **6543** is Supabase's
> transaction pooler, which is built for that. Port **5432** is a direct
> connection and will run out of connections under real traffic. Your `.env` has
> both — `DATABASE_URL` is the 6543 one, `MIGRATION_DATABASE_URL` is 5432.
> **Do not put `MIGRATION_DATABASE_URL` into Vercel at all.** It is for running
> migrations from your own machine.

### Required for features you are already using

| Name | What breaks without it |
|---|---|
| `ANTHROPIC_API_KEY` | The chat-based food logging |
| `USDA_API_KEY` | Live food search against the US database |

### Must NOT be set

| Name | Why |
|---|---|
| `DEV_AUTH_BYPASS` | Makes every visitor a full admin. The build **refuses to run** if this is set, so a mistake here fails loudly rather than silently. Leave it out entirely |
| `NEXT_PUBLIC_DEV_AUTH_BYPASS` | Same |
| `MIGRATION_DATABASE_URL` | Direct connection, wrong for serverless, and it is the owner account |

### Optional — leave out unless you are using them

`STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
(payments are not wired up yet), `RESEND_API_KEY`, `UPLOADTHING_*`,
`NCBI_API_KEY`, `NEXT_PUBLIC_BASE_PATH` (only needed if you ever move the app
back under a subpath).

---

## Step 4 — Deploy

Click **Deploy**. It takes a couple of minutes.

If the build fails, read the error at the top of the log. The two likely ones:

- **"Refusing to build: DEV_AUTH_BYPASS is enabled"** — you set that variable.
  Remove it and redeploy.
- **"Missing SUPABASE_SERVICE_ROLE_KEY"** — a required variable above is missing
  or misspelled.

---

## Step 5 — Tell the app and Supabase where they live

The deploy gives you a URL like `https://nutri-abc123.vercel.app`. Two places
need it, and **login will not work until both are done.**

### 5a. Vercel

1. Settings → **Environment Variables** → edit `NEXT_PUBLIC_APP_URL`
2. Set it to your real URL, with **no trailing slash and no path**:
   `https://nutri-abc123.vercel.app`
3. Redeploy (Deployments → the latest one → ⋯ → **Redeploy**)

### 5b. Supabase

1. Dashboard → **Authentication** → **URL Configuration**
2. **Site URL**: `https://nutri-abc123.vercel.app`
3. **Redirect URLs** — add both:
   - `https://nutri-abc123.vercel.app/auth/callback`
   - `https://nutri-abc123.vercel.app/**`

> These previously pointed at `/nutri/...` paths, because the app used to live
> under a subpath. It now serves at the root. If confirmation emails send people
> to a broken page, this is why.

---

## Step 6 — Check it actually works

In a **private/incognito window**, so you are not logged in as yourself:

1. Open your URL. The landing page should load.
2. Go to `/dashboard`. It should bounce you to `/login`. (If it shows the
   dashboard to a logged-out visitor, stop and say so.)
3. Sign up with an email that is **not** in `ADMIN_EMAILS`.
4. Confirm via the email you receive.
5. You should land in the real app — not a waitlist screen.
6. Try `/admin`. It should refuse you.

If step 5 shows a waitlist screen, the deploy is running old code. If step 6
lets you in, the admin list is wrong.

---

## What is true about this deployment

Worth knowing before you send the link to anyone:

- **Anyone can sign up** and immediately use the app. There is no approval step.
- **Every signed-up user can read the whole compound and food database** through
  the API. Nobody can read another user's meals or symptoms.
- **"Delete my account" and "Export my data" do not work.** They return an
  honest error rather than pretending. Under GDPR these are rights, not
  features, so this is a real limitation and not just a missing nicety.
- **Symptom entries are stored unencrypted.** They are health data.
- **There is no privacy policy or consent screen.**

None of that stops the app working. All of it matters the moment someone who is
not a friend signs up.

---

## Later, when you have a real domain

Vercel → Settings → **Domains** → add it. Then redo **Step 5** with the new
address in both places. That is the whole change.
