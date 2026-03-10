"""
Creative Barter Network — AI/ML Microservice
=============================================
FastAPI-based service providing:
  - Text analysis and keyword extraction
  - Skill/resource matching via Anthropic Claude API
  - Semantic similarity scoring between users and projects
"""

import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import anthropic

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

# Anthropic client — reads ANTHROPIC_API_KEY from environment automatically
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-20250514")

client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY) if ANTHROPIC_API_KEY else None


# ============================================================
# Request/Response Models
# ============================================================

class TextAnalysisRequest(BaseModel):
    text: str
    max_keywords: int = 10


class TextAnalysisResponse(BaseModel):
    keywords: list[str]
    categories: list[str]
    summary: str


class MatchScoreRequest(BaseModel):
    project_id: str
    user_id: str
    project_description: Optional[str] = None
    project_required_skills: Optional[list[str]] = None
    user_bio: Optional[str] = None
    user_skills: Optional[list[str]] = None


class MatchScoreResponse(BaseModel):
    score: float
    reasoning: str
    matched_skills: list[str]


class RecommendationRequest(BaseModel):
    project_id: str
    project_description: Optional[str] = None
    project_required_skills: Optional[list[str]] = None
    candidate_profiles: Optional[list[dict]] = None


class RecommendationResponse(BaseModel):
    recommendations: list[dict]
    source: str


# ============================================================
# Claude API Helper
# ============================================================

def call_claude(system_prompt: str, user_prompt: str) -> str:
    """
    Call the Anthropic Claude API with the given prompts.
    Returns the text response or raises an error.
    """
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured. Set ANTHROPIC_API_KEY in environment."
        )

    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=500,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt}
            ],
        )

        # Extract text from the response content blocks
        return "".join(
            block.text for block in message.content if block.type == "text"
        )

    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Claude API rate limit reached. Try again shortly.")
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {str(e)}")


# ============================================================
# Endpoints
# ============================================================

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai-ml",
        "provider": "anthropic-claude",
        "llm_configured": client is not None,
    }


@app.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """
    Analyze text (user bio, project description) to extract
    keywords, categories, and a brief summary.
    """
    system_prompt = """You are a skill and resource analysis assistant for a creative collaboration platform.
Extract relevant keywords, categorize them, and provide a brief summary.
Respond ONLY with valid JSON, no markdown fences or extra text.
Use this exact format: {"keywords": [...], "categories": [...], "summary": "..."}
Focus on: creative skills, tools, software, equipment, artistic domains, and collaboration-relevant terms."""

    user_prompt = f"""Analyze this text and extract up to {request.max_keywords} relevant keywords for creative skill/resource matching:

"{request.text}"

Return JSON only."""

    try:
        result = call_claude(system_prompt, user_prompt)
        # Strip any markdown fences Claude might add
        clean = result.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        parsed = json.loads(clean)
        return TextAnalysisResponse(
            keywords=parsed.get("keywords", []),
            categories=parsed.get("categories", []),
            summary=parsed.get("summary", ""),
        )
    except (json.JSONDecodeError, HTTPException):
        # Fallback: simple keyword extraction without LLM
        words = request.text.lower().split()
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
    Calculate a match compatibility score (0-100) between a user and a project.
    Uses Claude for semantic matching when descriptions are available,
    falls back to rule-based skill overlap otherwise.
    """
    # If we have text descriptions, use Claude for semantic analysis
    if request.project_description and request.user_bio and client:
        system_prompt = """You are a matching algorithm for a creative collaboration platform.
Analyze how well a user's profile matches a project's needs.
Respond ONLY with valid JSON: {"score": 0-100, "reasoning": "...", "matched_skills": [...]}"""

        user_prompt = f"""Rate the match between this user and project:

PROJECT: {request.project_description}
Required skills: {', '.join(request.project_required_skills or [])}

USER BIO: {request.user_bio}
User skills: {', '.join(request.user_skills or [])}

Return JSON only."""

        try:
            result = call_claude(system_prompt, user_prompt)
            clean = result.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            parsed = json.loads(clean)
            return MatchScoreResponse(
                score=min(float(parsed.get("score", 50)), 100),
                reasoning=parsed.get("reasoning", ""),
                matched_skills=parsed.get("matched_skills", []),
            )
        except Exception:
            pass  # Fall through to rule-based matching

    # Rule-based fallback
    if request.project_required_skills and request.user_skills:
        required = set(s.lower() for s in request.project_required_skills)
        user = set(s.lower() for s in request.user_skills)
        overlap = required & user
        base_score = (len(overlap) / max(len(required), 1)) * 100

        return MatchScoreResponse(
            score=min(base_score, 100),
            reasoning=f"Matched {len(overlap)}/{len(required)} required skills",
            matched_skills=list(overlap),
        )

    return MatchScoreResponse(
        score=50.0,
        reasoning="Insufficient data for detailed scoring. Using default.",
        matched_skills=[],
    )


@app.post("/match/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """
    Get recommended users for a project.
    Scores each candidate by skill overlap, uses Claude for tiebreaking when available.
    """
    if not request.candidate_profiles:
        return RecommendationResponse(recommendations=[], source="fallback")

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

    scored_candidates.sort(key=lambda x: x["score"], reverse=True)

    return RecommendationResponse(
        recommendations=scored_candidates[:10],
        source="rule_based",
    )


# ============================================================
# Run with: uvicorn main:app --reload --port 8000
# ============================================================
