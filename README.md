# Amplify LMS: Oral Response to Transcript System

## 1. Project Overview

Amplify LMS is a research/demo learning management system focused on oral response assignments. Instructors create assignments with spoken-response prompts, share a public assignment link with students, and review the submitted transcript text after students record their answers.

The core workflow is:

1. An instructor logs in and creates an assignment.
2. The instructor adds one or more oral response questions.
3. The instructor publishes the assignment and shares the generated student link.
4. A student opens the link, records an oral response, and waits for transcription.
5. The frontend sends the student audio to the backend transcription pipeline.
6. The backend sends the audio to OpenAI's transcription API.
7. The returned transcript is shown to the student and saved with the submitted response.
8. The instructor reviews the saved transcript in View Submissions.

Automatic grading exists as experimental development work, but it is not the primary focus of this README. The current documented system is the oral response to transcript workflow.

## Quick Start

For a fast local setup, run the backend first, then the frontend.

```bash
# Backend API
cd amplify-lms-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# Create .env with DATABASE_URL, OPENAI_API_KEY, SUPABASE_JWT_SECRET, FRONTEND_ORIGINS
uvicorn main:app --reload --port 8000
```

```bash
# Frontend app
cd amplify-lms-frontend
corepack enable
pnpm install
cp .env.example .env
# Add VITE_API_URL, VITE_FRONTEND_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
pnpm dev
```

Typical local URLs:

```text
Frontend: http://localhost:5173
Backend:  http://localhost:8000
Student assignment links: http://localhost:5173/student/{assignmentId}
```

## 2. Features

- Instructor login with Supabase Auth.
- Instructor-owned assignment creation.
- Short answer, multiple choice, and oral response question types.
- Oral response recording in the browser.
- Optional per-question and assignment-level timers.
- Backend transcription through OpenAI audio transcription.
- Public student assignment links.
- Student name and J-number collection.
- Transcript display before submission.
- Transcript storage as the primary oral response artifact.
- Instructor submission review with transcript viewing.
- Student transcript accuracy feedback after submission.

Current active behavior: transcripts are saved with submissions. Original audio recordings are not part of the default persisted submission artifact in the normal student workflow.

## 3. System Architecture

The system has three main parts:

- **Frontend:** React/Vite app for instructors and students.
- **Backend:** FastAPI service that manages assignments, submissions, instructor authorization, and transcription.
- **Supabase:** Auth provider for instructors and PostgreSQL database host.

Oral response to transcript workflow:

```text
Instructor
  -> Create oral assignment
  -> Publish assignment
  -> Share /student/{assignmentId}

Student
  -> Open assignment link
  -> Record oral response in browser
  -> Upload audio to FastAPI /api/transcribe
  -> Receive transcript from OpenAI transcription pipeline
  -> Submit transcript to FastAPI /responses/

Instructor
  -> Open View Submissions
  -> Review saved transcript text
```

Supporting service flow:

```text
React frontend
  -> FastAPI backend
  -> OpenAI transcription API
  -> FastAPI backend
  -> React frontend
  -> Supabase/Postgres response storage
```

## 4. Technology Stack

### Frontend

- React 18
- Vite
- TypeScript
- React Router
- Tailwind CSS
- Supabase JavaScript client
- Browser `MediaRecorder` API

### Backend

- FastAPI
- SQLModel / SQLAlchemy
- PostgreSQL through Supabase
- Supabase JWT validation
- OpenAI Python SDK
- Python multipart upload support

### External Services

- Supabase Auth
- Supabase Postgres
- OpenAI audio transcription API
- Vercel for frontend deployment
- Render for backend deployment

## 5. Repository Structure

This project currently uses separate frontend and backend directories.

Important frontend files:

```text
amplify-lms-frontend/
  docs/instructor-user-manual.md
  README.md
  src/config.ts
  src/supabaseClient.ts
  src/router.tsx
  src/pages/Login.tsx
  src/app/teacher/CreateAssignment.tsx
  src/app/teacher/ViewSubmissions.tsx
  src/app/student/TakeAssignment.tsx
  src/components/speech/AudioRecorder.tsx
  vercel.json
```

Important backend files:

```text
amplify-lms-backend/
  main.py
  db.py
  models.py
  schemas.py
  supabase_auth.py
  routes/assignments.py
  routes/responses.py
  routes/speech.py
  requirements.txt
  render.yaml
```

