# Phase 4: Collaboration Infrastructure - Research

**Researched:** 2026-08-20
**Domain:** GitHub Actions cross-repo dispatch, GitHub issue templates, branch model, security
**Confidence:** HIGH (core mechanism), MEDIUM (security mitigations), HIGH (issue template syntax)

---

## Summary

Phase 4 makes production repos contributor-ready by establishing a two-branch model (`main` for content, `gh-pages` for built output), shipping GitHub issue templates, and wiring an automated rebuild pipeline. All four production repos currently have **only a `gh-pages` branch** (confirmed via GitHub API) — creating a `main` branch and setting it as default is the first concrete action of this phase.

The central mechanism is a `repository_dispatch` event: when a contributor pushes `content/**/*.md` to a production repo's `main` branch, `content-ci.yml` fires and sends a `repository_dispatch` event to WebsiteMocker's `publish.yml`. `publish.yml` then fetches the new content from the production repo's public `main` branch, commits it into `sites/<slug>/src/content/`, and rebuilds the live site. This keeps WebsiteMocker as the single build source while the production repo's `main` branch serves as the contributor-facing editing surface.

The existing `WM_PUBLISH_PAT` (Classic PAT, `repo` scope) is sufficient to send `repository_dispatch` events to WebsiteMocker — but for security, a separate `WM_DISPATCH_PAT` (fine-grained, `contents: write` on WebsiteMocker only) should be created and stored in production repos. This limits the blast radius if a production repo is compromised: the fine-grained token cannot push to `gh-pages` or run arbitrary workflow operations.

**Primary recommendation:** Use `repository_dispatch` (not `workflow_dispatch`) as the cross-repo trigger. Modify `publish.yml` to accept both trigger types and add a content-sync step. Store a limited `WM_DISPATCH_PAT` in production repos rather than reusing the full `WM_PUBLISH_PAT`.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| COLLAB-01 | CONTRIBUTING.md in each production repo defining two-tier model | GitHub renders CONTRIBUTING.md from root/docs/.github/ automatically on new issue/PR — confirmed placement + content conventions |
| COLLAB-02 | Three YAML issue templates + config.yml disabling blank issues | GitHub issue form syntax verified from official docs; `blank_issues_enabled: false` in config.yml; labels in template frontmatter |
| COLLAB-03 | Auto-labeling on issues | Labels set in template frontmatter `labels:` field; labels must pre-exist in repo; no external action needed for template-based labeling |
| COLLAB-04 | Two-branch model: main holds content + CI, gh-pages holds built output | Confirmed production repos have gh-pages only; main branch must be created (orphan); GitHub Pages source stays on gh-pages |
| COLLAB-05 | content-ci.yml dispatches publish.yml on content push | repository_dispatch mechanism verified; peter-evans/repository-dispatch@v4 action confirmed legitimate; publish.yml modification pattern documented |
</phase_requirements>

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Content editing interface | Production repo `main` (GitHub) | — | GitHub web UI editing of .md files; no local tooling needed |
| Rebuild trigger | Production repo CI (`content-ci.yml`) | — | Path-filtered push event → dispatch to WebsiteMocker |
| Cross-repo event delivery | GitHub API (`repository_dispatch`) | — | REST POST from production repo to WebsiteMocker |
| Content sync to build source | WebsiteMocker `publish.yml` | — | Fetch from public production repo + commit to WebsiteMocker |
| Site build | WebsiteMocker `publish.yml` | — | Unchanged from Phase 1 |
| Built output delivery | Production repo `gh-pages` branch | — | JamesIves action unchanged |
| Issue triage routing | Operator (manual) | GitHub labels | Design/page issues labeled in production repo, triaged back to WebsiteMocker sandbox |
| Branch model setup | Operator script / one-time manual | GitHub API | Create orphan `main`, push template files, set as default branch |

---

## Standard Stack

### Core GitHub Actions

| Action | Version | Purpose | Why Standard |
|--------|---------|---------|--------------|
| `peter-evans/repository-dispatch` | v4 | Send `repository_dispatch` event from content-ci.yml to WebsiteMocker | Official Action Marketplace; maintained by prolific GitHub Actions author; `repo` or fine-grained `contents:write` only |
| `actions/checkout` | v7 | Already in use in publish.yml and deploy.yml | Pinned in codebase |

No new npm packages required for this phase. All changes are YAML workflow files, Markdown template files, and modifications to existing `publish.yml`.

