# RoofPost AI — Handoff Briefing

## TL;DR for the boss
> We built an internal tool that replaces 4 Zapier Zaps with a single React + Node app. Roofing photos go in → Claude Sonnet 4.6 writes platform-specific captions in British English → the owner edits them → direct API calls to GoHighLevel Social Planner schedule all 4 posts. Running on a laptop today; needs ~2–4 hours of deployment work to run permanently from any device.

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
- **Password gate** — single-env-var login (`APP_PASSWORD`), bearer-token auth, session-scoped storage, auto-logout on 401
- **Rate limiting** — 10 req/min on `/api/generate`, 20 req/min on `/api/revise`, 10/15min on `/api/login`
- **Timezone safety** — schedule times sent as UTC ISO from the browser's UK locale, safe across BST/GMT transitions
- **Session persistence** — captions, schedule times, and custom prompt survive F5; cleared automatically when all 4 are scheduled
- **GHL retry** — `/api/schedule` auto-retries up to 2× on 5xx errors with 500ms backoff
- **UI health badge** — green pulsing dot in the header confirms all API keys are configured; turns red with a hover tooltip identifying any missing keys; polls every 30 seconds

### Works but has known limitations
- **Local only** — runs on the laptop. Phone access on job sites won't work until deployed.

### Not built yet
- Public deployment (Railway recommended)
- Video support (currently skips media → generic text fallback)
- Audit log / simple reporting

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

