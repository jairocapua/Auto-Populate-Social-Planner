# RoofPost AI — Handoff Briefing

## TL;DR for the boss
> We built an internal tool that replaces 4 Zapier Zaps with a single React + Node app. Roofing photos go in → GPT-4o writes platform-specific captions in British English → the owner edits them → direct API calls to GoHighLevel Social Planner schedule all 4 posts. Running on a laptop today; needs ~1 day of deployment work to run permanently.

---

## Status Categories

### Working end-to-end
- Photo upload (drag-drop, up to 20MB)
- AI caption generation for FB / IG / LI / GBP with British English + roofing context
- Per-caption AI revision ("make it shorter", "add emojis", etc.)
- Custom global prompt to steer all 4 captions at once
- Real GHL Media Library hosting (no third-party image host)
- Direct GHL Social Planner scheduling with the correct `status: "scheduled"` flag
- Per-platform character counters + schedule datetime pickers
- All 4 platforms verified scheduling correctly

### Works but has known limitations
- **Local only** — runs on the laptop. Phone access on job sites won't work until deployed.
- **No auth** — anyone who reaches `localhost:3001` can generate/schedule. Fine on the owner's machine, risky if deployed.
- **Refresh loses state** — accidentally hitting F5 while reviewing captions wipes edits.

### Not built yet
- Password gate
- Public deployment
- Timezone safety (BST/GMT edge case)
- OpenAI rate-limiting (protects API credit)
- Video support (currently skips media → generic text fallback)

---

## Weaknesses & Risks — Detailed

### 1. Server is local-only — High impact
**Problem:** Can't use RoofPost AI from the phone when on a job. The backend only runs when the laptop is on and `npm run dev` is live.
**Fix:** Deploy the Express server to a cloud host.
**Options:**
- **Railway** (~$5/mo, 2-min deploy, recommended for simplicity)
- **Render** (free tier available but sleeps after 15 min idle, slower cold starts)
- **Fly.io** (free tier, closer to UK for lower latency)

**Effort:** 2–4 hours including domain setup (e.g. `roofpost.yourcompany.co.uk`).

---

### 2. No authentication — Critical once deployed
**Problem:** Once deployed, any URL visitor could burn OpenAI credit and post to the GHL account.
**Fix:** Simple password gate — one env variable, one login screen, session cookie.
**Options:**
- Simple `VITE_APP_PASSWORD` check (5 min, good enough for single-user)
- Proper auth with Clerk/Auth0 (overkill for one person)

**Effort:** 30 minutes. **Must-have before deploying publicly.**

---

### 3. Timezone drift during BST transitions — Medium
**Problem:** UK switches between GMT and BST twice a year (last Sunday of Mar/Oct). The `datetime-local` input doesn't carry timezone info, so a post scheduled for "9am" right around the clock change could fire an hour early/late.
**Fix:** Explicitly send `Europe/London` timezone with every schedule request.
**Effort:** 1 hour.

---

### 4. No OpenAI rate-limit — Critical once deployed
**Problem:** A malicious visitor (or a stuck F5) could fire hundreds of Generate requests, each costing $0.01–0.03. In 5 minutes that's tens of dollars.
**Fix:** `express-rate-limit` — cap at e.g. 10 requests/minute per IP.
**Effort:** 15 minutes.

---

### 5. Session not persisted — Low
**Problem:** Accidental refresh wipes captions, schedule times, and uploaded photos. Would need to regenerate from scratch.
**Fix:** Save `captions[]` to sessionStorage on every change.
**Effort:** 20 minutes.

---

### 6. Videos silently skip media — Medium
**Problem:** Upload a video → the caption generates but the scheduled post has NO media attached. Instagram will reject the post; others post text-only.
**Fix:** Route videos through GHL's video upload endpoint and set `type: "reel"` for IG.
**Effort:** 3–4 hours (GHL video endpoint docs are thin; may need trial-and-error).

---

### 7. No retry on transient GHL failures — Low
**Problem:** If GHL returns a random 502 during peak load, the post fails and requires manual retry.
**Fix:** Auto-retry up to 2x on 5xx errors with 500ms backoff.
**Effort:** 20 minutes.

---

### 8. No audit trail / logging — Medium (if boss wants reporting)
**Problem:** If a post fails silently in 3 weeks, there's no record of what was sent.
**Fix:** Log every scheduled post to a simple JSON file or Google Sheet via another GHL webhook.
**Effort:** 1–2 hours.

---

## Priority Roadmap

### Phase A — Before showing the boss a live demo (2–3 hrs)
1. Add password gate (`VITE_APP_PASSWORD`)
2. Add rate-limit on `/api/generate`
3. Fix timezone handling

### Phase B — Before daily use (4–6 hrs)
4. Deploy to Railway with custom domain
5. Session persistence (survive refresh)
6. Basic retry on GHL 5xx

### Phase C — Polish when time allows (4–6 hrs)
7. Video support
8. Audit log / simple reporting
9. UI health badge (green dot = all systems go)

---

## Running Costs

| Item | Current (local) | If deployed |
|---|---|---|
| OpenAI GPT-4o | ~$3–5/mo (light use) | Cap at $20/mo with rate-limiting |
| GHL | $0 extra (included in existing plan) | $0 extra |
| Hosting | $0 (local) | $5/mo (Railway) or $0 (Render free tier) |
| **Total** | **~$3–5/mo** | **~$10–25/mo** |

Compare to **previous design** ($20 Zapier tier + $3–5 OpenAI = ~$25/mo minimum). The new architecture is cheaper, faster, and more reliable.

---

## Suggested Pitch to the Boss

> "The tool is built and works on my laptop. To make it production-ready and use from my phone on site, it needs ~1 day of polish:
> - Password protection (30 min)
> - Rate limiting (15 min)
> - Timezone fix (1 hr)
> - Cloud deployment (2–4 hrs)
> - Refresh safety + retry (1 hr)
>
> Running cost will be ~£10–20/mo — less than the previous Zapier tier. Can I finish the last 1 day of work this week?"

---

## Architecture Summary

```
Browser (React + Vite SPA)
  ↓ fetch /api/*
Express Backend (localhost:3001 — holds all API keys)
  ├─ /api/generate  → OpenAI GPT-4o Vision
  ├─ /api/revise    → OpenAI GPT-4o
  ├─ /api/upload    → GHL Media Library
  └─ /api/schedule  → GHL Social Planner
                      (accountIds + scheduleDate + status:"scheduled")
```

**Tech stack:** React 18, TypeScript, Vite, Tailwind v4, Express, Node 22, OpenAI SDK, GoHighLevel API v2.

**Required env vars:** `OPENAI_API_KEY`, `GHL_API_KEY` (PIT), `GHL_LOCATION_ID`, `GHL_USER_ID`.

**PIT scopes required:** `medias.write`, `medias.readonly`, `socialplanner/account.readonly`, `socialplanner/post.readonly`, `socialplanner/post.write`.
