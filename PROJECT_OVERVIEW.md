# RoofPost AI — Project Overview

A single-operator web app that automates social media posting for a roofing
business. Upload one photo of a finished job → get four platform-tailored
captions written by Claude → review / edit → schedule all four posts to
GoHighLevel's Social Planner in one click.

---

## 1. Use case

The owner of a roofing company in England previously did this by hand for
every job:

1. Take a photo on a job site.
2. Write a different caption for Facebook, Instagram, LinkedIn and Google
   Business Profile (different tone, different length, different hashtag rules).
3. Open GoHighLevel (GHL), create four scheduled posts, attach the image to
   each, set the time.

That is ~15 minutes of fiddly mobile work per job. RoofPost AI compresses
it to: **upload → generate → approve → schedule** (about 60 seconds, mostly
on a phone).

**Hard requirements baked into the design:**

- British English, roofing-industry tone.
- Mobile-first UI (used from a phone after the job is finished).
- Single operator — no multi-user, no team features.
- Low running cost (~£10/month target).

---

## 2. Tech stack

### Frontend ([src/](src/))
| Layer | Choice |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Language | TypeScript 6 |
| Styling | Tailwind CSS v4 (via `@tailwindcss/vite`) |
| Utilities | `clsx`, `tailwind-merge` |
| Theme | Dark, mobile-first SPA |

Source layout under [src/](src/):

```
App.tsx              top-level state machine + sessionStorage hydration
main.tsx             React entrypoint
components/
  auth/              login gate
  upload/            drag-drop / camera image picker
  captions/          per-platform caption cards (edit + revise)
  schedule/          datetime picker + "Schedule all" button
  actions/           generate / revise buttons
  feedback/          toasts, error banners
  layout/            header (with health badge), shells
  ui/                shared primitives
constants/           platform metadata, prompt templates
hooks/               useHealthCheck, etc.
services/
  auth.ts            login + bearer-token plumbing
  openai.ts          (legacy name) AI calls — now hits Anthropic via /api/generate + /api/revise
  scheduler.ts       upload + schedule with retry
types/               shared TS types
utils/               helpers
```

### Backend ([server.js](server.js))
| Layer | Choice |
|---|---|
| Runtime | Node.js (ESM) |
| HTTP | Express 5 |
| AI SDK | `@anthropic-ai/sdk` ^0.90 |
| CORS | `cors` (pinned to `ALLOWED_ORIGIN` in prod) |
| Token gen | Node `crypto.randomUUID` |
| Dev runner | `concurrently` running Vite + server side-by-side |

Single-file Express server. Holds **all** secrets and proxies every external
call so the browser never sees a key.

### Tooling
- ESLint 9 with `typescript-eslint`, `eslint-plugin-react-hooks`,
  `eslint-plugin-react-refresh`
- TypeScript project references (`tsconfig.app.json`, `tsconfig.node.json`)
- `npm run dev` — boots Express on `:3001` and Vite on the default port in
  parallel via `concurrently`

---

## 3. External integrations

### Anthropic Claude (AI)
- Model: `claude-sonnet-4-6`
- Vision call → analyses the uploaded photo and produces a JSON object with
  one caption per platform.
- Text call → "revise this caption to be shorter / friendlier / etc."
- The system prompt enforces British English + roofing-copywriter voice +
  per-platform length and hashtag rules.
- (Migrated from OpenAI GPT-4o on 2026-04-22 — single-file diff in
  [server.js](server.js).)

### GoHighLevel (GHL) Social Planner
Direct REST integration against `services.leadconnectorhq.com` v2 API. No
Zapier in the loop.

| Endpoint | Purpose |
|---|---|
| `POST /medias/upload-file` | Push the photo into the GHL Media Library, get a hosted URL |
| `GET /social-media-posting/{locationId}/accounts` | List connected social accounts (cached 5 min) |
| `POST /social-media-posting/{locationId}/posts` | Create a scheduled post (`status: "scheduled"`) |
| `GET  /social-media-posting/{locationId}/posts/list` | Fetch upcoming posts for the confirmation panel |

