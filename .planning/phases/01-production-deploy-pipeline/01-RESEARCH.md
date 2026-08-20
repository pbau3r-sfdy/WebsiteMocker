# Phase 1: Production Deploy Pipeline — Research

**Phase:** 1 — Production Deploy Pipeline
**Researched:** 2026-08-20
**Requirements:** DEPLOY-01 through DEPLOY-08
**Mode:** MVP (vertical slice — one working end-to-end deploy)

---

## ## RESEARCH COMPLETE

---

## Summary

Phase 1 delivers a single command (`/wm-publish <slug>`) that takes a stage-5 site to a live GitHub Pages URL on its production repo. The implementation is a thin three-layer stack: a Claude skill (validation + trigger), a GitHub Actions workflow (build + push + wiring update), and a Node.js build script (single-site build). All patterns already exist in this repo — the work is composing and extending them.

---

## 1. JamesIves/github-pages-deploy-action — Cross-Repo Push

The action already used in `deploy.yml` (`JamesIves/github-pages-deploy-action@v4.8.0`) supports cross-repo push via two parameters:
- `token:` — accepts a PAT instead of `GITHUB_TOKEN`
- `repository:` — target repo in `owner/name` format

**Pattern for publish.yml:**
```yaml
- uses: JamesIves/github-pages-deploy-action@v4.8.0
  with:
    token: ${{ secrets.WM_PUBLISH_PAT }}
    repository: ${{ steps.wiring.outputs.prod_repo }}   # e.g. pbau3r-sfdy/starflight-dynamics
    folder: dist/${{ inputs.slug }}
    branch: gh-pages
    clean: true
    single-commit: true
```

The PAT must have `repo` scope (Classic PAT). Fine-grained PATs do NOT work for cross-repo pushes to repos you own but outside the token's originating repo — use Classic. `WM_PUBLISH_PAT` is already the agreed name (D-05).

**CNAME placement:** The action pushes the entire `folder` content to the branch root. So writing `dist/<slug>/CNAME` before the action step automatically lands CNAME at the gh-pages branch root. No special config needed (D-07 is straightforward).

---

## 2. build-single.mjs — Implementation Approach

`build-all.js` already supports single-site filtering via `process.argv[2]`. The simplest `build-single.mjs` re-uses this:

```js
// _scripts/build-single.mjs
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs';

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

// Delegate to build-all.js with the slug argument (already supported)
execSync(`node ${join(root, '_scripts/build-all.js')} ${slug}`, {
  stdio: 'inherit',
  env: { ...process.env }
});
```

**Alternative:** Call `build-all.js` with the slug arg — it already handles single-site builds and copies output to `dist/<slug>/`. Thin wrapper = less surface area to maintain. The planner/executor can choose either approach; the delegation pattern is simpler.

**DEPLOY-06 requirement:** `publish.yml` uses `build-single.mjs <slug>` — this creates `dist/<slug>/` which the deploy action then pushes.

---

## 3. publish.yml Structure

Based on `deploy.yml` as template. Full step sequence for `publish.yml`:

