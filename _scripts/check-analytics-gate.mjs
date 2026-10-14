#!/usr/bin/env node
/**
 * Analytics privacy gate (ANLY-06).
 *
 * Usage: node _scripts/check-analytics-gate.mjs <slug> [--live]
 * Exit:  0 pass or not applicable, 1 gate failure, 2 usage error / unknown slug.
 *
 * A site with analytics configured that is live (--live, stage >= 5, or a domain
 * set) must have a privacy page (any depth under src/pages) naming Plausible, with a
 * "Web analytics" heading/section, and no "no analytics" statement. Comments,
 * markdown frontmatter and script/style blocks are ignored. WM_ROOT overrides the repo root (test harness).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = process.env.WM_ROOT || join(fileURLToPath(import.meta.url), '..', '..');
const args = process.argv.slice(2);
const live = args.includes('--live');
const slug = args.find((a) => !a.startsWith('--'));

if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
  console.error('Usage: node _scripts/check-analytics-gate.mjs <slug> [--live]');
  process.exit(2);
}
const wiringPath = join(ROOT, 'sites', slug, 'wiring.json');
if (!existsSync(wiringPath)) {
  console.error(`Unknown slug: ${wiringPath} not found`);
  process.exit(2);
}

let w;
try {
  w = JSON.parse(readFileSync(wiringPath, 'utf-8'));
} catch (e) {
  console.error(`Cannot parse ${wiringPath}: ${e.message}`);
  process.exit(2);
}

const a = w.analytics || {};
if (!(a.service === 'plausible' && a.status === 'configured')) {
  console.log(`analytics not configured for ${slug}; gate not applicable`);
  process.exit(0);
}

const isLive = live || (typeof w.stage === 'number' && w.stage >= 5) ||
  (typeof w.domain === 'string' && w.domain.trim() !== '');
if (!isLive) {
  console.log(`${slug} is sandbox-only (stage ${w.stage}, no domain); gate not enforced`);
  process.exit(0);
}

const pagesDir = join(ROOT, 'sites', slug, 'src', 'pages');

// Privacy pages: privacy*/datenschutz* files anywhere under src/pages, or any file
// below a privacy*/datenschutz* directory.
const PRIV = /^(privacy|datenschutz)/i;
function walk(dir, inPriv = false) {
  const out = [];
  for (const d of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, d.name);
    if (d.isDirectory()) out.push(...walk(full, inPriv || PRIV.test(d.name)));
    else if (/\.(astro|md|mdx)$/.test(d.name) && (inPriv || PRIV.test(d.name))) out.push(full);
  }
  return out;
}
const candidates = existsSync(pagesDir) ? walk(pagesDir).sort() : [];

const fail = (msg) => {
  console.error(`\n✖  ${slug}: ${msg}`);
  process.exit(1);
};

if (candidates.length === 0) {
  fail(`analytics is configured but no privacy page (privacy*/datenschutz* .astro/.md/.mdx) exists under ${pagesDir}`);
}

// Only what a reader can see counts: drop YAML frontmatter of .md/.mdx files, HTML and
// JSX comments, JS comments, <script>/<style> blocks. (.astro frontmatter is code that
// holds the section data, so its strings stay; only its comments go.)
function visible(file, raw) {
  let t = raw.replace(/\r\n/g, '\n');
  if (/\.mdx?$/.test(file)) t = t.replace(/^---\n[\s\S]*?\n---\n?/, '');
  t = t
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|\s)\/\/[^\n]*/g, '$1')
    .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ');
  return t;
}

// An explicit claim that no analytics is used; "no cookies", "does not track you across
// websites" and "no tracking" inside other sentences must not match.
const NO_ANALYTICS = /\b(?:do(?:es)?\s+not|don't|never)\s+(?:use|run|employ|operate)\s+(?:any\s+)?(?:web\s+)?analytics\b|\bno\s+(?:web\s+)?analytics\s+(?:is|are)\s+(?:used|in use|employed)\b|\b(?:uses?|using|with)\s+no\s+(?:web\s+)?analytics\b|\bkeine\s+(?:web)?analyse(?:tools?)?\b/i;
const HEADING = /(^|\n)\s{0,3}#{1,6}\s*web analytics\b|<h[1-6][^>]*>\s*web analytics\b|['"`]\s*web analytics\s*['"`]/i;

const docs = candidates.map((f) => {
  const t = visible(f, readFileSync(f, 'utf-8'));
  return { f: relative(pagesDir, f), t, text: t.replace(/<[^>]+>/g, ' ') };
});

for (const { f, text } of docs) {
  if (NO_ANALYTICS.test(text)) fail(`${f} still states that no analytics/tracking is used`);
}
const names = candidates.map((f) => relative(pagesDir, f)).join(', ');
if (!docs.some(({ text }) => /plausible/i.test(text))) {
  fail(`no privacy page (${names}) names Plausible in its visible text`);
}
if (!docs.some(({ t, text }) => HEADING.test(t) && /plausible/i.test(text))) {
  fail(`no privacy page (${names}) has a 'Web analytics' heading/section that also names Plausible`);
}

console.log(`✔  ${slug}: privacy policy contains the Plausible 'Web analytics' section`);
process.exit(0);
