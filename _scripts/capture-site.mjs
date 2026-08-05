#!/usr/bin/env node
/**
 * capture-site.mjs  –  WebsiteMocker asset downloader + design DNA extractor
 *
 * Usage:
 *   node _scripts/capture-site.mjs <url> <slug> [page1,page2,...]
 *
 * Examples:
 *   node _scripts/capture-site.mjs https://www.starflight-dynamics.com sfdy
 *   node _scripts/capture-site.mjs https://crestworks.co crestworks /,/services,/contact
 *
 * What it does:
 *   1. Launches a real Chromium browser (Playwright) so Wix/React SPAs fully render
 *   2. Crawls each page, waiting for network idle
 *   3. Intercepts every response – downloads images, videos, fonts, SVGs
 *   4. Extracts rendered text per section for CAPTURE.md
 *   5. Samples computed CSS on key elements → tokens.json design system
 *   6. Takes full-page screenshots for visual reference
 *   7. Writes _captures/<slug>/CAPTURE.md + tokens.json
 */

import { chromium } from 'playwright';
import { mkdir, writeFile, readFile } from 'fs/promises';
import { createWriteStream, existsSync } from 'fs';
import { pipeline } from 'stream/promises';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── Args ────────────────────────────────────────────────────────────────────
const [,, SITE_URL, SLUG, pagesArg] = process.argv;

if (!SITE_URL || !SLUG) {
  console.error('Usage: node capture-site.mjs <url> <slug> [page1,page2,...]');
  process.exit(1);
}

const BASE_URL = SITE_URL.replace(/\/$/, '');
const DEFAULT_PAGES = ['/', '/investors', '/careers', '/news', '/imprint', '/privacy-policy'];
const PAGES = pagesArg ? pagesArg.split(',') : DEFAULT_PAGES;

const OUT_DIR    = path.join(ROOT, '_captures', SLUG);
const ASSETS_DIR = path.join(OUT_DIR, 'assets');
const SHOTS_DIR  = path.join(OUT_DIR, 'screenshots');

// ─── Asset filter ─────────────────────────────────────────────────────────────
const MEDIA_RE = /\.(jpg|jpeg|png|gif|webp|avif|svg|mp4|webm|mov|otf|ttf|woff|woff2)(\?|$)/i;
const SKIP_RE  = /\/(node_modules|chunk|_next|static\/js|static\/css|favicon)\//;

// ─── Helpers ──────────────────────────────────────────────────────────────────
async function ensureDirs() {
  for (const d of [OUT_DIR, ASSETS_DIR, SHOTS_DIR]) {
    await mkdir(d, { recursive: true });
  }
}

/** Sanitise a URL into a local filename */
function urlToFilename(rawUrl) {
  try {
    const u = new URL(rawUrl);
    // strip query / fragment, keep the last meaningful path segment
    const seg = u.pathname.split('/').filter(Boolean).slice(-3).join('_');
    const ext  = path.extname(u.pathname).split('?')[0] || '';
    return seg.replace(/[^a-z0-9_\-.]/gi, '_').slice(0, 120) + (ext && !seg.endsWith(ext) ? ext : '');
  } catch {
    return null;
  }
}

/** Download a URL to a local file, return local path or null */
async function downloadAsset(rawUrl, destDir) {
  const filename = urlToFilename(rawUrl);
  if (!filename) return null;

  const dest = path.join(destDir, filename);
  if (existsSync(dest)) return dest; // already downloaded

  return new Promise((resolve) => {
    const proto = rawUrl.startsWith('https') ? https : http;
    const req = proto.get(rawUrl, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        downloadAsset(res.headers.location, destDir).then(resolve);
        return;
      }
      if (res.statusCode !== 200) { resolve(null); return; }
      const stream = createWriteStream(dest);
      pipeline(res, stream).then(() => resolve(dest)).catch(() => resolve(null));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(15000, () => { req.destroy(); resolve(null); });
  });
}

/** Extract design tokens from the rendered page */
async function extractTokens(page) {
  return page.evaluate(() => {
    const el  = (sel) => document.querySelector(sel);
    const cs  = (node) => node ? getComputedStyle(node) : null;
    const px  = (v)    => v;

    const body  = cs(el('body'));
    const nav   = cs(el('header, nav, [class*="nav"], [class*="header"]'));
    const h1    = cs(el('h1'));
    const h2    = cs(el('h2'));
    const hero  = cs(el('[class*="hero"], [class*="Hero"], section:first-of-type'));
    const btn   = cs(el('button, [class*="btn"], [class*="cta"]'));
    const card  = cs(el('[class*="card"], [class*="Card"], article'));

    const bg    = body?.backgroundColor || '';
    const text  = body?.color || '';
    const font  = h1?.fontFamily || body?.fontFamily || '';
    const accent = btn?.backgroundColor || btn?.color || '';
    const radius = btn?.borderRadius || card?.borderRadius || '0px';
    const navBg  = nav?.backgroundColor || '';

    return { bg, text, font, accent, radius, navBg,
      fontHead: h1?.fontFamily || font,
      fontBody: body?.fontFamily || font };
  });
}