### 2. ~~No authentication~~ ✅ DONE (2026-04-18)
**Shipped:** Single-password gate protecting all API routes.
- `APP_PASSWORD` env var on the backend
- `POST /api/login` issues a UUID bearer token (in-memory store)
- Frontend stores token in `sessionStorage` — wiped on tab close
- `requireAuth` middleware on `/api/generate`, `/api/revise`, `/api/upload`, `/api/schedule`
- Any 401 from the backend auto-redirects the UI to the login screen
- Logout button in the header clears the token
- Zero new npm packages (uses Node's built-in `crypto.randomUUID()`)

---

### 3. ~~Timezone drift during BST transitions~~ ✅ DONE (2026-04-20)
**Shipped:** Frontend now calls `new Date(caption.scheduleDate).toISOString()` before sending, so the browser's UK timezone converts the naive datetime-local string to a proper UTC ISO string. The backend receives an unambiguous UTC timestamp regardless of where it's deployed.

---

### 4. ~~No AI rate-limit~~ ✅ DONE (2026-04-20)
**Shipped:** Zero-dependency rate limiter built directly into `server.js`.
- `/api/generate` — 10 requests/min per IP
- `/api/revise` — 20 requests/min per IP
- `/api/login` — 10 requests per 15 min per IP

---

### 5. ~~Session not persisted~~ ✅ DONE (2026-04-20)
**Shipped:** `captions[]` and `customPrompt` saved to `sessionStorage` on every change.
- Captions, schedule dates, edited text, and custom prompt all survive F5
- If all 4 captions are already `scheduled: true` on restore, storage is cleared and app starts fresh
- Photos cannot be persisted (browser `File` objects are not serialisable) — re-upload needed after refresh

---

### 6. Videos silently skip media — Medium
**Problem:** Upload a video → the caption generates but the scheduled post has NO media attached. Instagram will reject the post; others post text-only.
**Fix:** Route videos through GHL's video upload endpoint and set `type: "reel"` for IG.
**Effort:** 3–4 hours (GHL video endpoint docs are thin; may need trial-and-error).

---

### 7. ~~No retry on transient GHL failures~~ ✅ DONE (2026-04-20)
**Shipped:** `fetchWithRetry` wraps the `/api/schedule` call — retries up to 2× on any `5xx` response with 500ms backoff. `4xx` errors (bad request, unauthorised) are returned immediately without retrying.

---

### 8. No audit trail / logging — Medium (if boss wants reporting)
**Problem:** If a post fails silently in 3 weeks, there's no record of what was sent.
**Fix:** Log every scheduled post to a simple JSON file or Google Sheet via another GHL webhook.
**Effort:** 1–2 hours.

---

### 9. ~~No UI health indicator~~ ✅ DONE (2026-04-20)
**Shipped:** Health badge in the header polls `/api/health` every 30 seconds.
- Green pulsing dot = all 4 env vars confirmed present
- Red dot = one or more missing; hover tooltip names the specific missing keys
- Grey dot = initial loading state

---

## Priority Roadmap

### Phase A — Complete ✅
1. ✅ ~~Add password gate~~ **DONE 2026-04-18**
2. ✅ ~~Add rate-limit on `/api/generate`~~ **DONE 2026-04-20**
3. ✅ ~~Fix timezone handling~~ **DONE 2026-04-20**

### Phase B — Mostly complete
4. ⬜ **Deploy to Railway with custom domain** ← next priority
5. ✅ ~~Session persistence (survive refresh)~~ **DONE 2026-04-20**
6. ✅ ~~Basic retry on GHL 5xx~~ **DONE 2026-04-20**

### Phase C — In progress
7. ⬜ Video support (3–4 hrs)
8. ⬜ Audit log / simple reporting (1–2 hrs)
9. ✅ ~~UI health badge~~ **DONE 2026-04-20**

---

## Running Costs

| Item | Current (local) | If deployed |
|---|---|---|
| Claude Sonnet 4.6 | ~$4–6/mo (light use) | Capped at ~$25/mo with rate-limiting |
| GHL | $0 extra (included in existing plan) | $0 extra |
| Hosting | $0 (local) | $5/mo (Railway) or $0 (Render free tier) |
| **Total** | **~$3–5/mo** | **~$10–25/mo** |

Compare to **previous design** ($20 Zapier tier + $3–5 OpenAI = ~$25/mo minimum). The new architecture is cheaper, faster, and more reliable, and now runs on Claude Sonnet 4.6 for higher-quality captions.

---

## Suggested Pitch to the Boss

> "The tool is built and works on my laptop — fully password protected, rate limited, timezone-safe, and refresh-proof. The only thing left to use it from my phone on site is cloud deployment (~2–4 hrs):
> - ~~Password protection~~ ✅ done
> - ~~Rate limiting~~ ✅ done
> - ~~Timezone fix~~ ✅ done
> - ~~Refresh safety~~ ✅ done
> - ~~GHL retry~~ ✅ done
> - ~~Health badge~~ ✅ done
> - **Cloud deployment** ← last step (2–4 hrs, ~£4/mo on Railway)
>
> Running cost will be ~£10–20/mo — less than the previous Zapier tier."

---

## Architecture Summary

```
Browser (React + Vite SPA)
  ↓ fetch /api/*
Express Backend (localhost:3001 — holds all API keys)
  ├─ /api/health    → env var check (public, no auth)
  ├─ /api/login     → issues bearer token
  ├─ /api/generate  → Anthropic Claude Sonnet 4.6 (vision)
  ├─ /api/revise    → Anthropic Claude Sonnet 4.6
  ├─ /api/upload    → GHL Media Library
  ├─ /api/schedule  → GHL Social Planner (with 2× retry on 5xx)
  └─ /api/scheduled-posts → GHL Social Planner (read)
```

**Tech stack:** React 19, TypeScript, Vite, Tailwind v4, Express, Node 22, Anthropic SDK (`@anthropic-ai/sdk`), GoHighLevel API v2.

**Required env vars:** `ANTHROPIC_API_KEY`, `GHL_API_KEY` (PIT), `GHL_LOCATION_ID`, `GHL_USER_ID`, `APP_PASSWORD`.

**PIT scopes required:** `medias.write`, `medias.readonly`, `socialplanner/account.readonly`, `socialplanner/post.readonly`, `socialplanner/post.write`.
