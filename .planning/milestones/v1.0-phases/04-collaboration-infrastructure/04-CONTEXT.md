# Phase 4: Collaboration Infrastructure — Context

**Gathered:** 2026-08-21
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase makes production repos contributor-ready: each repo gets a `main` branch (with `content/**/*.md` editable via GitHub web UI), CONTRIBUTING.md defining the two-tier model, three YAML issue templates + config.yml, `content-ci.yml` that triggers automated content sync into WebsiteMocker on contributor push, and a WebsiteMocker-side content sync workflow. Operator-controlled publishing is preserved — the automated pipeline syncs content, not deploys.

**What this phase does NOT do:** Auto-publish contributor content. Trigger full production rebuilds automatically. Gate `/wm-publish` on contributor activity.

</domain>

<decisions>
## Implementation Decisions

### Content Authoritativeness & Sync Direction

- **D-01:** WebsiteMocker is the canonical source. Production repo `main/content/` is a contributor interface, not the source of truth. The build always runs from WebsiteMocker.
- **D-02:** Contributor push flow: `production-repo/main/content/**/*.md` push → `content-ci.yml` → `repository_dispatch` → WebsiteMocker content-sync workflow → clones prod repo `main`, copies `content/` into `sites/<slug>/src/content/`, commits to WebsiteMocker `main` → stops. No auto-publish.
- **D-03:** Operator runs `/wm-publish <slug>` when ready to go live. `/wm-add-news` (and all other content skills) are unchanged — they commit directly to WebsiteMocker as before.
- **D-04:** Sync is additive-only. Files in WebsiteMocker that are absent from the production repo are NEVER deleted by the sync step. Contributor cannot remove content via the production repo — they must file a Tier-2 issue.
- **D-05:** ROADMAP criterion #3 is revised: `content-ci.yml` triggers a sync-only workflow (not `publish.yml`). CONTRIBUTING.md must set clear expectations: "content is reviewed by the operator before going live."
- **D-06:** A separate `content-sync.yml` workflow lives in WebsiteMocker (not a modified `publish.yml`) to keep concerns separate. It is triggered by `repository_dispatch` events of type `content-synced`.

### Init Tooling

- **D-07:** One-time production repo setup is delivered as `/wm-init-collab <slug>` — a Claude skill consistent with the project's skill-first pattern.
- **D-08:** `/wm-init-collab` is idempotent: checks what's already done (branch exists? labels exist? templates present?) and skips or updates steps already completed. Safe to re-run when templates need updating across all repos.
- **D-09:** The skill guides the operator through human-action steps that require manual GitHub UI/CLI work (creating `WM_DISPATCH_PAT`, storing it as a secret in each production repo).

### Repo Scope

- **D-10:** All four production repos get the full treatment: CONTRIBUTING.md, three YAML issue templates + config.yml, and `content-ci.yml`. The four repos are: `pbau3r-sfdy/starflight-dynamics` (sfdy-alt-clean), `pbau3r-sfdy/mogwai-systems`, `pbau3r-sfdy/parrot-capital`, `pbau3r-sfdy/crestworks`.

### Template Storage

- **D-11:** Template files live in `_templates/` directory in WebsiteMocker (not inline in the skill). Structure:
  ```
  _templates/
  ├── CONTRIBUTING.md
  └── .github/
      ├── ISSUE_TEMPLATE/
      │   ├── content-request.yml
      │   ├── design-change.yml
      │   ├── bug-report.yml
      │   └── config.yml
      └── workflows/
          └── content-ci.yml
  ```
- **D-12:** Template substitution uses `{{PLACEHOLDER}}` tokens — consistent with `_core/` scaffold pattern. Variables: `{{SITE_NAME}}`, `{{SLUG}}`, `{{PROD_REPO}}`. `/wm-init-collab` reads templates, substitutes tokens, then pushes to the production repo.

### Security (from research — locked by research.md)

- **D-13:** `WM_DISPATCH_PAT` (fine-grained PAT, `contents: write` on WebsiteMocker only) is stored in each production repo's Actions secrets. `WM_PUBLISH_PAT` is NEVER stored in production repos — it has full `repo` scope.
- **D-14:** `client_payload.slug` from `repository_dispatch` is validated against `^[a-z0-9-]+$` in `content-sync.yml` before any shell/path use.
- **D-15:** `peter-evans/repository-dispatch@v4` is the action used in `content-ci.yml`.

### Claude's Discretion

- Whether `content-sync.yml` uses `git clone --depth 1` + `cp -rT` or `rsync --delete` for the file sync step (research recommends `cp -rT` for MVP, avoiding `rsync --delete` since sync is additive-only)
- Exact YAML structure of `content-sync.yml` (steps, timeout, concurrency group)
- `WM_DISPATCH_PAT` expiry documentation (research recommends 1-year fine-grained PAT with renewal note in CLAUDE.md)
- Whether `content-sync.yml` opens a GitHub notification (issue or commit comment) to alert the operator that new content is ready for review

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Existing CI/CD infrastructure
- `.github/workflows/publish.yml` — Production publish workflow. `content-sync.yml` follows the same checkout + PAT pattern but stops before build/deploy. DO NOT modify `publish.yml` in this phase (the `repository_dispatch` trigger for auto-publish was deferred; sync uses a separate workflow).
- `.github/workflows/deploy.yml` — Sandbox deploy workflow. Reference for pinned action versions and build steps.

### Research (authoritative for Phase 4 architecture)
- `.planning/phases/04-collaboration-infrastructure/04-RESEARCH.md` — Complete architecture, cross-repo dispatch pattern, issue template syntax, pitfall list, security threat model. **Read fully before planning.**