/** Walk the DOM and return sections of text content */
async function extractPageContent(page) {
  return page.evaluate(() => {
    const sections = [];
    // Wix uses specific section containers
    const containers = document.querySelectorAll(
      'section, [class*="section"], [data-testid*="section"], ' +
      '[class*="container"], main > div > div'
    );
    const seen = new Set();
    for (const el of containers) {
      const text = (el.innerText || '').trim().slice(0, 800);
      if (!text || seen.has(text.slice(0, 40))) continue;
      seen.add(text.slice(0, 40));
      sections.push(text);
    }
    return sections;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  await ensureDirs();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36',
  });

  // Asset catalogue: url → local filename
  const assetMap   = new Map(); // url → local dest
  const videoUrls  = new Set();
  const fontUrls   = new Set();
  const imageUrls  = new Set();
  const pageData   = {};
  let   tokens     = {};

  // ── Intercept every network response ────────────────────────────────────────
  context.on('response', async (resp) => {
    const url = resp.url();
    if (!MEDIA_RE.test(url) || SKIP_RE.test(url)) return;
    if (assetMap.has(url)) return;

    const isVideo = /\.(mp4|webm|mov)(\?|$)/i.test(url);
    const isFont  = /\.(otf|ttf|woff2?)(\?|$)/i.test(url);

    // Mark before async download to prevent duplicates
    assetMap.set(url, null);

    const dest = await downloadAsset(url, ASSETS_DIR);
    if (dest) {
      assetMap.set(url, dest);
      const label = path.basename(dest);
      if (isVideo) { videoUrls.add(label); console.log(`  📹 video  ${label}`); }
      else if (isFont) { fontUrls.add(label); console.log(`  🔤 font   ${label}`); }
      else { imageUrls.add(label); console.log(`  🖼  image  ${label}`); }
    }
  });

  // ── Crawl each page ──────────────────────────────────────────────────────────
  for (const route of PAGES) {
    const fullUrl = BASE_URL + route;
    console.log(`\n→ ${fullUrl}`);

    const page = await context.newPage();
    try {
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 45000 });

      // Extra wait for Wix SPAs that lazy-load after networkidle
      await page.waitForTimeout(3000);

      // Scroll to trigger lazy-loaded images/videos
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(1000);

      // Screenshot
      const shotName = route === '/' ? 'home' : route.replace(/\//g, '_').replace(/^_/, '');
      const shotPath = path.join(SHOTS_DIR, `${shotName}.png`);
      await page.screenshot({ path: shotPath, fullPage: true });
      console.log(`  📸 screenshot saved`);

      // Tokens (once, from homepage)
      if (route === '/' && Object.keys(tokens).length === 0) {
        tokens = await extractTokens(page);
        console.log(`  🎨 tokens extracted`);
      }

      // Text content
      const sections = await extractPageContent(page);
      pageData[route] = sections;

    } catch (err) {
      console.error(`  ⚠  ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // ── Write tokens.json ────────────────────────────────────────────────────────
  const tokensOut = {
    bg:         tokens.bg        || '',
    text:       tokens.text      || '',
    accent:     tokens.accent    || '',
    radius:     tokens.radius    || '0px',
    'bg-nav':   tokens.navBg     || '',
    'font-head': tokens.fontHead || '',
    'font-body': tokens.fontBody || '',
    _assets: {
      images: [...imageUrls].sort(),
      videos: [...videoUrls].sort(),
      fonts:  [...fontUrls].sort(),
    },
  };
  await writeFile(path.join(OUT_DIR, 'tokens.json'), JSON.stringify(tokensOut, null, 2));
  console.log('\n✓ tokens.json written');

  // ── Write CAPTURE.md ─────────────────────────────────────────────────────────
  const captureLines = [
    `# Capture: ${SLUG}`,
    `Source: ${BASE_URL}`,
    `Date: ${new Date().toISOString().slice(0, 10)}`,
    `Framework: detected via Playwright crawl`,
    '',
    '## Pages crawled',
    PAGES.map(p => `- \`${p}\``).join('\n'),
    '',
    '## Assets downloaded',
    `- **Images (${imageUrls.size}):** ${[...imageUrls].slice(0, 6).join(', ')}${imageUrls.size > 6 ? ', …' : ''}`,
    `- **Videos (${videoUrls.size}):** ${[...videoUrls].join(', ') || 'none'}`,
    `- **Fonts (${fontUrls.size}):** ${[...fontUrls].join(', ') || 'none'}`,
    '',
    '## Design tokens (from computed styles)',
    '```json',
    JSON.stringify({ bg: tokens.bg, text: tokens.text, accent: tokens.accent,
      radius: tokens.radius, fontHead: tokens.fontHead }, null, 2),
    '```',
    '',
    '## Page content (extracted sections)',
  ];

  for (const [route, sections] of Object.entries(pageData)) {
    captureLines.push(`\n### ${route}`);
    sections.slice(0, 5).forEach((s, i) => {
      captureLines.push(`**Section ${i + 1}:**\n\`\`\`\n${s.slice(0, 400)}\n\`\`\``);
    });
  }

  await writeFile(path.join(OUT_DIR, 'CAPTURE.md'), captureLines.join('\n'));
  console.log('✓ CAPTURE.md written');

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n─────────────────────────────────────');
  console.log(`Capture complete: _captures/${SLUG}/`);
  console.log(`  ${imageUrls.size} images, ${videoUrls.size} videos, ${fontUrls.size} fonts`);
  console.log(`  Screenshots: ${SHOTS_DIR}`);
  console.log('─────────────────────────────────────');
}

main().catch((e) => { console.error(e); process.exit(1); });