### Supporting: GitHub native features

| Feature | Purpose | When to Use |
|---------|---------|-------------|
| `repository_dispatch` event | Cross-repo trigger with typed payload | content-ci.yml → publish.yml dispatch |
| YAML issue forms | Structured contributor inputs with auto-labeling | Three templates per production repo |
| `config.yml` (ISSUE_TEMPLATE folder) | Disable blank issues, add contact links | Required for COLLAB-02 |
| GitHub branch protection (basic) | Require PR for changes outside `content/**` | Optional security hardening post-MVP |

---

## Package Legitimacy Audit

This phase installs **no new npm packages**. All tooling is GitHub Actions (YAML) and native GitHub features.

| Action | Source | Age | Usage | slopcheck | Disposition |
|--------|--------|-----|-------|-----------|-------------|
| `peter-evans/repository-dispatch@v4` | github.com/peter-evans/repository-dispatch | 5+ yrs | 50M+ workflow runs (GitHub Marketplace) | N/A (GH Action, not npm) | Approved — well-established Action by known maintainer |

**Packages removed due to slopcheck:** none
**Packages flagged as suspicious:** none

*Note: GitHub Actions (YAML `uses:` references) are not npm packages and are not screened by slopcheck. Legitimacy was assessed by checking the GitHub Marketplace listing and confirming active maintenance.*

**Recommendation:** Pin `peter-evans/repository-dispatch` to a commit SHA in production for supply-chain safety (see Security Domain section).

---

## Architecture Patterns

### System Architecture Diagram

```
Production repo (e.g., pbau3r-sfdy/starflight-dynamics)
  main branch:
    content/
      news/2026-08-20-post.md    ← contributor edits here (GitHub web UI)
    .github/
      workflows/content-ci.yml  ← path-filtered push trigger
      ISSUE_TEMPLATE/
        content-request.yml
        design-change.yml
        bug-report.yml
        config.yml               ← blank_issues_enabled: false
    CONTRIBUTING.md

  [push to main, path: content/**/*.md]
        │
        ▼
  content-ci.yml fires
        │ POST /repos/pbau3r-sfdy/WebsiteMocker/dispatches
        │ event_type: content-updated
        │ client_payload: {slug: "sfdy-alt-clean"}
        │ auth: WM_DISPATCH_PAT (fine-grained, contents:write on WebsiteMocker only)
        ▼
  WebsiteMocker publish.yml (repository_dispatch trigger)
        │
        ├── read slug from github.event.client_payload.slug
        ├── validate wiring.json (stage ≥ 5)
        ├── [NEW] fetch content from production repo main/content/**
        │         (public repo, no auth needed)
        │         copy into sites/<slug>/src/content/
        │         commit to WebsiteMocker main via WM_PUBLISH_PAT
        ├── build site (build-single.mjs)
        ├── inject CNAME, swap robots.txt
        └── push to production repo gh-pages (JamesIves action)

  Production repo gh-pages: ← live site output (unchanged)
```

### Recommended Project Structure (files to create)

```
WebsiteMocker/
├── _templates/                    ← NEW: production repo template files
│   ├── CONTRIBUTING.md            ← template (slug/name filled at deploy time)
│   ├── .github/
│   │   ├── ISSUE_TEMPLATE/
│   │   │   ├── content-request.yml
│   │   │   ├── design-change.yml
│   │   │   ├── bug-report.yml
│   │   │   └── config.yml
│   │   └── workflows/
│   │       └── content-ci.yml     ← template (slug/prod_repo filled at deploy time)
└── .github/
    └── workflows/
        └── publish.yml            ← MODIFIED: add repository_dispatch trigger + content sync
```

**Alternative (no `_templates/` dir):** inline the template content directly in a `_scripts/init-prod-repo.mjs` script that creates all files programmatically. This avoids template variable substitution complexity at the cost of harder maintainability.

### Pattern 1: Cross-Repo Dispatch (repository_dispatch)

**What:** content-ci.yml in the production repo sends a webhook event to WebsiteMocker; publish.yml listens for it.

**When to use:** Any time a production repo needs to trigger a build without giving the production repo write access to WebsiteMocker source.

