#!/usr/bin/env python3
"""Claude SEO Team Webapp — FastAPI backend.

Provides a web interface for the team to run SEO analyses
without needing CLI access or Claude Code installed.

Usage:
    python app.py
    # or: uvicorn app:app --reload --port 8000
"""

import asyncio
import json
import os
import sys
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Add parent dir so we can import scripts
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "scripts"))

from fetch_page import fetch_page  # noqa: E402
from parse_html import parse_html  # noqa: E402

app = FastAPI(title="Claude SEO", version="1.0.0")

BASE_DIR = Path(__file__).resolve().parent
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

# In-memory job store (replace with DB for production)
jobs: dict[str, dict] = {}


# ---------------------------------------------------------------------------
# Pages
# ---------------------------------------------------------------------------

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    """Main dashboard page."""
    return templates.TemplateResponse("index.html", {"request": request})


# ---------------------------------------------------------------------------
# API endpoints
# ---------------------------------------------------------------------------

@app.post("/api/analyze")
async def analyze(request: Request):
    """Run an SEO analysis on a URL.

    Body JSON: { "url": "...", "analysis_type": "full|technical|content|schema|images" }
    """
    body = await request.json()
    url = body.get("url", "").strip()
    analysis_type = body.get("analysis_type", "full")

    if not url:
        raise HTTPException(status_code=400, detail="URL is required")

    # Normalize URL
    if not url.startswith(("http://", "https://")):
        url = f"https://{url}"

    job_id = str(uuid.uuid4())[:8]
    jobs[job_id] = {
        "id": job_id,
        "url": url,
        "analysis_type": analysis_type,
        "status": "running",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "result": None,
        "error": None,
    }

    # Run analysis in background
    asyncio.create_task(_run_analysis(job_id, url, analysis_type))

    return {"job_id": job_id, "status": "running"}


async def _run_analysis(job_id: str, url: str, analysis_type: str):
    """Execute the SEO analysis pipeline."""
    try:
        # Step 1: Fetch page
        fetch_result = await asyncio.to_thread(fetch_page, url)

        if fetch_result["error"]:
            jobs[job_id]["status"] = "failed"
            jobs[job_id]["error"] = fetch_result["error"]
            return

        html = fetch_result["content"]
        status_code = fetch_result["status_code"]
        final_url = fetch_result["url"]
        redirect_chain = fetch_result["redirect_chain"]

        # Step 2: Parse HTML
        parsed = await asyncio.to_thread(parse_html, html, final_url)

        # Step 3: Build analysis result based on type
        result = _build_result(
            url=url,
            final_url=final_url,
            status_code=status_code,
            redirect_chain=redirect_chain,
            headers=fetch_result["headers"],
            parsed=parsed,
            html=html,
            analysis_type=analysis_type,
        )

        jobs[job_id]["status"] = "completed"
        jobs[job_id]["result"] = result

    except Exception as e:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = str(e)


def _build_result(
    url: str,
    final_url: str,
    status_code: int,
    redirect_chain: list,
    headers: dict,
    parsed: dict,
    html: str,
    analysis_type: str,
) -> dict:
    """Build structured analysis result."""
    result = {
        "overview": _analyze_overview(url, final_url, status_code, redirect_chain, parsed),
    }

    if analysis_type in ("full", "technical"):
        result["technical"] = _analyze_technical(headers, html, parsed, final_url)

    if analysis_type in ("full", "content"):
        result["content"] = _analyze_content(parsed)

    if analysis_type in ("full", "schema"):
        result["schema"] = _analyze_schema(parsed)

    if analysis_type in ("full", "images"):
        result["images"] = _analyze_images(parsed)

    # Compute score
    result["score"] = _compute_score(result)

    return result


