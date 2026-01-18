# PitchCoach

PitchCoach is an AI-powered web application that provides actionable feedback on presentation decks and pitch videos. Users upload a PDF presentation and record or upload a short pitch video. The system performs multimodal analysis of deck content and speech delivery, then produces timestamped coaching insights and optional voice feedback.

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Functional Features](#functional-features)
4. [Non-Functional Requirements](#non-functional-requirements)
5. [User Flow](#user-flow)
6. [Integrations](#integrations)
7. [Testing](#testing)
8. [Deployment](#deployment)

---

## Overview

PitchCoach helps users quickly improve their presentation skills by analyzing both content and delivery:

- **Deck analysis**: structure, clarity, visual communication, and suggested improvements
- **Pitch analysis**: speech clarity, pacing, filler detection, and timestamped highlights
- **Dashboard**: video playback with overlay markers, transcript panel, and actionable summary
- **Voice feedback**: optional TTS coaching clips for key fixes

---

## System Architecture

**Frontend (React + Tailwind CSS)**

- Upload PDF and record/upload video
- Display analysis progress and results dashboard
- Render timeline markers on video and transcript

**Backend (FastAPI or Node.js)**

- Generates presigned URLs for file uploads to DigitalOcean Spaces
- Manages async analysis jobs
- Calls Gemini API for deck critique
- Calls ElevenLabs API for transcription and TTS

**Storage (DigitalOcean Spaces)**

- Temporary storage for uploaded media
- Stores derived JSON results

**Async Job Processing**

- Background worker handles transcription, deck analysis, and TTS generation
- Updates job state and persists results

---

## Functional Features

- **Deck Upload & Analysis**: PDF required, per-slide feedback, summary, suggested fixes
- **Pitch Recording & Analysis**: STT transcription, filler detection, pacing metrics, timestamped highlights
- **Integrated Dashboard**: Video player with timeline, transcript, and action items
- **Voice Feedback (optional)**: Short coaching clips using ElevenLabs TTS
- **Session History (optional)**: Derived results stored locally or in DB

---

## Non-Functional Requirements

- Analysis completes within ~2 minutes for 2–5 minute videos
- Async job handling prevents frontend timeouts
- HTTPS and presigned uploads for security
- Raw media deleted automatically after processing
- Responsive and mobile-friendly UI

---

## User Flow

1. Landing page → disclaimer → start new pitch
2. Upload PDF → record/upload video → analyze
3. Dashboard displays video with timeline markers, transcript, ratings, and action items
4. Optional voice coaching playback
5. Optional session comparison if results are stored

---

## Integrations

- **Gemini API**: deck critique
- **ElevenLabs**: Scribe v2 for transcription, TTS for coaching
- **DigitalOcean**: Spaces for storage, optional Droplet/App Platform for backend

---

## Testing

- Unit tests for upload component, recorder, timeline, backend endpoints
- Integration tests for full workflow: upload → job → dashboard
- Manual testing with sample videos to validate timeline alignment and TTS playback

---

## Deployment

- Client-side React app and backend deployed on DigitalOcean
- Presigned uploads handle large media reliably
- Static hosting compatible for frontend

## Running the app

To run the app,

```bash
cd code && npm run dev
```
