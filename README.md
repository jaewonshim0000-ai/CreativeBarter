# 🎨 Nuvra

**창작자를 위한 하이퍼로컬 기술 및 자원 바터링 네트워크**

A hyperlocal skill & resource bartering platform for creatives — artists, musicians, writers, and indie filmmakers can exchange skills and resources within their local community.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                     │
│         React + TypeScript + Tailwind CSS                │
│              Port: 3000 (Vercel)                         │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API / WebSocket
┌─────────────────▼───────────────────────────────────────┐
│                  Backend (Express.js)                     │
│          Node.js + TypeScript + Socket.IO                │
│            Port: 4000 (Render/Fly.io)                    │
└────────┬────────────────────────────┬───────────────────┘
         │                            │ HTTP
┌────────▼────────┐     ┌────────────▼────────────────────┐
│   PostgreSQL    │     │       AI/ML Service (FastAPI)     │
│   + PostGIS     │     │     Python + LLM API Integration │
│   Port: 5432    │     │           Port: 8000              │
└─────────────────┘     └──────────────────────────────────┘
```

## Project Structure

```
creative-barter-network/
├── frontend/          # Next.js + React + TypeScript + Tailwind
├── backend/           # Express.js + TypeScript + Socket.IO
├── ai-service/        # Python FastAPI + LLM integration
├── database/          # SQL schema & migrations
└── README.md          # This file
```

## Quick Start

### Prerequisites
- Node.js >= 18
- Python >= 3.10
- PostgreSQL >= 15 (with PostGIS extension)
- npm or yarn

### 1. Database Setup
```bash
# Create the database
createdb creative_barter_network

# Enable PostGIS
psql -d creative_barter_network -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run schema
psql -d creative_barter_network -f database/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # Edit with your DB credentials
npm install
npm run dev             # Starts on http://localhost:4000
```

### 3. AI Service
```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # Add your LLM API key
uvicorn main:app --reload --port 8000
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev             # Starts on http://localhost:3000
```

## Tech Stack

| Layer       | Technology                                    |
|-------------|-----------------------------------------------|
| Frontend    | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend     | Express.js, TypeScript, Socket.IO, Prisma ORM |
| Database    | PostgreSQL 15 + PostGIS                       |
| AI/ML       | Python FastAPI, OpenAI/Gemini API             |
| Auth        | JWT (jsonwebtoken + bcrypt)                   |
| Deployment  | Vercel (FE), Render/Fly.io (BE), GitHub Actions |

## Key Features

- **User Profiles** — Skills, resources, portfolio, location
- **Project Board** — Post projects with needed/offered skills
- **Smart Matching** — AI-powered skill/resource matching
- **Real-time Chat** — Socket.IO-based messaging
- **Reviews & Ratings** — Build trust through peer feedback
- **Map View** — PostGIS-powered hyperlocal discovery

## Environment Variables

See `.env.example` files in each service directory for required configuration.

## License

MIT
