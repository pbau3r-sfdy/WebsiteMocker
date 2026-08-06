#!/usr/bin/env node
/**
 * capture-site.mjs  –  WebsiteMocker design-DNA extractor (Playwright-based)
 *
 * Usage:
 *   node _scripts/capture-site.mjs <url> <slug> [page1,page2,...]
 *
 * Examples:
 *   node _scripts/capture-site.mjs https://www.starflight-dynamics.com sfdy
 *   node _scripts/capture-site.mjs https://crestworks.co crestworks /,/services,/contact
 *
 * Output: _captures/<slug>/
 *   ├── CAPTURE.md        human-readable summary
 *   ├── capture.json      machine-readable; consumed by /wm-instantiate
 *   ├── tokens.json       design tokens only (shortcut for /wm-instantiate)
 *   ├── assets/           all downloaded images, videos, fonts
 *   └── screenshots/      full-page screenshots per page at desktop + mobile
 *
 * What it does:
 *   1. Launches Chromium (full JS rendering — handles Wix, React, Vue, etc.)
 *   2. Dismisses cookie/GDPR consent overlays automatically
 *   3. Scrolls each page to trigger lazy-loaded images and videos
 *   4. Intercepts every network response → downloads images, videos, fonts, SVGs
 *   5. Extracts rendered text per section
 *   6. Samples computed CSS → design tokens
 *   7. Takes full-page screenshots at 1440px (desktop) and 390px (mobile)
 *   8. Warns if a page looks like a placeholder / under construction
 */

import { chromium } from 'playwright';
import { mkdir, writeFile } from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Args ─────────────────────────────────────────────────────────────────────
const [,, SITE_URL, SLUG, pagesArg] = process.argv;

if (!SITE_URL || !SLUG) {
  console.error('Usage: node capture-site.mjs <url> <slug> [/path1,/path2,...]');
  process.exit(1);
}

const BASE_URL    = SITE_URL.replace(/\/$/, '');
const DEFAULT_PAGES = ['/', '/investors', '/careers', '/news', '/imprint', '/privacy-policy'];
const PAGES       = pagesArg ? pagesArg.split(',') : DEFAULT_PAGES;

const OUT_DIR    = path.join(ROOT, '_captures', SLUG);
const ASSETS_DIR = path.join(OUT_DIR, 'assets');
const SHOTS_DIR  = path.join(OUT_DIR, 'screenshots');

// ─── Filters ──────────────────────────────────────────────────────────────────
const MEDIA_RE = /\.(jpg|jpeg|png|gif|webp|avif|svg|mp4|webm|mov|otf|ttf|woff|woff2)(\?|$)/i;
const SKIP_RE  = /\/(node_modules|_next\/static\/chunks|webpack|polyfill)\//;
const CONSTRUCTION_PHRASES = [
  'under construction', 'coming soon', 'launching soon',
  'currently building', 'site is down', 'maintenance',
];

