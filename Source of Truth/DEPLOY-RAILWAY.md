# RoofPost AI — Railway Deployment Runbook

Step-by-step from local → public URL on a phone. Follow in order; every step has an expected result and a "if it fails" note.

**Time budget:** ~45 minutes first time (most of it is waiting for DNS + TLS).
**Prerequisite mental state:** Do this at a desk, not on the roof.

---

## Part 0 — Pre-flight checklist

Before you start, have these 5 secrets in a text note ready to paste:

| Variable | Where to find it |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → Settings → API Keys → Create Key → starts with `sk-ant-api03-...` |
| `GHL_API_KEY` | GHL sub-account → Settings → Private Integrations → Create new token with scopes: `medias.write`, `medias.readonly`, `socialplanner/account.readonly`, `socialplanner/post.readonly`, `socialplanner/post.write` |
| `GHL_LOCATION_ID` | GHL sub-account → Settings → Business Info → copy the 24-char Location ID |
| `GHL_USER_ID` | GHL → My Profile → Personal Info → user ID (or from the URL when editing a user) |
| `APP_PASSWORD` | A new strong password you invent for the login gate (e.g. 4 words + a number). Write it down. |

Also needed:
- A GitHub account (you already have `jairocapua`).
- A credit or debit card for Railway Hobby ($5/mo, billed after free trial credit runs out).
- Optional: a domain you control (e.g. via Namecheap, GoDaddy, Cloudflare) if you want `roofpost.yourdomain.co.uk` instead of `xxxxx.up.railway.app`.

---

## Part 1 — Commit and push the pre-flight fixes

All the code changes (Anthropic migration, CORS pin, upload retry, session persistence, health badge, etc.) only matter once they're on GitHub — Railway deploys from the GitHub repo, not your laptop.

### Step 1.1 — Check what's staged

Open a terminal in the project root and run:

```bash
git status
```

**Expected:** you'll see ~11 modified files plus the untracked `Source of Truth/DEPLOY-RAILWAY.md`. Key ones:
- `server.js`, `package.json`, `package-lock.json` — Anthropic SDK migration
- `.env.example` — new `ANTHROPIC_API_KEY` + `ALLOWED_ORIGIN`
- `src/services/scheduler.ts`, `src/services/openai.ts` — upload retry + comment
- `src/hooks/useHealthCheck.ts`, `src/components/layout/Header.tsx`, `src/components/ui/SystemPromptViewer.tsx` — health badge rename
- `sys_design.md`, `Source of Truth/HANDOFF.md`, `Source of Truth/DEPLOY-RAILWAY.md` — docs

You'll also see `.claude/settings.json` modified — **do NOT commit that**, it's local IDE settings.

### Step 1.2 — Stage every deploy-relevant file except `.claude/settings.json`

```bash
git add server.js package.json package-lock.json .env.example \
  src/services/scheduler.ts src/services/openai.ts \
  src/hooks/useHealthCheck.ts src/components/layout/Header.tsx \
  src/components/ui/SystemPromptViewer.tsx \
  sys_design.md "Source of Truth/HANDOFF.md" "Source of Truth/DEPLOY-RAILWAY.md"
git status
```

**Expected:** all those files appear under "Changes to be committed"; `.claude/settings.json` stays under "Changes not staged".

### Step 1.3 — Commit

```bash
git commit -m "feat: switch to Anthropic Claude Sonnet 4.6, pin CORS, retry uploads"
```

**Expected:** one commit created; hash printed.

### Step 1.4 — Push to GitHub

```bash
git push origin main
```

**Expected:** push succeeds. Browse to https://github.com/jairocapua/Auto-Populate-Social-Planner/commits/main and confirm the new commit is on GitHub.

**If push is rejected:** someone else pushed first. Run `git pull --rebase origin main` then `git push`.

---

## Part 2 — Create the Railway account + project

### Step 2.1 — Sign up

Go to https://railway.app → **Login** → choose **Login with GitHub**. This auto-authorises Railway to read your repo list, which saves a step later.

**Expected:** you land on `railway.app/dashboard` with an empty project list.

### Step 2.2 — Add a payment method (one-time)

Top-right avatar → **Account Settings** → **Plans** → pick **Hobby ($5/mo)**. Enter card details.

**Why now, before the first deploy:** Railway's free trial gives you $5 of one-off credit; if you skip this and the trial runs out mid-demo, the service suspends. Paying up front means no surprise outages.

