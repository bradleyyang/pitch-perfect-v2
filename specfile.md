Below is a **full, Codex-ready technical spec** (single file) that’s **indepth**, prize-optimized, and includes a **step-by-step implementation plan**. Paste this into your repo as `SPEC.md`.

---

# PitchCoach — Full Technical Spec for Codex (uOttaHack 8)

**Version:** 1.3 (Codex Build Spec, Prize-Optimized)
**Date:** January 16, 2026
**Stack:** Next.js (App Router) + FastAPI + Worker + DigitalOcean Spaces + Gemini API + ElevenLabs (Scribe v2 STT + TTS)
**Prizes Targeted:** Best Use of Gemini API, Best Use of DigitalOcean, Best Use of ElevenLabs, Best .Tech Domain Name, Yellowcake API, Solace Agent Mesh

---

## 0) North Star Demo (90-second judge flow)

1. Open **PitchCoach.tech** → beautiful landing → “Start”
2. Upload **PDF deck** (required) + record/upload **video** (or upload **audio-only**)
3. Processing screen shows progress + elevator music + fun loading copy
4. Results show:

   * Transcript (click to seek)
   * Timeline coach moments overlay
   * Deck critique (per slide + top fixes)
   * Two narrated coach personas (Encouraging + Strict Investor)
5. Optional “Market Analysis (Yellowcake)” → competitor bullets + pitch email template
6. Optional “Agent Mesh Mode” → live event log of multi-agent pipeline

---

## 1) Scope & Requirements

### 1.1 MVP (must ship)

* UI polish: smooth uploads + clear success path
* PDF deck analysis (Gemini)
* Pitch evaluation from:

  * Video (record/upload) OR
  * Audio-only (mp3/wav/m4a)
* Transcription: ElevenLabs **Scribe v2**
* Delivery metrics: fillers, pace, pauses (+ timeline events)
* Gemini coaching synthesis producing structured feedback + timestamps
* ElevenLabs TTS: 2 persona clips (short)
* Async job processing (no timeouts)
* DigitalOcean deployment + Spaces storage
* .tech domain live

### 1.2 Stretch (prize multipliers)

* Yellowcake market analysis module (button-triggered)
* Solace Agent Mesh mode (event-driven agent pipeline + UI event log)
* PPTX best-effort conversion (LibreOffice) if time

### 1.3 Non-goals

* No accounts / auth (use anonymous sessionId)
* No medical “stress” claims
* No full real-time coaching during recording (stretch only)

---

## 2) Repo & Service Layout

```
pitchcoach/
  web/                       # Next.js app (frontend)
  backend/                   # FastAPI API server
  worker/                    # Python worker process (job runner)
  infra/                     # deployment scripts, env templates
  SPEC.md
  README.md
```

---

## 3) Environment Variables

### 3.1 `backend/.env.example`

* `DO_SPACES_REGION`

