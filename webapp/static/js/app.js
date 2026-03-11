/* Claude SEO Team Dashboard — Frontend */

(function () {
  "use strict";

  // --- Navigation ---
  const navLinks = document.querySelectorAll(".nav-link");
  const views = document.querySelectorAll(".view");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.view;
      navLinks.forEach((l) => l.classList.remove("active"));
      link.classList.add("active");
      views.forEach((v) => v.classList.remove("active"));
      document.getElementById("view-" + target).classList.add("active");

      if (target === "history") loadHistory();
      if (target === "schemas") loadSchemas();
    });
  });

  // --- Analyze form ---
  const form = document.getElementById("analyze-form");
  const urlInput = document.getElementById("url-input");
  const typeSelect = document.getElementById("analysis-type");
  const analyzeBtn = document.getElementById("analyze-btn");
  const resultsArea = document.getElementById("results-area");
  const loading = document.getElementById("loading");
  const resultsContent = document.getElementById("results-content");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = urlInput.value.trim();
    if (!url) return;

    analyzeBtn.disabled = true;
    analyzeBtn.textContent = "Analyzing...";
    resultsArea.classList.remove("hidden");
    loading.classList.remove("hidden");
    resultsContent.innerHTML = "";

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, analysis_type: typeSelect.value }),
      });
      const data = await res.json();

      if (!res.ok) {
        showError(data.detail || "Analysis failed");
        return;
      }

      pollJob(data.job_id);
    } catch (err) {
      showError("Network error: " + err.message);
    }
  });

  async function pollJob(jobId) {
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      await sleep(1000);
      try {
        const res = await fetch("/api/jobs/" + jobId);
        const job = await res.json();

        if (job.status === "completed") {
          loading.classList.add("hidden");
          renderResults(job);
          resetButton();
          return;
        }

        if (job.status === "failed") {
          showError(job.error || "Analysis failed");
          resetButton();
          return;
        }
      } catch {
        // Network blip, keep polling
      }
    }
    showError("Analysis timed out");
    resetButton();
  }

  function resetButton() {
    analyzeBtn.disabled = false;
    analyzeBtn.textContent = "Analyze";
  }

  function showError(msg) {
    loading.classList.add("hidden");
    resultsContent.innerHTML =
      '<div class="result-section open"><div class="result-section-body" style="display:block;padding-top:16px"><p style="color:var(--error)">' +
      escapeHtml(msg) +
      "</p></div></div>";
    resetButton();
  }

  // --- Render results ---
  function renderResults(job) {
    const r = job.result;
    if (!r) return;

    let html = "";

    // Score
    const score = r.score ?? 0;
    const scoreClass = score >= 80 ? "good" : score >= 50 ? "ok" : "bad";
    html += `
      <div class="score-card">
        <div class="score-number ${scoreClass}">${score}</div>
        <div>
          <div class="score-label">SEO Health Score</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px">${escapeHtml(job.url)}</div>
        </div>
        <button class="export-btn" onclick="exportJSON('${job.id}')">Export JSON</button>
      </div>`;

    // Overview
    if (r.overview) {
      html += renderSection("Overview", r.overview, () => {
        const o = r.overview;
        return `
          <dl class="data-grid">
            <dt>Title</dt><dd>${escapeHtml(o.title || "—")}</dd>
            <dt>Meta Description</dt><dd>${escapeHtml(truncate(o.meta_description, 160) || "—")}</dd>
            <dt>Canonical</dt><dd>${escapeHtml(o.canonical || "—")}</dd>
            <dt>H1</dt><dd>${escapeHtml((o.h1 || []).join(", ") || "—")}</dd>
            <dt>Word Count</dt><dd>${o.word_count ?? "—"}</dd>
            <dt>Status Code</dt><dd>${o.status_code ?? "—"}</dd>
            <dt>Final URL</dt><dd>${escapeHtml(o.final_url || "—")}</dd>
          </dl>
          ${renderIssues(o.issues)}`;
      });
    }

    // Technical
    if (r.technical) {
      html += renderSection("Technical SEO", r.technical, () => {
        const t = r.technical;
        return `
          <dl class="data-grid">
            <dt>HTTPS</dt><dd>${t.https ? "Yes" : "No"}</dd>
            <dt>Canonical</dt><dd>${escapeHtml(t.canonical || "—")}</dd>
            <dt>Meta Robots</dt><dd>${escapeHtml(t.meta_robots || "—")}</dd>
            <dt>Hreflang Tags</dt><dd>${t.hreflang_count}</dd>
          </dl>
          ${renderIssues(t.issues)}`;
      });
    }

    // Content
    if (r.content) {
      html += renderSection("Content Quality", r.content, () => {
        const c = r.content;
        return `
          <dl class="data-grid">
            <dt>Word Count</dt><dd>${c.word_count}</dd>
            <dt>H1 / H2 / H3</dt><dd>${c.headings.h1} / ${c.headings.h2} / ${c.headings.h3}</dd>
            <dt>Internal Links</dt><dd>${c.links.internal}</dd>
            <dt>External Links</dt><dd>${c.links.external}</dd>
            <dt>Open Graph</dt><dd>${Object.keys(c.open_graph || {}).length ? "Present" : "Missing"}</dd>
            <dt>Twitter Card</dt><dd>${Object.keys(c.twitter_card || {}).length ? "Present" : "Missing"}</dd>
          </dl>
          ${renderIssues(c.issues)}`;
      });
    }

    // Schema
    if (r.schema) {
      html += renderSection("Schema Markup", r.schema, () => {
        const s = r.schema;
        let body = `
          <dl class="data-grid">
            <dt>JSON-LD Blocks</dt><dd>${s.count}</dd>
            <dt>Types Found</dt><dd>${escapeHtml((s.types || []).join(", ") || "None")}</dd>
          </dl>
          ${renderIssues(s.issues)}`;
        if (s.schemas && s.schemas.length > 0) {
          body +=
            '<div style="margin-top:12px"><pre class="schema-code" style="display:block">' +
            escapeHtml(JSON.stringify(s.schemas, null, 2)) +
            "</pre></div>";
        }
        return body;
      });
    }

    // Images
    if (r.images) {
      html += renderSection("Images", r.images, () => {
        const im = r.images;
        return `
          <dl class="data-grid">
            <dt>Total Images</dt><dd>${im.total}</dd>
            <dt>Missing Alt Text</dt><dd>${im.missing_alt}</dd>
            <dt>Missing Dimensions</dt><dd>${im.missing_dimensions}</dd>
          </dl>
          ${renderIssues(im.issues)}`;
      });
    }

    resultsContent.innerHTML = html;

    // Auto-open first section
    const firstSection = resultsContent.querySelector(".result-section");
    if (firstSection) firstSection.classList.add("open");

    // Attach toggle handlers
    resultsContent.querySelectorAll(".result-section-header").forEach((hdr) => {
      hdr.addEventListener("click", () => {
        hdr.parentElement.classList.toggle("open");
      });
    });
  }

  function renderSection(title, data, bodyFn) {
    const issues = data.issues || [];
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;

    let badges = "";
    if (errors > 0)
      badges += `<span class="badge badge-error">${errors} error${errors > 1 ? "s" : ""}</span> `;
    if (warnings > 0)
      badges += `<span class="badge badge-warning">${warnings} warning${warnings > 1 ? "s" : ""}</span> `;
    if (errors === 0 && warnings === 0)
      badges += '<span class="badge badge-success">Pass</span>';

    return `
      <div class="result-section">
        <div class="result-section-header">
          <h3>${escapeHtml(title)} ${badges}</h3>
          <span class="chevron">&#9654;</span>
        </div>
        <div class="result-section-body">${bodyFn()}</div>
      </div>`;
  }

  function renderIssues(issues) {
    if (!issues || issues.length === 0) return "";
    let html = '<ul class="issue-list" style="margin-top:12px">';
    for (const issue of issues) {
      html += `
        <li class="issue-item">
          <span class="issue-dot ${issue.severity}"></span>
          <span>${escapeHtml(issue.message)}</span>
        </li>`;
    }
    html += "</ul>";
    return html;
  }

  // --- History ---
  async function loadHistory() {
    const list = document.getElementById("history-list");
    list.innerHTML = '<p style="color:var(--text-muted)">Loading...</p>';
    try {
      const res = await fetch("/api/jobs");
      const jobs = await res.json();
      if (jobs.length === 0) {
        list.innerHTML =
          '<p style="color:var(--text-muted)">No analyses yet. Run your first one!</p>';
        return;
      }
      let html = "";
      for (const job of jobs) {
        const score = job.result?.score;
        const scoreClass =
          score >= 80 ? "good" : score >= 50 ? "ok" : "bad";
        const date = new Date(job.created_at).toLocaleString();
        html += `
          <div class="history-item" onclick="viewJob('${job.id}')">
            <div>
              <div class="history-url">${escapeHtml(job.url)}</div>
              <div class="history-meta">
                <span><span class="status-dot ${job.status}"></span>${job.status}</span>
                <span>${job.analysis_type}</span>
                <span>${date}</span>
              </div>
            </div>
            ${score != null ? `<div class="history-score score-number ${scoreClass}">${score}</div>` : ""}
          </div>`;
      }
      list.innerHTML = html;
    } catch {
      list.innerHTML =
        '<p style="color:var(--error)">Failed to load history</p>';
    }
  }

  // --- Schema Templates ---
  async function loadSchemas() {
    const list = document.getElementById("schema-list");
    list.innerHTML = '<p style="color:var(--text-muted)">Loading...</p>';
    try {
      const res = await fetch("/api/schema-templates");
      const data = await res.json();
      const templates = data.templates || [];
      if (templates.length === 0) {
        list.innerHTML =
          '<p style="color:var(--text-muted)">No templates available.</p>';
        return;
      }
      let html = "";
      for (let i = 0; i < templates.length; i++) {
        const t = templates[i];
        const jsonStr = JSON.stringify(t.template, null, 2);
        html += `
          <div class="schema-card" id="schema-${i}">
            <h3>${escapeHtml(t.type)}</h3>
            <p>${escapeHtml(t.description)}</p>
            <div class="schema-actions">
              <button class="btn-sm" onclick="toggleSchema(${i})">View Template</button>
              <button class="btn-sm" onclick="copySchema(${i})">Copy JSON-LD</button>
            </div>
            <pre class="schema-code">${escapeHtml(jsonStr)}</pre>
          </div>`;
      }
      list.innerHTML = html;
    } catch {
      list.innerHTML =
        '<p style="color:var(--error)">Failed to load templates</p>';
    }
  }

  // --- Global functions ---
  window.toggleSchema = function (index) {
    const card = document.getElementById("schema-" + index);
    card.classList.toggle("expanded");
  };

  window.copySchema = function (index) {
    const card = document.getElementById("schema-" + index);
    const code = card.querySelector(".schema-code").textContent;
    const wrapped =
      '<script type="application/ld+json">\n' + code + "\n<\/script>";
    navigator.clipboard.writeText(wrapped).then(() => {
      const btn = card.querySelectorAll(".btn-sm")[1];
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy JSON-LD"), 1500);
    });
  };

  window.viewJob = async function (jobId) {
    // Switch to analyze view and show results
    navLinks.forEach((l) => l.classList.remove("active"));
    navLinks[0].classList.add("active");
    views.forEach((v) => v.classList.remove("active"));
    document.getElementById("view-analyze").classList.add("active");

    resultsArea.classList.remove("hidden");
    loading.classList.remove("hidden");
    resultsContent.innerHTML = "";

    try {
      const res = await fetch("/api/jobs/" + jobId);
      const job = await res.json();
      loading.classList.add("hidden");
      if (job.status === "completed") {
        urlInput.value = job.url;
        renderResults(job);
      } else if (job.status === "failed") {
        showError(job.error || "Analysis failed");
      } else {
        pollJob(jobId);
      }
    } catch {
      showError("Failed to load job");
    }
  };

  window.exportJSON = async function (jobId) {
    try {
      const res = await fetch("/api/jobs/" + jobId);
      const job = await res.json();
      const blob = new Blob([JSON.stringify(job.result, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `seo-report-${jobId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to export");
    }
  };

  // --- Utilities ---
  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function truncate(str, len) {
    if (!str) return str;
    return str.length > len ? str.slice(0, len) + "..." : str;
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
})();
