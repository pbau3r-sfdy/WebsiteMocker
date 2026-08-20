/**
 * build-single.mjs — single-site production build wrapper
 *
 * Usage:
 *   node _scripts/build-single.mjs <slug>
 *
 * Validates the slug exists in sites/, then delegates to build-all.js
 * which already supports single-site filtering via process.argv[2].
 *
 * Environment variables (set by publish.yml before calling this script):
 *   SITE_URL   — production origin, e.g. https://www.starflight-dynamics.com
 *   SITE_BASE  — production base path, e.g. /
 */

import { execSync }    from 'child_process';
import { fileURLToPath } from 'url';
import { join }        from 'path';
import { existsSync }  from 'fs';

// Always resolve paths relative to this script, not CWD
const root = join(fileURLToPath(import.meta.url), '..', '..');

const slug = process.argv[2];

if (!slug) {
  console.error('Usage: node _scripts/build-single.mjs <slug>');
  process.exit(1);
}

const siteDir = join(root, 'sites', slug);
if (!existsSync(siteDir)) {
  console.error(`Error: site "${slug}" not found in sites/`);
  process.exit(1);
}

// Delegate to build-all.js as a subprocess so stdio inheritance works correctly.
// build-all.js already handles single-site mode via process.argv[2] and exits 1
// if the site is not found — but we've already validated above for a cleaner error.
execSync(`node ${join(root, '_scripts/build-all.js')} ${slug}`, {
  stdio: 'inherit',
  env: { ...process.env },
  cwd: root,
});
