#!/usr/bin/env node
/**
 * init-prod-repo.mjs — bootstrap a production repo for contributor collaboration
 *
 * Usage:
 *   node _scripts/init-prod-repo.mjs <slug>
 *   node _scripts/init-prod-repo.mjs <slug> --confirm
 *
 * What it does:
 *   • Validates the site's wiring.json (prod_repo, domain, stage)
 *   • Creates the three auto-labels in the production repo (--force for idempotency)
 *   • Creates an orphan main branch (or works on the existing one) in a temp clone
 *   • Renders every _templates/ file (substituting {{SITE_NAME}}, {{SLUG}}, {{PROD_REPO}}, {{DOMAIN}})
 *     and writes the rendered files into the temp clone
 *   • Creates the four content collection directories with .gitkeep files
 *   • Commits and pushes main, then sets main as the default branch
 *   • Checks whether WM_DISPATCH_PAT is set in the production repo secrets and reports
 *
 * Without --confirm the script prints a dry-run plan and exits (no changes made).
 * Pass --confirm to actually execute.
 * Safe to run more than once against the same repo (idempotent by design).
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';
import { tmpdir } from 'os';

const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// ── CLI args ──────────────────────────────────────────────────────────────────
const [slug, ...rest] = process.argv.slice(2);
const CONFIRM = rest.includes('--confirm');

if (!slug) {
  console.error('\nUsage: node _scripts/init-prod-repo.mjs <slug> [--confirm]\n');
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const log  = (...a) => console.log(...a);
const info = (...a) => console.log(' ', ...a);
const ok   = (...a) => console.log(' ✓', ...a);
const warn = (...a) => console.log(' ⚠', ...a);
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };
const dry  = (...a) => !CONFIRM && console.log('  [dry]', ...a);

function run(cmd, cwd = ROOT) {
  if (!CONFIRM) {
    console.log('  [dry]', cmd);
    return;
  }
  execSync(cmd, { stdio: 'inherit', cwd });
}

/**
 * capture — always executes (read-only probe), returns trimmed stdout or null on error.
 */
function capture(cmd, cwd = ROOT) {
  try {
    return execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'], cwd }).trim();
  } catch {
    return null;
  }
}

// ── Preflight checks ──────────────────────────────────────────────────────────

// 1. gh is on PATH
if (capture('gh --version') === null) {
  fail('gh CLI not found — install it and run: gh auth login');
}

// 2. gh auth status
if (capture('gh auth status') === null) {
  fail('gh CLI is not authenticated — run: gh auth login');
}

// 3. wiring.json exists and parses
const wiringPath = join(ROOT, 'sites', slug, 'wiring.json');

if (!existsSync(wiringPath)) {
  fail(`No wiring.json found for "${slug}"`);
}

let wiring;
try {
  wiring = JSON.parse(readFileSync(wiringPath, 'utf-8'));
} catch (e) {
  fail(`Could not parse wiring.json for "${slug}": ${e.message}`);
}

// 4. prod_repo must be set
if (!wiring.prod_repo) {
  fail(`prod_repo not set in sites/${slug}/wiring.json — nothing to initialise`);
}

// 5. domain must be set
if (!wiring.domain) {
  fail(`domain not set in sites/${slug}/wiring.json`);
}

// 6. prod_repo must be in owner/repo form
if (!/^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/.test(wiring.prod_repo)) {
  fail('prod_repo must be in owner/repo form');
}

// 7. slug must match ^[a-z0-9-]+$ (interpolated into shell commands and client-payload)
if (!/^[a-z0-9-]+$/.test(slug)) {
  fail('slug must match ^[a-z0-9-]+$');
}

// 8. _templates/ must exist
const TEMPLATES_DIR = join(ROOT, '_templates');
if (!existsSync(TEMPLATES_DIR)) {
  fail('_templates/ not found — run this from the WebsiteMocker repo root');
}

// ── Substitution map ──────────────────────────────────────────────────────────

// SITE_NAME: use wiring.name if present; otherwise Title Case from slug
// Required: parrot-capital has no `name` field, so we must not render `undefined`
const SITE_NAME = wiring.name
  ? wiring.name
  : slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const PROD_REPO = wiring.prod_repo;
const DOMAIN    = wiring.domain;
const SLUG      = slug;

const TOKENS = {
  '{{SITE_NAME}}': SITE_NAME,
  '{{SLUG}}':      SLUG,
  '{{PROD_REPO}}': PROD_REPO,
  '{{DOMAIN}}':    DOMAIN,
};

// ── Template rendering ────────────────────────────────────────────────────────

/**
 * Walk _templates/ recursively and return rendered { relPath, content } objects.
 * Asserts that no rendered content still contains `{{` (catches new unsubstituted tokens).
 */
