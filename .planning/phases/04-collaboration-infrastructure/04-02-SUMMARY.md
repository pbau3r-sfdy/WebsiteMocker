---
phase: 04-collaboration-infrastructure
plan: "02"
subsystem: contributor-templates
tags: [contributing, issue-templates, github-actions, security, workflows]
depends_on: ["04-01"]
provides:
  - "_templates/CONTRIBUTING.md — two-tier contribution model doc with review-before-live expectation"
  - "_templates/.github/ISSUE_TEMPLATE/content-request.yml — structured content request form"
  - "_templates/.github/ISSUE_TEMPLATE/design-change.yml — structured design/page change form"
  - "_templates/.github/ISSUE_TEMPLATE/bug-report.yml — structured bug report form"
  - "_templates/.github/ISSUE_TEMPLATE/config.yml — blank issue suppression + CONTRIBUTING.md link"
  - "_templates/.github/workflows/content-ci.yml — path-filtered dispatch workflow for production repos"
affects:
  - _templates/ (new directory, six new files)
tech_stack:
  added:
    - peter-evans/repository-dispatch@v4 (GitHub Action for cross-repo dispatch)
  patterns:
    - GitHub YAML issue form syntax (body: with typed elements)
    - paths filter on push trigger (mandatory containment — T-04-08)
    - cancel-in-progress: true for content-ci vs false for content-sync (rationale documented inline)
    - Placeholder token pattern for Plan 03 installer: {{SITE_NAME}}, {{SLUG}}, {{PROD_REPO}}, {{DOMAIN}}
key_files:
  created:
    - _templates/CONTRIBUTING.md
    - _templates/.github/ISSUE_TEMPLATE/content-request.yml
    - _templates/.github/ISSUE_TEMPLATE/design-change.yml
    - _templates/.github/ISSUE_TEMPLATE/bug-report.yml
    - _templates/.github/ISSUE_TEMPLATE/config.yml
    - _templates/.github/workflows/content-ci.yml
  modified: []
decisions:
  - "D-A7 honoured: CONTRIBUTING.md contains review-before-live expectation; 'rebuilds automatically' and 'goes live automatically' are absent; harness verified"
  - "D-A3 honoured: content-ci.yml comment states dispatch triggers sync, not publish; WM_PUBLISH_PAT absent from entire _templates/ tree"
  - "D-A4 honoured: CONTRIBUTING.md Removing content section states additive-only policy explicitly"
  - "cancel-in-progress: true on content-ci.yml (producer) vs false on content-sync.yml (consumer) — superseded push is safe to drop; missed sync would lose a commit"
  - "WM_PUBLISH_PAT excluded entirely from _templates/ to prevent credential confusion in contributor-writable workflow file"
  - "placeholder tokens use double curly braces with no spaces: {{SITE_NAME}}, {{SLUG}}, {{PROD_REPO}}, {{DOMAIN}}"
metrics:
  duration: ~18 minutes
  completed: "2026-08-21"
  tasks_completed: 3
  files_created: 6
  files_modified: 0
---

# Phase 4 Plan 02: Contributor Template Bundle Summary

**One-liner:** Six-file `_templates/` bundle — CONTRIBUTING.md with two-tier model and D-A7-compliant review expectation, three YAML issue forms with auto-labelling, blank-issue suppression config, and path-filtered `content-ci.yml` dispatching `content-updated` to WebsiteMocker.

## What Was Built

### Task 1 — `_templates/CONTRIBUTING.md`

Two-tier contribution model documentation (148 lines). Covers:

| Section | What it provides |
|---|---|
| Two-tier model table | 9-row routing table: which actions are direct push vs. which need an issue |
| Tier 1 — direct push | Four accepted paths (`content/news/`, `content/jobs/`, `content/announcements/`, `content/blog/`), `YYYY-MM-DD-slug.md` naming convention |
| D-A7 expectation | Contributor push enters the operator's review queue; the live site does NOT update on push |
| Content format | Fenced YAML frontmatter examples for all four collections matching `_core/src/content.config.ts` schemas exactly; date-quoting note for GitHub web UI compatibility |
| Removing content | Additive-only policy (D-A4): deleting a file here does not unpublish it from the live site |
| What happens after you push | Numbered 5-step walkthrough: push → `content-ci.yml` → dispatch → `content-sync.yml` copies file → operator reviews and publishes |

Placeholders: `{{SITE_NAME}}`, `{{SLUG}}`, `{{PROD_REPO}}`, `{{DOMAIN}}` — all replaced by Plan 03's installer.

### Task 2 — Four issue-template YAML files

All use GitHub's YAML issue-form syntax (`body:` with typed elements, not legacy Markdown).

| File | Labels | Required fields |
|---|---|---|
| `content-request.yml` | `["content-request"]` | content-type (dropdown), headline, body |
| `design-change.yml` | `["design-change"]` | change-type (dropdown), page, current, desired |
| `bug-report.yml` | `["bug"]` | url, what-happened, expected, device (dropdown) |
| `config.yml` | none | `blank_issues_enabled: false`; contact_links to CONTRIBUTING.md |

