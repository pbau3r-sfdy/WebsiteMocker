# Phase 4: Collaboration Infrastructure - Pattern Map

**Mapped:** 2026-08-20
**Files analyzed:** 9 new/modified files
**Analogs found:** 9 / 9 (all files have at least a role-match analog)

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `.github/workflows/publish.yml` | workflow | event-driven + request-response | `.github/workflows/publish.yml` (self) | exact — adding a second trigger to existing file |
| `.claude/skills/wm-publish.md` | skill-doc | request-response | `.claude/skills/wm-publish.md` (self) | exact — appending a Notes section |
| `_templates/CONTRIBUTING.md` | documentation | N/A | `CLAUDE.md` | role-match (operator-facing structured doc) |
| `_templates/.github/ISSUE_TEMPLATE/content-request.yml` | config | event-driven | none in this repo | no analog — use RESEARCH.md pattern |
| `_templates/.github/ISSUE_TEMPLATE/design-change.yml` | config | event-driven | none in this repo | no analog — use RESEARCH.md pattern |
| `_templates/.github/ISSUE_TEMPLATE/bug-report.yml` | config | event-driven | none in this repo | no analog — use RESEARCH.md pattern |
| `_templates/.github/ISSUE_TEMPLATE/config.yml` | config | N/A | none in this repo | no analog — use RESEARCH.md pattern |
| `_templates/.github/workflows/content-ci.yml` | workflow-template | event-driven | `.github/workflows/deploy.yml` | role-match (workflow structure + concurrency pattern) |
| `_scripts/init-prod-repo.mjs` | utility-script | batch | `_scripts/archive-site.mjs` + `_scripts/import-site.mjs` | role-match (Node ESM script with gh CLI calls) |

---

## Pattern Assignments

### `.github/workflows/publish.yml` (workflow, event-driven + request-response)

**Analog:** Self — add `repository_dispatch` trigger alongside existing `workflow_dispatch`

**Current trigger block** (`publish.yml` lines 1–9) — replace this entire `on:` block:
```yaml
name: Publish to Production

on:
  workflow_dispatch:
    inputs:
      slug:
        description: 'Site slug to publish (e.g. sfdy-alt-clean)'
        required: true
        type: string
  repository_dispatch:
    types: [content-updated]
```

**Concurrency pattern** (`publish.yml` lines 13–15) — update group key to handle both trigger sources:
```yaml
concurrency:
  group: publish-${{ github.event_name == 'repository_dispatch' && github.event.client_payload.slug || inputs.slug }}
  cancel-in-progress: false
```

**New slug-resolution step** — insert as the FIRST step under `steps:`, before Checkout, referencing RESEARCH.md Pattern 1:
```yaml
      - name: Resolve slug
        id: slug-step
        run: |
          if [ "${{ github.event_name }}" = "repository_dispatch" ]; then
            SLUG="${{ github.event.client_payload.slug }}"
          else
            SLUG="${{ inputs.slug }}"
          fi
          if [ -z "$SLUG" ]; then
            echo "Error: slug is empty"; exit 1
          fi
          echo "slug=$SLUG" >> $GITHUB_OUTPUT
```

**Existing slug validation step** (`publish.yml` lines 43–68) — the `node -e` block already validates against `^[a-z0-9-]+$`. Replace `process.env.SLUG` source to use the resolved step output:
```yaml
        env:
          SLUG: ${{ steps.slug-step.outputs.slug }}
```
Apply this `env:` substitution on every subsequent step that currently uses `${{ inputs.slug }}` (Build site, Inject CNAME, Swap robots.txt, Push to production, Update wiring.json).