```yaml
name: Publish to Production

on:
  workflow_dispatch:
    inputs:
      slug:
        description: 'Site slug (e.g. sfdy-alt-clean)'
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
      # 1. Checkout
      - uses: actions/checkout@v7
        with:
          token: ${{ secrets.WM_PUBLISH_PAT }}   # needed for commit-back step

      # 2. Node
      - uses: actions/setup-node@v7
        with:
          node-version: '22'
          cache: npm

      # 3. Install
      - run: npm ci --no-fund --no-audit

      # 4. Read wiring.json (validate + extract)
      - name: Read and validate wiring.json
        id: wiring
        run: |
          node -e "
            const w = JSON.parse(require('fs').readFileSync('sites/${{ inputs.slug }}/wiring.json'));
            if (w.stage < 5) { console.error('stage < 5'); process.exit(1); }
            if (!w.domain)   { console.error('domain missing'); process.exit(1); }
            if (!w.prod_repo){ console.error('prod_repo missing'); process.exit(1); }
            console.log('domain=' + w.domain);
            console.log('prod_repo=' + w.prod_repo);
          " >> $GITHUB_OUTPUT

      # 5. Build single site
      - run: node _scripts/build-single.mjs ${{ inputs.slug }}

      # 6. Inject CNAME
      - run: echo "${{ steps.wiring.outputs.domain }}" > dist/${{ inputs.slug }}/CNAME

      # 7. Swap robots.txt
      - run: printf 'User-agent: *\nAllow: /\n' > dist/${{ inputs.slug }}/robots.txt

      # 8. Push to production repo gh-pages
      - uses: JamesIves/github-pages-deploy-action@v4.8.0
        with:
          token: ${{ secrets.WM_PUBLISH_PAT }}
          repository: ${{ steps.wiring.outputs.prod_repo }}
          folder: dist/${{ inputs.slug }}
          branch: gh-pages
          clean: true
          single-commit: true

      # 9. Update wiring.json and commit back to main
      - name: Update wiring.json (stage 6, last_deploy)
        run: |
          node -e "
            const fs = require('fs');
            const path = 'sites/${{ inputs.slug }}/wiring.json';
            const w = JSON.parse(fs.readFileSync(path));
            w.stage = 6;
            w.last_deploy = new Date().toISOString().slice(0,10);
            w.prod_repo = '${{ steps.wiring.outputs.prod_repo }}';
            fs.writeFileSync(path, JSON.stringify(w, null, 2) + '\n');
          "
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add sites/${{ inputs.slug }}/wiring.json
          git commit -m "chore(${{ inputs.slug }}): mark stage 6, live" || echo "No changes"
          git push
```

**Commit-back note (D-08):** The checkout in step 1 must use `WM_PUBLISH_PAT` (not `GITHUB_TOKEN`) so git push back to the WebsiteMocker repo's `main` branch succeeds. This is a common pattern — same PAT, two uses.

---

## 4. /wm-publish Skill Structure

The `/wm-publish` skill is a Claude Code skill file in `.claude/skills/wm-publish.md`. Following the existing skill pattern (see `wm-deploy.md`):

```markdown
# /wm-publish

Build and publish a stage-5 site to its production GitHub Pages URL.

## Steps

1. Read `sites/<slug>/wiring.json` — confirm stage ≥ 5, domain, prod_repo are set.
2. Run `/wm-preflight <slug>` — block on any FAIL items.
3. Trigger publish.yml:
   ```bash
   gh workflow run publish.yml --field slug=<slug>
   ```
4. Wait for workflow completion:
   ```bash
   gh run watch $(gh run list --workflow publish.yml --limit 1 --json databaseId -q '.[0].databaseId')
   ```
5. If workflow succeeded: print DNS guide (see below) and report live URL.
6. If workflow failed: surface the failure log URL.

## DNS Guide (inline output)

Print after successful deploy:
- CNAME record: `www → <slug>.pbau3r-sfdy.github.io` (or as per prod_repo)
- Apex A records: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153
- CAA record check: verify no CAA records block Let's Encrypt
- SSL wait: GitHub Pages provisions SSL within 15-30 min — do not configure HTTPS redirect in Squarespace until SSL is active
- Default record warning: delete Squarespace default A/CNAME records that point to Squarespace servers before adding GitHub records
```

**gh run watch approach:** `gh run watch` streams live output and exits with the workflow's exit code. This is cleaner than polling `gh run list`. The run ID can be obtained immediately after `gh workflow run` (which outputs a URL containing the run ID), or retrieved via `gh run list --workflow publish.yml --limit 1`.

---

## 5. robots.txt Swap

The source `public/robots.txt` contains `Disallow: /` (sandbox-safe). The publish workflow must replace it in the build output before pushing. Two approaches:

**Option A — printf (recommended):**
```bash
printf 'User-agent: *\nAllow: /\n' > dist/<slug>/robots.txt
```

**Option B — sed:**
```bash
sed -i 's/Disallow: \//Allow: \//' dist/<slug>/robots.txt
```

Option A is safer: it writes the complete desired content rather than doing a string substitution that could break on formatting variations. The source file's exact content doesn't matter.

---

## 6. DEPLOY-02 Validation Placement

`DEPLOY-02` says "publish.yml validates stage ≥ 5, domain, and prod_repo before building." The wiring.json read step (step 4 above) must run BEFORE the build step (step 5). If validation fails, the workflow exits non-zero — `gh workflow run` will show the failure.

**Important:** `/wm-publish` skill also validates before triggering (D-02 / preflight). This is double-validation — the skill catches it cheaply before triggering GHA spend; the workflow catches it defensively even if triggered directly.

