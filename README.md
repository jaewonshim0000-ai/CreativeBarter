# ✦ Nuvra

**Your Skill Is Currency.**

Nuvra is a full-stack hyperlocal skill bartering platform where creatives — artists, musicians, filmmakers, developers, and designers — trade skills and resources without money. Built for Raven Hacks VTL 2026 (Social Impact Track).

> A teenager who edits stunning videos needs album art. Another student across town who can illustrate needs someone to edit their short film. The skills exist. The demand exists. Nuvra makes the connection.

---

## ✨ Features

### Core Platform
- **User Profiles** — Skills, portfolio links, bio, location, and specialty
- **Project Board** — Post projects with needed and offered skills/resources
- **Real-Time Messaging** — Socket.IO powered chat between matched collaborators
- **Explore & Search** — Find creatives by skill, specialty, or keyword

### AI-Powered
- **Portfolio Scanner** — Paste a GitHub, Behance, or SoundCloud link. Claude analyzes your work and auto-detects skills with proficiency ratings (1–10 scale)
- **Smart Match Scoring** — AI evaluates compatibility between project needs and user skills, ranking potential collaborators
- **Fuzzy Circular Barter Discovery** — Graph algorithm + AI semantic matching finds multi-party exchange loops (A → B → C → A), even when skill names don't match exactly ("2D Animation" connects to "Animation" with proportional confidence)

### Economy
- **Trade Credits** — When exchanges aren't perfectly equal, credits bridge the gap. Every user starts with 100 credits
- **Negotiation System** — Propose, counter-offer (including flipping payment direction), accept, or reject credit offers on any match
- **Transaction History** — Full ledger of all credit movements with running balance

### Trust & Community
- **Reputation System** — Star ratings (1–5) with written reviews, rating distribution charts, and review history
- **Community Impact Map** — Public interactive dark-themed map showing opted-in creatives worldwide with clickable pins, live platform stats, top skills, and recent trade feed
- **Privacy Controls** — Opt-in map visibility with browser geolocation

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Frontend (Next.js 14)                │
│           React 18 · TypeScript · Tailwind CSS       │
│         Leaflet.js · Socket.IO Client                │
│                    ↕ Vercel                           │
└─────────────────────┬────────────────────────────────┘
                      │ REST API / WebSocket
┌─────────────────────▼────────────────────────────────┐
│                 Backend (Express.js)                   │
│        TypeScript · Prisma 7 · Socket.IO · JWT       │
│                    ↕ Render                           │
└──────────┬──────────────────────────┬────────────────┘
           │                          │ HTTP
┌──────────▼──────────┐  ┌───────────▼─────────────────┐
│   Supabase          │  │     AI Service (FastAPI)     │
│   PostgreSQL        │  │  Python · Anthropic Claude   │
│   + PostGIS         │  │  Fuzzy matching · NLP        │
└─────────────────────┘  │         ↕ Render             │
                         └─────────────────────────────┘
```

---

## 📁 Project Structure

```
nuvra/
├── frontend/                    # Next.js 14 App Router
│   ├── src/
│   │   ├── app/                 # Pages
│   │   │   ├── page.tsx         # Landing page (dark editorial design)
│   │   │   ├── community/       # Public impact map + stats
│   │   │   ├── projects/        # CRUD + AI analysis
│   │   │   ├── matches/         # Match proposals + credit negotiation
│   │   │   ├── messages/        # Real-time chat
│   │   │   ├── circular-barters/# Multi-party exchange discovery
│   │   │   ├── wallet/          # Credit balance + transaction history
│   │   │   ├── reviews/         # Reputation system
│   │   │   ├── explore/         # User search
│   │   │   └── profile/         # Profile edit + AI portfolio scanner
│   │   ├── components/          # Navbar, ScrollReveal, Reveal
│   │   ├── hooks/               # useAuth
│   │   ├── lib/                 # API client
│   │   └── types/               # TypeScript interfaces
│   └── public/                  # logo.svg, favicon.svg
│
├── backend/                     # Express.js API
│   ├── src/
│   │   ├── controllers/         # Auth, user, project, match, message,
│   │   │                        # review, barter-chain, credits, community
│   │   ├── services/            # Business logic for each domain
│   │   ├── routes/              # Route definitions
│   │   ├── middleware/          # Auth (JWT), error handling
│   │   └── utils/               # Prisma client setup
│   └── prisma/
│       ├── schema.prisma        # Prisma 7 schema (14 models)
│       └── prisma.config.ts     # Prisma 7 adapter config
│
├── ai-service/                  # Python FastAPI
│   ├── main.py                  # All endpoints + circular barter algorithm
│   └── requirements.txt         # anthropic, fastapi, uvicorn, httpx
│
└── database/
    ├── schema.sql               # Full PostgreSQL schema
    ├── circular-barter-migration.sql
    └── credits-migration.sql