Key responsibilities:

- `CreateAssignment.tsx`: instructor assignment authoring and publishing.
- `TakeAssignment.tsx`: public student assignment workflow.
- `AudioRecorder.tsx`: browser audio capture and upload to transcription endpoint.
- `ViewSubmissions.tsx`: instructor review of submitted responses and transcripts.
- `routes/speech.py`: backend OpenAI transcription endpoint.
- `routes/assignments.py`: assignment creation, listing, retrieval, and ownership checks.
- `routes/responses.py`: student response submission and instructor response listing.
- `supabase_auth.py`: validates instructor Supabase access tokens.
- `models.py`: SQLModel database models for assignments, drafts, responses, and related records.

## 6. Installation Guide

### Prerequisites

- Node.js 18.17 or newer
- pnpm 9 or compatible package manager
- Python 3.10 or newer
- A Supabase project
- An OpenAI API key
- A PostgreSQL connection string, preferably from Supabase

### Frontend Setup

```bash
cd amplify-lms-frontend
corepack enable
pnpm install
cp .env.example .env
```

Edit `.env` with the frontend environment variables listed below.

Run the frontend locally:

```bash
pnpm dev
```

Build the frontend:

```bash
pnpm build
```

### Backend Setup

From the sibling backend repository:

```bash
cd ../amplify-lms-backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create a backend `.env` file and add the backend environment variables listed below.

Run the backend locally:

```bash
uvicorn main:app --reload --port 8000
```

For local frontend development, set `VITE_API_URL` to the backend URL, for example:

```text
VITE_API_URL=http://localhost:8000
```

## 7. Environment Variables

### Frontend `.env`

Required:

```text
VITE_API_URL=http://localhost:8000
VITE_FRONTEND_URL=http://localhost:5173
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Notes:

- `VITE_API_URL` points to the FastAPI backend.
- `VITE_FRONTEND_URL` is used to build student assignment links.
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are required for instructor login through Supabase Auth.
- Vite exposes `VITE_*` values to browser code. Do not place service role keys or OpenAI keys in frontend variables.

### Backend `.env`

Required:

```text
DATABASE_URL=postgresql+psycopg2://...
OPENAI_API_KEY=sk-...
SUPABASE_JWT_SECRET=your-supabase-jwt-secret
FRONTEND_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
```

Optional:

```text
OPENAI_WHISPER_MODEL=whisper-1
OPENAI_WHISPER=whisper-1
WHISPER_MODEL=whisper-1
FRONTEND_ORIGIN=https://your-frontend.vercel.app
FRONTEND_ORIGIN_REGEX=
DEMO_MODE=true
```

Optional storage-related variables for future audio persistence work:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_AUDIO_BUCKET=response-audio
SUPABASE_AUDIO_FOLDER=responses
SUPABASE_AUDIO_BUCKET_PUBLIC=false
```

The current active transcript workflow does not rely on persisted original audio. Storage configuration may be useful if audio persistence is added to the submission flow later.

## 8. Supabase Setup

1. Create a Supabase project.
2. Enable email/password authentication.
3. Create or invite instructor users in Supabase Auth.
4. Copy the project URL and anon key into the frontend `.env`.
5. Copy the Supabase JWT secret into the backend `.env` as `SUPABASE_JWT_SECRET`.
6. Create a PostgreSQL connection string for the backend `DATABASE_URL`.
7. Use SSL for hosted Supabase Postgres connections.
8. Start the backend so SQLModel can create or update required tables.

Recommended Supabase database connection format for hosted deployment:

```text
postgresql+psycopg2://postgres.<project-id>:<password>@<region>.pooler.supabase.com:6543/postgres?sslmode=require
```

The backend stores instructor-created assignments with an `owner_id` that matches the Supabase user ID from the instructor's JWT. This allows the backend to return only the assignments and submissions owned by the logged-in instructor.

## 9. OpenAI Whisper Setup

The backend handles transcription. The OpenAI API key must stay on the server.

1. Create an OpenAI API key.
2. Add it to the backend environment as `OPENAI_API_KEY`.
3. Optionally set a transcription model with one of:
   - `OPENAI_WHISPER_MODEL`
   - `OPENAI_WHISPER`
   - `WHISPER_MODEL`
4. If no model variable is set, the backend falls back to `whisper-1`.

Supported upload extensions in the backend transcription endpoint include:

- `.webm`
- `.wav`
- `.mp3`
- `.m4a`
- `.m4v`
- `.mp4`

The student browser usually records `audio/webm`, then sends it to:

```text
POST /api/transcribe
```

The backend returns:

```json
{
  "transcription": "transcribed response text",
  "status": "success"
}
```

## 10. Deployment

### Vercel Frontend

1. Create a Vercel project for `amplify-lms-frontend`.
2. Set the build command:

```bash
pnpm build
```

3. Set the output directory:

```text
dist
```

4. Add frontend environment variables in Vercel:

```text
VITE_API_URL=https://your-render-backend.onrender.com
VITE_FRONTEND_URL=https://your-frontend.vercel.app
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

