# Marketplace Plugins

Claude SEO integrates with the **claude-code-skills** community marketplace,
providing access to 173+ production-ready skills across 9 domains.

## Web App (Non-Technical Teams)

Prefer a visual interface? Open the Plugin Marketplace web app:

```bash
# macOS / Linux
./webapp/open.sh

# Windows
.\webapp\open.ps1

# Or just double-click webapp/index.html
```

The web app lets you browse bundles, select what you need, and generates the
install commands to copy-paste into Claude Code.

## Quick Setup (CLI)

### Step 1: Register the Marketplace

```
/plugin marketplace add alirezarezvani/claude-skills
```

This downloads the marketplace catalog. No plugins are installed yet.

### Step 2: Install Skill Bundles

Install bundles by domain — each bundle contains multiple related skills:

```bash
# Engineering (49 skills total)
/plugin install engineering-skills@claude-code-skills          # 24 core engineering
/plugin install engineering-advanced-skills@claude-code-skills  # 25 POWERFUL-tier

# Product & Design (8 skills)
/plugin install product-skills@claude-code-skills

# Marketing (43 skills)
/plugin install marketing-skills@claude-code-skills

# Compliance & Quality (12 skills)
/plugin install ra-qm-skills@claude-code-skills

# Project Management (6 skills)
/plugin install pm-skills@claude-code-skills

# Executive Advisory (28 skills)
/plugin install c-level-skills@claude-code-skills

# Business & Growth (4 skills)
/plugin install business-growth-skills@claude-code-skills

# Finance (2 skills)
/plugin install finance-skills@claude-code-skills
```

### Step 3: Install Individual Skills (Optional)

Install specific skills without the full bundle:

```bash
/plugin install skill-security-auditor@claude-code-skills   # Security scanner
/plugin install playwright-pro@claude-code-skills            # Playwright testing toolkit
/plugin install self-improving-agent@claude-code-skills      # Auto-memory curation
/plugin install content-creator@claude-code-skills           # Content creation
```

## Bundle Reference

| Bundle | Skills | Category | Description |
|--------|--------|----------|-------------|
| `engineering-skills` | 24 | Engineering | Architecture, DevOps, QA, AI/ML |
| `engineering-advanced-skills` | 25 | Engineering | Agent design, RAG, DB optimization |
| `product-skills` | 8 | Product | PM, UX research, UI design |
| `marketing-skills` | 43 | Marketing | Content, SEO, CRO, growth, sales |
| `ra-qm-skills` | 12 | Compliance | ISO standards, FDA, GDPR |
| `pm-skills` | 6 | Management | Jira, Confluence, Agile |
| `c-level-skills` | 28 | Executive | Full C-suite advisory roles |
| `business-growth-skills` | 4 | Business | Sales, customer success, revenue ops |
| `finance-skills` | 2 | Finance | Financial analyst, SaaS metrics |

**Total: 152 skills across 9 bundles** + individual skills

## Recommended Combinations

### For SEO Teams

Claude SEO + marketing bundle gives you comprehensive SEO + content marketing:

```bash
/plugin install marketing-skills@claude-code-skills
```

### For Full-Stack Teams

Engineering bundles complement SEO with code quality and testing:

```bash
/plugin install engineering-skills@claude-code-skills
/plugin install engineering-advanced-skills@claude-code-skills
/plugin install playwright-pro@claude-code-skills
```

### For Agencies

Full coverage across client deliverables:

```bash
/plugin install marketing-skills@claude-code-skills
/plugin install product-skills@claude-code-skills
/plugin install c-level-skills@claude-code-skills
/plugin install business-growth-skills@claude-code-skills
```

### For Enterprise / Regulated Industries

Add compliance and project management:

```bash
/plugin install ra-qm-skills@claude-code-skills
/plugin install pm-skills@claude-code-skills
/plugin install skill-security-auditor@claude-code-skills
```

## Managing Plugins

```bash
# List installed plugins
/plugin list

# Update all plugins from marketplace
/plugin marketplace update

# Update a specific plugin
/plugin update marketing-skills@claude-code-skills

# Disable a plugin (without uninstalling)
/plugin disable engineering-skills@claude-code-skills

# Re-enable a plugin
/plugin enable engineering-skills@claude-code-skills

# Uninstall a plugin
/plugin uninstall marketing-skills@claude-code-skills

# Remove marketplace registration
/plugin marketplace remove claude-code-skills
```

## Alternative: Universal CLI Installer

You can also install skills using the universal CLI:

```bash
npx agent-skills-cli add alirezarezvani/claude-skills
```

This works across Claude Code, Cursor, Codex, and other compatible editors.
