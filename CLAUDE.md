# Claude SEO — Universal SEO Analysis Skill

## Project Overview

This repository contains **Claude SEO**, a Tier 4 Claude Code skill for comprehensive
SEO analysis across all industries. It follows the Agent Skills open standard and the
3-layer architecture (directive, orchestration, execution). 13 sub-skills, 6 parallel
subagents, and an extensible reference system cover technical SEO, content quality,
schema markup, image optimization, sitemap architecture, and AI search optimization.

## Architecture

```
claude-seo/
  CLAUDE.md                          # Project instructions (this file)
  .claude-plugin/plugin.json         # Plugin manifest (v1.4.0)
  .claude-plugin/marketplace-plugins.json  # Marketplace plugin catalog
  seo/                               # Main orchestrator skill
    SKILL.md                         # Entry point, routing table, core rules
    references/                      # On-demand knowledge files
  scripts/                           # Python execution scripts
  hooks/                             # Quality gate hooks
  schema/                            # Schema.org JSON-LD templates
  skills/                            # 12 specialized sub-skills
    seo-audit/SKILL.md              # Full site audit with parallel agents
    seo-page/SKILL.md              # Deep single-page analysis
    seo-technical/SKILL.md         # Technical SEO (9 categories)
    seo-content/SKILL.md           # E-E-A-T and content quality
    seo-schema/SKILL.md            # Schema.org markup detection/generation
    seo-sitemap/SKILL.md           # XML sitemap analysis/generation
    seo-images/SKILL.md            # Image optimization analysis
    seo-geo/SKILL.md               # AI search / GEO optimization
    seo-plan/SKILL.md              # Strategic SEO planning
    seo-programmatic/SKILL.md      # Programmatic SEO at scale
    seo-competitor-pages/SKILL.md  # Competitor comparison pages
    seo-hreflang/SKILL.md         # International SEO / hreflang
  agents/                            # 6 parallel subagents
    seo-technical.md               # Crawlability, indexability, security
    seo-content.md                 # E-E-A-T, readability, thin content
    seo-schema.md                  # Structured data validation
    seo-sitemap.md                 # Sitemap quality gates
    seo-performance.md             # Core Web Vitals, page speed
    seo-visual.md                  # Screenshots, mobile rendering
  webapp/                              # Plugin marketplace web app
    index.html                       # Browser-based plugin selector
    open.sh                          # macOS/Linux launcher
    open.ps1                         # Windows launcher
  docs/                              # Extended documentation
    ARCHITECTURE.md                # System design overview
    COMMANDS.md                    # Full command reference
    INSTALLATION.md                # Install guide
    MARKETPLACE-PLUGINS.md         # Marketplace plugin setup
    MCP-INTEGRATION.md            # DataForSEO MCP setup
    TROUBLESHOOTING.md            # Common issues
```

## Commands

| Command | Purpose |
|---------|---------|
| `/seo audit <url>` | Full site audit with 6 parallel subagents |
| `/seo page <url>` | Deep single-page analysis |
| `/seo technical <url>` | Technical SEO audit (9 categories) |
| `/seo content <url>` | E-E-A-T and content quality analysis |
| `/seo schema <url>` | Schema.org detection, validation, generation |
| `/seo sitemap <url>` | XML sitemap analysis or generation |
| `/seo images <url>` | Image optimization analysis |
| `/seo geo <url>` | AI search / Generative Engine Optimization |
| `/seo plan <type>` | Strategic SEO planning by industry |
| `/seo programmatic` | Programmatic SEO analysis and planning |
| `/seo competitor-pages` | Competitor comparison page generation |
| `/seo hreflang <url>` | International SEO / hreflang audit |

## Development Rules

- Keep SKILL.md files under 500 lines / 5000 tokens
- Reference files should be focused and under 200 lines
- Scripts must have docstrings, CLI interface, and JSON output
- Follow kebab-case naming for all skill directories
- Agents invoked via Task tool with `context: fork`, never via Bash
- Python dependencies install into `~/.claude/skills/seo/.venv/`
- Test with `python -m pytest tests/` after changes (if applicable)

## Marketplace Plugins

Claude SEO integrates with the **claude-code-skills** community marketplace
(173+ skills, 9 domains). Register and install:

```bash
# Register marketplace
/plugin marketplace add alirezarezvani/claude-skills

# Install bundles by domain
/plugin install engineering-skills@claude-code-skills          # 24 core engineering
/plugin install engineering-advanced-skills@claude-code-skills  # 25 POWERFUL-tier
/plugin install product-skills@claude-code-skills               # 8 product skills
/plugin install marketing-skills@claude-code-skills             # 43 marketing skills
/plugin install ra-qm-skills@claude-code-skills                 # 12 regulatory/quality
/plugin install pm-skills@claude-code-skills                    # 6 project management
/plugin install c-level-skills@claude-code-skills               # 28 C-level advisory
/plugin install business-growth-skills@claude-code-skills       # 4 business & growth
/plugin install finance-skills@claude-code-skills               # 2 finance

# Individual skills
/plugin install skill-security-auditor@claude-code-skills
/plugin install playwright-pro@claude-code-skills
/plugin install self-improving-agent@claude-code-skills
/plugin install content-creator@claude-code-skills
```

For non-technical team members, open the web app: `./webapp/open.sh` (or double-click `webapp/index.html`).

See [docs/MARKETPLACE-PLUGINS.md](docs/MARKETPLACE-PLUGINS.md) for full details.

## Key Principles

1. **Progressive Disclosure**: Metadata always loaded, instructions on activation, resources on demand
2. **Industry Detection**: Auto-detect SaaS, e-commerce, local, publisher, agency
3. **Parallel Execution**: Full audits spawn 6 subagents simultaneously
4. **Extension System**: DataForSEO MCP integration for live data
5. **Marketplace Integration**: 173+ community skills via claude-code-skills marketplace