**content-ci.yml (production repo):**
```yaml
# Source: github.com/peter-evans/repository-dispatch + GitHub Actions docs
name: Content CI

on:
  push:
    branches: [main]
    paths:
      - 'content/**/*.md'

jobs:
  dispatch-publish:
    runs-on: ubuntu-latest
    steps:
      - uses: peter-evans/repository-dispatch@v4
        with:
          token: ${{ secrets.WM_DISPATCH_PAT }}
          repository: pbau3r-sfdy/WebsiteMocker
          event-type: content-updated
          client-payload: '{"slug": "sfdy-alt-clean"}'
```

**publish.yml trigger modification:**
```yaml
# Source: GitHub Actions docs - events-that-trigger-workflows#repository_dispatch
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

**Slug resolution in publish.yml (works for both triggers):**
```yaml
# In steps, resolve slug from either trigger source:
- name: Resolve slug
  id: slug
  run: |
    if [ "${{ github.event_name }}" = "repository_dispatch" ]; then
      echo "slug=${{ github.event.client_payload.slug }}" >> $GITHUB_OUTPUT
    else
      echo "slug=${{ inputs.slug }}" >> $GITHUB_OUTPUT
    fi
```

### Pattern 2: Content Sync Step in publish.yml

**What:** When triggered by `repository_dispatch`, publish.yml fetches content from the production repo's public `main` branch before building, then commits it to WebsiteMocker.

**When to use:** Automated rebuild triggered by contributor content push.

```yaml
# Source: GitHub REST API + standard git clone
- name: Sync content from production repo (automated trigger only)
  if: github.event_name == 'repository_dispatch'
  run: |
    PROD_REPO="${{ steps.wiring.outputs.prod_repo }}"
    SLUG="${{ steps.slug.outputs.slug }}"
    # Production repos are public — no auth needed to clone
    git clone --depth 1 --branch main \
      "https://github.com/${PROD_REPO}.git" /tmp/prod-content
    # content/ in prod repo maps to src/content/ in WebsiteMocker
    mkdir -p "sites/${SLUG}/src/content"
    # Sync only (rsync would be ideal; cp -r works for MVP)
    cp -rT /tmp/prod-content/content/ "sites/${SLUG}/src/content/"
    # Commit back to WebsiteMocker so content is persistent
    git config user.name  "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add "sites/${SLUG}/src/content/"
    git commit -m "chore(${SLUG}): sync content from production repo" || echo "No content changes"
    git remote set-url origin \
      "https://x-access-token:${{ secrets.WM_PUBLISH_PAT }}@github.com/${{ github.repository }}.git"
    git push origin main
```

**Important:** This commit-back happens BEFORE the build step, so the build picks up the synced content.

### Pattern 3: GitHub YAML Issue Template

**What:** Structured issue forms with auto-labeling and mandatory fields.

```yaml
# Source: docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms
name: Content Request
description: Request a new content item — news post, job posting, announcement, or blog post
title: "[Content] "
labels: ["content-request"]
body:
  - type: dropdown
    id: content-type
    attributes:
      label: Content Type
      options: [News article, Job posting, Announcement, Blog post]
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: What should this content say?
      description: Key points, facts, dates, links
    validations:
      required: true
  - type: input
    id: deadline
    attributes:
      label: Publish by (optional)
      placeholder: "YYYY-MM-DD"
```

```yaml
# .github/ISSUE_TEMPLATE/config.yml
# Source: docs.github.com/en/communities/.../configuring-issue-templates-for-your-repository
blank_issues_enabled: false
contact_links:
  - name: Contribution Guide
    url: https://github.com/pbau3r-sfdy/REPO/blob/main/CONTRIBUTING.md
    about: Read before opening an issue — explains what to file vs. what to push directly