GHL then publishes to **Facebook, Instagram, LinkedIn, Google Business
Profile** on the configured schedule. The app itself never touches the
social platforms directly.

### Auth gate
Single shared password (`APP_PASSWORD` env var). On success, the server
issues a UUID bearer token, stores it in an in-memory `Set`, and the client
keeps it in `sessionStorage` (wiped on tab close).

---

## 4. Architecture

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
│    GET  /api/health           → env-var presence + last-call probe   │
│                                                                      │
│  Authenticated (requireAuth middleware):                             │
│    POST /api/generate         → Anthropic Claude Sonnet 4.6 vision   │
│    POST /api/revise           → Anthropic Claude Sonnet 4.6 text     │
│    POST /api/upload           → GHL Media Library (image hosting)    │
│    POST /api/schedule         → GHL Social Planner (scheduled post)  │
│    GET  /api/scheduled-posts  → GHL Social Planner (upcoming list)   │
└──────────┬───────────────────────────────────┬───────────────────────┘
           ▼                                   ▼
┌──────────────────────────┐      ┌───────────────────────────────────┐
│  ANTHROPIC API           │      │  GOHIGHLEVEL API v2               │
│  claude-sonnet-4-6       │      │  services.leadconnectorhq.com     │
│  vision + text           │      │  media + social-media-posting     │
└──────────────────────────┘      └────────────────┬──────────────────┘
                                                   ▼
                                  ┌───────────────────────────────────┐
                                  │  Facebook · Instagram             │
                                  │  LinkedIn · Google Business       │
                                  │  (published by GHL on schedule)   │
                                  └───────────────────────────────────┘
```

---

## 5. Request flow (happy path)

1. **Login** — `POST /api/login` with the shared password → server returns a
   UUID; client stashes it in `sessionStorage`.
2. **Upload** — user drops a photo; the frontend base64-encodes it in memory.
3. **Generate** — `POST /api/generate` with the base64 image → server calls
   Claude Sonnet 4.6 (vision) → returns JSON with four platform captions.
4. **Review** — user edits any caption inline, or clicks "revise" with a
   short instruction → `POST /api/revise` → Claude returns the rewrite.
5. **Schedule all** — for each of the four platforms, in sequence:
   - `POST /api/upload` → image lands in GHL Media Library, returns hosted URL
     (2× retry on 5xx, 500ms backoff)
   - `POST /api/schedule` → GHL creates a scheduled post (also 2× retried)
6. **Confirmation** — frontend re-pulls `GET /api/scheduled-posts` so the
   user can see the four posts now sitting in GHL's queue.

### Timezone handling
`<input type="datetime-local">` produces a naive string like
`"2026-04-20T09:00"`. The frontend converts it to UTC with
`new Date(dateStr).toISOString()` — the browser's `Europe/London` locale
handles BST/GMT automatically. The server passes the UTC ISO string straight
through to GHL.

---

## 6. Reliability primitives

| Concern | Mechanism |
|---|---|
| Transient GHL 5xx | 2× retry, 500ms backoff in [src/services/scheduler.ts](src/services/scheduler.ts) |
| AI cost runaway | In-memory per-IP rate limit — 10/min on `/generate`, 20/min on `/revise` |
| Brute-force login | 10 attempts / 15 min on `/api/login` |
| F5 mid-flow | `sessionStorage` mirror of captions + custom prompt; auto-clears if everything is already scheduled |
| Misconfigured / revoked key | `/api/health` reports env-var presence **and** last-success/last-error per service; UI shows green/red dot in the header, polled every 30s |
| Stolen token replay | UUID tokens in `sessionStorage` (gone on tab close); auto-logout on any 401 |

---

## 7. Trust boundaries

```
Browser (untrusted)
  │   bearer token, base64 images, user-edited captions
  ▼
Express (trusted — holds every secret)
  │   authenticated calls with real keys
  ▼
