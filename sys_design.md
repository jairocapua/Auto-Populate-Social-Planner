# RoofPost AI — System Design

## Purpose

A single-operator web app that replaces a manual social media workflow. The owner of a roofing company uploads a photo of a completed job, and the app generates 4 platform-specific captions (Facebook, Instagram, LinkedIn, Google Business Profile), lets the owner review/edit them, then schedules all 4 posts directly to GoHighLevel's Social Planner in one click.

**Design constraints:**
- Single-operator — no multi-user concerns
- British English, roofing-industry tone
- Mobile-friendly (used from a phone on job sites once deployed)
- Low running cost (~£10/mo target)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                       BROWSER (React + Vite SPA)                     │
│                                                                      │
│  Login → Upload photo → Generate → Review/edit → Schedule            │
│                                                                      │
│  State:                                                              │
│    • sessionStorage  roofpost_auth_token    (bearer token)           │
│    • sessionStorage  roofpost_captions      (survives F5)            │
│    • sessionStorage  roofpost_prompt        (custom instructions)    │
└──────────────────────────────┬───────────────────────────────────────┘
                               │  fetch /api/*
                               │  Authorization: Bearer <uuid>
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (server.js)                      │
│                                                                      │
│  Holds ALL secrets — ANTHROPIC_API_KEY, GHL_API_KEY, APP_PASSWORD    │
│                                                                      │
│  Public:                                                             │
│    POST /api/login            → issue UUID bearer token              │
│    GET  /api/health           → env-var presence check               │
│                                                                      │
│  Authenticated (requireAuth middleware):                             │
│    POST /api/generate         → Anthropic Claude Sonnet 4.6 vision   │
│    POST /api/revise           → Anthropic Claude Sonnet 4.6 text     │
│    POST /api/upload           → GHL Media Library (image hosting)    │
│    POST /api/schedule         → GHL Social Planner (scheduled post)  │
│    GET  /api/scheduled-posts  → GHL Social Planner (upcoming list)   │
│                                                                      │
│  Cross-cutting:                                                      │
│    • Rate limit  /generate (10/min) /revise (20/min) /login (10/15m) │
│    • CORS pin via ALLOWED_ORIGIN env var (open in dev)               │
│    • trust proxy = 1 (so rate limiter sees real IPs behind Railway)  │
└──────────┬───────────────────────────────────┬───────────────────────┘
           │                                   │
           ▼                                   ▼
┌──────────────────────────┐      ┌───────────────────────────────────┐
│  ANTHROPIC API           │      │  GOHIGHLEVEL API v2               │
│  claude-sonnet-4-6       │      │  services.leadconnectorhq.com     │
│                          │      │                                   │
│  Vision + text gen       │      │  • /medias/upload-file            │
│  British English,        │      │  • /social-media-posting/         │
│  roofing-copywriter      │      │      {locationId}/accounts        │
│  system prompt           │      │  • /social-media-posting/         │
│                          │      │      {locationId}/posts           │
│                          │      │  • /social-media-posting/         │
│                          │      │      {locationId}/posts/list      │
└──────────────────────────┘      └────────────────┬──────────────────┘
                                                   │
                                                   ▼
                                  ┌───────────────────────────────────┐
                                  │  Facebook · Instagram             │
                                  │  LinkedIn · Google Business       │
                                  │  (published by GHL on schedule)   │
                                  └───────────────────────────────────┘
```

---

## Request flows

### Generate + schedule (happy path)

1. **Login** — `POST /api/login` with password → UUID token stored in `sessionStorage`
2. **Upload** — user drops photo(s); frontend base64-encodes them in memory
3. **Generate** — `POST /api/generate` with base64 images → server calls Claude Sonnet 4.6 vision → returns JSON with 4 platform captions
4. **Review** — user edits any caption manually, or clicks revise ("make it shorter") → `POST /api/revise` → Claude returns a single revised caption
5. **Schedule all** — for each platform:
   - `POST /api/upload` → GHL Media Library returns a hosted URL (retried 2× on 5xx)
   - `POST /api/schedule` with caption + UTC timestamp + image URL + platform → GHL returns a post ID (retried 2× on 5xx)
6. **Confirmation** — frontend refreshes the "Scheduled Posts" panel from `GET /api/scheduled-posts` to verify the post landed in GHL

### Timezone handling

`datetime-local` inputs produce naive strings like `"2026-04-20T09:00"`. The frontend converts these to UTC with `new Date(dateStr).toISOString()` — the browser's Europe/London locale handles BST/GMT automatically. The server does no timezone logic; it passes the UTC ISO string straight to GHL.

---

## Reliability primitives

| Concern | Mechanism | Location |
|---|---|---|
| Transient GHL 5xx | 2× retry, 500ms backoff | `fetchWithRetry` in [scheduler.ts](src/services/scheduler.ts) — applied to `/api/upload` and `/api/schedule` |
| OpenAI/Anthropic cost runaway | In-memory per-IP rate limit | `createRateLimiter` in [server.js](server.js) |
| Brute-force login | 10 attempts / 15 min | `loginLimiter` on `/api/login` |
| Accidental F5 | sessionStorage mirror of captions + custom prompt | [App.tsx](src/App.tsx) |
| Zombie "already scheduled" state after F5 | On restore, clear storage if every caption is `scheduled: true` | [App.tsx](src/App.tsx) init |
| API-key misconfiguration | `/api/health` + green/red dot badge in header, polls every 30s | [useHealthCheck.ts](src/hooks/useHealthCheck.ts), [Header.tsx](src/components/layout/Header.tsx) |
| Stolen token replay | UUID bearer tokens in sessionStorage (wiped on tab close), auto-logout on 401 | [auth.ts](src/services/auth.ts) |

---

## Data storage

**None on the server** — deliberately. The only server-side state is in-memory:

- `validTokens: Set<string>` — login tokens, lost on restart
- `accountsCache` — GHL social account list, 5-minute TTL
- Rate-limit counters (Map per IP)

Consequence: every server restart logs every user out mid-flow. For a single-operator tool this is acceptable (HANDOFF.md notes the tradeoff). The day this needs fixing is the day SQLite gets added — at which point an audit log of scheduled posts should go in the same DB.

**Frontend state:** session-scoped only. Photos never persist across F5 (browser `File` objects aren't serialisable) — captions and custom prompt do.

---

## Trust boundaries

```
Browser (untrusted)
  │    bearer token, base64 images, user-edited captions
  ▼
Express (trusted — holds every secret)
  │    authenticated API calls with real keys
  ▼
Anthropic + GHL (external, trusted per their own SLAs)
```

- No key ever reaches the browser
- `requireAuth` middleware on every write endpoint — `/api/health` is the only public authenticated-adjacent endpoint, and it only exposes "is key configured" booleans, never the keys themselves
- `APP_PASSWORD` protects the app from the open internet
- `ALLOWED_ORIGIN` pins CORS in production

---

## What's deliberately not built

- **Multi-user auth** — single-operator tool
- **Persistent token store** — in-memory is fine for one user; tolerating post-deploy re-login is cheaper than running a database
- **Observability stack (Sentry, DataDog)** — server console + GHL's own audit UI covers current scale
- **OpenAI-compatibility shim / model-agnostic layer** — provider switching in the past has been a single-file diff; abstracting is overkill
- **Video support** — acknowledged gap (HANDOFF.md problem 6); videos generate captions but don't attach media

---

## Deployment

Not yet deployed — runs via `npm run dev` on the owner's laptop today. Target is Railway Hobby (~$5/mo) with a custom subdomain. The full runbook is in [DEPLOY-RAILWAY.md](Source%20of%20Truth/DEPLOY-RAILWAY.md).

**Required env vars:** `ANTHROPIC_API_KEY`, `GHL_API_KEY`, `GHL_LOCATION_ID`, `GHL_USER_ID`, `APP_PASSWORD`, `NODE_ENV=production`, `ALLOWED_ORIGIN`.

---

## Known weaknesses (for follow-up)

In priority order, honest assessment:

1. **No audit log** — if GHL silently drops a post in 3 weeks there's no app-side record to reconcile against. Single-file SQLite log would fix it and also solve persistent tokens.
2. **No GHL token-expiry signal** — the PIT can be revoked server-side; the health badge only checks env var presence, not validity. A "last successful GHL call" timestamp in `/api/health` would catch this.
3. **Video media not attached to scheduled posts** — text-only posts succeed; IG will reject.
4. **In-memory rate limiter** — fine for current scale, but doesn't work across replicas if scale-out ever happens.

None of these block single-operator production use. All can be layered in without architectural change.