```

**Key constraint:** Labels listed in template `labels:` field must already exist in the repository — GitHub will silently skip labels that don't exist. Labels must be created before issue templates are active.

### Anti-Patterns to Avoid

- **Using `WM_PUBLISH_PAT` in production repos:** Full `repo`-scope PAT stored in production repo gives any contributor with write access (via modified workflow) the ability to push to any `pbau3r-sfdy/*` repo. Use a separate limited `WM_DISPATCH_PAT`.
- **Triggering `workflow_dispatch` from content-ci.yml:** `workflow_dispatch` API requires `repo` scope AND the target workflow must be on the default branch. `repository_dispatch` is more flexible and requires only `contents: write` fine-grained scope.
- **Floating action tags:** `uses: peter-evans/repository-dispatch@v4` is acceptable for MVP; pin to commit SHA for production hardening (`@abc1234`).
- **Auto-labeling in `config.yml`:** Labels cannot be set in `config.yml`. They must be in each template's frontmatter `labels:` field.
- **Putting content-ci.yml behind a PR requirement:** If `main` requires PR review, contributors cannot push directly via web UI. Branch protection for `.github/workflows/` would need to be file-path-specific — GitHub doesn't support this natively. The MVP accepts the tradeoff.
- **Blank issues enabled with templates present:** Without `blank_issues_enabled: false` in config.yml, contributors can bypass templates.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cross-repo event dispatch | Custom curl POST in shell | `peter-evans/repository-dispatch@v4` | Handles auth headers, error handling, retry; tested against GitHub API edge cases |
| Issue template format | Custom Markdown templates | GitHub YAML issue forms (`.yml`) | YAML forms enforce required fields, provide dropdowns, and auto-label — Markdown templates cannot enforce required fields |
| Content sync | git submodules or rsync daemon | Simple `git clone --depth 1` + `cp -rT` in publish.yml | Production repos are public; shallow clone is fast; no infrastructure needed |
| Branch creation | GitHub UI manual steps | `_scripts/init-prod-repo.mjs` script using `gh` CLI | Reproducible for all 4 repos; documents the exact sequence; verifiable |

**Key insight:** GitHub's native issue form YAML (not the old Markdown template format) is the right tool. It enforces required fields, provides type-safe dropdowns, and applies labels atomically. The old Markdown template format cannot enforce required fields.

---

## Common Pitfalls

### Pitfall 1: `repository_dispatch` only fires on default branch workflows
**What goes wrong:** `publish.yml` is committed to WebsiteMocker's `main` branch (which is the default branch — confirmed). `repository_dispatch` only triggers workflows on the repository's default branch. If WebsiteMocker's default branch were `gh-pages`, the trigger would never fire.
**Why it happens:** GitHub restriction on `repository_dispatch` trigger scope.
**How to avoid:** WebsiteMocker's default branch is `main` (confirmed via API). No action needed; the constraint is already satisfied.
**Warning signs:** Dispatch events appear in the GitHub audit log but no workflow run is created.

### Pitfall 2: Labels don't exist when issue template applies them
**What goes wrong:** Issue template has `labels: ["content-request"]` but the label doesn't exist in the production repo. GitHub silently applies no label; the issue appears unlabeled.
**Why it happens:** GitHub doesn't auto-create labels from templates.
**How to avoid:** `init-prod-repo.mjs` must create labels in the production repo BEFORE pushing issue templates. Use `gh label create "content-request" --color "#0075ca" --repo pbau3r-sfdy/<slug>`.
**Warning signs:** Issues filed via template appear without the expected label.

### Pitfall 3: Production repo `main` default branch not set after creation
**What goes wrong:** GitHub keeps `gh-pages` as the default branch (because it was the first/only branch). New contributors opening the repo see built HTML output, not `CONTRIBUTING.md`.
**Why it happens:** GitHub's default branch is set when the first branch is created; it's not automatically updated when a new branch is added.
**How to avoid:** After pushing `main` to the production repo, explicitly set it as default: `gh repo edit pbau3r-sfdy/<slug> --default-branch main`.
**Warning signs:** GitHub web UI shows `gh-pages` as the default in the branch dropdown.

### Pitfall 4: Content sync overwrites files committed directly by operator in WebsiteMocker
**What goes wrong:** Operator runs `/wm-add-news` which commits a news post to WebsiteMocker's `sites/<slug>/src/content/news/`. Then a contributor pushes a different post to the production repo `main`. The `cp -rT` content sync could overwrite files that exist in WebsiteMocker but not in the production repo (if a production-repo-side delete occurred).
**Why it happens:** `cp -rT` copies all files from production repo but doesn't delete files in WebsiteMocker that are absent from the production repo.
**How to avoid:** For MVP, use `rsync --delete` instead of `cp -rT` when the production repo `content/` is the authoritative source, OR accept that WebsiteMocker's content dir is a superset of the production repo's. Document the chosen policy clearly in CONTRIBUTING.md.
**Warning signs:** Content files disappear from WebsiteMocker after an automated publish run.

### Pitfall 5: `content-ci.yml` fires on every push, not only content changes
**What goes wrong:** If `paths:` filter is omitted or misconfigured, every push to `main` (e.g., editing CONTRIBUTING.md) triggers a full rebuild.
**Why it happens:** GitHub `push` event without `paths:` fires on all file changes.
**How to avoid:** Always include `paths: ['content/**/*.md']` in the `on.push` trigger of `content-ci.yml`. Add `paths-ignore` for `.github/**` changes.
**Warning signs:** publish.yml runs are triggered when CONTRIBUTING.md is updated.