* `DO_SPACES_ENDPOINT` (ex: [https://nyc3.digitaloceanspaces.com](https://nyc3.digitaloceanspaces.com))

* `DO_SPACES_BUCKET`

* `DO_SPACES_ACCESS_KEY`

* `DO_SPACES_SECRET_KEY`

* `GEMINI_API_KEY`

* `ELEVENLABS_API_KEY`

* `ELEVENLABS_VOICE_ID_ENCOURAGING`

* `ELEVENLABS_VOICE_ID_INVESTOR`

* `PUBLIC_APP_URL` (CORS allowlist origin)

* `DATA_RETENTION_HOURS` (default 12)

* Optional:

  * `DB_URL` (sqlite path or postgres url)
  * `ENABLE_AGENT_MESH` (true/false)
  * `YELLOWCAKE_API_KEY`

### 3.2 `web/.env.local.example`

* `NEXT_PUBLIC_API_BASE_URL=https://api.pitchcoach.tech`
* `NEXT_PUBLIC_MAX_DECK_MB=10`
* `NEXT_PUBLIC_MAX_VIDEO_MB=100`
* `NEXT_PUBLIC_MAX_AUDIO_MB=20`

---

## 4) DigitalOcean Storage Layout (Spaces)

Bucket key prefixes:

* `raw/{sessionId}/{jobId}/deck.pdf`
* `raw/{sessionId}/{jobId}/pitch.webm` OR `raw/{sessionId}/{jobId}/pitch.mp4`
* `raw/{sessionId}/{jobId}/audio.mp3` (audio-only path)
* `derived/{sessionId}/{jobId}/slides/{index}.png` (optional)
* `derived/{sessionId}/{jobId}/voice/encouraging.mp3`
* `derived/{sessionId}/{jobId}/voice/investor.mp3`

Retention:

* Raw keys deleted after `DATA_RETENTION_HOURS`
* Derived keys deleted after same window (or kept longer if desired)

---

## 5) Next.js App (Web UI)

### 5.1 Routes (App Router)

* `GET /` Landing
* `GET /new` Upload/Record
* `GET /job/[jobId]` Processing (poll job status)
* `GET /results/[jobId]` Results dashboard
* `GET /results/[jobId]/market` Market analysis view (optional)
* `GET /results/[jobId]/events` Agent Mesh event log view (optional)

### 5.2 Client vs Server Components

* Use **Client Components** for:

  * MediaRecorder
  * File uploads (PUT presigned URL)
  * Polling job status
  * Timeline seeking / transcript interactivity
* Use Server Components only as lightweight wrappers.

### 5.3 UI Components

Create in `web/components/`:

**Core**

* `LandingHero`
* `NewPitchClient` (orchestrates input selection + uploads + create job)
* `DeckUploadCard`
* `PitchInputTabs` (Video | Audio)
* `VideoRecordCard` (MediaRecorder)
* `VideoUploadCard`
* `AudioUploadCard`
* `AnalyzeButton`

**Processing**

* `ProcessingClient` (polls job, shows progress)
* `ProgressSteps` (step list)
* `BrainRotCarousel` (loading messages)
* `ElevatorAudioPlayer` (loop + optional TTS status clips)

**Results**

* `ResultsClient` (fetches result JSON)
* `VideoOrAudioPlayer`
* `TimelineBar` (markers)
* `TranscriptPanel` (click-to-seek)
* `SummaryPanel` (scores + top fixes + action items)
* `DeckFeedbackPanel` (per-slide list)
* `VoiceCoachPlayer` (persona toggle + orb UI)
* `ExportButton` (download result JSON)

**Optional**

* `MarketAnalysisPanel`
* `AgentMeshEventLog`

### 5.4 UX Requirements

* Uploads are “fail fast” with clear file-size and file-type errors
* One obvious CTA path
* Results page should look premium (cards, spacing, typography)
* Processing screen always feels alive (music + progress + rotating text)

---

## 6) Backend (FastAPI) + DB

### 6.1 Session Handling

Frontend generates `sessionId = crypto.randomUUID()` once and stores in localStorage key `pitchcoach_session_id`.
Frontend sends header: `X-Session-Id: <uuid>` for all API calls.

No auth required for hackathon.

### 6.2 Database (SQLite default)

Tables:

**jobs**

* `id` TEXT PRIMARY KEY (uuid)
* `session_id` TEXT NOT NULL
* `status` TEXT NOT NULL (`queued|processing|done|error`)
* `progress` INTEGER NOT NULL DEFAULT 0
* `mode` TEXT NOT NULL (`standard|agent_mesh`)
* `deck_key` TEXT NOT NULL
* `video_key` TEXT NULL
* `audio_key` TEXT NULL
* `result_json` TEXT NULL (store inline for MVP speed)
* `error_message` TEXT NULL
* `created_at` TEXT
* `updated_at` TEXT

**market_jobs** (optional)

* `id` TEXT PK
* `job_id` TEXT FK
* `status` TEXT
* `progress` INTEGER
* `params_json` TEXT
* `result_json` TEXT NULL
* `error_message` TEXT NULL
* timestamps

**agent_events** (optional)

* `id` TEXT PK
* `job_id` TEXT
* `ts` TEXT
* `type` TEXT
* `payload_json` TEXT

### 6.3 API Endpoints (Contract)

#### `GET /v1/health`

Response:

```json
{ "ok": true }
```

#### `POST /v1/uploads/presign`

Purpose: presigned PUT URL to upload directly to Spaces.

Request:

```json
{
  "kind": "deck" | "video" | "audio" | "voice",
  "jobId": "uuid",
  "filename": "deck.pdf",
  "contentType": "application/pdf",
  "sizeBytes": 123
}
```

Response:

```json
{
  "objectKey": "raw/<sessionId>/<jobId>/deck.pdf",
  "putUrl": "https://...",
  "headers": { "Content-Type": "application/pdf" },
  "expiresInSeconds": 900
}
```

Validation:

* `deck`: must be pdf, <= 10MB
* `video`: <= 100MB
* `audio`: <= 20MB

#### `POST /v1/jobs/init`

Purpose: create a jobId first so uploads can be placed under it.

Request:

```json
{
  "mode": "standard" | "agent_mesh"
}
```

Response:

```json
{
  "jobId": "uuid",
  "sessionId": "uuid",
  "uploadPlan": {
    "deckKey": "raw/<sessionId>/<jobId>/deck.pdf",
    "videoKey": "raw/<sessionId>/<jobId>/pitch.webm",
    "audioKey": "raw/<sessionId>/<jobId>/audio.mp3"
  }
}
```

#### `POST /v1/jobs`

Purpose: finalize job inputs and queue it.

Request:

```json
{
  "jobId": "uuid",
  "deckKey": "raw/.../deck.pdf",
  "videoKey": "raw/.../pitch.webm",
  "audioKey": null,
  "languageHint": "en" | "fr" | null
}
```

Rules:

* deckKey required
* exactly one of videoKey or audioKey must be present
* set job status to `queued`

Response:

```json
{ "jobId": "uuid", "status": "queued" }
```

#### `GET /v1/jobs/{jobId}`

Response:

```json
{
  "jobId": "uuid",
  "status": "queued|processing|done|error",
  "progress": 0,
  "errorMessage": null
}
```

#### `GET /v1/results/{jobId}`

* 404 if not done
  Response: `AnalysisResult` JSON (schema below)

#### `POST /v1/market/{jobId}` (Yellowcake)

Request:

```json
{
  "companyName": "string",
  "website": "string|null",
  "industryHint": "string|null"
}
```

Response:

```json
{ "marketJobId": "uuid", "status": "queued" }
```

#### `GET /v1/market/{marketJobId}`

Response: market result JSON.

#### `GET /v1/events/{jobId}` (Agent Mesh log, optional)

Response: list of events for UI event log.

---

## 7) Worker (Job Processor)

### 7.1 Worker Responsibilities

* Poll DB for `status='queued'` jobs
* Process one job at a time (or limited concurrency)
* Update progress frequently
* Persist result JSON in DB
* Upload voice mp3 assets to Spaces
* Enforce cleanup policy (or a separate cleanup loop)

### 7.2 Pipeline Steps (with progress)

1. **Validate inputs** (progress 5)
2. **Fetch deck PDF** from Spaces (progress 8)
3. **Fetch pitch media** (video or audio) (progress 12)
4. If video: **Extract audio with ffmpeg** (progress 20)
5. **STT with ElevenLabs Scribe v2** (progress 45)
6. **Compute metrics + draft events** (progress 55)
7. **Deck processing** (progress 65)

   * render slides to images (preferred)
   * limit slides to 15
8. **Gemini deck critique** (progress 78)
9. **Gemini coaching synthesis** (progress 88)
10. **ElevenLabs TTS** for two personas (progress 96)
11. **Assemble final result JSON + save** (progress 100)

### 7.3 Media Handling

* Video formats accepted: webm/mp4
* Audio formats: wav/mp3/m4a
* Audio extraction (if video):

  * `ffmpeg -i input -vn -ac 1 -ar 16000 output.wav`

### 7.4 Deterministic Metrics & Events

Compute from transcript segments (timestamps):

* `wpmOverall`
* `paceSeries` (30s windows)
* `fillerCount` and `fillerRatePerMin`
* `pauseCount` (gaps > 400ms), `avgPauseMs`

Event rules:

* `filler_spike`: >=3 fillers in a 15s window
* `pace_fast`: wpm > 175 in window
* `pace_slow`: wpm < 110 in window
* `strong_moment`: low fillers + stable pace + contains hook keywords OR Gemini labels 1–2

Keep 8–15 events total (best for UI).

---

## 8) AI Integrations (Exact Responsibilities)

### 8.1 ElevenLabs (Prize: Best Use of ElevenLabs)

**STT:** Use **Scribe v2** on extracted audio:

* Request timestamps if available
* Output segments as `{startMs, endMs, text}`

**TTS:** Generate two short persona clips:

* `encouraging_coach` (20–40s)
* `strict_investor` (20–40s)
  Store each as mp3 in Spaces.

**Waiting Audio:**

* Frontend plays a local elevator loop instantly
* Optionally: worker generates a short “status voice clip” (stretch) and returns it for processing page playback

### 8.2 Gemini API (Prize: Best Use of Gemini)

Use Gemini in two separate prompts:

1. **Deck critique**: slide images + extracted text → per-slide issues + rewrite suggestions + top fixes
2. **Coaching synthesis**: transcript + metrics + draft events + deck fixes → final events + scores + scripts for TTS

Gemini outputs must be STRICT JSON (no markdown).

### 8.3 Yellowcake API (Prize module)

Triggered by user button after core results.
Use extracted pitch summary + optional website:

* competitor scan
* market snapshot bullets
* positioning suggestions
* pitch email template

### 8.4 Solace Agent Mesh (Prize module)

If `mode=agent_mesh`:

* emit/record events per pipeline step
* optionally implement actual pub/sub later
* UI shows event log in processing

---

## 9) AnalysisResult JSON Schema (Frontend Contract)

```json
{
  "jobId": "uuid",
  "sessionId": "uuid",
  "createdAt": "ISO",
  "input": { "type": "video|audio", "durationSec": 180 },

  "deck": {
    "format": "pdf",
    "slideCount": 10,
    "overallSummary": "string",
    "topFixes": [
      { "title": "string", "why": "string", "how": "string" }
    ],
    "perSlide": [
      {
        "slideIndex": 0,
        "title": "string|null",
        "summary": "string",
        "issues": [
          { "type": "clarity|density|story|visual", "detail": "string" }
        ],
        "rewriteSuggestions": [
          { "before": "string|null", "after": "string", "rationale": "string" }
        ]
      }
    ]
  },

  "speech": {
    "language": "en",
    "transcript": [
      { "startMs": 0, "endMs": 1800, "text": "string", "tags": ["filler"] }
    ],
    "metrics": {
      "durationSec": 180,
      "wpmOverall": 152,
      "fillerCount": 23,
      "fillerRatePerMin": 7.6,
      "pauseCount": 14,
      "avgPauseMs": 520,
      "paceSeries": [
        { "tMs": 0, "wpm": 140 },
        { "tMs": 30000, "wpm": 180 }
      ]
    }
  },

  "events": [
    {
      "id": "uuid",
      "tMs": 72000,
      "type": "filler_spike|pace_fast|pace_slow|strong_moment|clarity_issue",
      "severity": 1,
      "title": "string",
      "detail": "string",
      "suggestion": "string",
      "evidence": "string|null"
    }
  ],

  "scores": { "overall": 82, "content": 86, "delivery": 78, "clarity": 80 },

  "voice": {
    "clips": [
      {
        "persona": "encouraging_coach|strict_investor",
        "audioUrl": "https://presigned-get-url",
        "durationSec": 32,
        "script": "string"
      }
    ]
  },

  "market": {
    "summary": "string",
    "competitors": [
      { "name": "string", "whyRelevant": "string", "evidence": "string" }
    ],
    "positioningSuggestions": ["string"],
    "pitchEmailTemplate": "string"
  },

  "retention": {
    "rawDeleteAt": "ISO",
    "derivedDeleteAt": "ISO|null"
  }
}
```

Notes:

* `market` is optional (only after Yellowcake run)
* `voice` is optional if TTS fails; UI must still render

---

## 10) Gemini Prompt Specs (Exact)

### 10.1 Deck Critique Prompt (STRICT JSON)

**System:**
“You are an expert pitch coach and slide design reviewer… Return strict JSON only…”

**User inputs:**

* `slides`: array of `{index, imageBase64?, extractedText?}`

**Output JSON (deck-only):**

* `slideCount`, `overallSummary`
* `topFixes[3]`
* `perSlide[]` with issues + rewriteSuggestions

Constraints:

* No markdown
* Keep rewrite suggestions short and demo-friendly

### 10.2 Coaching Synthesis Prompt (STRICT JSON)

Inputs:

* transcript segments
* computed metrics
* draft events
* deck top fixes

Output:

* `scores`
* refined `events` (8–15)
* `voiceScripts`:

  * `encouraging_coach`
  * `strict_investor`

Constraints:

* No medical claims
* Provide actionable advice
* Mention timestamps naturally (around MM:SS)

---

## 11) ElevenLabs Integration Specs

### 11.1 Scribe v2 STT

* Input: wav 16k mono (preferred)
* Output: transcript segments with timestamps
* If only paragraph text: create synthetic segments by splitting into sentences with approximate timing (fallback)

### 11.2 TTS

* Use provided voice IDs
* Output mp3
* Upload to Spaces under `derived/.../voice/...`
* Generate presigned GET URL for frontend playback

---

## 12) Agent Mesh Mode (Solace Prize) — Minimal Viable Implementation

### 12.1 Requirements

* `mode=agent_mesh` toggles event-driven behavior
* Worker logs events to `agent_events` table
* Processing UI displays event log live (poll `/v1/events/{jobId}`)

### 12.2 Event Types

* `job.created`
* `upload.complete`
* `speech.transcription.started` / `.done`
* `deck.render.started` / `.done`
* `gemini.deck.started` / `.done`
* `gemini.coach.started` / `.done`
* `voice.tts.started` / `.done`
* `job.done` / `job.error`

### 12.3 Stretch

* Replace DB log with Solace pub/sub if integration time permits.

---

## 13) Yellowcake Market Analysis Module (Prize) — Minimal Viable Implementation

### 13.1 Trigger

Button on Results page: “Run Market Analysis (Yellowcake)”

### 13.2 Inputs

* `companyName` required
* `website` optional
* use pitch summary extracted from deck + transcript

### 13.3 Output Requirements

* competitor list with short evidence bullets
* positioning suggestions
* pitch email template (investor or customer)

Keep output short and structured for demo.

---

## 14) DigitalOcean Deployment Requirements (Prize)

Minimum proof:

* DigitalOcean **Spaces** for uploads + voice mp3
* DigitalOcean **Droplet** (or App Platform) running:

  * FastAPI API server
  * Worker process
* Domain:

  * `pitchcoach.tech` → Next.js deployment
  * `api.pitchcoach.tech` → FastAPI

Optional:

* DigitalOcean Managed DB (Postgres)
* App Platform for web + api (if you want “all DO” story)

---

## 15) Data Retention & Cleanup

Policy:

* Raw media deleted after `DATA_RETENTION_HOURS` (default 12)
* Derived artifacts deleted after same window (or keep for 24h)

Implementation:

* Worker runs hourly cleanup:

  * find jobs older than retention
  * delete keys under `raw/...` and `derived/...`
  * mark job as cleaned

---

## 16) Step-by-Step Implementation Plan (Codex Tasks)

### Phase A — Project Setup (1–2 hours)

1. Create `web/` Next.js app (TS + Tailwind)
2. Create `backend/` FastAPI app
3. Create `worker/` python worker package
4. Add `.env.example` files
5. Add basic README with run commands

**Acceptance:** `/` and `/new` load; `GET /health` returns ok.

---

### Phase B — Jobs + Presigned Uploads (2–4 hours)

Backend:

1. Implement SQLite DB and jobs table
2. Implement `POST /v1/jobs/init`
3. Implement `POST /v1/uploads/presign` (Spaces PUT presign)
4. Implement `POST /v1/jobs` (finalize + queue)
5. Implement `GET /v1/jobs/{jobId}`

Web:

1. Implement sessionId generation in browser
2. On `/new`: call `/jobs/init`
3. Call `/uploads/presign` for deck and media
4. PUT upload directly to Spaces
5. Call `/jobs` to queue
6. Route to `/job/[jobId]`

**Acceptance:** Upload works end-to-end and job enters queued state.

---

### Phase C — Worker Skeleton + Media Fetch + ffmpeg (2–4 hours)

Worker:

1. Poll queued jobs
2. Download objects from Spaces
3. If video: extract wav via ffmpeg
4. Update job progress and status

**Acceptance:** Worker moves job from queued → processing and completes dummy result.

---

### Phase D — ElevenLabs Scribe v2 STT + Transcript UI (3–6 hours)

Worker:

1. Integrate ElevenLabs STT (Scribe v2)
2. Produce transcript segments with timestamps
3. Save partial result JSON to job (or results table)

Web:

1. Results page fetches result JSON
2. Render transcript list; click-to-seek supported (video) or jump in audio player

**Acceptance:** transcript appears and is timestamped.

---

### Phase E — Metrics + Timeline Events (2–4 hours)

Worker:

1. Compute WPM, fillerCount, filler spikes, pace events, pauses
2. Build 8–15 events with tMs + type + title + suggestion

Web:

1. Render timeline bar markers
2. Clicking marker seeks playback + highlights transcript segment + shows detail

**Acceptance:** timeline feels interactive and useful.

---

### Phase F — Deck Processing + Gemini Deck Critique (4–8 hours)

Worker:

1. Render PDF slides to images (cap at 15)
2. Call Gemini deck critique prompt
3. Store per-slide feedback + top fixes

Web:

1. Deck feedback panel
2. Show top fixes and per-slide accordion

**Acceptance:** deck critique looks coherent and structured.

---

### Phase G — Gemini Coaching Synthesis + Scores + Voice Scripts (3–6 hours)

Worker:

1. Call Gemini synthesis prompt using transcript + metrics + deck fixes
2. Produce scores + refined events + two voice scripts

Web:

1. Show scores in summary
2. Ensure events list updated and consistent

**Acceptance:** narrative feedback reads well and aligns with events.

---

### Phase H — ElevenLabs TTS Personas + Elevator Music (2–5 hours)

Worker:

1. TTS generate mp3 for two personas
2. Upload to Spaces
3. Save presigned GET URLs into result JSON

Web:

1. Implement VoiceCoachPlayer (orb)
2. Persona toggle (encouraging/investor)
3. Processing page plays local elevator loop

**Acceptance:** Judges hear voices; processing feels alive.

---

### Phase I — Deploy on DigitalOcean + .tech Domain (2–6 hours)

1. Deploy FastAPI + worker to DO Droplet (systemd services)
2. Configure Spaces + env vars
3. Deploy Next.js (DO or Vercel)
4. Point `.tech` domain
5. Configure CORS allowlist

**Acceptance:** Full flow works on public HTTPS URL.

---

### Phase J — Prize Multipliers (Optional)

**Yellowcake**

* Implement `/market` endpoints + UI tab + results

**Solace Agent Mesh**

* Implement event log table + `/events/{jobId}`
* Show event log on processing screen

**Acceptance:** Demo mode shows these clearly even if minimal.

---

## 17) Acceptance Criteria (Final “We can demo” checklist)

* Next.js UI looks polished and stable
* PDF + video OR audio upload works
* Async job progress updates reliably
* Transcript + timeline + deck critique visible
* Two ElevenLabs voice personas playable
* Hosted on DigitalOcean and uses Spaces
* pitchcoach.tech domain live
* Optional: market analysis + agent mesh event log

---

If you want, I can also generate the **starter code skeleton** (folder structure + FastAPI endpoints + worker polling loop + Next.js pages/components) directly from this spec so Codex can start implementing immediately.
