import type {
  AnalysisResult,
  AnalysisType,
  Issue,
  OverviewResult,
  TechnicalResult,
  ContentResult,
  SchemaResult,
  ImagesResult,
  ImageInfo,
} from './types';

const PROXY_URL = 'https://api.allorigins.win/raw?url=';

export async function fetchPage(url: string): Promise<{ html: string; finalUrl: string }> {
  const encoded = encodeURIComponent(url);
  const res = await fetch(`${PROXY_URL}${encoded}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch page (HTTP ${res.status})`);
  }
  const html = await res.text();
  return { html, finalUrl: url };
}

export function analyzeUrl(
  url: string,
  html: string,
  finalUrl: string,
  analysisType: AnalysisType
): AnalysisResult {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const overview = analyzeOverview(url, finalUrl, doc, html);
  const result: AnalysisResult = { overview, score: 100 };

  if (analysisType === 'full' || analysisType === 'technical') {
    result.technical = analyzeTechnical(finalUrl, doc, html);
  }
  if (analysisType === 'full' || analysisType === 'content') {
    result.content = analyzeContent(doc, finalUrl);
  }
  if (analysisType === 'full' || analysisType === 'schema') {
    result.schema = analyzeSchema(doc);
  }
  if (analysisType === 'full' || analysisType === 'images') {
    result.images = analyzeImages(doc);
  }

  result.score = computeScore(result);
  return result;
}

function analyzeOverview(url: string, finalUrl: string, doc: Document, html: string): OverviewResult {
  const issues: Issue[] = [];

  const title = doc.querySelector('title')?.textContent?.trim() || null;
  const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || null;
  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
  const h1s = Array.from(doc.querySelectorAll('h1')).map(el => el.textContent?.trim() || '').filter(Boolean);

  // Word count — visible text
  const clone = doc.body?.cloneNode(true) as HTMLElement;
  if (clone) {
    clone.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
  }
  const text = clone?.textContent || '';
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  if (!title) {
    issues.push({ severity: 'error', message: 'Missing page title' });
  } else if (title.length > 60) {
    issues.push({ severity: 'warning', message: `Title too long (${title.length} chars, recommended ≤60)` });
  } else if (title.length < 30) {
    issues.push({ severity: 'warning', message: `Title too short (${title.length} chars, recommended ≥30)` });
  }

  if (!metaDesc) {
    issues.push({ severity: 'error', message: 'Missing meta description' });
  } else if (metaDesc.length > 160) {
    issues.push({ severity: 'warning', message: `Meta description too long (${metaDesc.length} chars, recommended ≤160)` });
  }

  if (h1s.length === 0) {
    issues.push({ severity: 'error', message: 'Missing H1 tag' });
  } else if (h1s.length > 1) {
    issues.push({ severity: 'warning', message: `Multiple H1 tags found (${h1s.length})` });
  }

  return {
    url,
    finalUrl,
    statusCode: 200,
    title,
    metaDescription: metaDesc,
    canonical,
    h1: h1s,
    wordCount,
    issues,
  };
}

function analyzeTechnical(finalUrl: string, doc: Document, html: string): TechnicalResult {
  const issues: Issue[] = [];

  const https = finalUrl.startsWith('https://');
  if (!https) {
    issues.push({ severity: 'error', message: 'Page not served over HTTPS' });
  }

  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href') || null;
  if (!canonical) {
    issues.push({ severity: 'warning', message: 'No canonical URL specified' });
  } else if (canonical !== finalUrl) {
    issues.push({ severity: 'info', message: `Canonical differs from URL: ${canonical}` });
  }

  const robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || null;
  if (robots?.toLowerCase().includes('noindex')) {
    issues.push({ severity: 'error', message: 'Page is set to noindex' });
  }
  if (robots?.toLowerCase().includes('nofollow')) {
    issues.push({ severity: 'warning', message: 'Page is set to nofollow' });
  }

  const viewport = doc.querySelector('meta[name="viewport"]');
  if (!viewport) {
    issues.push({ severity: 'error', message: 'Missing viewport meta tag (mobile-unfriendly)' });
  }

  const htmlTag = html.match(/<html[^>]*>/i)?.[0] || '';
  if (!htmlTag.includes('lang=')) {
    issues.push({ severity: 'warning', message: 'Missing lang attribute on <html> tag' });
  }

  const hreflangTags = doc.querySelectorAll('link[rel="alternate"][hreflang]');

  return {
    https,
    canonical,
    metaRobots: robots,
    hreflangCount: hreflangTags.length,
    issues,
  };
}

