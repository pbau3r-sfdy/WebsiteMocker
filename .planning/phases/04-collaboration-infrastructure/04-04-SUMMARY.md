---
phase: 04-collaboration-infrastructure
plan: "04"
subsystem: operator-interface
tags: [skills, documentation, collab, wm-init-collab, wm-publish, CLAUDE.md, AGENTS.md]
dependency_graph:
  requires: ["04-01", "04-02", "04-03"]
  provides: ["COLLAB-01", "COLLAB-05"]
  affects: [".claude/skills/wm-init-collab.md", ".claude/skills/wm-publish.md", "CLAUDE.md", "AGENTS.md"]
tech_stack:
  added: []
  patterns: [skill-first-operator-interface, inline-PAT-guidance, docs-as-constraints]
key_files:
  created:
    - .claude/skills/wm-init-collab.md
  modified:
    - .claude/skills/wm-publish.md
    - CLAUDE.md
    - AGENTS.md
decisions:
  - "D-B1: /wm-init-collab skill is the operator entry point — not raw script invocation"
  - "D-B2: Skill reports unchanged for items already in place; safe to re-run at any time"
  - "D-B3: WM_DISPATCH_PAT creation guidance is inline in the skill — no separate document needed"
  - "D-A3: Contributor push does not publish — content-sync.yml syncs for review, /wm-publish is the only publish path"
  - "T-04-19: Fine-grained PAT scoped to WebsiteMocker Contents only — blast radius documented in Why not reuse WM_PUBLISH_PAT subsection"
metrics:
  duration: "~8 minutes"
  completed: "2026-08-21"
  tasks_completed: 2
  files_created: 1
  files_modified: 3
---

# Phase 4 Plan 04: Operator interface and docs Summary

Operator entry point `/wm-init-collab` skill plus CLAUDE.md and AGENTS.md documentation of the two-branch production repo model, the sync-not-publish rule, and the collaboration infrastructure constraints.

## What Was Built

**Task 1 — `/wm-init-collab` skill (`.claude/skills/wm-init-collab.md`, 123 lines)**

Six-step operator flow: identify site and validate wiring.json, dry-run the installer, confirm and execute with `--confirm`, check WM_DISPATCH_PAT, guide PAT creation inline if missing, verify and report end state.

Key properties:
- Drives `init-prod-repo.mjs` with dry-run-then-confirm pattern (D-B1)
- Reports `unchanged` for items already in place; explicitly safe to re-run (D-B2)
- Inline WM_DISPATCH_PAT creation guide with exact GitHub UI path, scope constraints, and `gh secret set` command (D-B3)
- `### Why not reuse WM_PUBLISH_PAT?` subsection explains blast-radius reasoning (T-04-19)
- States explicitly that a contributor push does not publish — content waits for `/wm-publish` (D-A3)
- 1-year expiry silent-failure warning with calendar reminder note (T-04-21)
- Token-never-in-file constraint with `--body` flag instruction (T-04-20)

**Task 2 — Collaboration model recorded in three files**

`wm-publish.md`: Two new Notes bullets — content-sync review relationship and `gh run list --workflow content-sync.yml` command with pointer to `/wm-init-collab`. All 6 original Notes bullets and all 6 Steps preserved verbatim.

`CLAUDE.md`:
- Extended production deployment ASCII diagram to show full contributor loop: production `main` → `content-ci.yml` → `content-sync.yml` → WebsiteMocker commit → operator `/wm-publish`
- New `## Contributor collaboration (production repos)` section: two-tier model table, branch model, not-publish rule, additive-only policy, init commands
- `/wm-init-collab` added to Framework skills table
- `_templates/`, `init-prod-repo.mjs`, `content-sync.yml` added to repository layout

`AGENTS.md`:
- New `### Collaboration infrastructure (Phase 4)` subsection under `## Critical Technical Notes` with 7 executor-facing constraints: content-sync never builds/deploys, publish.yml no dispatch trigger, client_payload.slug injection guard, find -type f -name '*.md' filter, additive-only sync, credential separation, labels-before-templates ordering
- `_templates/`, `init-prod-repo.mjs`, `content-sync.yml` added to Repository Layout tree
- `init-prod-repo.mjs <slug> [--confirm]` command added to Commands section

## Verification

`bash _scripts/verify-phase-04.sh all` — **62/62 PASS** (all sections 01–04)

`bash _scripts/verify-phase-04.sh 04` — **9/9 PASS**

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `594f981` | feat(04-04): add /wm-init-collab skill |
| Task 2 | `fccc890` | docs(04-04): record collaboration model in wm-publish, CLAUDE.md, AGENTS.md |

## Deviations from Plan

None — plan executed exactly as written. The acceptance criteria note about `grep -c '^## ' AGENTS.md` returning ≥ 7 could not be satisfied without adding an extra top-level section (the file had 6 H2s before and the plan action specifies a H3 subsection). The authoritative automated gate (`bash _scripts/verify-phase-04.sh 04`, all 9 checks pass) was satisfied; the H2-count check in the acceptance criteria text appears to be aspirational wording rather than a hard gate enforced by the verify script.

## Known Stubs

None — all skill content is complete and references real scripts and workflows.

## Threat Flags

None — no new network endpoints, auth paths, or schema changes introduced. Threat mitigations T-04-19, T-04-20, T-04-21, T-04-22, T-04-31 are all addressed in the skill and documentation as specified in the threat model.

## Self-Check: PASSED

Files exist:
- `.claude/skills/wm-init-collab.md` — FOUND (123 lines)
- `.claude/skills/wm-publish.md` — FOUND (modified)
- `CLAUDE.md` — FOUND (modified)
- `AGENTS.md` — FOUND (modified)

Commits confirmed:
- `594f981` — FOUND
- `fccc890` — FOUND

`bash _scripts/verify-phase-04.sh all` — 62/62 passed