**Expected:** Hobby plan shown as active. You won't be charged until usage exceeds the included credit (which it won't for this app).

### Step 2.3 — Create a new project from your GitHub repo

Dashboard → **+ New Project** → **Deploy from GitHub repo**.

If this is your first Railway project, Railway will prompt: *"Install Railway GitHub App"* → click **Configure GitHub App** → in the GitHub popup, choose **Only select repositories** → pick `Auto-Populate-Social-Planner` → **Install & Authorise**.

Back in Railway, the repo now appears in the list. Click it → **Deploy Now**.

**Expected:** a new project is created with one service (named after the repo). Railway immediately starts its first build using Nixpacks auto-detection. You'll see a "Deploying" banner; build logs stream in real time.

### Step 2.4 — Watch the first build

Click the service tile → **Deployments** tab → click the running deployment to see logs.

**Expected build sequence:**
```
#1 [internal] load build definition      (Nixpacks detects Node)
#2 [install] npm ci                       (~30-60 s)
#3 [build]   npm run build                (tsc + vite build, ~20 s)
#4 [build] exporting to image             (~10 s)
Deploy → starts `npm start`               (server.js runs)
```

**Expected runtime log:**
```
Server running on http://localhost:<random-port>
  Anthropic key:   ✗ MISSING
  GHL API key:     ✗ MISSING
  GHL Location ID: ✗ MISSING
  GHL User ID:     ✗ MISSING
```

Those MISSING lines are **expected on the first deploy** — you haven't set env vars yet. The server still runs; the app will render but `/api/generate` will 500 until you add keys. Move on to Part 3.

**If the build fails:**
- **TypeScript error**: run `npm run build` locally and fix the error there first, then push again.
- **npm ci fails**: Railway uses your `package-lock.json`. If you edited `package.json` without running `npm install` locally, the lockfile is out of date. Run `npm install`, commit the lockfile, push.

---

## Part 3 — Set environment variables

### Step 3.1 — Open the Variables tab

Service tile → **Variables** tab (top nav). You'll see one pre-populated variable `PORT` — Railway injects this automatically. **Leave it alone.**

### Step 3.2 — Add the 7 variables

Click **+ New Variable** and add each of these one by one. Paste each value from your pre-flight note.

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your sk-ant-api03-... key |
| `GHL_API_KEY` | your GHL PIT token |
| `GHL_LOCATION_ID` | your 24-char GHL location id |
| `GHL_USER_ID` | your GHL user id |
| `APP_PASSWORD` | your invented login password |
| `NODE_ENV` | `production` |
| `ALLOWED_ORIGIN` | your public URL (e.g. `https://auto-populate-social-planner-production-xxxx.up.railway.app`) — add this **after** Part 4.1 when you know the domain |

**Critical:** `NODE_ENV=production` is what makes `server.js` serve the built `dist/` SPA. Miss this and visiting the URL returns "Cannot GET /".

**About `ALLOWED_ORIGIN`:** pins CORS in production so only your deployed frontend can call `/api/*`. You'll set this in Part 4.1 once Railway gives you a URL. If you skip it, CORS stays open (works fine, slightly less hardened).

### Step 3.3 — Trigger a redeploy

Adding variables auto-queues a redeploy. Watch the **Deployments** tab — a new deployment starts within seconds. Wait ~90 s for it to go green.

**Expected runtime log after redeploy:**
```
Server running on http://localhost:<port>
  Anthropic key:   ✓ configured
  GHL API key:     ✓ configured
  GHL Location ID: ✓ configured
  GHL User ID:     ✓ configured
```

All four ticks = good. Any cross = that variable is missing or misnamed.

---

## Part 4 — Generate the public domain + smoke test

### Step 4.1 — Generate a railway.app subdomain

Service → **Settings** tab → scroll to **Networking** → **Public Networking** → click **Generate Domain**. Railway assigns a URL like `auto-populate-social-planner-production-xxxx.up.railway.app`.

### Step 4.1a — Set `ALLOWED_ORIGIN`

Now that you have the URL, go back to **Variables** → edit (or add) `ALLOWED_ORIGIN` = `https://<your-generated-domain>.up.railway.app`. This pins CORS to your real domain. A redeploy auto-triggers; wait ~90 s.