function analyzeContent(doc: Document, baseUrl: string): ContentResult {
  const issues: Issue[] = [];

  const clone = doc.body?.cloneNode(true) as HTMLElement;
  if (clone) {
    clone.querySelectorAll('script, style, nav, footer, header').forEach(el => el.remove());
  }
  const text = clone?.textContent || '';
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  if (wordCount < 300) {
    issues.push({ severity: 'error', message: `Thin content: ${wordCount} words (recommended ≥300)` });
  } else if (wordCount < 600) {
    issues.push({ severity: 'warning', message: `Light content: ${wordCount} words (recommended ≥600 for ranking)` });
  }

  const h1 = doc.querySelectorAll('h1').length;
  const h2 = doc.querySelectorAll('h2').length;
  const h3 = doc.querySelectorAll('h3').length;

  if (h2 === 0 && wordCount > 300) {
    issues.push({ severity: 'warning', message: 'No H2 subheadings found — add structure' });
  }

  let baseDomain = '';
  try { baseDomain = new URL(baseUrl).hostname; } catch { /* ignore */ }

  const allLinks = doc.querySelectorAll('a[href]');
  let internal = 0, external = 0;
  allLinks.forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#') || href.startsWith('javascript:')) return;
    try {
      const linkUrl = new URL(href, baseUrl);
      if (linkUrl.hostname === baseDomain) internal++;
      else external++;
    } catch {
      internal++; // relative links
    }
  });

  if (internal === 0) {
    issues.push({ severity: 'warning', message: 'No internal links found' });
  }
  if (external === 0 && wordCount > 500) {
    issues.push({ severity: 'info', message: 'No external links — consider citing sources' });
  }

  const hasOG = doc.querySelector('meta[property^="og:"]') !== null;
  const hasTC = doc.querySelector('meta[name^="twitter:"]') !== null;

  if (!hasOG) {
    issues.push({ severity: 'warning', message: 'No Open Graph tags found' });
  } else {
    if (!doc.querySelector('meta[property="og:image"]')) {
      issues.push({ severity: 'warning', message: 'Missing og:image — social shares won\'t have an image' });
    }
  }

  return {
    wordCount,
    headings: { h1, h2, h3 },
    links: { internal, external },
    hasOpenGraph: hasOG,
    hasTwitterCard: hasTC,
    issues,
  };
}

function analyzeSchema(doc: Document): SchemaResult {
  const issues: Issue[] = [];
  const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
  const schemas: unknown[] = [];
  const types: string[] = [];

  scripts.forEach(script => {
    try {
      const data = JSON.parse(script.textContent || '');
      schemas.push(data);
      if (Array.isArray(data)) {
        data.forEach(item => {
          if (item?.['@type']) types.push(item['@type']);
        });
      } else if (data?.['@type']) {
        types.push(data['@type']);
      }
    } catch { /* skip invalid */ }
  });

  if (schemas.length === 0) {
    issues.push({ severity: 'warning', message: 'No Schema.org (JSON-LD) markup found' });
  }

  const deprecated = new Set(['HowTo', 'SpecialAnnouncement', 'CourseInfo', 'ClaimReview', 'VehicleListing']);
  types.forEach(t => {
    if (deprecated.has(t)) {
      issues.push({ severity: 'error', message: `Schema type '${t}' is deprecated — remove it` });
    }
    if (t === 'FAQPage') {
      issues.push({ severity: 'warning', message: 'FAQPage is restricted to government/healthcare sites (Aug 2023)' });
    }
  });

  return { count: schemas.length, types, schemas, issues };
}

function analyzeImages(doc: Document): ImagesResult {
  const issues: Issue[] = [];
  const imgs = doc.querySelectorAll('img');
  const images: ImageInfo[] = [];
  let missingAlt = 0;
  let missingDimensions = 0;

  imgs.forEach(img => {
    const alt = img.getAttribute('alt');
    const width = img.getAttribute('width');
    const height = img.getAttribute('height');
    const loading = img.getAttribute('loading');

    if (!alt && alt !== '') missingAlt++;
    else if (alt === '') missingAlt++;
    if (!width || !height) missingDimensions++;

    images.push({
      src: img.getAttribute('src') || '',
      alt: alt,
      width,
      height,
      loading,
    });
  });

  const total = images.length;
  if (total === 0) {
    issues.push({ severity: 'info', message: 'No images found on page' });
  } else {
    if (missingAlt > 0) {
      issues.push({ severity: 'error', message: `${missingAlt}/${total} images missing alt text` });
    }
    if (missingDimensions > 0) {
      issues.push({ severity: 'warning', message: `${missingDimensions}/${total} images missing width/height (causes CLS)` });
    }
  }

  return { total, missingAlt, missingDimensions, images: images.slice(0, 20), issues };
}

function computeScore(result: AnalysisResult): number {
  const weights = { error: 10, warning: 4, info: 1 };
  let score = 100;

  const sections = [result.overview, result.technical, result.content, result.schema, result.images];
  for (const section of sections) {
    if (!section) continue;
    for (const issue of section.issues) {
      score -= weights[issue.severity] ?? 0;
    }
  }

  return Math.max(0, Math.min(100, score));
}
