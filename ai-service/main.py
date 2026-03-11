"""
Creative Barter Network — AI/ML Microservice
=============================================
FastAPI-based service providing:
  - Text analysis and keyword extraction
  - Skill/resource matching via Anthropic Claude API
  - Semantic similarity scoring between users and projects
  - Portfolio analysis: extract skills from URLs and bios
"""

import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import anthropic
import httpx

load_dotenv()

# ============================================================
# App Configuration
# ============================================================

app = FastAPI(
    title="Creative Barter Network - AI Service",
    description="AI/ML microservice for skill matching, text analysis, and portfolio analysis",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("BACKEND_URL", "http://localhost:4000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Anthropic client
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


# ---- Portfolio Analysis Models ----

class PortfolioSkill(BaseModel):
    name: str
    proficiency_estimate: int  # 1-10
    category: str  # e.g. "software", "artistic_skill", "tool", "language"


class PortfolioAnalysisRequest(BaseModel):
    """Input for portfolio analysis."""
    urls: list[str] = []              # GitHub, Behance, SoundCloud, etc.
    bio: str = ""                      # Free-text bio
    existing_skills: list[str] = []    # Skills the user already listed (for context)


class PortfolioAnalysisResponse(BaseModel):
    """Structured output from portfolio analysis."""
    top_skills: list[PortfolioSkill]
    suggested_categories: list[str]    # e.g. ["web_dev", "music", "visual_arts"]
    tools_detected: list[str]          # e.g. ["Adobe Premiere", "React", "Logic Pro"]
    artistic_styles: list[str]         # e.g. ["minimalist", "abstract", "lo-fi"]
    summary: str                       # Brief profile summary
    urls_analyzed: list[str]           # Which URLs were successfully fetched
    urls_failed: list[str]             # Which URLs failed


# ============================================================
# Claude API Helper
# ============================================================

def call_claude(system_prompt: str, user_prompt: str, max_tokens: int = 1000) -> str:
    """Call Anthropic Claude API. Returns text response."""
    if not client:
        raise HTTPException(
            status_code=503,
            detail="Anthropic API key not configured. Set ANTHROPIC_API_KEY in environment."
        )

    try:
        message = client.messages.create(
            model=CLAUDE_MODEL,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        return "".join(
            block.text for block in message.content if block.type == "text"
        )
    except anthropic.AuthenticationError:
        raise HTTPException(status_code=401, detail="Invalid Anthropic API key.")
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="Claude API rate limit reached.")
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {str(e)}")


def parse_json_response(text: str) -> dict:
    """Safely parse JSON from Claude's response, stripping markdown fences."""
    clean = text.strip()
    clean = clean.removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    return json.loads(clean)


# ============================================================
# URL Fetching Helper
# ============================================================

async def fetch_url_content(url: str, max_chars: int = 5000) -> tuple[str, bool]:
    """
    Fetch text content of a URL for AI analysis.
    Returns (content, success). Limits to max_chars for token budget.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as http:
            response = await http.get(url, headers={
                "User-Agent": "CreativeBarter-Bot/1.0 (portfolio-analysis)"
            })
            response.raise_for_status()

            content_type = response.headers.get("content-type", "")

            if "text/html" in content_type or "application/json" in content_type:
                return response.text[:max_chars], True
            elif "text/" in content_type:
                return response.text[:max_chars], True
            else:
                return f"[Binary content at {url}, type: {content_type}]", True

    except httpx.TimeoutException:
        return f"Timeout fetching {url}", False
    except httpx.HTTPStatusError as e:
        return f"HTTP {e.response.status_code} from {url}", False
    except Exception as e:
        return f"Failed to fetch {url}: {str(e)}", False


def detect_platform(url: str) -> str:
    """Detect the platform from a URL for better analysis context."""
    platforms = {
        "github.com": "GitHub",
        "behance.net": "Behance",
        "soundcloud.com": "SoundCloud",
        "dribbble.com": "Dribbble",
        "linkedin.com": "LinkedIn",
        "youtube.com": "YouTube",
        "youtu.be": "YouTube",
        "vimeo.com": "Vimeo",
        "artstation.com": "ArtStation",
        "deviantart.com": "DeviantArt",
        "bandcamp.com": "Bandcamp",
        "spotify.com": "Spotify",
        "medium.com": "Medium",
        "codepen.io": "CodePen",
    }
    for domain, name in platforms.items():
        if domain in url.lower():
            return name
    return "website"


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


# ---- Text Analysis ----

@app.post("/analyze-text", response_model=TextAnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """Extract keywords, categories, and summary from text."""
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
        parsed = parse_json_response(result)
        return TextAnalysisResponse(
            keywords=parsed.get("keywords", []),
            categories=parsed.get("categories", []),
            summary=parsed.get("summary", ""),
        )
    except (json.JSONDecodeError, HTTPException):
        words = request.text.lower().split()
        stop_words = {"the", "a", "an", "is", "are", "was", "and", "or", "in", "on", "at", "to", "for", "of", "with"}
        keywords = [w.strip(".,!?;:") for w in words if len(w) > 3 and w not in stop_words]
        unique_keywords = list(dict.fromkeys(keywords))[:request.max_keywords]
        return TextAnalysisResponse(
            keywords=unique_keywords, categories=["uncategorized"], summary=request.text[:200]
        )


# ---- Portfolio Analysis ----

@app.post("/analyze-portfolio", response_model=PortfolioAnalysisResponse)
async def analyze_portfolio(request: PortfolioAnalysisRequest):
    """
    Analyze a user's portfolio URLs and bio to extract:
    - Professional creative skills with proficiency estimates (1-10)
    - Tools and software detected
    - Artistic styles
    - Suggested platform categories
    """
    if not request.urls and not request.bio:
        raise HTTPException(status_code=400, detail="Provide at least one URL or a bio.")

    # Step 1: Fetch URL contents
    url_contents: dict[str, str] = {}
    urls_analyzed: list[str] = []
    urls_failed: list[str] = []

    for url in request.urls[:5]:  # Cap at 5 URLs
        content, success = await fetch_url_content(url)
        if success:
            url_contents[url] = content
            urls_analyzed.append(url)
        else:
            urls_failed.append(url)

    # Step 2: Build analysis prompt
    portfolio_context = ""

    if request.bio:
        portfolio_context += f"USER BIO:\n{request.bio}\n\n"

    if request.existing_skills:
        portfolio_context += f"SKILLS ALREADY LISTED BY USER: {', '.join(request.existing_skills)}\n\n"

    for url, content in url_contents.items():
        platform = detect_platform(url)
        portfolio_context += f"PORTFOLIO LINK ({platform}): {url}\nPAGE CONTENT (excerpt):\n{content[:3000]}\n\n"

    system_prompt = """You are an expert creative talent analyst for a skill bartering platform called CreativeBarter.
Your job is to analyze a creative professional's portfolio links and bio to extract their skills, tools, and artistic identity.

You must respond ONLY with valid JSON in this exact format:
{
  "top_skills": [
    {"name": "skill name", "proficiency_estimate": 1-10, "category": "software|artistic_skill|tool|language|technique|domain"}
  ],
  "suggested_categories": ["category1", "category2"],
  "tools_detected": ["Tool Name 1", "Tool Name 2"],
  "artistic_styles": ["style1", "style2"],
  "summary": "A 2-3 sentence professional summary of this creative."
}

Rules:
- proficiency_estimate: 1-3 = beginner, 4-6 = intermediate, 7-8 = advanced, 9-10 = expert
- Infer proficiency from context clues: project complexity, years mentioned, breadth of work, platform reputation signals
- suggested_categories must be from: visual_arts, music, writing, film, photography, design, web_dev, game_dev, animation, crafts, other
- For GitHub: analyze languages, repo descriptions, README content, project complexity, stars/forks if visible
- For Behance/Dribbble/ArtStation: look at project types, tools mentioned, style patterns
- For SoundCloud/Bandcamp: look at genres, production quality indicators, instruments/DAWs mentioned
- tools_detected: specific software, hardware, or platforms (e.g., "Adobe Premiere", "Blender", "Logic Pro X", "React", "Ableton Live")
- artistic_styles: visual or creative style descriptors (e.g., "minimalist", "photorealistic", "lo-fi", "brutalist", "abstract")
- Return at least 3 and at most 15 top_skills
- If some URLs couldn't be fetched, still analyze whatever information IS available
- Do NOT include generic skills like "creativity" or "communication" — focus on specific, barterable creative skills"""

    user_prompt = f"""Analyze this creative professional's portfolio and extract their skills, tools, and artistic identity:

{portfolio_context}

Return JSON only. Be specific and actionable — these skills will be used for matching with other creatives who need collaborators."""

    try:
        result = call_claude(system_prompt, user_prompt, max_tokens=1500)
        parsed = parse_json_response(result)

        # Validate and structure the response
        top_skills = []
        for skill in parsed.get("top_skills", []):
            if isinstance(skill, dict) and "name" in skill:
                top_skills.append(PortfolioSkill(
                    name=skill["name"],
                    proficiency_estimate=max(1, min(10, int(skill.get("proficiency_estimate", 5)))),
                    category=skill.get("category", "other"),
                ))

        return PortfolioAnalysisResponse(
            top_skills=top_skills,
            suggested_categories=parsed.get("suggested_categories", []),
            tools_detected=parsed.get("tools_detected", []),
            artistic_styles=parsed.get("artistic_styles", []),
            summary=parsed.get("summary", ""),
            urls_analyzed=urls_analyzed,
            urls_failed=urls_failed,
        )

    except json.JSONDecodeError:
        return PortfolioAnalysisResponse(
            top_skills=[], suggested_categories=[], tools_detected=[],
            artistic_styles=[], summary="Analysis failed — could not parse AI response. Try again.",
            urls_analyzed=urls_analyzed, urls_failed=urls_failed,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio analysis failed: {str(e)}")


# ---- Match Scoring ----

@app.post("/match/score", response_model=MatchScoreResponse)
async def calculate_match_score(request: MatchScoreRequest):
    """Calculate match compatibility score (0-100) between a user and a project."""
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
            parsed = parse_json_response(result)
            return MatchScoreResponse(
                score=min(float(parsed.get("score", 50)), 100),
                reasoning=parsed.get("reasoning", ""),
                matched_skills=parsed.get("matched_skills", []),
            )
        except Exception:
            pass

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

    return MatchScoreResponse(score=50.0, reasoning="Insufficient data.", matched_skills=[])


# ---- Recommendations ----

@app.post("/match/recommend", response_model=RecommendationResponse)
async def get_recommendations(request: RecommendationRequest):
    """Get recommended users for a project, scored by skill overlap."""
    if not request.candidate_profiles:
        return RecommendationResponse(recommendations=[], source="fallback")

    scored = []
    for profile in request.candidate_profiles:
        user_skills = set(s.lower() for s in profile.get("skills", []))
        required = set(s.lower() for s in (request.project_required_skills or []))
        overlap = user_skills & required
        score = (len(overlap) / max(len(required), 1)) * 100
        scored.append({
            "user_id": profile.get("user_id"),
            "name": profile.get("name"),
            "score": score,
            "matched_skills": list(overlap),
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    return RecommendationResponse(recommendations=scored[:10], source="rule_based")


# ============================================================
# Run with: uvicorn main:app --reload --port 8000
# ============================================================