If you're skipping ahead to a custom domain in Part 5, you can set `ALLOWED_ORIGIN` to the custom one instead and revisit this step once DNS is live.

### Step 4.2 — Hit the health endpoint

In any browser:
```
https://<your-domain>.up.railway.app/api/health
```

**Expected response:**
```json
{"status":"ok","anthropic":true,"ghl":true,"ghlLocation":true,"ghlUser":true}
```

**If any field is `false`:** go back to Part 3 and re-check the variable name — they're case-sensitive. Common typo: `GHL_USERID` instead of `GHL_USER_ID`.

### Step 4.3 — Hit the app root

```
https://<your-domain>.up.railway.app/
```

**Expected:** the login screen renders (dark theme, password input, "Sign in" button).

**If you get "Cannot GET /":** `NODE_ENV=production` is not set. Go back to Part 3.

### Step 4.4 — Log in and do a dry-run generate

Enter your `APP_PASSWORD` → dashboard loads → health badge is green → upload a real roof photo → click Generate.

**Expected:** 4 captions appear within 10-15 seconds.

**If generate fails with 429:** the rate limit is working. Wait 60 s.
**If generate fails with 401 repeatedly:** `APP_PASSWORD` on the server doesn't match what you typed. Check Variables → `APP_PASSWORD`.

Don't click Schedule yet — do that from the phone as the real acceptance test.

---

## Part 5 — Custom domain (optional but recommended)

Skip this section if you're fine with `xxxx.up.railway.app`. The rest of the runbook assumes you want a custom domain like `roofpost.yourdomain.co.uk`.

### Step 5.1 — Add the domain in Railway

Service → **Settings** → **Networking** → **Custom Domain** → enter `roofpost.yourdomain.co.uk` (replace with your real subdomain) → **Add Domain**.

Railway shows a **CNAME target** like `xxxxxxxx.up.railway.app`. Copy it.

### Step 5.2 — Create the CNAME at your registrar

Log into your DNS provider (Namecheap, GoDaddy, Cloudflare, etc.) → DNS settings for `yourdomain.co.uk` → **Add Record**:

| Field | Value |
|---|---|
| Type | `CNAME` |
| Host / Name | `roofpost` (just the subdomain, not the full name) |
| Target / Value | `xxxxxxxx.up.railway.app` (what Railway gave you) |
| TTL | Auto or 300 |

**Cloudflare gotcha:** set the proxy status to **DNS only** (grey cloud, not orange), otherwise Cloudflare terminates TLS before Railway can provision its certificate. You can re-enable the proxy later once Railway has issued its cert.

### Step 5.3 — Wait for DNS + TLS

Back in Railway → the Custom Domain entry shows status `Waiting for DNS`. Every ~30 s Railway re-checks. When DNS propagates (usually 2-10 min), it auto-requests a Let's Encrypt cert — status moves to `Issuing Certificate`, then `Active`.

**Check propagation yourself:** run `nslookup roofpost.yourdomain.co.uk` — you should see the `xxxx.up.railway.app` alias in the answer.

### Step 5.4 — Smoke test the custom domain

```
https://roofpost.yourdomain.co.uk/api/health
```

**Expected:** same JSON as Part 4.2, served over TLS. Browser padlock should show a valid Let's Encrypt cert.

---

## Part 6 — End-to-end test from your phone

**Critical:** do this on mobile data (cellular), **not** home Wi-Fi. You want to prove the app works when you're actually on a job site.

1. Phone → Safari/Chrome → open the domain (custom or railway.app).
2. Login screen renders → enter `APP_PASSWORD` → dashboard loads.
3. Green health badge in the header.
4. Tap the upload zone → take a photo of anything roof-shaped (or pick one from camera roll).
5. Thumbnail appears → tap **Generate Captions** → wait ~15 s → 4 captions appear.
6. Edit the Facebook caption to add your phone number.
7. Set a schedule time ~5 min from now (so you can verify it appears in GHL scheduler immediately).
8. Tap **Schedule All** → confirm modal → wait for toasts: *"Facebook post scheduled!"* × 4.
9. Open GHL → Social Planner → Calendar view → confirm all 4 posts show at the right times against the right accounts.
10. Close the browser → reopen the URL → you're still logged in (session storage persists), but captions are cleared because all 4 were marked scheduled.

**If any step fails:** screenshot the Railway deployment logs tab for the exact moment of failure — that's your first debugging step.

---