def _analyze_overview(url, final_url, status_code, redirect_chain, parsed):
    """Basic page overview."""
    issues = []

    if not parsed["title"]:
        issues.append({"severity": "error", "message": "Missing page title"})
    elif len(parsed["title"]) > 60:
        issues.append({"severity": "warning", "message": f"Title too long ({len(parsed['title'])} chars, recommended ≤60)"})
    elif len(parsed["title"]) < 30:
        issues.append({"severity": "warning", "message": f"Title too short ({len(parsed['title'])} chars, recommended ≥30)"})

    if not parsed["meta_description"]:
        issues.append({"severity": "error", "message": "Missing meta description"})
    elif len(parsed["meta_description"]) > 160:
        issues.append({"severity": "warning", "message": f"Meta description too long ({len(parsed['meta_description'])} chars, recommended ≤160)"})

    if not parsed["h1"]:
        issues.append({"severity": "error", "message": "Missing H1 tag"})
    elif len(parsed["h1"]) > 1:
        issues.append({"severity": "warning", "message": f"Multiple H1 tags found ({len(parsed['h1'])})"})

    if redirect_chain:
        issues.append({"severity": "info", "message": f"Redirect chain: {len(redirect_chain)} hop(s)"})

    return {
        "url": url,
        "final_url": final_url,
        "status_code": status_code,
        "title": parsed["title"],
        "meta_description": parsed["meta_description"],
        "canonical": parsed["canonical"],
        "h1": parsed["h1"],
        "word_count": parsed["word_count"],
        "redirect_chain": redirect_chain,
        "issues": issues,
    }


def _analyze_technical(headers, html, parsed, final_url):
    """Technical SEO checks."""
    issues = []

    # HTTPS check
    if not final_url.startswith("https://"):
        issues.append({"severity": "error", "message": "Page not served over HTTPS"})

    # Canonical check
    if not parsed["canonical"]:
        issues.append({"severity": "warning", "message": "No canonical URL specified"})
    elif parsed["canonical"] != final_url:
        issues.append({"severity": "info", "message": f"Canonical differs from URL: {parsed['canonical']}"})

    # Robots meta
    robots = parsed.get("meta_robots", "")
    if robots and "noindex" in robots.lower():
        issues.append({"severity": "error", "message": "Page is set to noindex"})
    if robots and "nofollow" in robots.lower():
        issues.append({"severity": "warning", "message": "Page is set to nofollow"})

    # Security headers
    security_headers = {
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": None,
        "Strict-Transport-Security": None,
    }
    headers_lower = {k.lower(): v for k, v in headers.items()}
    for header_name in security_headers:
        if header_name.lower() not in headers_lower:
            issues.append({"severity": "info", "message": f"Missing security header: {header_name}"})

    # Viewport meta
    if '<meta name="viewport"' not in html.lower() and "<meta name='viewport'" not in html.lower():
        issues.append({"severity": "error", "message": "Missing viewport meta tag (mobile-unfriendly)"})

    # Language
    has_lang = 'lang="' in html[:500] or "lang='" in html[:500]
    if not has_lang:
        issues.append({"severity": "warning", "message": "Missing lang attribute on <html> tag"})

    # Hreflang
    hreflang_count = len(parsed.get("hreflang", []))

    return {
        "https": final_url.startswith("https://"),
        "canonical": parsed["canonical"],
        "meta_robots": parsed.get("meta_robots"),
        "hreflang_count": hreflang_count,
        "hreflang_tags": parsed.get("hreflang", []),
        "issues": issues,
    }


def _analyze_content(parsed):
    """Content quality analysis."""
    issues = []
    word_count = parsed["word_count"]

    if word_count < 300:
        issues.append({"severity": "error", "message": f"Thin content: {word_count} words (recommended ≥300)"})
    elif word_count < 600:
        issues.append({"severity": "warning", "message": f"Light content: {word_count} words (recommended ≥600 for ranking)"})

    h2_count = len(parsed["h2"])
    h3_count = len(parsed["h3"])

    if h2_count == 0 and word_count > 300:
        issues.append({"severity": "warning", "message": "No H2 subheadings found — add structure"})

    internal_links = len(parsed["links"]["internal"])
    external_links = len(parsed["links"]["external"])

    if internal_links == 0:
        issues.append({"severity": "warning", "message": "No internal links found"})
    if external_links == 0 and word_count > 500:
        issues.append({"severity": "info", "message": "No external links — consider citing sources"})

    # Open Graph
    og = parsed.get("open_graph", {})
    if not og:
        issues.append({"severity": "warning", "message": "No Open Graph tags found"})
    else:
        if "og:title" not in og:
            issues.append({"severity": "info", "message": "Missing og:title"})
        if "og:description" not in og:
            issues.append({"severity": "info", "message": "Missing og:description"})
        if "og:image" not in og:
            issues.append({"severity": "warning", "message": "Missing og:image — social shares won't have an image"})

    return {
        "word_count": word_count,
        "headings": {"h1": len(parsed["h1"]), "h2": h2_count, "h3": h3_count},
        "links": {"internal": internal_links, "external": external_links},
        "open_graph": og,
        "twitter_card": parsed.get("twitter_card", {}),
        "issues": issues,
    }