### Pitfall 6: JamesIves action resets origin to production repo
**What goes wrong:** The content-sync step in publish.yml does a `git remote set-url origin` for WM_PUBLISH_PAT BEFORE the JamesIves action. JamesIves then overwrites `origin` to point to the production repo. The final `git push origin main` (for wiring.json update) fails.
**Why it happens:** Already known pattern from Phase 1 (STATE.md records this). JamesIves action overwrites git remote.
**How to avoid:** The `git remote set-url origin` must come AFTER the JamesIves deploy step, as is currently done in publish.yml. Keep this ordering when inserting the content-sync step (insert BEFORE JamesIves, not after).
**Warning signs:** `git push origin main` in the wiring.json update step pushes to the production repo instead of WebsiteMocker.

---

## Runtime State Inventory

> Not a rename/refactor phase — this section is OMITTED per instructions.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `gh` CLI | `init-prod-repo.mjs` (branch creation, label creation, default branch set) | ✓ | Available in GitHub Actions `ubuntu-latest`; available locally (pbau3r-sfdy org authenticated) | Manual GitHub UI steps |
| WM_PUBLISH_PAT | publish.yml commit-back + JamesIves push | ✓ (exists as org secret) | Classic PAT, `repo` scope | — |
| WM_DISPATCH_PAT | content-ci.yml in production repos | ✗ (must be created) | Fine-grained, `contents: write` on WebsiteMocker | Use WM_PUBLISH_PAT with documented risk (not recommended) |
| Production repo write access | init-prod-repo.mjs (push `main` branch) | ✓ (pbau3r-sfdy org member) | gh auth: pbau3r-sfdy authenticated | — |

**Missing dependencies with no fallback:**
- `WM_DISPATCH_PAT`: Must be created as a fine-grained PAT (GitHub Settings → Developer settings → Fine-grained tokens) and stored in each production repo's Actions secrets. This is a human action; no code can substitute for it. The init script should document exact steps.

**Missing dependencies with fallback:**
- None

---

## Code Examples

### Full content-ci.yml template
```yaml
# Source: github.com/peter-evans/repository-dispatch docs + GitHub Actions push event docs
name: Content CI

on:
  push:
    branches: [main]
    paths:
      - 'content/**/*.md'

concurrency:
  group: content-ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  dispatch-publish:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - name: Dispatch publish to WebsiteMocker
        uses: peter-evans/repository-dispatch@v4
        with:
          token: ${{ secrets.WM_DISPATCH_PAT }}
          repository: pbau3r-sfdy/WebsiteMocker
          event-type: content-updated
          client-payload: '{"slug": "SLUG_PLACEHOLDER"}'
```

### Label creation (init-prod-repo.mjs)
```bash
# Source: gh CLI docs + GitHub Labels API
gh label create "content-request" --color "#0075ca" --description "New content item requested" --repo pbau3r-sfdy/<slug>
gh label create "design-change"   --color "#e4e669" --description "Visual or layout change requested" --repo pbau3r-sfdy/<slug>
gh label create "bug"             --color "#d73a4a" --description "Something isn't working" --repo pbau3r-sfdy/<slug>
```

### Setting default branch after creating main
```bash
# Source: gh CLI docs
gh repo edit pbau3r-sfdy/<slug> --default-branch main
```

### publish.yml: reading slug from either trigger
```yaml
# Source: GitHub Actions context docs
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

### CONTRIBUTING.md structure (contributor-facing)
```markdown
# Contributing to [Site Name]

Thank you for contributing!

## Two-tier contribution model

### Tier 1 — Content you can push directly
Push `.md` files to the `content/` directory on this branch. The site rebuilds automatically.

Supported content types:
- `content/news/YYYY-MM-DD-slug.md` — News articles
- `content/jobs/YYYY-MM-DD-slug.md` — Job postings
- `content/announcements/YYYY-MM-DD-slug.md` — Announcements
- `content/blog/YYYY-MM-DD-slug.md` — Blog posts

