# Phase 4: Collaboration Infrastructure — Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-21
**Phase:** 04-collaboration-infrastructure
**Areas discussed:** Content authoritativeness, Init tooling shape, Which repos get content-ci.yml, Template storage approach

---

## Content Authoritativeness

| Option | Description | Selected |
|--------|-------------|----------|
| WebsiteMocker is canonical | Contributor pushes sync INTO WebsiteMocker at rebuild time (additive-only). Operator /wm-add-news unchanged. | ✓ |
| Production repo is canonical | All content through production repo main/content/. /wm-add-news would need to push there. | |

**User's choice:** WebsiteMocker is canonical
**Notes:** User stated: "WebsiteMocker is the playground. Once we are aligned, we publish, and that goes to the external repository. But as long as it is on the WebsiteMocker, it is not official." This clearly establishes WebsiteMocker as the sandbox/source of truth.

### Follow-up: Auto-publish vs manual

| Option | Description | Selected |
|--------|-------------|----------|
| Auto-publish immediately | content-ci.yml fires, syncs, builds, live. Zero operator involvement for Tier-1 pushes. | |
| Sync to WebsiteMocker, hold for operator | content-ci.yml syncs content into WebsiteMocker but does NOT trigger a build. | ✓ |
| You decide | Claude picks. | |

**User's choice:** Sync only, operator publishes manually
**Notes:** User stated: "We collect everything in WebsiteMocker, and once that is consolidated, we publish. Not before." This revises ROADMAP criterion #3 (which called for auto-rebuild). CONTRIBUTING.md must set clear expectations.

### Follow-up: Sync automation level

| Option | Description | Selected |
|--------|-------------|----------|
| Automated sync, manual publish | Contributor push → auto-sync into WebsiteMocker. Operator decides when to /wm-publish. | ✓ |
| Fully manual: operator syncs and publishes | No automation. Operator pulls content manually, then publishes. | |

**User's choice:** Automated sync, manual publish

---

## Init Tooling Shape

| Option | Description | Selected |
|--------|-------------|----------|
| /wm-init-collab <slug> skill | Skill-first pattern. Guides through human-action steps inline. | ✓ |
| _scripts/init-prod-repo.mjs raw script | Node.js script, operator runs directly. Breaks skill-first convention. | |

**User's choice:** /wm-init-collab <slug> skill

### Follow-up: Idempotency

| Option | Description | Selected |
|--------|-------------|----------|
| Yes, idempotent | Checks what's already done and skips/updates. Safe to re-run. | ✓ |
| One-shot only | Assumes fresh repo. Simpler but less forgiving. | |

**User's choice:** Yes, idempotent

---

## Which Repos Get content-ci.yml

| Option | Description | Selected |
|--------|-------------|----------|
| All 4 repos | sfdy-alt-clean, mogwai-systems, parrot-capital, crestworks all get content-ci.yml. | ✓ |
| Active sites only (sfdy + mogwai) | parrot-capital and crestworks get CONTRIBUTING + templates only; content-ci.yml deferred. | |
| sfdy-alt-clean only | Wire one repo first, validate, expand later. | |

**User's choice:** All 4 repos

---

## Template Storage Approach

| Option | Description | Selected |
|--------|-------------|----------|
| _templates/ directory | Template files as actual files. Maintained independently, readable without running the skill. | ✓ |
| Inline in /wm-init-collab skill | Template content embedded as heredocs. Simpler structure but harder to maintain. | |

**User's choice:** _templates/ directory

### Follow-up: Substitution style

| Option | Description | Selected |
|--------|-------------|----------|
| {{PLACEHOLDER}} tokens | Consistent with _core/ scaffold pattern. /wm-init-collab replaces {{SITE_NAME}}, {{SLUG}}, {{PROD_REPO}}. | ✓ |
| Environment variables / sed | $SITE_NAME or ___PLACEHOLDER___ style. Shell-idiomatic but inconsistent with existing convention. | |

**User's choice:** {{PLACEHOLDER}} tokens

---

## Claude's Discretion

- Whether `content-sync.yml` uses `git clone --depth 1` + `cp -rT` or `rsync` for the sync step
- Exact YAML structure of `content-sync.yml` (steps, timeout, concurrency group)
- `WM_DISPATCH_PAT` expiry documentation strategy
- Whether `content-sync.yml` opens a GitHub notification to alert the operator that content is ready

## Deferred Ideas

- Auto-publish on contributor content push (explicitly decided against)
- `repository_dispatch` trigger in `publish.yml` for full auto-rebuild (ROADMAP criterion #3 revised)
- Branch protection rules for changes outside `content/**`
- Org-level `WM_DISPATCH_PAT` secret (vs per-repo)
- `/wm-sync-content <slug>` manual operator skill for on-demand sync
