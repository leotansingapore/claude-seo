# Claude SEO — Team Web Dashboard

A web interface that lets your team run SEO analyses without needing CLI access.

## Quick Start

```bash
# 1. Install dependencies (from repo root)
pip install -r requirements.txt
pip install -r webapp/requirements.txt

# 2. Run the server
cd webapp
python app.py
```

The dashboard opens at **http://localhost:8000**.

## Features

- **URL Analysis** — Full, technical, content, schema, or image-only analysis
- **Shared History** — All team analyses visible in one place
- **Schema Templates** — Browse and copy JSON-LD templates
- **JSON Export** — Download any report as JSON
- **Mobile-friendly** — Responsive layout for any device

## Analysis Types

| Type | What it checks |
|------|---------------|
| Full | Everything below combined |
| Technical | HTTPS, canonical, robots, security headers, viewport, hreflang |
| Content | Word count, headings, links, Open Graph, Twitter Card |
| Schema | JSON-LD blocks, deprecated types, FAQPage restrictions |
| Images | Alt text, dimensions, lazy loading |

## Architecture

```
webapp/
  app.py                 # FastAPI backend
  requirements.txt       # Webapp-specific dependencies
  templates/
    index.html           # Dashboard page
  static/
    css/style.css        # Styles
    js/app.js            # Frontend logic
```

The backend imports `fetch_page` and `parse_html` directly from `scripts/`,
so all existing analysis logic is reused.