function renderTemplates() {
  const results = [];

  function walk(dir, base) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relPath  = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        walk(fullPath, relPath);
      } else {
        let content = readFileSync(fullPath, 'utf-8');
        for (const [token, value] of Object.entries(TOKENS)) {
          content = content.split(token).join(value);
        }
        // Assert no unsubstituted project placeholders remain.
        // Pattern {{[A-Z_]+}} matches our tokens (uppercase/underscore only).
        // This excludes GitHub Actions expressions like ${{ github.ref }} which
        // use lowercase letters, dots, and are preceded by $.
        const leftover = content.match(/\{\{[A-Z_-]+\}\}/);
        if (leftover) {
          fail(`Unsubstituted placeholder in ${relPath}: ${leftover[0]}`);
        }
        results.push({ relPath, content });
      }
    }
  }

  walk(TEMPLATES_DIR, '');
  return results;
}

// ── Stage gate: content-ci.yml only for stage 6 sites ────────────────────────

const STAGE_6 = (wiring.stage ?? 0) >= 6;
let rendered = renderTemplates();

if (!STAGE_6) {
  warn(`${slug} is stage ${wiring.stage ?? 0} (< 6) — installing docs, issue templates, and labels but NOT content-ci.yml`);
  rendered = rendered.filter(f => f.relPath !== '.github/workflows/content-ci.yml');
}

// ── Labels ────────────────────────────────────────────────────────────────────

const LABELS = [
  { name: 'content-request', color: '0075ca', description: 'New content item requested' },
  { name: 'design-change',   color: 'e4e669', description: 'Visual, layout, or page change requested' },
  { name: 'bug',             color: 'd73a4a', description: "Something isn't working" },
];

// ── Dry-run plan output ───────────────────────────────────────────────────────

log('');
log(`== init-prod-repo: ${slug} → ${PROD_REPO} ==`);
if (!CONFIRM) log('   (DRY RUN — no changes will be made; pass --confirm to execute)');
log('');
info(`Site name : ${SITE_NAME}`);
info(`Domain    : ${DOMAIN}`);
info(`Stage     : ${wiring.stage ?? 0}${STAGE_6 ? '' : ' (content-ci.yml will NOT be installed)'}`);
log('');
log('Steps this run will perform:');
log('');
log('  1. Create / update labels in production repo:');
for (const l of LABELS) {
  info(`     ${l.name}  (#${l.color})  "${l.description}"`);
}
log('');
log('  2. Create or update main branch (orphan if main does not yet exist):');
info(`     Clone: https://github.com/${PROD_REPO}.git`);
log('');
log('  3. Write rendered template files:');
for (const f of rendered) {
  info(`     ${f.relPath}`);
}
info('     content/news/.gitkeep');
info('     content/jobs/.gitkeep');
info('     content/announcements/.gitkeep');
info('     content/blog/.gitkeep');
log('');
log('  4. Commit and push main branch');
log('');
log('  5. Set main as the default branch:');
info(`     gh repo edit ${PROD_REPO} --default-branch main`);
log('');
log('  6. Check WM_DISPATCH_PAT secret in production repo');
log('');

if (!CONFIRM) {
  log('  Run with --confirm to actually execute:');
  log('');
  log(`  node _scripts/init-prod-repo.mjs ${slug} --confirm`);
  log('');
  process.exit(0);
}

// ── Execution path (--confirm) ────────────────────────────────────────────────

let created   = 0;
let unchanged = 0;
let updated   = 0;

// ── Step 1: Create labels (FIRST — labels must pre-exist before issue templates land) ──

log('');
log('── Step 1: Labels ──────────────────────────────────────────────────────────');

for (const l of LABELS) {
  // Check if label already exists in the repo to decide ok/warn outcome
  const existing = capture(`gh api repos/${PROD_REPO}/labels/${encodeURIComponent(l.name)} --jq .name`);
  execSync(
    `gh label create "${l.name}" --color "${l.color}" --description "${l.description}" --repo ${PROD_REPO} --force`,
    { stdio: 'inherit' }
  );
  if (existing === l.name) {
    warn(`label:${l.name} already existed — updated`);
    updated++;
  } else {
    ok(`label:${l.name} created`);
    created++;
  }
}

// ── Step 2: Create or update main branch ─────────────────────────────────────

log('');
log('── Step 2: main branch ─────────────────────────────────────────────────────');

const tmp = join(tmpdir(), `wm-init-${slug}-${Date.now()}`);
const cloneUrl = `https://github.com/${PROD_REPO}.git`;

