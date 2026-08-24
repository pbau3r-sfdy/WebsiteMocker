---
phase: 06-doc-pipeline
verified: 2026-08-24T00:00:00Z
status: human_needed
score: 10/10 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Run /wm-gen-docs end-to-end against a real production repo — paste an HTML artifact, confirm the D-06 summary, type y, and verify the committed file appears at github.com/<org>/<repo>/blob/main/docs/index.html"
    expected: "gh api PUT succeeds, file appears in the target repo's docs/ folder, brand tokens are visually applied in the HTML"
    why_human: "Requires real gh CLI authentication and an accessible pbau3r-sfdy/* repo; cannot simulate with dry-run alone"
  - test: "Open the committed HTML document in a browser and confirm brand tokens (colours, typography) are visually applied correctly"
    expected: "The :root CSS variables are overridden with wiring.json brand.doc_tokens values and the page renders with the correct brand palette"
    why_human: "Visual rendering cannot be verified programmatically; CSS injection correctness requires visual inspection"
---

# Phase 6: Doc Pipeline Verification Report

**Phase Goal:** Deliver a complete doc pipeline — operator runs /wm-gen-docs, gets branded HTML committed to the target production repo's docs/ folder. No Astro build required.
**Verified:** 2026-08-24T00:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `--mode docs --dry-run` exits 1 with 'doc_tokens' warning | VERIFIED | Live run: `grep -i 'doc_tokens'` exits 0; output shows `⚠ brand.doc_tokens not set` |
| 2 | Given artifact.html + doc_tokens, script produces branded docs/index.html exits 0 | VERIFIED | Fixture test with temp doc_tokens + dry-run: `[dry] would write _captures/sfdy-alt-clean/docs/index.html` |
| 3 | Zip auto-extract path implemented with adm-zip | VERIFIED | `new AdmZip(zipPath).extractAllTo(extractedDir, true)` at line 381; T-06-04 zip-slip check follows |
| 4 | `--commit --dry-run` prints `[dry]` lines (no actual gh api call) | VERIFIED | Live run with fixture: `[dry] would call gh api PUT → pbau3r-sfdy/starflight-dynamics/docs/index.html` |
| 5 | `--format md` produces a docs/<name>.md GFM file alongside HTML | VERIFIED | TurndownService block at lines 464–476; `gfmOutputPath` wired into commit block |
| 6 | `--target-repo` routes commit to specified repo | VERIFIED | `targetRepoArg` parsed at dispatch (line 582), passed to `runDocsMode`, overrides `wiring.prod_repo` |
| 7 | Operator can invoke /wm-gen-docs and be guided step-by-step | VERIFIED | `.claude/skills/wm-gen-docs.md` exists, 7 numbered steps confirmed |
| 8 | Skill pauses with y/N confirm before any gh api commit | VERIFIED | `grep -c 'Proceed with commit'` → 1; `grep -c 'cannot be bypassed'` → 1 |
| 9 | Skill shows D-06 confirm summary (tokens, file size, target repo) | VERIFIED | Step 5 has exact D-06 summary box format; Step 4 dry-run feeds it |
| 10 | Skill handles --name, --format md, --target-repo flags transparently | VERIFIED | All three flags in Step 1 inputs; Step 4 and Step 6 bash commands include `[--name <n>] [--format md] [--target-repo org/repo]` |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `_scripts/ingest-artifact.mjs` | docs mode dispatch, runDocsMode, injectDocTokens, warnMissingDocTokens, ghApiPutFile | VERIFIED | All 5 functions present; `grep -c 'runDocsMode'` → 3; `grep -c 'ghApiPutFile'` → 4; `grep -c 'injectDocTokens'` → 3; `grep -c 'warnMissingDocTokens'` → 3 |
| `node_modules/adm-zip/package.json` | adm-zip installed | VERIFIED | File exists; `package.json` has `"adm-zip": "^0.6.0"` under `dependencies` |
| `node_modules/turndown/package.json` | turndown installed | VERIFIED | File exists; `package.json` has `"turndown": "^7.2.4"` under `dependencies` |
| `.claude/skills/wm-gen-docs.md` | /wm-gen-docs skill — 7 steps, D-07 confirm gate | VERIFIED | File exists; all 9 acceptance criteria pass |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `ingest-artifact.mjs` | `adm-zip` | `import AdmZip from 'adm-zip'` | WIRED | Line 49; `AdmZip` used at line 381 |
| `ingest-artifact.mjs` | `turndown` | `import TurndownService from 'turndown'` | WIRED | Line 50; `new TurndownService(...)` at line 469 |
| `ingest-artifact.mjs runDocsMode` | `wiring.json brand.doc_tokens` | `readJSON() + wiring?.brand?.doc_tokens` | WIRED | Lines 344–346; `warnMissingDocTokens` called if absent |
| `ingest-artifact.mjs injectDocTokens` | `artifact :root {} block` | `fromHtml + walkTree + style text node mutation` | WIRED | Lines 254–288; HAST tree walk targets `tagName === 'style'` nodes |
| `ingest-artifact.mjs ghApiPutFile` | GitHub Contents API | `execSync('gh api ... --method PUT --input -')` | WIRED | Lines 318–321; `--input -` stdin body per T-06-03 |
| `.claude/skills/wm-gen-docs.md Step 4` | `ingest-artifact.mjs --mode docs` | `node _scripts/ingest-artifact.mjs <slug> --mode docs ... --dry-run` | WIRED | Step 4 bash block matches |
| `.claude/skills/wm-gen-docs.md Step 6` | `ingest-artifact.mjs --commit` | `node _scripts/ingest-artifact.mjs <slug> --mode docs ... --commit` | WIRED | Step 6 bash block matches |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ingest-artifact.mjs injectDocTokens` | `docTokens` | `wiring.json brand.doc_tokens` via `readJSON()` | Yes (operator-populated JSON object) | FLOWING |
| `ingest-artifact.mjs ghApiPutFile` | `fileBytes` | `readFileSync(outputPath)` of written HTML | Yes (the HTML file previously written by writeFileSync) | FLOWING |
| `ingest-artifact.mjs runDocsMode` | `htmlString` | `readFileSync(htmlPath, 'utf-8')` | Yes (artifact.html or zip-extracted file) | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Docs mode dispatches and validates doc_tokens | `node _scripts/ingest-artifact.mjs sfdy-alt-clean --mode docs --dry-run 2>&1 \| grep -i 'doc_tokens'` | `⚠ brand.doc_tokens not set in sites/sfdy-alt-clean/wiring.json` | PASS |
| --commit --dry-run prints [dry] lines | `node _scripts/ingest-artifact.mjs sfdy-alt-clean --mode docs --commit --dry-run 2>&1 \| grep '\[dry\]'` (with fixture) | `[dry] would write ... [dry] would call gh api PUT` | PASS |
| Both packages ESM-importable | `node --input-type=module -e "import AdmZip from 'adm-zip'; import TurndownService from 'turndown'; console.log(typeof AdmZip, typeof TurndownService)"` | `function function` | PASS |
| Actual gh api PUT commit to prod repo | requires real gh auth + accessible repo | not run | SKIP |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DOCS-01 | 06-01, 06-02 | `--mode docs` with bare HTML or .zip, no Astro build | SATISFIED | Mode dispatch at line 580; zip extraction via AdmZip at lines 377–420 |
| DOCS-02 | 06-02 | Inherits brand colours/typography from wiring.json | SATISFIED | `injectDocTokens` reads `wiring.brand.doc_tokens` and overrides `:root` CSS vars |
| DOCS-03 | 06-03 | `/wm-gen-docs <slug>` skill exists | SATISFIED | `.claude/skills/wm-gen-docs.md` with 7 steps and D-07 confirm gate |
| DOCS-04 | 06-02 | Commit via single gh api call — no PR, no CI | SATISFIED | `ghApiPutFile` uses one `gh api ... --method PUT` call; no workflow triggered |
| DOCS-05 | 06-02 | `--target-repo org/repo` overrides prod_repo | SATISFIED | `targetRepoArg` overrides `wiring.prod_repo`; restricted to `pbau3r-sfdy/*` org (fail if outside) |
| DOCS-06 | 06-02 | GFM Markdown export alongside HTML | SATISFIED | `--format md` path via TurndownService at lines 464–476; committed alongside HTML when `--commit` used |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | — | No debt markers (TBD/FIXME/XXX/TODO/HACK/PLACEHOLDER) found in any modified file | — | — |

**One implementation deviation noted (non-blocking):**

Plan 02 action spec specified `warn(...)` for `--target-repo` outside `pbau3r-sfdy/` org; the implementation uses `fail(...)` (line 340) which aborts immediately. This is stricter than the plan intended but is consistent with DOCS-05 (which only covers `pbau3r-sfdy/*` repos), with the skill Notes section (`--target-repo must be in pbau3r-sfdy/`), and with T-06-06 mitigation intent. Severity: informational — no blocker.

### Human Verification Required

#### 1. End-to-End Commit to Production Repo

**Test:** Run `/wm-gen-docs` on a site with `brand.doc_tokens` set, paste an HTML artifact, confirm the D-06 summary, type `y`, and observe the result.

**Expected:** `gh api PUT` succeeds without errors; the committed file appears at `https://github.com/<org>/<repo>/blob/main/docs/index.html`; the done banner prints the correct URL.

**Why human:** Requires real `gh` CLI session authenticated to `pbau3r-sfdy/*`; cannot simulate with `--dry-run` which skips the actual API call.

#### 2. Visual Brand Token Verification

**Test:** Open the committed (or locally staged) HTML file in a browser after running with a site that has `brand.doc_tokens` set.

**Expected:** The document renders with the site's brand palette — `:root` CSS variables match the values in `wiring.json brand.doc_tokens`; no default/pre-injection colours visible.

**Why human:** CSS injection correctness requires visual inspection; programmatic checks confirm the code path exists but not the perceptual result.

### Gaps Summary

No gaps. All 10 must-have truths are verified, all 4 required artifacts exist and are substantive and wired, all 6 DOCS requirements are satisfied. Two items require human verification before the phase can be considered fully closed.

---

_Verified: 2026-08-24T00:00:00Z_
_Verifier: Claude (gsd-verifier)_
