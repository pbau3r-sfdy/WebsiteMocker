# Phase 9: Claude Design Connectivity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-14
**Phase:** 9-Claude Design Connectivity
**Areas discussed:** What gets pulled, Protecting hand edits, Tokens, Ad hoc UX and seeding

---

## Astro update (raised by the user's note)

| Option | Description | Selected |
|--------|-------------|----------|
| Flag it and ask first | Stay on 5.x; stop and ask before any upgrade | ✓ |
| Do it when needed | Planner/executor may upgrade within the phase | |
| Upgrade now, as its own step | Prerequisite plan | |

**User's choice:** Flag it and ask first.
**Notes:** The user's note was cut off after "please do"; clarified by question.

---

## What gets pulled

| Option | Description | Selected |
|--------|-------------|----------|
| Website-relevant set | tokens, templates/website, ui_kits/website, components, assets/logo, assets/brand | ✓ |
| Tokens + logos only | Smallest and safest | |
| Everything except uploads/ | Whole project minus exclusions | |

**User's choice:** Website-relevant set.

| Option | Description | Selected |
|--------|-------------|----------|
| Hard exclude + gitignored _staging/ | uploads/** never pulled, no override; staging gitignored | ✓ |
| Exclude by default, overridable | Staging in committed _captures/<slug>/raw/ | |

**User's choice:** Hard exclude + gitignored `_staging/`.

---

## Lock file and edit detection

| Option | Description | Selected |
|--------|-------------|----------|
| sites/<slug>/design.lock.json | Committed next to wiring.json | ✓ |
| _captures/<slug>/design.lock.json | Kept in the capture folder | |

**User's choice:** `sites/<slug>/design.lock.json`.

| Option | Description | Selected |
|--------|-------------|----------|
| Hash recorded at ingest | Lock stores component hash; mismatch = hand edit | ✓ |
| Compare against last ingest commit | Git-based | |
| Header comment with hash | Marker in each file | |

**User's choice:** Hash recorded at ingest.

---

## Protecting hand edits (conflict behaviour)

| Option | Description | Selected |
|--------|-------------|----------|
| Skip + write .incoming copy | Edited file untouched; new version staged with diff summary | ✓ |
| Ask, then overwrite | Per-section confirm; old file backed up | |
| Always skip, report only | Never overwrite | |

**User's choice:** Skip + write `.incoming` copy.

---

## Tokens

| Option | Description | Selected |
|--------|-------------|----------|
| doc_tokens only, plus Layout.astro proposal | Live CSS changes shown as an approvable diff | ✓ |
| doc_tokens and Layout.astro automatically | Fast, riskier on live sites | |
| doc_tokens only | Layout.astro always manual | |

**User's choice:** `brand.doc_tokens` only, plus a proposal for `Layout.astro`.

| Option | Description | Selected |
|--------|-------------|----------|
| Global default + per-site override | Unmapped tokens reported, kept out until mapped | ✓ |
| Per-site only | | |
| Pass-through with prefix | | |

**User's choice:** Global default + per-site override.

---

## Ad hoc UX and seeding

| Option | Description | Selected |
|--------|-------------|----------|
| Wiring block, else ask | Block if present, else list projects / artifact link / local export | ✓ |
| Always ask | | |
| Wiring block only | | |

**User's choice:** Wiring block, else ask.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep as last plan, gated on the spike | Incremental, approval of the exact path list each time | ✓ |
| Split into its own phase now | | |
| Backlog it | | |

**User's choice:** Keep as the last plan, gated on the spike.

| Option | Description | Selected |
|--------|-------------|----------|
| Optional prompt after scaffold, skippable | In /wm-new-site and /wm-instantiate | ✓ |
| Only via /wm-design-pull | | |
| Ask before scaffolding | | |

**User's choice:** Optional prompt after scaffold, skippable.

---

## Mid-discussion plan change (not a gray area)

The user asked whether the plan "strip jobs from reskin-2, add drops and analytics, substitute on sfdy" was right. Answer: yes in direction; publish rather than copy; fix the contributor-sync slug; remove the internal `/open-points` page. Decision: add the SFDY cutover as its own **Phase 12**.

## Claude's Discretion

JSX render path (from the spike), sanitiser implementation, lock schema details, staging layout, default token map, diff format.

## Deferred Ideas

Phase 12 SFDY cutover; push-back beyond seeding; scheduled auto-pull; two-way merge engine.