try {
  const mainExists = capture(`gh api repos/${PROD_REPO}/branches/main --jq .name`);

  if (!mainExists) {
    info('main branch does not exist — creating orphan branch');
    run(`git clone --depth 1 ${cloneUrl} ${tmp}`);
    execSync('git checkout --orphan main', { stdio: 'inherit', cwd: tmp });
    // Only rm if the index is non-empty (truly empty repos have nothing to remove)
    const hasFiles = spawnSync('git', ['ls-files'], { cwd: tmp, encoding: 'utf-8' }).stdout.trim();
    if (hasFiles) execSync('git rm -rf . --quiet', { stdio: 'inherit', cwd: tmp });
    ok('orphan main branch created in temp clone');
    created++;
  } else {
    info('main branch exists — cloning and updating');
    execSync(`git clone --depth 1 --branch main ${cloneUrl} ${tmp}`, { stdio: 'inherit' });
    ok('existing main branch cloned');
    unchanged++;
  }

  // ── Step 3: Write rendered files ──────────────────────────────────────────

  log('');
  log('── Step 3: Template files ──────────────────────────────────────────────────');

  for (const { relPath, content } of rendered) {
    const target = join(tmp, relPath);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content, 'utf-8');
    ok(`wrote ${relPath}`);
    created++;
  }

  // Content collection directories with .gitkeep (git cannot track empty directories)
  const COLLECTIONS = ['content/news', 'content/jobs', 'content/announcements', 'content/blog'];
  for (const col of COLLECTIONS) {
    const keepPath = join(tmp, col, '.gitkeep');
    mkdirSync(dirname(keepPath), { recursive: true });
    writeFileSync(keepPath, '', 'utf-8');
    ok(`created ${col}/.gitkeep`);
    created++;
  }

  // ── Step 4: Commit and push main ──────────────────────────────────────────

  log('');
  log('── Step 4: Commit and push ──────────────────────────────────────────────────');

  // Set git identity in the temp clone
  const gitName  = capture('git config user.name')  || 'github-actions[bot]';
  const gitEmail = capture('git config user.email') || 'github-actions[bot]@users.noreply.github.com';

  // Use spawnSync with argument arrays to avoid shell injection via git identity values
  spawnSync('git', ['config', 'user.name',  gitName],  { stdio: 'inherit', cwd: tmp });
  spawnSync('git', ['config', 'user.email', gitEmail], { stdio: 'inherit', cwd: tmp });
  execSync('git add -A', { stdio: 'inherit', cwd: tmp });

  try {
    execSync(
      'git commit -m "chore: add contributor collaboration bundle (WebsiteMocker Phase 4)"',
      { stdio: 'inherit', cwd: tmp }
    );
    ok('committed collaboration bundle to main');
    created++;
  } catch {
    info('No changes to commit — working tree already matches templates (unchanged)');
    unchanged++;
  }

  execSync('git push origin main', { stdio: 'inherit', cwd: tmp });
  ok('pushed main to origin');

  // ── Step 5: Set default branch ────────────────────────────────────────────

  log('');
  log('── Step 5: Default branch ───────────────────────────────────────────────────');

  execSync(`gh repo edit ${PROD_REPO} --default-branch main`, { stdio: 'inherit' });
  ok(`${PROD_REPO}: default branch set to main`);
  created++;

  // ── Step 6: Check WM_DISPATCH_PAT secret ─────────────────────────────────

  log('');
  log('── Step 6: WM_DISPATCH_PAT secret ──────────────────────────────────────────');

  const secretList = capture(`gh secret list --repo ${PROD_REPO}`);
  if (secretList && secretList.includes('WM_DISPATCH_PAT')) {
    ok('WM_DISPATCH_PAT is set');
    unchanged++;
  } else {
    if (STAGE_6) {
      warn(`WM_DISPATCH_PAT is NOT set in ${PROD_REPO}`);
      warn('  The automated content sync will NOT fire until the secret is set.');
      warn('  Set it with:');
      warn(`    gh secret set WM_DISPATCH_PAT --body "<token>" --repo ${PROD_REPO}`);
      warn(`  Run /wm-init-collab ${slug} — it walks you through creating the fine-grained token`);
    }
  }

} finally {
  // Clean up temp directory — runs even if a step throws
  rmSync(tmp, { recursive: true, force: true });
}

// ── Summary ───────────────────────────────────────────────────────────────────

log('');
log('════════════════════════════════════════════════════════════════════════════');
log(`  ${PROD_REPO} is now contributor-ready`);
log(`  created: ${created}  unchanged: ${unchanged}  updated: ${updated}`);
log('');
log('  Next step:');
log(`  Push a test .md file to content/news/ in ${PROD_REPO} via the GitHub web UI`);
log(`  and watch the Actions tab of https://github.com/${PROD_REPO}`);
log('════════════════════════════════════════════════════════════════════════════');
log('');