---

## 7. CLAUDE.md Update

`DEPLOY-03` is implied: update `[websites-org]` placeholder in `CLAUDE.md` to `pbau3r-sfdy`. This is a simple text edit but must be part of the phase to keep documentation accurate. The planner should include this as a task.

---

## 8. Squarespace DNS Guide — GitHub Pages IP Addresses

Current GitHub Pages apex IP addresses (as of 2025):
- 185.199.108.153
- 185.199.109.153
- 185.199.110.153
- 185.199.111.153

CNAME target format: `<username>.github.io` (not the full repo URL). For `pbau3r-sfdy`, the Pages CNAME target is `pbau3r-sfdy.github.io`.

CAA records: If the domain has CAA records, they must include `letsencrypt.org` (GitHub Pages uses Let's Encrypt). Squarespace-hosted domains typically have no CAA records.

---

## 9. Key Edge Cases and Gotchas

1. **PAT scope for commit-back:** The checkout action must use the PAT (not `GITHUB_TOKEN`) for the git push back to work. `GITHUB_TOKEN` cannot push to repos outside the current workflow's repo.

2. **gh run watch timing:** There's a brief delay between `gh workflow run` and the run appearing in `gh run list`. The skill should handle this with a short sleep or retry.

3. **build-single.mjs output dir:** The deploy action expects `dist/<slug>/` at the repo root. Verify `build-all.js`'s single-site mode copies to the right location (`dist/<slug>/`) — looking at the source, it does: `cpSync(siteDist, outDir, { recursive: true })` where `outDir = join(distDir, site)`.

4. **CNAME file at gh-pages root:** The deploy action pushes `folder` contents to the branch root. `dist/<slug>/CNAME` → `gh-pages root/CNAME`. Correct.

5. **WM_PUBLISH_PAT availability:** This is a prerequisite. The workflow will fail if the secret doesn't exist. The `/wm-publish` skill should check for the secret's existence... but `gh secret list` requires auth. Better: document the prerequisite in the skill and let the workflow fail fast with a clear error.

6. **Concurrent deploys:** The `concurrency` block in `deploy.yml` prevents concurrent sandbox deploys. `publish.yml` should have a per-slug concurrency group: `group: publish-${{ inputs.slug }}`.

7. **wiring.json git push on gh-pages branch:** The commit-back step runs on the `main` branch (we checked out main). The deploy action pushes to gh-pages of the PRODUCTION repo. These are separate operations — no conflict.

---

## 10. File Inventory for Phase 1

| File | Action | Notes |
|------|--------|-------|
| `.github/workflows/publish.yml` | Create | New production deploy workflow |
| `_scripts/build-single.mjs` | Create | Single-site build wrapper |
| `.claude/skills/wm-publish.md` | Create | New skill: validate + trigger + DNS guide |
| `CLAUDE.md` | Edit | Replace `[websites-org]` with `pbau3r-sfdy` |
| `AGENTS.md` | Edit | Document `/wm-publish` in quick reference |

No existing files are structurally modified. All changes are additive.

---

## Validation Architecture

### Test Approach
- `publish.yml` validation can be tested with `workflow_dispatch` against a mock stage-5 site
- `build-single.mjs` can be tested locally: `node _scripts/build-single.mjs sfdy-alt-clean`
- `/wm-publish` skill is a Claude skill — validated by running it against a real stage-5 site
- End-to-end: trigger on `parrot-capital` (stage 4 → promote to 5 for test) or `sfdy-alt-clean` (already stage 6, can re-deploy)

### Acceptance Proof per Requirement
- DEPLOY-01: `/wm-publish sfdy-alt-clean` completes; site live at starflight-dynamics.com
- DEPLOY-02: Running on stage-4 site exits with non-zero before build
- DEPLOY-03: CNAME file present in gh-pages branch root after deploy
- DEPLOY-04: Production robots.txt contains `Allow: /`
- DEPLOY-05: wiring.json `stage: 6`, `last_deploy` set after deploy
- DEPLOY-06: Only target site built (no other dist/<slug>/ dirs created)
- DEPLOY-07: DNS guide printed inline after deploy
- DEPLOY-08: PAT used (not GITHUB_TOKEN); cross-repo push succeeds