`config.yml` contains no `labels:` key (GitHub silently ignores labels in config.yml and a wrong entry here would mask the per-template labels). Label names (`content-request`, `design-change`, `bug`) match the names Plan 03 creates with `gh label create`.

### Task 3 — `_templates/.github/workflows/content-ci.yml`

Path-filtered dispatch workflow for production repos. Key design decisions:

| Decision | Implementation |
|---|---|
| T-04-08: paths filter mandatory | `paths: ['content/**/*.md']` — CONTRIBUTING.md edits dispatch nothing |
| T-04-09: concurrency | `cancel-in-progress: true` — superseded push drops safely (producer side) |
| Credential scope | `WM_DISPATCH_PAT` only (fine-grained, `contents: write` on WebsiteMocker); no `WM_PUBLISH_PAT` anywhere in `_templates/` |
| D-A3 | Inline comment: dispatches `content-sync.yml` for review, does NOT publish |
| No checkout | Job does not touch the production repo contents — dispatch only |
| No manual trigger | Manual trigger not included (reduces attack surface) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `count_in` helper strips Markdown headings as shell comments**
- **Found during:** Task 3 verification (`bash _scripts/verify-phase-04.sh 02` section 02, 2 failures)
- **Issue:** The harness `count_in` function uses `grep -v '^\s*#'` which strips lines starting with `#`. Markdown H1 headings (`# Contributing to {{SITE_NAME}}`) and H2/H3 headings start with `#`, so `{{SITE_NAME}}` and `reviewed` (word from D-A7 check) were only present in heading lines and thus invisible to `count_in`.
- **Fix:** Added `{{SITE_NAME}}` and the word "reviewed" in body-text (non-heading) lines. The intro paragraph now reads "contributor repository for **{{SITE_NAME}}**" and "every contribution... is reviewed by the operator."
- **Files modified:** `_templates/CONTRIBUTING.md`
- **Commit:** `5cfe5a0`

**2. [Rule 1 - Bug] `WM_PUBLISH_PAT` mentioned in comment violated success criteria**
- **Found during:** Post-task success_criteria check (`grep -rn 'WM_PUBLISH_PAT' _templates/`)
- **Issue:** A comment in `content-ci.yml` explained not to use `WM_PUBLISH_PAT` by name. The plan's `<success_criteria>` requires the raw grep to return no matches — even in comments. The rationale: a contributor copying the file might replicate the name.
- **Fix:** Replaced the explicit name with a description of the credential type ("A Classic PAT with org-wide reach must never be stored here").
- **Files modified:** `_templates/.github/workflows/content-ci.yml`
- **Commit:** `dcd9ced`

## Known Stubs

None — this plan creates template infrastructure only. No UI or data-rendering components. The `{{SITE_NAME}}`, `{{SLUG}}`, `{{PROD_REPO}}`, and `{{DOMAIN}}` tokens are intentional placeholders to be replaced by Plan 03's installer; they are not stubs.

## Threat Flags

No new security surface beyond the plan's `<threat_model>`. All six STRIDE entries have `mitigate` disposition and are addressed:

| Flag | File | Description |
|------|------|-------------|
| T-04-07 mitigated | `_templates/.github/workflows/content-ci.yml` | WM_DISPATCH_PAT only; WM_PUBLISH_PAT absent from entire _templates/ tree (verified by success criteria grep) |
| T-04-08 mitigated | `_templates/.github/workflows/content-ci.yml` | `paths: ['content/**/*.md']` restricts trigger to Markdown under content/ |
| T-04-09 mitigated | `_templates/.github/workflows/content-ci.yml` | `concurrency cancel-in-progress: true` collapses dispatch burst |
| T-04-10 mitigated | `_templates/.github/ISSUE_TEMPLATE/*.yml` | Label names match Plan 03 exactly; no labels in config.yml |
| T-04-11 mitigated | `_templates/.github/ISSUE_TEMPLATE/config.yml` | `blank_issues_enabled: false` |
| T-04-29 mitigated | `_templates/CONTRIBUTING.md` | D-A7 wording enforced; harness grep gate passes 23/23 |

## Self-Check: PASSED

- FOUND: `_templates/CONTRIBUTING.md` (148 lines, all placeholders, 23/23 harness checks pass)
- FOUND: `_templates/.github/ISSUE_TEMPLATE/content-request.yml`
- FOUND: `_templates/.github/ISSUE_TEMPLATE/design-change.yml`
- FOUND: `_templates/.github/ISSUE_TEMPLATE/bug-report.yml`
- FOUND: `_templates/.github/ISSUE_TEMPLATE/config.yml`
- FOUND: `_templates/.github/workflows/content-ci.yml`
- FOUND: commit `648115d` (CONTRIBUTING.md)
- FOUND: commit `b9963a6` (four issue templates)
- FOUND: commit `5cfe5a0` (content-ci.yml + CONTRIBUTING.md body fix)
- FOUND: commit `dcd9ced` (WM_PUBLISH_PAT removal)
- `bash _scripts/verify-phase-04.sh 02`: 23/23 PASS
