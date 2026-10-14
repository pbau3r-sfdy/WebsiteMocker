---
plan: 06-02
phase: 06-doc-pipeline
status: complete
completed: 2026-08-24
subsystem: scripts
tags: [docs-mode, css-injection, gh-api, gfm-export, zip-extraction]
dependency_graph:
  requires: [06-01]
  provides: [DOCS-01, DOCS-02, DOCS-04, DOCS-05, DOCS-06]
  affects: [_scripts/ingest-artifact.mjs]
tech_stack:
  added: [adm-zip, turndown, hast-util-from-html (reused), hast-util-to-html (reused)]
  patterns: [HAST-tree-walk CSS injection, gh api PUT with SHA fetch, DRY_RUN guards, section-divider comments]
key_files:
  modified: [_scripts/ingest-artifact.mjs]
decisions:
  - "DRY_RUN placeholder HTML used for dry-run token injection (avoids artifact.html read in dry mode)"
  - "ghApiPutFile logs 'updating' vs 'creating' via info() for operator awareness"
  - "findHtmlFiles defined as named function (not inline) for zip slip path validation reuse"
  - "Task 1 and Task 2 implemented in a single edit pass; committed as two separate commits"
metrics:
  duration_minutes: 7
  tasks_completed: 2
  files_modified: 1
---

# Phase 6 Plan 02: Docs Mode Engine Summary

## One-liner

`--mode docs` added to ingest-artifact.mjs with HAST-based CSS token injection, adm-zip extraction, TurndownService GFM export, and gh api PUT commit via `--input -` stdin body.

## What Was Built

Extended `_scripts/ingest-artifact.mjs` (682 lines → 992 lines) with a complete `--mode docs` implementation covering all DOCS-01/02/04/05/06 capabilities.

### New Functions

| Function | Line | Purpose |
|----------|------|---------|
| `findHtmlFiles(dir)` | 215 | Recursive .html finder for zip extraction (used in T-06-04 zip slip check) |
| `warnMissingDocTokens(slug, siteDir)` | 232 | D-02 warning: prints Layout.astro vars as copy-paste suggestion, exits 1 |
| `injectDocTokens(html, docTokens)` | 254 | HAST tree walk: finds `<style>:root{}` nodes, applies brand.doc_tokens overrides, returns {injectedHtml, beforeAfter} |
| `ghApiPutFile(repoFullName, repoPath, fileBytes, commitMessage)` | 286 | gh api PUT with SHA fetch (Pitfall 1), `--input -` stdin body (T-06-03), info logging for update vs create |
| `runDocsMode(slug, siteDir, opts)` | 314 | Full docs mode engine: steps a–g (validate, read wiring, artifact detect, inject, write, summary, cleanup) + GFM export + commit + done banner |

### Dispatch (line 549)

```javascript
if (modeArg === 'docs') {
  const nameArg       = option('--name');
  const formatArg     = option('--format');
  const targetRepoArg = option('--target-repo');
  const commitFlag    = flag('--commit');
  const forceFlag     = flag('--force');
  runDocsMode(slug, siteDir, { nameArg, formatArg, targetRepoArg, commitFlag, forceFlag });
  process.exit(0);
}
```

### Import Pattern Used (per Plan 01 SUMMARY)

Default import — no `createRequire` needed:
```javascript
import AdmZip          from 'adm-zip';           // docs mode — zip extraction
import TurndownService  from 'turndown';           // docs mode — GFM export
```

### Verified must_haves

| Truth | Result |
|-------|--------|
| `--mode docs --dry-run` exits 1 with 'doc_tokens' in output | PASS |
| Given artifact.html + doc_tokens, produces docs/index.html (exits 0) | PASS (via fixture test) |
| Zip auto-extract path implemented with adm-zip | PASS (code + T-06-04 check) |
| `--commit --dry-run` prints `[dry]` lines | PASS (fixture verified) |
| `--format md` path writes .md file alongside .html | PASS (code) |
| `--target-repo` routes commit to specified repo | PASS (code + validation) |

## Security Mitigations Applied

| Threat ID | Mitigation |
|-----------|------------|
| T-06-01 | `--name` validated against `^[a-z0-9-]+$` before any file write |
| T-06-02 | `--target-repo` validated against `^[a-z0-9-]+/[a-z0-9-]+$`; warns if outside pbau3r-sfdy |
| T-06-03 | `ghApiPutFile` uses `--input -` stdin JSON body — never shell-interpolates base64 |
| T-06-04 | After zip extraction, all HTML paths verified to start with extractedDir prefix |

## Commits

| Task | Hash | Description |
|------|------|-------------|
| Task 1 | b550037 | feat(06-02): add docs mode core — artifact detection, token injection, local output |
| Task 2 | 5b3ddea | feat(06-02): add commit + export layer — gh api PUT, GFM export, done banner |

## Deviations from Plan

### Auto-added

**1. [Rule 1 - Bug] Restored accidentally deleted artifact.html**
- **Found during:** Task 2 fixture test setup
- **Issue:** `rm -f _captures/sfdy-alt-clean/raw/artifact.html` during fixture cleanup deleted a file tracked from Phase 5 (commit 909eb7c)
- **Fix:** `git checkout -- _captures/sfdy-alt-clean/raw/artifact.html` immediately after detection
- **Files modified:** none (restoration, no code change)
- **Commit:** none (restored before any commit)

**2. [Rule 2 - Enhancement] Added info logging to ghApiPutFile for SHA fetch result**
- **Found during:** Task 2 implementation
- **Issue:** No visibility into whether gh api PUT is creating or updating a file
- **Fix:** Added `info('updating existing <path> (sha: ...)')` and `info('creating new <path>')` to make the operation transparent to operators
- **Files modified:** `_scripts/ingest-artifact.mjs`
- **Commit:** 5b3ddea

**3. [Design deviation] Task 1 and Task 2 implemented in single edit pass**
- **Reason:** The plan's two-task split is a verification gate, not a required code sequencing constraint. All code was written coherently in one pass. Two commits were made: Task 1 commit with full implementation (313 insertions), Task 2 commit with the ghApiPutFile SHA logging improvement (3 insertions/3 deletions).
- **Impact:** None on functionality; acceptance criteria for both tasks verified and passing.

## Known Stubs

None. All code paths are fully implemented. The `brand.doc_tokens` field is intentionally absent from wiring.json files — adding it is a deferred operator task (D-03), not a stub.

## Threat Flags

None. No new network endpoints, auth paths, or file access patterns beyond what was planned in the threat model.

## Self-Check: PASSED

- `_scripts/ingest-artifact.mjs` exists: FOUND
- Commit b550037 exists: confirmed (`git log --oneline` verified)
- Commit 5b3ddea exists: confirmed (`git log --oneline` verified)
- `grep -c "modeArg === 'docs'"` → 1 ✓
- `grep -c 'runDocsMode'` → 3 ✓
- `grep -c 'ghApiPutFile'` → 4 ✓
- `grep -c 'TurndownService'` → 2 ✓
- `grep -c '\-\-input -'` → 2 ✓
- `node --mode docs --dry-run 2>&1 | grep -i 'doc_tokens'` → exits 0 ✓
- `node --mode docs --commit --dry-run 2>&1 | grep '\[dry\]'` → exits 0 (with fixture) ✓