### Site wiring and routing
- `sites/sfdy-alt-clean/wiring.json` — Reference wiring.json. Fields relevant here: `slug`, `name`, `prod_repo`, `domain`.
- `sites/mogwai-systems/wiring.json` — Second active site.
- `sites/parrot-capital/wiring.json` — Third production repo (holding page, `robots: disallow`).
- `sites/crestworks/wiring.json` — Fourth production repo (holding page, `robots: disallow`).
- `CLAUDE.md` — Site ownership table, skill quick-reference, production deployment model.

### Skill conventions
- `.claude/skills/wm-publish.md` — Reference for skill structure, wiring.json validation pattern, operator guidance steps. `/wm-init-collab` follows the same validate → act → report pattern.
- `_core/.claude/skills/` — Inherited content skills directory (content skills are unchanged in this phase).
- `.claude/skills/wm-add-news.md` — Content skill that stays unchanged. DO NOT modify.

### Content structure
- `sites/sfdy-alt-clean/src/content/` — Reference content directory structure (news/, jobs/, announcements/, blog/ with .gitkeep files). Production repo `content/` maps to this `src/content/` path during sync.

### Project conventions
- `_scripts/build-all.js` — Reference for build orchestration patterns and `_scripts/` conventions.
- `_scripts/new-site.sh` — Reference for `{{PLACEHOLDER}}` token substitution pattern used by `/wm-init-collab`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `_core/.claude/skills/` `{{PLACEHOLDER}}` substitution — already used by `new-site.sh`; `/wm-init-collab` reuses the same `sed`/substitution pattern for template tokens.
- `publish.yml` `persist-credentials: false` + `git remote set-url origin` pattern — known working approach for PAT-authenticated pushes; `content-sync.yml` uses the same approach for the WebsiteMocker commit-back.
- `publish.yml` slug validation regex (`^[a-z0-9-]+$`) — reuse verbatim in `content-sync.yml`.
- `JamesIves/github-pages-deploy-action@v4.8.0` — already pinned and proven; NOT used in this phase (no gh-pages push in content-sync.yml).

### Established Patterns
- **Skill-first pattern:** Every operator capability is a Claude skill in `.claude/skills/`. `/wm-init-collab` follows this.
- **wiring.json as source of truth:** `/wm-init-collab` reads `sites/<slug>/wiring.json` to get `name`, `prod_repo`, `domain` — no hardcoding.
- **Pinned action versions:** `.github/workflows/` files use pinned major versions. `content-ci.yml` template must pin `peter-evans/repository-dispatch@v4`.
- **`{{PLACEHOLDER}}` token substitution:** Used in `_core/` and `new-site.sh`. Same pattern for `_templates/` files.
- **`git remote set-url origin` after JamesIves:** Known pitfall from Phase 1 (STATE.md). `content-sync.yml` does NOT use JamesIves — but any commit-back to WebsiteMocker must happen before the remote is potentially altered.

### Integration Points
- `content-sync.yml` reads `client_payload.slug` from `repository_dispatch` event → validates → reads `sites/<slug>/wiring.json` → clones `prod_repo`'s `main` branch → copies `content/` to `sites/<slug>/src/content/` → commits to WebsiteMocker `main` via `WM_PUBLISH_PAT`
- `/wm-init-collab` reads `sites/<slug>/wiring.json` → substitutes tokens in `_templates/` files → pushes to `prod_repo`'s `main` branch using `gh` CLI → creates labels → sets default branch
- `_templates/content-ci.yml` sends `repository_dispatch` to `pbau3r-sfdy/WebsiteMocker` — hardcoded org/repo (no substitution needed here)

### Known Pitfalls (from RESEARCH.md — must be avoided)
- Labels in issue templates must be pre-created before templates are pushed (GitHub silently skips missing labels)
- `repository_dispatch` only triggers workflows on the default branch — WebsiteMocker's default is `main` (confirmed)
- After creating `main` branch in production repo, must explicitly set it as default (`gh repo edit --default-branch main`)
- `content-ci.yml` must include `paths: ['content/**/*.md']` filter — without it, every push (including to CONTRIBUTING.md) triggers a sync

</code_context>

<specifics>
## Specific Ideas

- CONTRIBUTING.md must explicitly state: "Content pushed to this repo is reviewed by the operator before going live." Do not promise immediate publish.
- `/wm-init-collab` should print a step-by-step PAT setup guide (fine-grained PAT creation, scopes, where to store it in GitHub Settings) so the operator doesn't have to look it up.
- `_templates/CONTRIBUTING.md` should include the frontmatter format table (with quoted dates warning) from RESEARCH.md — contributors need to know the exact format.
- Issue template `config.yml` must have `blank_issues_enabled: false` — no blank issue bypass.

</specifics>

<deferred>
## Deferred Ideas

- Auto-publish on contributor content push — explicitly decided against; operator controls publish timing
- `repository_dispatch` trigger added to `publish.yml` for auto-rebuild — deferred (was in ROADMAP criterion #3 but user revised to sync-only)
- Branch protection rules requiring PR review for changes outside `content/**` — post-MVP security hardening; research noted GitHub doesn't support file-path-specific branch protection natively
- Org-level `WM_DISPATCH_PAT` secret (vs per-repo) — optional convenience; `/wm-init-collab` documents how to do either
- `/wm-sync-content <slug>` operator skill — manual trigger to pull production repo content into WebsiteMocker on demand (complement to the automated content-ci.yml path)

</deferred>

---

*Phase: 04-collaboration-infrastructure*
*Context gathered: 2026-08-21 via discuss-phase conversation*