```

---

## 🧠 How the Circular Barter Algorithm Works

The core innovation is **AI-powered fuzzy matching** for multi-party skill exchanges.

**Problem:** In traditional barter, you need a "double coincidence of wants" — person A needs what B has *and* B needs what A has. This rarely happens.

**Solution:** Find cycles in a directed skill graph. If A → B → C → A exists (each person has something the next person wants), all three can trade simultaneously.

**Our approach:**

1. **Collect** all unique skills users have and want
2. **AI Similarity Matrix** — Send all skill pairs to Claude, which scores semantic similarity (0.0–1.0). "2D Animation" scores ~0.85 against "Animation", "Illustration" scores ~0.6 against "Graphic Design"
3. **Build weighted graph** — Edge from user A to user B if A has a skill matching B's want with similarity ≥ 0.4
4. **DFS cycle detection** — Find all simple cycles of length 3–5
5. **Score & rank** — Confidence = average similarity × 100, with a slight penalty for longer chains

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- Python ≥ 3.10
- A Supabase project (free tier works)
- An Anthropic API key

### 1. Database

Run these in **Supabase SQL Editor** in order:

```sql
-- 1. Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Run database/schema.sql (copy-paste the full file)

-- 3. Run database/circular-barter-migration.sql

-- 4. Run database/credits-migration.sql

-- 5. Add community map column
ALTER TABLE users ADD COLUMN IF NOT EXISTS show_on_map BOOLEAN DEFAULT FALSE NOT NULL;
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your Supabase connection strings, JWT secret, etc.

npm install
npx prisma generate
npm run dev                # http://localhost:4000
```

### 3. AI Service

```bash
cd ai-service
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your ANTHROPIC_API_KEY

uvicorn main:app --reload --port 8000
```

### 4. Frontend

```bash
cd frontend
cp .env.example .env.local
# Edit: NEXT_PUBLIC_API_URL=http://localhost:4000

npm install
npm run dev                # http://localhost:3000
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Description |
|---|---|
| `DATABASE_URL` | Supabase transaction pooler (port 6543) |
| `DIRECT_URL` | Supabase session pooler (port 5432) |
| `JWT_SECRET` | Random string for signing tokens |
| `JWT_EXPIRES_IN` | Token expiry (e.g., `7d`) |
| `AI_SERVICE_URL` | AI service URL (e.g., `http://localhost:8000`) |
| `FRONTEND_URL` | Frontend URL for CORS (no trailing slash) |

### AI Service (`ai-service/.env`)
| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Claude API key |
| `CLAUDE_MODEL` | Model to use (e.g., `claude-sonnet-4-20250514`) |
| `BACKEND_URL` | Backend URL for callbacks |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL |
| `NEXT_PUBLIC_SOCKET_URL` | Backend WebSocket URL (same as API) |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Leaflet.js, Socket.IO Client |
| Backend | Express.js, TypeScript, Prisma 7, Socket.IO, JWT, bcrypt |
| AI/ML | Python FastAPI, Anthropic Claude API, DFS graph algorithm |
| Database | PostgreSQL + PostGIS (Supabase) |
| Deployment | Vercel (frontend), Render (backend + AI service) |

---

## 🌐 Deployment

**Frontend** → [Vercel](https://vercel.com) — auto-deploys from `main` branch

**Backend** → [Render](https://render.com) — Web Service
- Build: `npm install --include=dev && npx prisma generate && npm run build`
- Start: `node dist/index.js`

**AI Service** → [Render](https://render.com) — Web Service
- Environment: Python 3
- Set `PYTHON_VERSION=3.11.11` in Render env vars
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 🏆 Built For

**Raven Hacks VTL 2026** — A student-led virtual hackathon by Univa Dev for participants aged 13–18. Social Impact track.

---

## 📄 License

MIT