**New content-sync step** — insert AFTER the Install dependencies step and BEFORE the Build site step. Only runs on `repository_dispatch`:
```yaml
      - name: Sync content from production repo (automated trigger only)
        if: github.event_name == 'repository_dispatch'
        run: |
          PROD_REPO="${{ steps.wiring.outputs.prod_repo }}"
          SLUG="${{ steps.slug-step.outputs.slug }}"
          git clone --depth 1 --branch main \
            "https://github.com/${PROD_REPO}.git" /tmp/prod-content
          mkdir -p "sites/${SLUG}/src/content"
          cp -rT /tmp/prod-content/content/ "sites/${SLUG}/src/content/"
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add "sites/${SLUG}/src/content/"
          git commit -m "chore(${SLUG}): sync content from production repo" || echo "No content changes"
          git remote set-url origin \
            "https://x-access-token:${{ secrets.WM_PUBLISH_PAT }}@github.com/${{ github.repository }}.git"
          git push origin main
```

**Critical ordering constraint** (`publish.yml` lines 114–115) — the `git remote set-url origin` that resets origin back to WebsiteMocker MUST come AFTER the JamesIves deploy step (which overwrites origin to point to the production repo). The content-sync step above also sets remote URL, but only before the build — this is safe because JamesIves runs after the build and will overwrite it again. The final remote reset in "Update wiring.json" (lines 114–115) must remain the last remote operation.

---

### `.claude/skills/wm-publish.md` (skill-doc, request-response)

**Analog:** Self — existing file ends at line 85. Append a new section.

**Existing Notes section pattern** (`wm-publish.md` lines 82–85) — follow the same bullet style:
```markdown
## Notes
- Only works for sites at stage 5 (all preflight checks must pass before triggering)
- `WM_PUBLISH_PAT` must be stored as a repo-level Actions secret before this skill can succeed
- Check workflow status anytime: `gh run list --workflow publish.yml --limit 5`
- Re-deploying an already-live site (stage 6) is safe — publish.yml is idempotent; CNAME and robots.txt are re-written on every run
```

**New section to append** — mirror the Notes bullet style, add a `## WM_DISPATCH_PAT Setup` section:
```markdown
## WM_DISPATCH_PAT Setup (required for automated content rebuilds)

Content contributors push `.md` files to a production repo's `main` branch. The production
repo's `content-ci.yml` then dispatches `publish.yml` automatically. This requires a separate
fine-grained PAT stored in each production repo — NOT the full `WM_PUBLISH_PAT`.

### Create the token
1. GitHub Settings → Developer settings → Fine-grained personal access tokens → Generate new token
2. Name: `WM_DISPATCH_PAT`
3. Resource owner: `pbau3r-sfdy`
4. Repository access: Only select repositories → `pbau3r-sfdy/WebsiteMocker`
5. Permissions → Repository permissions → Contents: **Read and write**
6. Expiration: 1 year (set a calendar reminder to renew)

### Store in each production repo
For each production repo (`starflight-dynamics`, `mogwai-systems`, `parrot-capital`, `crestworks`):
```bash
gh secret set WM_DISPATCH_PAT --body "<paste token>" --repo pbau3r-sfdy/<slug>
```

### Why not reuse WM_PUBLISH_PAT?
`WM_PUBLISH_PAT` is a Classic PAT with `repo` scope — it can push to any `pbau3r-sfdy/*` repo.
Storing it in a production repo would give a contributor who modifies `content-ci.yml` the ability
to push to all production repos. `WM_DISPATCH_PAT` (fine-grained, `contents: write` on WebsiteMocker only)
limits the blast radius to triggering builds only.
```

---

### `_templates/CONTRIBUTING.md` (documentation, N/A)

**Analog:** `CLAUDE.md` (lines 1–40) — structured operator-facing documentation using tables, code blocks, and clear section headers. Copy the heading hierarchy and table-first approach.

**CLAUDE.md heading/table pattern** (lines 1–20):
```markdown
# CLAUDE.md — WebsiteMocker

Skill-driven monorepo for creating, iterating, and deploying branded static websites.

## Purpose

**WebsiteMocker is the sandbox.** ...

## Site categories

| Category | `wiring.json` flag | Dashboard section | Perf tracked |
|---|---|---|---|
```

**Apply to CONTRIBUTING.md** — use H1 with site name, lead sentence, then two-tier table, then inline code blocks for file naming conventions. Template variables to fill at `init-prod-repo.mjs` time: `SITE_NAME`, `REPO_SLUG`.

---

### `_templates/.github/workflows/content-ci.yml` (workflow-template, event-driven)

**Analog:** `.github/workflows/deploy.yml` — same workflow skeleton, same `concurrency:` block style, same `actions/checkout@v7` version, same `runs-on: ubuntu-latest`, same `timeout-minutes:` pattern.

**Concurrency pattern from `deploy.yml`** (lines 14–16):
```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```
Adapt for content-ci:
```yaml
concurrency:
  group: content-ci-${{ github.ref }}
  cancel-in-progress: true   # content-ci: cancel superseded pushes; unlike publish, losing a queued trigger is acceptable
```

**Workflow header pattern from `deploy.yml`** (lines 1–8):
```yaml
name: Deploy WebsiteMocker to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

# Branch-based deployment via JamesIves/github-pages-deploy-action.
```
Adapt for content-ci — only the `push` trigger with `paths:` filter, no `workflow_dispatch`:
```yaml
name: Content CI

on:
  push:
    branches: [main]
    paths:
      - 'content/**/*.md'
