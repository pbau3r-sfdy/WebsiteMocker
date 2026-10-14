#!/usr/bin/env node
/**
 * Analytics privacy gate (ANLY-06).
 *
 * Usage: node _scripts/check-analytics-gate.mjs <slug> [--live]
 * Exit:  0 pass or not applicable, 1 gate failure, 2 usage error / unknown slug.
 *
 * A site with analytics configured that is live (--live, stage >= 5, or a domain
 * set) must have a privacy page naming Plausible with a "Web analytics" section
 * and no "no analytics" statement. WM_ROOT overrides the repo root (test harness).
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
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
const candidates = existsSync(pagesDir)
  ? readdirSync(pagesDir).filter((f) => /^(privacy|datenschutz)/.test(f) && /\.(astro|md)$/.test(f))
  : [];

const fail = (msg) => {
  console.error(`\n✖  ${slug}: ${msg}`);
  process.exit(1);
};

if (candidates.length === 0) {
  fail(`analytics is configured but no privacy page (privacy*/datenschutz* .astro/.md) exists in ${pagesDir}`);
}

const texts = candidates.map((f) => ({ f, t: readFileSync(join(pagesDir, f), 'utf-8') }));
const NO_ANALYTICS = /\b(no|without)\s+(web\s+)?(analytics|tracking)\b|does not use (any )?(analytics|tracking)|keine\s+(web)?analyse/i;

for (const { f, t } of texts) {
  if (NO_ANALYTICS.test(t)) fail(`${f} still states that no analytics/tracking is used`);
}
if (!texts.some(({ t }) => /plausible/i.test(t))) {
  fail(`no privacy page (${candidates.join(', ')}) names Plausible`);
}
if (!texts.some(({ t }) => /web analytics/i.test(t))) {
  fail(`no privacy page (${candidates.join(', ')}) contains the 'Web analytics' section`);
}

console.log(`✔  ${slug}: privacy policy contains the Plausible 'Web analytics' section`);
process.exit(0);