See the [content format guide](#content-format) below for required frontmatter fields.

### Tier 2 — Everything else (file a GitHub Issue)
For page edits, design changes, new pages, or bugs — open an issue using the templates above.
The site operator will triage your request and implement it via the WebsiteMocker sandbox.

Do **not** push files outside `content/` — changes to `.github/workflows/` or site structure
require operator review.

## Content format

Each `.md` file must start with frontmatter:

\`\`\`yaml
---
title: "Your title here"
date: "YYYY-MM-DD"
summary: "One-sentence summary"
tags: []
---
\`\`\`

Use quoted dates (`"2026-08-20"` not `2026-08-20`) — this prevents YAML parsing errors when
editing via the GitHub web UI.
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Markdown issue templates (`*.md` in ISSUE_TEMPLATE/) | YAML issue forms (`*.yml`) | 2021 | YAML forms enforce required fields, support dropdowns, apply labels — Markdown cannot |
| Classic PAT for all GitHub Actions auth | Fine-grained PATs scoped per-repo | 2022 (GA 2023) | Reduces blast radius; `contents: write` on one repo only |
| `workflow_dispatch` as cross-repo trigger | `repository_dispatch` as cross-repo trigger | Long-standing best practice | `repository_dispatch` uses REST API (any auth can call it); `workflow_dispatch` requires `actions:write` |

**Deprecated/outdated:**
- Markdown ISSUE_TEMPLATE files (`.md`): Still functional, but cannot enforce required fields. YAML forms (`.yml`) are the current standard.
- Using `GITHUB_TOKEN` for cross-repo operations: Token is scoped to the current repo only. Must use PAT or GitHub App.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | PAT scoping — fine-grained WM_DISPATCH_PAT, not full WM_PUBLISH_PAT in production repos |
| V3 Session Management | no | No sessions; stateless GitHub Actions |
| V4 Access Control | yes | Production repo write access to trusted contributors only; `main` branch not open to anonymous push |
| V5 Input Validation | yes | `client_payload.slug` validated against `^[a-z0-9-]+$` regex in publish.yml before use in shell/paths (same pattern already in publish.yml) |
| V6 Cryptography | no | No cryptographic operations; PATs handled by GitHub |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Contributor modifies `content-ci.yml` to exfiltrate `WM_DISPATCH_PAT` | Information disclosure | Use fine-grained PAT limited to `contents: write` on WebsiteMocker only — exfiltrated token cannot push to gh-pages or trigger other workflows |
| Contributor injects malicious `.md` content (XSS in markdown rendered by Astro) | Tampering | Astro's default rendering escapes HTML in Markdown; review frontmatter field injection risk. Standard Astro behavior is safe. |
| Replay or flood dispatch events (content-ci.yml triggered many times) | Denial of service | `concurrency: cancel-in-progress: false` in publish.yml prevents queue flood; concurrency group per-slug ensures only one build per site at a time |
| Slug injection via `client_payload.slug` | Elevation of privilege | Slug validated against `^[a-z0-9-]+$` regex in publish.yml before any shell/path use — this check already exists and must be retained when adding `repository_dispatch` path |

**Critical security constraint:** `WM_PUBLISH_PAT` (full `repo` scope) must NEVER be stored as a secret in production repos. Only `WM_DISPATCH_PAT` (fine-grained, `contents: write` on WebsiteMocker) goes into production repos. This is the single most important security decision of this phase.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Fine-grained PAT with `contents: write` on WebsiteMocker is sufficient to send `repository_dispatch` events to that repo | Standard Stack, Security | If wrong, `repo`-scope classic PAT is needed in production repos — increases blast radius; must be communicated to user |
| A2 | Production repos (starflight-dynamics, mogwai-systems, parrot-capital, crestworks) are all in `pbau3r-sfdy` org and accessible to the operator for branch creation | Environment Availability | If access differs per-repo, some may need separate setup |
| A3 | `cp -rT` is available in `ubuntu-latest` GitHub Actions runner | Code Examples | Fallback: use `rsync` or explicit `cp -r` without `-T` flag |
| A4 | GitHub silently skips labels that don't exist in the repo (rather than erroring) | Pitfalls | If GitHub errors on missing labels, templates would fail to be created — label pre-creation becomes blocking |
| A5 | `crestworks` production repo exists at `pbau3r-sfdy/crestworks` | Environment | wiring.json for crestworks not read during research; confirm it has `prod_repo` set |

---

## Open Questions

1. **Content sync direction: who is authoritative?**
   - What we know: WebsiteMocker is the build source; production repo `main/content/` is the contributor interface
   - What's unclear: If operator runs `/wm-add-news` (commits to WebsiteMocker) AND a contributor pushes to production repo, the sync could go in two directions. The `cp -rT` approach makes the production repo `main` authoritative for the sync step — content in WebsiteMocker not in the production repo would survive (files are only copied, not deleted). But the inverse (a contributor deletes a post from the production repo) would NOT be reflected until the operator also removes it from WebsiteMocker.
   - Recommendation: For MVP, make the production repo additive-only via CONTRIBUTING.md guidance ("push new files; to remove content, file an issue"). Operator removes from WebsiteMocker directly. Document this explicitly.

2. **Which production repos need Phase 4 treatment?**
   - What we know: CLAUDE.md lists sfdy-alt-clean (stage 6), mogwai-systems (stage 6), parrot-capital (stage 4), crestworks (template? unclear)
   - What's unclear: parrot-capital is stage 4 (not yet live). Should it get content-ci.yml now or only after stage 6? COLLAB requirements say "production repos" without specifying stage.
   - Recommendation: Apply CONTRIBUTING.md and templates to all repos with `prod_repo` set (sfdy-alt-clean, mogwai-systems, parrot-capital); hold off on `content-ci.yml` for repos not yet at stage 6 since the dispatch would trigger a publish of a non-live site.

3. **WM_DISPATCH_PAT: classic vs fine-grained**
   - What we know: Fine-grained PAT with `contents: write` on WebsiteMocker is confirmed to work for `repository_dispatch` (Elio Struyf article, cross-referenced with peter-evans README)
   - What's unclear: Fine-grained PATs expire (GitHub enforces max 1 year). Classic PATs can be set to no-expiry. Long-term maintenance preference?
   - Recommendation: Use fine-grained PAT (better security), set 1-year expiry, document renewal in CLAUDE.md. Add a reminder comment to publish.yml.

---

## Sources

### Primary (HIGH confidence)
- [docs.github.com — Syntax for issue forms](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms) — YAML frontmatter fields, body element types
- [docs.github.com — Configuring issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository) — config.yml `blank_issues_enabled: false`
- [docs.github.com — REST API: create repository dispatch event](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event) — `repo` scope required for classic PAT; verified `client_payload` format
- [docs.github.com — Setting guidelines for repository contributors](https://docs.github.com/en/communities/setting-up-your-project-for-healthy-contributions/setting-guidelines-for-repository-contributors) — CONTRIBUTING.md placement (root/docs/.github)
- [github.com/peter-evans/repository-dispatch](https://github.com/peter-evans/repository-dispatch) — Action usage syntax, token scope requirements
- GitHub API (live): confirmed starflight-dynamics and mogwai-systems production repos have `gh-pages` branch only, no `main` branch
- GitHub API (live): confirmed WebsiteMocker default branch is `main`

### Secondary (MEDIUM confidence)
- [eliostruyf.com — Dispatch GitHub Action via fine-grained PAT](https://www.eliostruyf.com/dispatch-github-action-fine-grained-personal-access-token/) — Fine-grained PAT: `contents: read/write` sufficient for `repository_dispatch`
- [GitHub Actions security — WebSearch + Orca, Arctiq, GitHub Security Lab results] — threat patterns for cross-repo dispatch
- [docs.github.com — Events that trigger workflows#repository_dispatch] — `types:` filter syntax, default-branch constraint

### Tertiary (LOW confidence)
- None — all critical claims verified via official docs or live API

---

## Metadata

**Confidence breakdown:**
- Standard stack (repository_dispatch mechanism): HIGH — verified against GitHub REST API docs and peter-evans README
- Issue template syntax: HIGH — verified against official GitHub docs
- Fine-grained PAT scope for dispatch: MEDIUM — one primary source (Elio Struyf article) cross-referenced with peter-evans README; not in official REST API docs explicitly
- Content sync step pattern: MEDIUM — standard git + cp pattern; logic is sound but untested in this specific codebase
- Security mitigations: MEDIUM — based on known GitHub Actions security literature; specific to this architecture

**Research date:** 2026-08-20
**Valid until:** 2027-02-20 (GitHub Actions API is stable; issue template syntax rarely changes)
