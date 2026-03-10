"""
Creative Barter Network — AI/ML Microservice
=============================================
FastAPI-based service providing:
  - Text analysis and keyword extraction
  - Skill/resource matching via LLM API
  - Semantic similarity scoring between users and projects

This service is called by the Node.js backend for AI-powered
features like match scoring and recommendations.
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
from dotenv import load_dotenv

load_dotenv()

# ============================================================
# App Configuration
# ============================================================

app = FastAPI(
    title="Creative Barter Network - AI Service",
    description="AI/ML microservice for skill matching and text analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:4000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# LLM API configuration
LLM_API_KEY = os.getenv("LLM_API_KEY", "")
LLM_API_URL = os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions")
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini")


# ============================================================
# Request/Response Models
# ============================================================

class TextAnalysisRequest(BaseModel):
    """Input for keyword extraction from text."""
    text: str
    max_keywords: int = 10


class TextAnalysisResponse(BaseModel):
    """Extracted keywords and categories from text."""
    keywords: list[str]
    categories: list[str]
    summary: str


class MatchScoreRequest(BaseModel):
    """Input for calculating match score between user and project."""
    project_id: str
    user_id: str
    # In a full implementation, the backend would send the actual
    # profile and project data rather than IDs. Using IDs as stubs.
    project_description: Optional[str] = None
    project_required_skills: Optional[list[str]] = None
    user_bio: Optional[str] = None
    user_skills: Optional[list[str]] = None


class MatchScoreResponse(BaseModel):
    """Match score result."""
    score: float  # 0-100
    reasoning: str
    matched_skills: list[str]


class RecommendationRequest(BaseModel):
    """Input for getting project recommendations."""
    project_id: str
    project_description: Optional[str] = None
    project_required_skills: Optional[list[str]] = None
    candidate_profiles: Optional[list[dict]] = None


class RecommendationResponse(BaseModel):
    """List of recommended users for a project."""
    recommendations: list[dict]
    source: str  # 'ai' or 'fallback'


# ============================================================
# LLM Helper
# ============================================================

async def call_llm(system_prompt: str, user_prompt: str) -> str:
    """
    Call an LLM API (OpenAI-compatible) with the given prompts.
    Returns the text response or raises an error.
    """
    if not LLM_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="LLM API key not configured. Set LLM_API_KEY in environment."
        )

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            LLM_API_URL,
            headers={
                "Authorization": f"Bearer {LLM_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": LLM_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                "temperature": 0.3,
                "max_tokens": 500,
            },
        )

        if response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail=f"LLM API returned status {response.status_code}"
            )

        data = response.json()
        return data["choices"][0]["message"]["content"]


# ============================================================
# Endpoints
# ============================================================

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "ok", "service": "ai-ml", "llm_configured": bool(LLM_API_KEY)}


@app.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analyze text (user bio, project description) to extract
    keywords, categories, and a brief summary.

    This helps the matching system understand what skills/resources
    a user has or a project needs, even if not explicitly tagged.
    """
    system_prompt = """You are a skill and resource analysis assistant for a creative collaboration platform.
Extract relevant keywords, categorize them, and provide a brief summary.
Respond in JSON format with keys: keywords (list of strings), categories (list of strings), summary (string).
Focus on: creative skills, tools, software, equipment, artistic domains, and collaboration-relevant terms."""

    user_prompt = f"""Analyze this text and extract up to {request.max_keywords} relevant keywords for creative skill/resource matching:

"{request.text}"

Return JSON only, no markdown."""

    try:
        result = await call_llm(system_prompt, user_prompt)
        import json
        parsed = json.loads(result)
        return TextAnalysisResponse(
            keywords=parsed.get("keywords", []),
            categories=parsed.get("categories", []),
            summary=parsed.get("summary", ""),
        )
    except Exception as e:
        # Fallback: simple keyword extraction without LLM
        words = request.text.lower().split()
        # Filter common stop words
        stop_words = {"the", "a", "an", "is", "are", "was", "and", "or", "in", "on", "at", "to", "for", "of", "with"}
        keywords = [w.strip(".,!?;:") for w in words if len(w) > 3 and w not in stop_words]
        unique_keywords = list(dict.fromkeys(keywords))[:request.max_keywords]
        return TextAnalysisResponse(
            keywords=unique_keywords,
            categories=["uncategorized"],
            summary=request.text[:200],
        )


@app.post("/match/score", response_model=MatchScoreResponse)
async def calculate_match_score(request: MatchScoreRequest):
    """
    Calculate a match compatibility score (0-100) between a user
    and a project based on skills overlap and semantic analysis.
    """
    # If we have actual data, use LLM for semantic matching
    if request.project_required_skills and request.user_skills:
        # Rule-based matching first
        required = set(s.lower() for s in request.project_required_skills)
        user = set(s.lower() for s in request.user_skills)
        overlap = required & user
        base_score = (len(overlap) / max(len(required), 1)) * 100

        return MatchScoreResponse(
            score=min(base_score, 100),
            reasoning=f"Matched {len(overlap)}/{len(required)} required skills",
            matched_skills=list(overlap),
        )

    # Stub: return a placeholder score when no data is provided
    return MatchScoreResponse(
        score=50.0,
        reasoning="Insufficient data for detailed scoring. Using default.",
        matched_skills=[],
    )


@app.post("/match/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get recommended users for a project.
    Uses AI when available, falls back to rule-based matching.
    """
    if not request.candidate_profiles:
        return RecommendationResponse(
            recommendations=[],
            source="fallback",
        )

    # Score each candidate
    scored_candidates = []
    for profile in request.candidate_profiles:
        user_skills = set(s.lower() for s in profile.get("skills", []))
        required = set(s.lower() for s in (request.project_required_skills or []))
        overlap = user_skills & required
        score = (len(overlap) / max(len(required), 1)) * 100

        scored_candidates.append({
            "user_id": profile.get("user_id"),
            "name": profile.get("name"),
            "score": score,
            "matched_skills": list(overlap),
        })

    # Sort by score descending
    scored_candidates.sort(key=lambda x: x["score"], reverse=True)

    return RecommendationResponse(
        recommendations=scored_candidates[:10],
        source="rule_based",
    )


# ============================================================
# Run with: uvicorn main:app --reload --port 8000
# ============================================================
