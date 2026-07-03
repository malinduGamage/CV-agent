# CV Agent — Agentic Resume Tailoring System

An AI-powered web application that automatically tailors your resume to any job description using a **multi-agent LangGraph workflow** powered by Google Gemini. It extracts relevant experiences from your master career profile, rephrases bullet points for ATS alignment, drafts a personalized cover letter, and produces a print-ready PDF in the MCS Resume Template format.

---

## ✨ Features

- **Multi-Agent Pipeline** — A LangGraph graph orchestrates four specialized AI agents: Researcher → Filter → Tailor → Critic. The Critic re-routes back to Tailor up to 3 times until the ATS alignment score reaches ≥ 85%.
- **Resume Ingestion** — Paste your raw resume text; the AI parser automatically structures it into your master profile (work experience, projects, education, contact info).
- **Tailored CV Generator** — Provide a job title and description, and the agent workflow selects your most relevant experiences, rewrites bullet points with job-specific keywords, and drafts a cover letter.


---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 16 Frontend                  │
│  Dashboard · Profile Editor · Application Workspace     │
│  (Supabase Auth · ResumePrintView · ATS Analyzer)       │
└───────────────────────┬─────────────────────────────────┘
                        │ REST API (JWT Bearer Token)
┌───────────────────────▼─────────────────────────────────┐
│                   FastAPI Backend                        │
│  /api/profile · /api/ingest-resume · /api/generate-cv   │
│  /api/applications · /api/applications/{id}             │
└───────────────────────┬─────────────────────────────────┘
                        │ SQLAlchemy ORM
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
  Supabase DB     LangGraph Agent    Jinja2 Template
  (PostgreSQL)    Workflow           Renderer
                  │
         ┌────────▼────────┐
         │  Gemini Flash   │
         │   (via LangChain│
         │   Google GenAI) │
         └─────────────────┘
```

### LangGraph Agent Workflow

```
Job Title + Description
        │
        ▼
 ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
 │  RESEARCHER │────▶│   FILTER    │────▶│   TAILOR    │
 │             │     │             │     │             │
 │ Extracts:   │     │ Selects top │     │ Rewrites    │
 │ - Keywords  │     │ relevant    │     │ bullets &   │
 │ - Skills    │     │ experiences │     │ drafts cover│
 │ - Duties    │     │ & projects  │     │ letter      │
 └─────────────┘     └─────────────┘     └──────┬──────┘
                                                 │
                                         ┌───────▼──────┐
                                         │    CRITIC    │
                                         │              │
                                         │ Score ≥ 85?  │◀──── loop (max 3)
                                         │   → END      │
                                         │ Score < 85?  │────▶ TAILOR
                                         └──────────────┘
```

---

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 16, TypeScript, Tailwind CSS |
| **Backend** | FastAPI, Python 3.12+ |
| **AI Orchestration** | LangGraph, LangChain Google GenAI |
| **LLM** | Google Gemini Flash |
| **Database ORM** | SQLAlchemy 2.0 |
| **Database** | Supabase (PostgreSQL) / SQLite (local dev fallback) |
| **Auth** | Supabase Auth (JWT) |
| **Template Engine** | Jinja2 |
| **Deployment** | Render (backend), Vercel (frontend) |

---

## 📁 Project Structure

```
cv-agent/
├── backend/
│   ├── app/
│   │   ├── agents/
│   │   │   ├── graph.py        # LangGraph workflow definition
│   │   │   ├── nodes.py        # Agent node implementations (Research/Filter/Tailor/Critic)
│   │   │   ├── state.py        # Shared agent state schema
│   │   │   └── utils.py        # JSON extraction helpers
│   │   ├── database/
│   │   │   ├── connection.py   # SQLAlchemy engine + Supabase connection
│   │   │   └── models.py       # ORM models (User, MasterProfile, Application, etc.)
│   │   ├── router/
│   │   │   ├── auth.py         # JWT middleware + user sync
│   │   │   └── endpoints.py    # All API route handlers
│   │   ├── main.py             # FastAPI app entry point
│   │   └── schemas.py          # Pydantic request/response schemas
│   ├── .env.example            # Environment variable template
│   └── requirements.txt
│
└── frontend/
    └── src/
        ├── app/
        │   ├── login/           # Auth page (sign in / sign up)
        │   ├── dashboard/       # Stats, application card grid, ingestion modal
        │   ├── profile/         # Master profile tabbed editor
        │   └── applications/[id]/  # Split-pane ATS workspace + PDF download
        ├── components/
        │   ├── AuthProvider.tsx     # Supabase auth context
        │   ├── DashboardLayout.tsx  # Shared navigation shell
        │   └── ResumePrintView.tsx  # MCS-styled printable resume component
        └── utils/
            └── api.ts              # Authenticated API client
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites

- Python 3.12+
- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key for Gemini

### 1. Clone the Repository

```bash
git clone https://github.com/malinduGamage/CV-agent.git
cd CV-agent
```

### 2. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials
```

**backend/.env** — required keys:
```env
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
GEMINI_API_KEY=your-gemini-api-key
```

> **Local dev fallback:** If `DATABASE_URL` is not set, the backend automatically falls back to a local SQLite file (`cv_agent.db`).

Start the backend:
```bash
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the frontend:
```bash
npm run dev
```

Frontend available at: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Deployment

### Backend — Render

| Field | Value |
|---|---|
| **Root Directory** | `backend` |
| **Build Command** | `pip install -r requirements.txt && ln -s . backend` |
| **Start Command** | `python -m uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT` |

Set the following environment variables in the Render dashboard:
- `DATABASE_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_JWT_SECRET`
- `GEMINI_API_KEY`

### Frontend — Vercel

Connect your GitHub repository to Vercel. Set the root directory to `frontend` and configure these environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL` ← your Render backend URL (e.g. `https://cv-agent-xxxx.onrender.com`)

---

## 📋 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Get the authenticated user's master profile |
| `PUT` | `/api/profile` | Update the master profile (experiences, projects, education) |
| `POST` | `/api/ingest-resume` | Parse raw resume text and auto-populate the master profile |
| `POST` | `/api/generate-cv` | Run the LangGraph agent workflow to tailor a CV for a job |
| `GET` | `/api/applications` | List all tailored applications with ATS scores |
| `GET` | `/api/applications/{id}` | Get full details, rendered CV, and ATS keyword data for an application |

All endpoints require an `Authorization: Bearer <supabase_jwt>` header.

---

## 🖥️ Usage Guide

### 1. Set Up Your Master Profile
- Go to **Profile** and fill in your **Full Name**, **Email**, contact details, work experience, projects, and education.
- Alternatively, click **Ingest Profile** on the dashboard and paste your raw resume text — the AI parser will auto-populate everything.

### 2. Tailor a CV for a Job
- On the **Dashboard**, click **Tailor New CV**.
- Enter the target job title and paste the full job description.
- The 4-agent workflow runs automatically (~30–60 seconds):
  1. **Researcher** extracts required skills and keywords.
  2. **Filter** selects your most relevant experiences.
  3. **Tailor** rewrites achievements and drafts a cover letter.
  4. **Critic** scores the match; loops back up to 3 times if score < 85%.

### 3. Review & Download
- Open the generated application to see the **Split-Pane Workspace**:
  - **Left:** ATS match score gauge, keyword gap checklist, agent feedback.
  - **Right:** Tailored CV preview (MCS template), cover letter, raw JSON.
- Click **Download PDF** to save a print-ready resume.

---