// Cookie/consent selectors to try dismissing
const CONSENT_SELECTORS = [
  '[id*="accept"]', '[id*="cookie"] button', '[class*="accept"]',
  '[class*="consent"] button', '[aria-label*="Accept"]',
  'button:has-text("Accept")', 'button:has-text("Agree")',
  'button:has-text("OK")', 'button:has-text("Got it")',
  // Wix-specific
  '#consent-banner button', '[data-hook="consent-banner-accept"]',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function ensureDirs() {
  for (const d of [OUT_DIR, ASSETS_DIR, SHOTS_DIR]) {
    await mkdir(d, { recursive: true });
  }
}

/** Convert a full URL into a clean, short local filename. */
function urlToFilename(rawUrl) {
  try {
    const u    = new URL(rawUrl);
    const segs = u.pathname.split('/').filter(Boolean);
    // Take last 2 meaningful segments max, drop query
    const base = segs.slice(-2).join('_').replace(/[^a-z0-9_\-.]/gi, '_');
    const ext  = path.extname(u.pathname).split('?')[0] || '';
    const name = base.slice(0, 80) + (ext && !base.endsWith(ext) ? ext : '');
    return name || null;
  } catch {
    return null;
  }
}

/** Download a URL to destDir/filename; returns local path or null on failure. */
async function downloadAsset(rawUrl, destDir) {
  const filename = urlToFilename(rawUrl);
  if (!filename) return null;

  const dest = path.join(destDir, filename);
  if (existsSync(dest)) return dest;

  return new Promise((resolve) => {
    const proto = rawUrl.startsWith('https') ? https : http;
    const req   = proto.get(rawUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadAsset(res.headers.location, destDir).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      const stream = createWriteStream(dest);
      pipeline(res, stream).then(() => resolve(dest)).catch(() => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(20000, () => { req.destroy(); resolve(null); });
  });
}

/** Try to dismiss any consent/cookie overlays. */
async function dismissConsent(page) {
  for (const sel of CONSENT_SELECTORS) {
    try {
      const btn = page.locator(sel).first();
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click({ timeout: 2000 });
        await page.waitForTimeout(600);
        return;
      }
    } catch {
      // try next selector
    }
  }
}

/** Extract design tokens from rendered styles. */
async function extractTokens(page) {
  return page.evaluate(() => {
    const $ = (s) => document.querySelector(s);
    const cs = (el) => el ? getComputedStyle(el) : {};

    const body = cs($('body'));
    const h1   = cs($('h1'));
    const h2   = cs($('h2'));
    const btn  = cs($('button, [class*="btn"], [class*="cta"], a[class*="btn"]'));
    const card = cs($('[class*="card"], [class*="Card"], article'));
    const nav  = cs($('header, nav, [class*="nav"]'));

    // Try CSS custom properties on :root first
    const rootStyle = getComputedStyle(document.documentElement);
    const cprop = (n) => rootStyle.getPropertyValue(n).trim();

    return {
      bg:        cprop('--bg')     || body.backgroundColor || '',
      text:      cprop('--text')   || body.color            || '',
      accent:    cprop('--accent') || btn.backgroundColor   || btn.color || '',
      radius:    cprop('--radius') || btn.borderRadius || card.borderRadius || '4px',
      'bg-nav':  cprop('--bg-nav') || nav.backgroundColor || '',
      fontHead:  cprop('--font-head') || h1.fontFamily || h2.fontFamily || body.fontFamily || '',
      fontBody:  cprop('--font-body') || body.fontFamily || '',
    };
  });
}

/** Extract labelled sections of text content from a rendered page. */
async function extractContent(page) {
  return page.evaluate(() => {
    const sections = [];
    const seen = new Set();

    // Try semantic + Wix-specific selectors
    const candidates = [
      ...document.querySelectorAll(
        'section, [data-mesh-id], [class*="section"], [class*="Section"], ' +
        '[class*="block"], [class*="Block"], main > div > div > div'
      )
    ];

    for (const el of candidates) {
      // Skip tiny or invisible elements
      const rect = el.getBoundingClientRect();
      if (rect.height < 40) continue;

      const text = (el.innerText || '').replace(/\s+/g, ' ').trim().slice(0, 600);
      if (!text || text.length < 20) continue;
      const key = text.slice(0, 60);
      if (seen.has(key)) continue;
      seen.add(key);

      // Try to identify a heading within this section
      const heading = el.querySelector('h1, h2, h3, h4');
      sections.push({
        heading: heading ? heading.innerText.trim() : '',
        text,
        hasImage: el.querySelectorAll('img').length > 0,
        hasForm:  el.querySelectorAll('form, input').length > 0,
        hasVideo: el.querySelectorAll('video').length > 0,
      });
    }
    return sections;
  });
}

/** Detect if the page is a placeholder / under construction. */
async function detectPlaceholder(page) {
  const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
  return CONSTRUCTION_PHRASES.some(phrase => bodyText.includes(phrase));
}

/** Extract nav links from the rendered page. */
async function extractNav(page) {
  return page.evaluate(() => {
    const links = [];
    const seen  = new Set();
    for (const a of document.querySelectorAll('header a, nav a, [class*="nav"] a')) {
      const text = (a.innerText || a.getAttribute('aria-label') || '').trim();
      const href = a.getAttribute('href') || '';
      if (!text || seen.has(text)) continue;
      seen.add(text);
      links.push({ text, href });
    }
    return links;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await ensureDirs();
  console.log(`\n🌐  Capturing ${BASE_URL} → _captures/${SLUG}/\n`);

  const browser = await chromium.launch({ headless: true });

  const assetMap   = new Map();
  const imageFiles = new Set();
  const videoFiles = new Set();
  const fontFiles  = new Set();
  const pageResults = {};
  let tokens = {};
  let navLinks = [];

  // ── Context: desktop ───────────────────────────────────────────────────────
  const desktopCtx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36',
  });

  // Intercept responses to download assets
  desktopCtx.on('response', async (resp) => {
    const url = resp.url();
    if (!MEDIA_RE.test(url) || SKIP_RE.test(url) || assetMap.has(url)) return;
    assetMap.set(url, null); // mark early to prevent duplicate downloads

    const dest = await downloadAsset(url, ASSETS_DIR);
    if (!dest) return;

    const label = path.basename(dest);
    assetMap.set(url, label);

    if (/\.(mp4|webm|mov)$/i.test(dest))       { videoFiles.add(label); process.stdout.write(`  📹 ${label}\n`); }
    else if (/\.(otf|ttf|woff2?)$/i.test(dest)) { fontFiles.add(label);  process.stdout.write(`  🔤 ${label}\n`); }
    else                                          { imageFiles.add(label); process.stdout.write(`  🖼  ${label}\n`); }
  });

  for (const route of PAGES) {
    const fullUrl = BASE_URL + route;
    console.log(`\n→ ${fullUrl}`);
    const page = await desktopCtx.newPage();

    try {
      // Use 'load' not 'networkidle' — Wix and SPAs never truly go networkidle
      // (analytics, heartbeats, etc. keep firing). 'load' fires when the DOM + resources
      // are ready; the extra waits below let JS render the content.
      try {
        await page.goto(fullUrl, { waitUntil: 'load', timeout: 30000 });
      } catch {
        // If even 'load' times out (rare), continue with whatever rendered
      }
      await page.waitForTimeout(4000); // let JS frameworks finish rendering

      // Dismiss cookie banners
      await dismissConsent(page);
      await page.waitForTimeout(500);

      // Scroll to trigger lazy loading
      for (const frac of [0.3, 0.6, 1.0, 0]) {
        await page.evaluate((f) => window.scrollTo(0, document.body.scrollHeight * f), frac);
        await page.waitForTimeout(800);
      }

      // Screenshot (desktop)
      const shotBase = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({ path: path.join(SHOTS_DIR, `${shotBase}-desktop.png`), fullPage: true });
      console.log(`  📸 desktop screenshot`);

      // Tokens and nav from homepage only
      if (route === '/') {
        tokens   = await extractTokens(page);
        navLinks = await extractNav(page);
        console.log(`  🎨 tokens + nav extracted`);
      }

      // Content
      const sections      = await extractContent(page);
      const isPlaceholder = await detectPlaceholder(page);
      if (isPlaceholder) console.log(`  ⚠️  page looks like a placeholder / under construction`);

      pageResults[route] = { sections, isPlaceholder };

    } catch (err) {
      console.error(`  ⚠️  ${err.message.slice(0, 120)}`);
      pageResults[route] = { sections: [], isPlaceholder: false, error: err.message };
    } finally {
      await page.close();
    }
  }

  await desktopCtx.close();

  // ── Mobile screenshots (separate context, no asset interception needed) ────
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1 Safari/604.1',
  });

  for (const route of PAGES.slice(0, 2)) { // mobile shots for home + first page only
    const page = await mobileCtx.newPage();
    try {
      try { await page.goto(BASE_URL + route, { waitUntil: 'load', timeout: 25000 }); } catch { /* continue */ }
      await page.waitForTimeout(3500);
      await dismissConsent(page);
      const shotBase = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({ path: path.join(SHOTS_DIR, `${shotBase}-mobile.png`), fullPage: true });
      console.log(`\n→ mobile ${route} 📸`);
    } catch {
      // non-critical
    } finally {
      await page.close();
    }
  }

  await mobileCtx.close();
  await browser.close();

  // ── Assemble capture.json ────────────────────────────────────────────────────
  const captureJson = {
    slug: SLUG,
    source: BASE_URL,
    capturedAt: new Date().toISOString().slice(0, 10),
    nav: navLinks,
    tokens: {
      bg:       tokens.bg       || '',
      text:     tokens.text     || '',
      accent:   tokens.accent   || '',
      radius:   tokens.radius   || '4px',
      'bg-nav': tokens['bg-nav'] || '',
      fontHead: tokens.fontHead  || '',
      fontBody: tokens.fontBody  || '',
    },
    assets: {
      images: [...imageFiles].sort(),
      videos: [...videoFiles].sort(),
      fonts:  [...fontFiles].sort(),
    },
    pages: Object.fromEntries(
      Object.entries(pageResults).map(([route, { sections, isPlaceholder, error }]) => [
        route,
        { sections, isPlaceholder: isPlaceholder || false, error: error || null }
      ])
    ),
  };

  await writeFile(path.join(OUT_DIR, 'capture.json'), JSON.stringify(captureJson, null, 2));
  console.log('\n✓ capture.json written');

  // ── tokens.json (shorthand for instantiate) ─────────────────────────────────
  await writeFile(path.join(OUT_DIR, 'tokens.json'), JSON.stringify(captureJson.tokens, null, 2));
  console.log('✓ tokens.json written');

  // ── CAPTURE.md ───────────────────────────────────────────────────────────────
  const placeholderPages = Object.entries(captureJson.pages)
    .filter(([, v]) => v.isPlaceholder).map(([r]) => r);

  const md = [
    `# Capture: ${SLUG}`,
    `Source: ${BASE_URL}`,
    `Date: ${captureJson.capturedAt}`,
    '',
    '## Pages crawled',
    PAGES.map(p => {
      const r = captureJson.pages[p];
      const flag = r?.isPlaceholder ? ' ⚠️ placeholder' : r?.error ? ' ❌ error' : ' ✓';
      return `- \`${p}\`${flag}`;
    }).join('\n'),
    '',
    placeholderPages.length
      ? `> ⚠️ **Placeholder pages detected:** ${placeholderPages.join(', ')}\n> Content may be incomplete — check screenshots for the real visual.\n`
      : '',
    '## Navigation (extracted)',
    navLinks.length
      ? navLinks.map(l => `- **${l.text}** → \`${l.href}\``).join('\n')
      : '_None extracted_',
    '',
    '## Assets downloaded',
    `- **Images (${imageFiles.size}):** ${[...imageFiles].slice(0, 5).join(', ')}${imageFiles.size > 5 ? ` … +${imageFiles.size - 5} more` : ''}`,
    `- **Videos (${videoFiles.size}):** ${[...videoFiles].join(', ') || 'none'}`,
    `- **Fonts  (${fontFiles.size}):** ${[...fontFiles].join(', ') || 'none'}`,
    '',
    '## Design tokens',
    '```json',
    JSON.stringify(captureJson.tokens, null, 2),
    '```',
    '',
    '## Screenshots',
    'Saved in `screenshots/` — desktop (1440px) and mobile (390px) for each page.',
    '',
    '## Page sections (extracted text)',
    ...Object.entries(captureJson.pages).flatMap(([route, { sections, isPlaceholder }]) => {
      const label = `### ${route}${isPlaceholder ? ' ⚠️' : ''}`;
      if (!sections.length) return [label, '_No sections extracted_', ''];
      return [
        label,
        ...sections.slice(0, 4).map((s, i) =>
          `**${i + 1}. ${s.heading || '(no heading)'}**\n\`\`\`\n${s.text.slice(0, 350)}\n\`\`\``
        ),
        '',
      ];
    }),
    '',
    `---`,
    `Next step: \`/wm-instantiate ${SLUG} <new-slug>\` to create a site from this capture.`,
  ].join('\n');

  await writeFile(path.join(OUT_DIR, 'CAPTURE.md'), md);
  console.log('✓ CAPTURE.md written');

  // ── Summary ───────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────────────────────');
  console.log(`✅  Capture complete: _captures/${SLUG}/`);
  console.log(`   ${imageFiles.size} images · ${videoFiles.size} videos · ${fontFiles.size} fonts`);
  console.log(`   ${PAGES.length} pages · screenshots at 1440px + 390px`);
  if (placeholderPages.length)
    console.log(`   ⚠️  Placeholder/construction pages: ${placeholderPages.join(', ')}`);
  console.log('─────────────────────────────────────────────────────\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