def _analyze_schema(parsed):
    """Schema.org / JSON-LD analysis."""
    issues = []
    schemas = parsed.get("schema", [])

    if not schemas:
        issues.append({"severity": "warning", "message": "No Schema.org (JSON-LD) markup found"})
        return {"schemas": [], "count": 0, "types": [], "issues": issues}

    types_found = []
    for s in schemas:
        if isinstance(s, dict):
            t = s.get("@type", "Unknown")
            types_found.append(t)
        elif isinstance(s, list):
            for item in s:
                if isinstance(item, dict):
                    types_found.append(item.get("@type", "Unknown"))

    # Check for deprecated types
    deprecated = {"HowTo", "SpecialAnnouncement", "CourseInfo", "ClaimReview", "VehicleListing"}
    for t in types_found:
        if t in deprecated:
            issues.append({"severity": "error", "message": f"Schema type '{t}' is deprecated — remove it"})

    if "FAQPage" in types_found:
        issues.append({"severity": "warning", "message": "FAQPage is restricted to government/healthcare sites (Aug 2023)"})

    return {
        "schemas": schemas,
        "count": len(schemas),
        "types": types_found,
        "issues": issues,
    }


def _analyze_images(parsed):
    """Image optimization analysis."""
    issues = []
    images = parsed.get("images", [])
    missing_alt = 0
    missing_dimensions = 0
    missing_lazy = 0

    for img in images:
        if not img.get("alt"):
            missing_alt += 1
        if not img.get("width") or not img.get("height"):
            missing_dimensions += 1
        if img.get("loading") != "lazy":
            missing_lazy += 1

    total = len(images)
    if total == 0:
        issues.append({"severity": "info", "message": "No images found on page"})
    else:
        if missing_alt > 0:
            issues.append({"severity": "error", "message": f"{missing_alt}/{total} images missing alt text"})
        if missing_dimensions > 0:
            issues.append({"severity": "warning", "message": f"{missing_dimensions}/{total} images missing width/height (causes CLS)"})
        if missing_lazy > 0:
            below_fold = max(0, missing_lazy - 1)  # first image shouldn't be lazy
            if below_fold > 0:
                issues.append({"severity": "info", "message": f"{below_fold} below-fold images could use lazy loading"})

    return {
        "total": total,
        "missing_alt": missing_alt,
        "missing_dimensions": missing_dimensions,
        "missing_lazy_loading": missing_lazy,
        "images": images[:20],  # Limit to first 20
        "issues": issues,
    }


def _compute_score(result):
    """Compute overall SEO health score (0-100)."""
    score = 100
    weights = {"error": 10, "warning": 4, "info": 1}

    for section_key in ("overview", "technical", "content", "schema", "images"):
        section = result.get(section_key)
        if not section:
            continue
        for issue in section.get("issues", []):
            penalty = weights.get(issue["severity"], 0)
            score -= penalty

    return max(0, min(100, score))


@app.get("/api/jobs")
async def list_jobs():
    """List all analysis jobs (most recent first)."""
    sorted_jobs = sorted(jobs.values(), key=lambda j: j["created_at"], reverse=True)
    return sorted_jobs[:50]


@app.get("/api/jobs/{job_id}")
async def get_job(job_id: str):
    """Get a specific job result."""
    job = jobs.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/schema-templates")
async def schema_templates():
    """Return available Schema.org templates."""
    templates_path = Path(__file__).resolve().parent.parent / "schema" / "templates.json"
    if not templates_path.exists():
        return {"templates": []}
    with open(templates_path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