Anthropic + GHL (external, trusted per their own SLAs)
```

- No API key ever reaches the browser.
- `requireAuth` middleware guards every write endpoint.
- `/api/health` is the only authenticated-adjacent public route, and it only
  exposes booleans / timestamps — never key material.
- `APP_PASSWORD` is the perimeter; `ALLOWED_ORIGIN` pins CORS in production.

---

## 8. Storage

**Server: none on disk — deliberately.** Only in-memory state:

- `validTokens: Set<string>` — login tokens (lost on restart)
- `accountsCache` — GHL account list, 5-minute TTL
- Rate-limit counters (one Map per IP)

Consequence: every server restart logs the user out mid-flow. For one user
this is a fair trade for zero database ops cost. The day this needs to
change is the day SQLite gets added — and the same DB should hold an audit
log of scheduled posts.

**Client:** `sessionStorage` only. Photos are not persisted across F5
(browser `File` objects aren't serialisable); captions and the custom prompt
are.

---

## 9. Environment variables

Required for the server to boot healthy:

| Var | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Claude Sonnet 4.6 access |
| `GHL_API_KEY` | GoHighLevel Private Integration Token |
| `GHL_LOCATION_ID` | Which GHL sub-account to post into |
| `GHL_USER_ID` | "Posted by" user for the scheduled posts |
| `APP_PASSWORD` | The single shared login password |
| `ALLOWED_ORIGIN` | Production CORS pin (omit in dev = open) |
| `NODE_ENV=production` | Toggles prod paths in Express |
| `PORT` | Defaults to `3001` |

---

## 10. Dev & deployment

### Local dev
```bash
npm install
npm run dev          # concurrently boots Express (server) + Vite (client)
```
- `dev:server` runs `node --env-file=.env server.js` on port 3001.
- `dev:client` runs Vite on its default port and proxies `/api/*` to 3001.

### Build
```bash
npm run build        # tsc -b && vite build → dist/
npm start            # node server.js (serves API; static dist/ in prod)
```

### Deployment target
**Railway Hobby** (~$5/month). Canonical runbook is in
[Source of Truth/DEPLOY-RAILWAY.md](Source%20of%20Truth/DEPLOY-RAILWAY.md);
operational handover notes in
[Source of Truth/HANDOFF.md](Source%20of%20Truth/HANDOFF.md).

---

## 11. What's deliberately not built

- **Multi-user auth** — single operator, password gate is enough.
- **Persistent token store / database** — in-memory is acceptable; tolerating
  occasional re-login is cheaper than running Postgres.
- **Observability stack (Sentry, DataDog)** — server console + GHL's own
  audit UI cover current scale.
- **Provider-agnostic AI shim** — past provider switches have been a
  single-file diff. Abstracting would be premature.
- **Video posts** — known gap. Captions generate, but video media isn't
  attached to the scheduled post yet (Instagram will reject).

---

## 12. Known weaknesses (priority order)

1. **No audit log.** If GHL silently drops a post, there's no app-side
   record to reconcile against. SQLite would also solve persistent tokens.
2. **No GHL token-validity probe beyond "did the last call work."** The PIT
   can be revoked server-side without warning; `/api/health` now tracks
   last-success per service which catches it on next call, but there's no
   proactive ping.
3. **Video media not attached** to scheduled posts (see above).
4. **In-memory rate limiter** doesn't survive a multi-replica scale-out.

None block single-operator production use. Each can be added without an
architectural rewrite.

---

## 13. Reference docs in this repo

- [sys_design.md](sys_design.md) — design rationale + ASCII architecture
- [Source of Truth/DEPLOY-RAILWAY.md](Source%20of%20Truth/DEPLOY-RAILWAY.md) — deployment runbook
- [Source of Truth/HANDOFF.md](Source%20of%20Truth/HANDOFF.md) — operator handover notes
- [server.js](server.js) — entire backend
- [src/App.tsx](src/App.tsx) — frontend state machine