## Part 7 — Auto-deploy on every push (already configured)

Railway's GitHub integration watches the `main` branch by default. Every `git push origin main` triggers a fresh build + deploy in ~2 minutes. No CI/CD config needed.

**To see pending deploys:** Service → **Deployments** tab — each push appears as a new row with the commit message.

**To deploy from a feature branch instead:** Service → **Settings** → **Source** → change "Branch" to e.g. `release`. Useful if you want staging.

**To pause auto-deploy during a risky period:** Service → **Settings** → **Source** → disable **Deploy on push**. Manual redeploys still work via the button in the Deployments tab.

---

## Part 8 — Rollback procedure

Something broke after a deploy? Roll back in 10 seconds:

1. Service → **Deployments** tab.
2. Find the last known-good deployment (green tick, recent).
3. Click the three-dot menu → **Redeploy**.
4. Railway spins up the old build from cache — live in ~30 s.

The GitHub `main` branch still has the broken commit; fix it with a revert commit (`git revert <bad-sha>`) and push normally so Railway redeploys the fix forward.

---

## Part 9 — Monitoring + alerts (optional, 10 min)

You won't know if the app is down until you try to use it — unless you set up a ping.

### Step 9.1 — UptimeRobot free plan

1. Sign up at https://uptimerobot.com (free, no card).
2. Add Monitor → Type **HTTPS** → URL `https://roofpost.yourdomain.co.uk/api/health` → Interval 5 min.
3. Under **Alert Contacts**: add your phone via SMS or the UptimeRobot mobile app (push).
4. (Advanced) Enable keyword monitoring → keyword `"anthropic":true` — pages you if an env var goes missing (not just if the server is down).

### Step 9.2 — Check Railway usage weekly

Project → **Usage** tab. Keep an eye on:
- **Execution time** (dominant cost) — should be <1 GB-hour/day for this app.
- **Egress** (bandwidth) — negligible unless the photos are huge.

If you're heading toward the $5/mo Hobby credit, the **Limits** page lets you cap usage before it bills.

---

## Part 10 — Common issues + fixes

| Symptom | Cause | Fix |
|---|---|---|
| "Cannot GET /" on root | `NODE_ENV` not set to `production` | Add/fix variable, redeploy auto-triggers |
| Health shows `"ghl":false` | GHL_API_KEY wrong or missing scopes | Regenerate PIT with the 5 required scopes, update variable |
| Generate returns 500 "No response from AI" | Anthropic key out of credit | Top up at console.anthropic.com → Billing |
| Schedule returns 400 "No connected X account in this location" | GHL sub-account doesn't have that platform connected | Connect the social account in GHL Settings → Social Planner → Accounts |
| Schedule 5xx intermittently | GHL transient error | Already handled — `fetchWithRetry` retries 2×. If it still fails, check GHL status page |
| Custom domain stuck on "Waiting for DNS" > 30 min | Cloudflare proxy enabled, or wrong CNAME | Set Cloudflare to DNS-only OR re-check the CNAME target matches Railway's |
| Login works on laptop but not phone | Phone and laptop on same Wi-Fi pointing at the old local IP | Clear browser cache on phone, re-try on mobile data |
| Every user logged out randomly | Railway redeployed (in-memory token store resets) | Expected. Single-operator use — accept it or upgrade to persistent token store later |
| 429 after a few generates | Rate limit working as designed | Wait 60 s or raise the limit in `server.js` |

---

## Running costs after deployment

| Item | Monthly |
|---|---|
| Railway Hobby plan | $5 (~£4) |
| Claude Sonnet 4.6 (light use, rate-limited) | $4-6 |
| GHL | £0 extra (existing plan) |
| Domain (if custom) | ~£1 amortised |
| UptimeRobot | £0 (free plan) |
| **Total** | **~£8-10/mo** |

---

## What "done" looks like

You can answer **yes** to all of these:
- [ ] Commit on GitHub `main` branch contains `app.set('trust proxy', 1)` in server.js
- [ ] Railway service shows 4 green tick boots in the runtime log
- [ ] `https://<domain>/api/health` returns all `true`
- [ ] Login works from phone on mobile data
- [ ] One photo → 4 captions → 4 scheduled posts appear correctly in GHL
- [ ] UptimeRobot is pinging every 5 min with your phone number as alert contact

When all 6 are ticked, you can close the laptop on job sites permanently.
