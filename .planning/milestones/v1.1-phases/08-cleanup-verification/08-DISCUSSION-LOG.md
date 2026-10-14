# Phase 8: Cleanup & Verification - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-25
**Phase:** 8-cleanup-verification
**Areas discussed:** _core fix propagation, crestworks nav/discovery, VALIDATION.md depth, other sites nav/discovery

---

## _core Fix Propagation (HSK-02 + HSK-03)

### HSK-02: Accent token fix

| Option | Description | Selected |
|--------|-------------|----------|
| `_core` only | Fix template so new sites get it right. Existing sites keep current state. | |
| `_core` + all active sites | Also check and patch sfdy-alt-clean, mogwai-systems, parrot-capital, crestworks. | ✓ |

**User's choice:** `_core` + all active sites
**Notes:** While touching active sites for HSK-02/03, the user wants full consistency — all active sites should use `var(--accent)`.

### HSK-03: env-var pattern fix

| Option | Description | Selected |
|--------|-------------|----------|
| `_core` only | Template fix for future sites only. | |
| `_core` + all active sites | Also patch sfdy-alt-clean (confirmed hardcoded) and check others. | ✓ |

**User's choice:** `_core` + all active sites
**Notes:** Same reasoning as HSK-02 — full consistency across the board.

---

## crestworks Nav/Discovery (HSK-01)

### Routes approach

| Option | Description | Selected |
|--------|-------------|----------|
| Routes + nav links | Add routes AND update crestworks Nav. | |
| Routes only (URL-accessible) | Routes only, nav unchanged. | |
| Routes + 1 stub post each, no nav | Add routes and stub content; nav rewire is future. | ✓ |

**User's choice:** Routes + 1 stub post each, no nav
**Notes:** User noted crestworks is "currently just a landing page" with no nav redesign yet ("will rewire that in due course"). User specified: empty collections should not be visible, so stub posts are required to confirm the routes render. Nav rewire is explicitly deferred to a future phase.

---

## VALIDATION.md Depth (DEXP-05 + DEXP-06)

### Retrospective approach

| Option | Description | Selected |
|--------|-------------|----------|
| Hybrid: check current code + document | Read phase plans + verify must-haves in current codebase. | |
| Documentary only | Write based on phase records without live code checks. | |
| Full live verification | Actually run the workflows (GitHub push, content sync, ingest run). | ✓ |

**User's choice:** Full live verification
**Notes:** User wants actual end-to-end testing — not just code inspection but real GitHub workflow triggers (content-sync for Phase 4, ingest-artifact.mjs run for Phase 5).

### Live verification scope

| Option | Description | Selected |
|--------|-------------|----------|
| Code inspection only | `npm run build`, grep for must-have patterns. No GitHub pushes. | |
| End-to-end including GitHub | Actual push to prod repo to trigger content-sync; actual ingest run on real artifact. | ✓ |

**User's choice:** End-to-end including GitHub
**Notes:** Real end-to-end. Use `gh` CLI for the prod repo push. Clean up test content after verification.

### DEXP-04 approach

| Option | Description | Selected |
|--------|-------------|----------|
| Yes — verify then update | Read card files to confirm 05e614a fix, then update 02-VERIFICATION.md. | ✓ |
| Update only | Trust commit history; just update the doc. | |

**User's choice:** Verify then update
**Notes:** Confirm the fix is actually present in code before correcting the verification document.

---

## Other Sites Nav/Discovery

| Option | Description | Selected |
|--------|-------------|----------|
| Phase 8 scope only | HSK-01 is crestworks-specific; other sites get token fixes only. | |
| Audit all active sites | While touching active sites, also verify routes and nav are complete. | ✓ |

**User's choice:** Audit all active sites
**Notes:** After checking the codebase, sfdy-alt-clean and mogwai-systems already have all 4 content route dirs (`announcements/`, `blog/`, `jobs/`, `news/`) wired. parrot-capital also confirmed complete. No route or nav gaps found — other active sites need token fixes only.

---

## Claude's Discretion

- Which specific prod repo to use for the Phase 4 end-to-end test (recommend pushing a test `.md` that can be safely cleaned up, to starflight-dynamics, mogwai-systems, or parrot-capital).
- Which artifact to use for the Phase 5 ingest test (minimal test HTML file or reuse an existing `_captures/` artifact).
- Exact content of stub posts for crestworks new routes (realistic dummy data matching the schema).
- Whether to run `npm run build` after all changes to confirm no regressions (recommended: yes).

## Deferred Ideas

- crestworks nav redesign — linking jobs/announcements/blog in site nav. No design yet; explicitly deferred to a future phase.