5. The included `vercel.json` rewrites routes to the Vite app so direct links like `/student/{assignmentId}` work.

### Render Backend

1. Create a Render web service for `amplify-lms-backend`.
2. Use the Python environment.
3. Use the build command from `render.yaml`:

```bash
pip install -r requirements.txt
```

4. Use the start command from `render.yaml`:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

5. Add backend environment variables in Render:

```text
DATABASE_URL=...
OPENAI_API_KEY=...
SUPABASE_JWT_SECRET=...
FRONTEND_ORIGINS=https://your-frontend.vercel.app,http://localhost:5173
```

6. Confirm the backend health endpoint returns:

```text
GET /health
```

### Supabase Database/Auth

Supabase provides:

- Instructor authentication.
- PostgreSQL database hosting.
- JWT secret used by the backend to validate instructor tokens.

The backend does not use Supabase Row Level Security for the main assignment APIs. Instead, it validates the Supabase JWT and applies ownership checks in FastAPI routes.

## 11. Instructor Access Model

Instructor access is controlled by Supabase Auth account provisioning.

Current model:

- Instructors log in with Supabase email/password credentials.
- The frontend stores the Supabase access token and routes the user to the teacher dashboard.
- Authenticated frontend requests include the Supabase token as a Bearer token.
- The backend validates the token using `SUPABASE_JWT_SECRET`.
- Assignments are saved with the instructor's Supabase user ID as `owner_id`.
- Instructors can list and view submissions only for assignments they own.

Important limitation:

- There is no in-app instructor approval queue or selected-instructor allowlist screen.
- Selected instructors should be created, invited, approved, or disabled by the project administrator in Supabase Auth.

## 12. Cost / API Notes

- Each recorded or uploaded oral response can trigger an OpenAI transcription request.
- Transcription cost depends on the selected OpenAI model, audio duration, and current OpenAI pricing.
- Do not hard-code pricing assumptions in research documentation; verify current pricing in the OpenAI dashboard or official pricing page.
- Keep `OPENAI_API_KEY` only on the backend.
- Monitor OpenAI usage and rate limits during pilots or classroom demos.
- Backend hosting, Supabase database usage, and Vercel hosting may also incur costs depending on plan limits.

## 13. Current Limitations

- Transcript text is the primary saved oral-response artifact.
- Original audio recordings are not part of the default saved artifact in the current active student submission workflow.
- Transcript CSV or bulk export is not currently available.
- Students use public assignment links and do not authenticate.
- Instructor account approval is handled in Supabase Auth, not through an in-app approval dashboard.
- Browser microphone permission is required for recording.
- Transcription depends on backend availability and OpenAI API availability.
- The frontend `.env.example` currently lists the API and frontend URLs; local setup also requires Supabase frontend variables.
- Some older/demo student pages exist in the repository but the primary oral assignment flow is `/student/{assignmentId}`.
- Automatic grading exists in development and should be treated as experimental future work for this README's scope.

## 14. Future Work

Potential next improvements:

- Persist original student audio recordings alongside transcripts.
- Add transcript CSV or JSON export for instructors.
- Add an in-app instructor approval or allowlist workflow.
- Add student authentication for private assignment access.
- Add transcript correction/edit history for research review.
- Add clearer submission status and retry handling for failed transcriptions.
- Add consent and retention controls for student audio data.
- Move automatic grading into a clearly separated, instructor-approved workflow if used in production.
- Add automated tests for the oral response submission and transcription pipeline.