```

**Step structure from `deploy.yml`** (lines 26–58) — content-ci has a single step (no checkout, no node setup), using only the `peter-evans/repository-dispatch@v4` action. No need to mirror the multi-step pattern from deploy.yml. The content-ci job is minimal by design.

---

### `_scripts/init-prod-repo.mjs` (utility-script, batch)

**Primary analog:** `_scripts/archive-site.mjs` — shared file header, CLI arg parsing, helpers pattern, wiring.json read pattern, exit-on-error pattern.

**Script header pattern from `archive-site.mjs`** (lines 1–16):
```javascript
#!/usr/bin/env node
/**
 * archive-site.mjs — permanently archive a site in its wiring.json
 *
 * Usage:
 *   node _scripts/archive-site.mjs <slug>
 *   node _scripts/archive-site.mjs <slug> "reason text"
 *
 * What it does:
 *   • Sets archived: true, archived_at: <today>, archive_reason: <reason>
 *   ...
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
```

**Secondary analog for step-logging pattern:** `_scripts/import-site.mjs` (lines 73–84) — the `log/info/ok/warn/fail` helper set and `run()` wrapper that calls `execSync`:
```javascript
const log   = (...a) => console.log(...a);
const info  = (...a) => console.log(' ', ...a);
const ok    = (...a) => console.log(' ✓', ...a);
const warn  = (...a) => console.log(' ⚠', ...a);
const fail  = (...a) => { console.error(' ✖', ...a); process.exit(1); };

function run(cmd, cwd = ROOT) {
  if (DRY_RUN) { dry(`${cmd}  [${cwd.replace(ROOT, '.')}]`); return; }
  execSync(cmd, { stdio: 'inherit', cwd, ... });
}
```

**wiring.json read pattern from `archive-site.mjs`** (lines 32–45):
```javascript
const wiringPath = join(resolve('sites'), slug, 'wiring.json');

if (!existsSync(wiringPath)) {
  console.error(`\n✖  No wiring.json found for "${slug}"\n`);
  process.exit(1);
}

let wiring;
try {
  wiring = JSON.parse(readFileSync(wiringPath, 'utf-8'));
} catch (e) {
  console.error(`\n✖  Could not parse wiring.json for "${slug}": ${e.message}\n`);
  process.exit(1);
}
```

**Dry-run + --confirm guard from `delete-site.mjs`** (lines 22–48) — init-prod-repo.mjs should default to dry-run (show commands without executing) and require `--confirm` to actually run `gh` CLI commands:
```javascript
const [slug, flag] = process.argv.slice(2);
const confirmed = flag === '--confirm';

if (!confirmed) {
  console.log('\n  Run with --confirm to actually execute:\n');
  console.log(`  node _scripts/init-prod-repo.mjs ${slug} --confirm\n`);
  process.exit(0);
}
```

**Template file write pattern from `import-site.mjs`** (lines 90–93) — use `writeFileSync` directly for writing template files (CONTRIBUTING.md, content-ci.yml, issue templates) into the temp clone:
```javascript
function writeJSON(p, obj) {
  if (DRY_RUN) { dry(`write ${p.replace(ROOT, '.')}`); return; }
  writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}
```
Adapt for plain text files: `writeFileSync(path, content, 'utf-8')`.

**ROOT resolution from `import-site.mjs`** (lines 43–44):
```javascript
import { fileURLToPath } from 'url';
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');
```
Use this same pattern in init-prod-repo.mjs to locate `_templates/` relative to the script.

---

## Shared Patterns

### Workflow Structure
**Source:** `.github/workflows/publish.yml` lines 11–21 and `.github/workflows/deploy.yml` lines 13–22
**Apply to:** `_templates/.github/workflows/content-ci.yml`
```yaml
# No permissions block for content-ci.yml — WM_DISPATCH_PAT is the only auth
concurrency:
  group: content-ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  dispatch-publish:
    runs-on: ubuntu-latest
    timeout-minutes: 5
```

### Slug Validation (retain in publish.yml)
**Source:** `.github/workflows/publish.yml` lines 47–49 — slug regex guard
**Apply to:** publish.yml `Read and validate wiring.json` step — this guard already exists and MUST be retained when adding the `repository_dispatch` trigger path; the slug from `client_payload` is user-controlled and must pass the same `^[a-z0-9-]+$` check
```javascript
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('Error: slug must match ^[a-z0-9-]+$');
  process.exit(1);
}
```

### Git Remote Reset After JamesIves (retain + ordering guard)
**Source:** `.github/workflows/publish.yml` lines 113–119
**Apply to:** Any new content-sync step in publish.yml — the content-sync step also does a `git remote set-url origin` but that must happen BEFORE JamesIves. The existing reset in "Update wiring.json" (after JamesIves) must remain in place and must be the LAST remote operation.
```yaml
          # Reset origin back to WebsiteMocker — JamesIves rewrites it to the production repo
          git remote set-url origin "https://x-access-token:${{ secrets.WM_PUBLISH_PAT }}@github.com/${{ github.repository }}.git"
```

### Checkout with PAT + persist-credentials: false
**Source:** `.github/workflows/publish.yml` lines 23–32
**Apply to:** publish.yml (already in place — do not change this; the new content-sync step relies on the PAT-authenticated checkout being established first)
```yaml
      - name: Checkout
        uses: actions/checkout@v7
        with:
          token: ${{ secrets.WM_PUBLISH_PAT }}
          persist-credentials: false
```

### Node ESM Script File Header
**Source:** `_scripts/archive-site.mjs` lines 1–16 and `_scripts/import-site.mjs` lines 1–29
**Apply to:** `_scripts/init-prod-repo.mjs`
Pattern: shebang + JSDoc block (name, usage, options, what it does), then imports, then CLI arg parse, then helpers.

---

## No Analog Found

Files with no close match in the codebase (use RESEARCH.md patterns directly):

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `_templates/.github/ISSUE_TEMPLATE/content-request.yml` | config | event-driven | No GitHub YAML issue forms exist in this repo — no `.github/ISSUE_TEMPLATE/` directory |
| `_templates/.github/ISSUE_TEMPLATE/design-change.yml` | config | event-driven | Same — no issue template precedent in this repo |
| `_templates/.github/ISSUE_TEMPLATE/bug-report.yml` | config | event-driven | Same |
| `_templates/.github/ISSUE_TEMPLATE/config.yml` | config | N/A | Same |

**Substitute:** Use RESEARCH.md Pattern 3 (lines 242–282) which contains the full verified YAML issue form syntax from official GitHub docs. The planner should copy those patterns verbatim.

---

## Metadata

**Analog search scope:** `.github/workflows/`, `_scripts/`, `.claude/skills/`, `CLAUDE.md`
**Files scanned:** 8 source files read in full
**Pattern extraction date:** 2026-08-20
