Here's the full updated picture:

Updated System Architecture

┌─────────────────────────────────────────────────────────────────┐
│                    BROWSER (RoofPost AI)                        │
│                                                                 │
│  1. Upload photo/video                                          │
│  2. POST /api/generate  (base64 image)                         │
│  3. See & edit 4 captions                                       │
│  4. Click "Approve & Schedule"                                  │
│     → POST /api/upload  (base64 image)                         │
│     → POST Zapier webhook (caption + GHL image URL)            │
└────────┬──────────────────────────┬────────────────────────────┘
         │                          │ (no-cors, fire & forget)
         ▼                          ▼
┌─────────────────┐      ┌─────────────────────────────────────┐
│  EXPRESS SERVER │      │         ZAPIER (×4 Zaps)            │
│  :3001          │      │                                     │
│                 │      │  Catch Hook trigger                 │
│  /api/generate  │      │     → parse JSON payload            │
│  → OpenAI GPT-4o│      │     → POST to GHL Social Planner   │
│    Vision       │      │       API with:                     │
│  → returns JSON │      │       - caption                     │
│    captions     │      │       - schedule_date               │
│                 │      │       - accountId (per platform)    │
│  /api/upload    │      │       - media.url (GHL-hosted)      │
│  → GHL Media    │      └──────────────┬──────────────────────┘
│    Library API  │                     │
│  → returns GHL  │                     ▼
│    hosted URL   │      ┌─────────────────────────────────────┐
│                 │      │     GoHighLevel Social Planner      │
│  Holds all keys │      │                                     │
│  (never in      │      │  Scheduled posts published to:      │
│   browser)      │      │  Facebook · Instagram               │
│                 │      │  LinkedIn · Google Business         │
└─────────────────┘      └─────────────────────────────────────┘
What's In Each Layer
Browser — React + Vite SPA. No API keys. No secrets. Just UI logic.

Express Server — 3 endpoints, 1 file (server.js). Holds all keys server-side.

Endpoint	Does
POST /api/generate	Receives base64 images → calls GPT-4o Vision → returns 4 captions
POST /api/upload	Receives base64 image → uploads to GHL Media Library → returns GHL URL
GET /api/health	Reports which keys are configured
Zapier (×4 Zaps) — One per platform. Each receives a webhook and calls GHL API. Not built yet.

GHL — Owns everything at the end: the media file and the scheduled social post.

Keys Required

OPENAI_API_KEY     → AI captions (server only)
GHL_API_KEY        → image upload + Zapier uses same key for posting
GHL_LOCATION_ID    → which GHL sub-account
Honest Feedback on the Current Design
What's genuinely better now
GHL Media Library is the right call. Your images live in your own GHL account, reusable, no third-party dependency. It also means the same API key does double duty — upload and post.

Keys are fully server-side. Nothing sensitive reaches the browser. The bundle is smaller too (OpenAI SDK was removed from the frontend).

The architecture is clean for a single-user tool. One server, one page, three external services. Easy to reason about.

Remaining problems — honest ones
Problem 1: The GHL Media Library upload endpoint is unverified

I found the endpoint (POST /medias/upload-file) in the docs but could not read the full schema — GHL's API docs are behind authentication. The response structure I'm handling:


ghlData?.data?.url || ghlData?.url || ghlData?.fileUrl
...is a best guess across three possible shapes. This will likely need adjustment once you test it against the real API. If it fails, the image silently won't attach. This needs a real test before relying on it.

Problem 2: Still no confirmation posts actually scheduled

The Zapier webhook is still mode: 'no-cors' — fire and forget. The app shows green checkmarks regardless of what Zapier does. If your GHL token expires, a Zap is turned off, or an accountId is wrong, you'd never know from the app.

Problem 3: The 4 Zapier Zaps haven't been built yet

The app is functionally ready but nothing will actually post to social media until you set up the 4 Zaps in Zapier. Each one needs:

A Catch Hook trigger (gives you the webhook URL)
A POST to GHL Social Planner API with correct locationId, accountIds[], summary, media, scheduleDate
This is the most important remaining task — the app is wired up, Zapier is the missing piece.

Problem 4: Server needs to be running for the app to work

Right now you run it locally with npm run dev. If you close your laptop, the app stops working. For it to work reliably from your phone on a job site, the server needs to be hosted somewhere permanently.

Cheapest options:

Railway — free tier, push to deploy, stays running
Render — free tier, slight cold-start delay
Your own VPS — if you already have one

Priority Order from Here
#	Task	Effort	Blocks
1	Build the 4 Zapier Zaps	~1 hour in Zapier UI	Nothing posts without this
2	Test GHL Media Library upload	10 minutes	Images may not attach
3	Deploy server permanently	30 minutes	App only works on your machine right now
4	Add scheduling confirmation	Medium	You're blind to failures
5	Add password gate	Small	Anyone with URL can use it
The single most impactful next step is building the Zapier Zaps. Want me to write out the exact step-by-step configuration for all 4?