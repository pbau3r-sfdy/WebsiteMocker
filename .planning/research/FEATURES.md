# Feature Landscape: Static-Site Deploy Pipeline + Content System

**Domain:** Skill-driven Astro monorepo → per-site GitHub Pages production pipeline with async team contribution
**Researched:** 2026-08-20
**Milestone scope:** DEPLOY, INGEST, BRAND, CONTENT, COLLAB requirement groups in PROJECT.md

---

## Framing: What This System Is Competing Against

The baseline comparison is NOT Vercel/Netlify. The system is a skills-layer on top of GitHub Actions + GitHub Pages. The real comparison is "managing this by hand" — manual `git push`, hand-written DNS records, ad-hoc content file paths, Slack DMs for design change requests. Table stakes in this context means: features that make the system reliably usable versus doing it by hand.

---

## 1. Production Deploy (DEPLOY-01 to DEPLOY-03)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Cross-repo push via PAT | Without this the gh-pages branch on the production org is unreachable from WebsiteMocker's Actions runner | Low | JamesIves/github-pages-deploy-action v4 supports `repository: org/repo` + `token: ${{ secrets.PAT }}`. PAT needs `contents: write` on target repo. |
| Env-aware Astro build (SITE_URL + SITE_BASE) | Sandbox uses `/WebsiteMocker/<slug>` base; production uses `/` with custom domain. Wrong base = broken asset paths in prod. | Low | Already partially in place — `astro.config.mjs` has env var fallback. `publish.yml` must set `SITE_URL` and `SITE_BASE=""`. |
| Stage gate: require stage ≥ 5 before publish | Prevents accidentally pushing incomplete sites. Equivalent to a release branch policy. | Low | `/wm-publish` skill reads `wiring.json.stage` and aborts if < 5. |
| CNAME file in deploy output | GitHub Pages won't activate a custom domain without it. Missing CNAME = 404 on custom domain after deploy. | Low | `publish.yml` must echo `$DOMAIN > dist/<slug>/CNAME` before the push step. Without this, GitHub Pages reverts to default URL. |
| Single-commit gh-pages history on target repo | Keeps production repos lean; built output history is noise. | Low | `single-commit: true` in JamesIves action. Already used in sandbox deploy. |
| `wiring.json` updated after publish (stage 6, last_deploy, prod_repo) | Dashboard reads these fields. Stale = wrong stage shown, wrong perf URL fetched. | Low | `/wm-publish` skill must update wiring.json as final step and commit. |
| Idempotent workflow (safe to re-run) | Failed halfway runs must not corrupt the target repo. Re-running a completed deploy must not break anything. | Low | JamesIves action is inherently idempotent — push overwrites target branch. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Auto-generated Squarespace DNS handoff guide | Non-obvious step for non-technical site owners. Generated guide (CNAME record + verification TXT + custom domain activation steps) removes the bottleneck between deploy and DNS cutover. | Low | Template Markdown file rendered with site-specific values. Not a live API call — static instructions. |
| Deploy summary comment on the triggering commit | Makes it easy to find the production URL and verify deploy completed successfully. | Low | `gh` CLI `gh commit comment` or GitHub Actions step summary. |
| `robots.txt` swap at publish time | Sandbox has `Disallow: /`. Production must have `Allow: /` or site-specific robots rules. Forgetting this = production site not indexed. | Low | `publish.yml` must overwrite `robots.txt` with production variant before push. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Automatic Squarespace DNS API changes | Squarespace DNS API is not publicly documented for programmatic record management; attempting automation creates false confidence that DNS is handled when it may not be. | Generate the records to paste; let the operator apply them manually. |
| Multi-host targets (Netlify, Vercel, Cloudflare Pages) | This system is explicitly GitHub Pages + Squarespace DNS only. Adding targets fragments the deploy logic. | Out of scope for this milestone. Revisit if a site needs edge functions. |
| Deploy preview URLs per PR | Useful but requires a second GitHub Pages site or a third-party service. Not worth the complexity overhead for a solo operator with a sandbox already serving this role. | Sandbox GitHub Pages URL IS the preview. |
| Blue/green or zero-downtime switchover | GitHub Pages has no traffic-split capability. Attempting this adds complexity with no realistic benefit for the site scale involved. | Accept brief propagation window (typically < 60 seconds). |

### Feature Dependencies

```
SITE_URL + SITE_BASE env vars in astro.config.mjs
  → env-aware build
    → CNAME file write
      → cross-repo push with PAT
        → GitHub Pages custom domain activation
          → wiring.json stage 6 update
```

---

## 2. Markdown Content Management (CONTENT-01 to CONTENT-04, COLLAB-04)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Astro content collections with typed Zod schema | Type-safe rendering, automatic collection query, build-time validation of frontmatter. Without this, missing required fields fail silently at runtime. | Low | Already exists for `news` in `_core/src/content/config.ts`. Needs extending to `jobs`. |
| `YYYY-MM-DD-slug.md` filename convention | GitHub web UI lists files alphabetically — date prefix gives chronological order without a database. Contributors can immediately see the timeline. | Low | Already used in `sfdy-alt-clean`. Must be documented and enforced as the canonical pattern. |
| Required frontmatter fields minimal and documented | Non-technical contributors fail at the frontmatter step more than anywhere else. Every required field must have a clear example in CONTRIBUTING.md. | Low | Current schema: `title`, `date`, `summary` required; `image`, `imageCredit` optional. This is the right minimal set. |
| GitHub web UI editing works without build tool | The entire COLLAB-04 requirement. If a contributor edits a `.md` file in `github.com/<org>/<repo>/edit/main/...`, CI must pick it up and rebuild. No local setup required for content-only changes. | Low | This works by design with GitHub Actions triggered on `push` to `main`. The constraint: contributors must NOT need to run `npm run build` to publish. |
| `_content/<type>/` directory per site (not ad-hoc paths) | Consistent location means the CI pipeline, skills, and contributors all know where to look. Ad-hoc paths (the current state) break predictability. | Low | CONTENT-01. Standardize on `src/content/<type>/` within each site (Astro convention). |
| CI auto-triggers on `.md` push to production repo | The rebuild must happen automatically when a content file is added or edited in the production repo. Without this, contributors don't see their changes live. | Low | Already true for WebsiteMocker sandbox (any push to main triggers deploy.yml). Same pattern must exist in each production repo after publish. |
| Clear content types v1: `news/` and `jobs/` | Having too many types at launch creates schema management overhead. `news` covers announcements; `jobs` covers hiring. Both have clear real-world demand across the existing sites. | Low | CONTENT-02. `jobs` needs Zod schema added to `config.ts` and a `/wm-add-job` skill. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| CONTRIBUTING.md with copy-paste-ready frontmatter template | "Fill in the blanks" beats "read the schema". A literal markdown block contributors can copy reduces error rate to near zero for the frontmatter step. | Low | One code block per content type with all fields, required/optional annotated inline via comments. |
| `draft: true` frontmatter flag with build-time exclusion | Allows contributors to commit a draft without it going live. Useful for staging content without spinning up a full review workflow. | Low | Add `draft: z.boolean().optional()` to Zod schema; filter in the page query. One-line change. |
| Explicit "no build step required" guarantee in CONTRIBUTING.md | Non-technical contributors need explicit reassurance, not implicit assumption. | Low | One sentence at the top: "You do not need to install anything. Editing and saving a file here is all it takes." |
| Image conventions documented (where to put images, supported formats) | Image handling is the second most common contributor mistake after frontmatter. Documenting `public/images/<type>/` as the upload target prevents broken image references. | Low | Add image upload section to CONTRIBUTING.md. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Decap CMS / Netlify CMS / Tina CMS admin UI | Adds an auth layer, a separate config file, and a build dependency on a third-party service. Contradicts the "file-based only" constraint. GitHub web UI IS the editor for this use case. | CONTRIBUTING.md + GitHub web UI. |
| MDX for contributor-authored content | MDX lets contributors embed React/Astro components in markdown. This is powerful for developers and a footgun for non-technical contributors who will copy-paste component syntax incorrectly. | Plain `.md` files only for contributor content. `.mdx` reserved for developer-authored pages. |
| Content in a database (even SQLite) | Contradicts the static-site model and the out-of-scope constraint on backend/persistence. | File-based content collections only. |
| Automated content moderation or approval gates | Solo operator model means Philipp is the final arbiter. Automated gates add friction without benefit. | CONTRIBUTING.md defines who can push directly (content) vs who must file an Issue (design changes). |

### Feature Dependencies

```
Zod schema in config.ts (per content type)
  → typed collection query in Astro page
    → CONTRIBUTING.md documents required fields + conventions
      → CI deploy.yml in production repo triggers on push
        → contributor web-UI edit goes live automatically
```

---

## 3. Brand Consistency Enforcement (BRAND-01, BRAND-02)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| `brand` block in `wiring.json` | Single source of truth per site. Dashboard already reads `wiring.json`; adding `brand` here means one config file, not two. | Low | BRAND-01. Minimum fields: `hashtags: string[]`, `vocabulary: string[]`, `avoid: string[]`. |
| Skills read `brand.vocabulary` and `brand.hashtags` at content creation time | `/wm-add-news` already drafts social posts from `keywords.json`. Migrating this to `brand` block in wiring.json standardizes the source and adds hashtag suggestions. | Low | Change the social post draft step in `/wm-add-news` to read `wiring.json.brand.hashtags` instead of (or in addition to) `keywords.json`. |
| `/wm-wire` prompts for `brand` block if missing | Brand data is captured organically when the operator knows it, not retrofitted later. The wiring wizard is the right moment to ask. | Low | BRAND-02. Add brand section to `/wm-wire` after socials step. |
| Flag unrecognized vocabulary in generated content | If the AI drafts a news post with a brand-incorrect term (e.g. "spacecraft" when the brand uses "vehicle"), the skill should flag it. Not a hard block — a "check these terms" list at commit time. | Medium | Compare generated content against `brand.avoid` list. Surface as a checklist item in the skill output, not a pipeline error. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `hyphenation: { [term]: rule }` in brand block | Some brands have strict rules (e.g. "e-commerce" vs "ecommerce" vs "eCommerce"). Documenting these in wiring.json means skills can apply them consistently. | Low | Add as optional field. Example: `"hyphenation": { "pre-seed": "hyphenated", "SpaceTech": "CamelCase" }`. |
| `voice: "formal" | "technical" | "casual"` field | Short signal that skills use when drafting post copy or content suggestions. Low overhead, high signal. | Low | One field. Skills use it as a prompt modifier: "Write in a formal, technical tone." |
| `brand.color` field with accent and background | Skills that generate boilerplate HTML/CSS snippets (e.g. for email templates or social card descriptions) can reference the brand accent without reading `astro.config.mjs`. | Low | Mirror the `accent` from top-level wiring.json into `brand.color.accent` for explicit documentation. |
| Vocabulary validation report as part of `/wm-preflight` | Pre-deploy checklist already exists. Adding a brand vocab scan to preflight catches violations before publish, not after. | Medium | Scan all `.md` content files for terms in `brand.avoid`, report findings. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Browser extension or editor plugin for real-time brand linting | Out of scope for a file-based, skills-driven system. Requires contributor setup. | Flag at commit time via skill output, not at edit time. |
| Automated PR rejection on brand violation | Heavy-handed for the solo-operator + async-contributor model. Violations are guidance, not errors. | Flag in skill output. Operator decides whether to fix before committing. |
| Separate `brand.json` file per site | `wiring.json` is already the per-site config. Adding a second file splits the source of truth and adds a new file type every collaborator must learn about. | Single `brand` block in `wiring.json`. |
| Brand consistency enforcement on contributor `.md` files | Vocabulary rules are primarily for AI-drafted copy (news posts, social content). Requiring contributors to know brand vocabulary creates friction and is unlikely to be enforced in practice. | Scope enforcement to skill-generated content only. |

### Feature Dependencies

```
brand block in wiring.json
  → /wm-wire prompts to build it
    → /wm-add-news reads brand.hashtags for social post draft
    → /wm-add-news checks brand.avoid for violations
      → /wm-preflight scans .md files for brand.avoid terms
```

---

## 4. GitHub Issue-Based Triage Workflow (COLLAB-01 to COLLAB-03)

### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| CONTRIBUTING.md in each production repo | Without written norms, collaborators default to "DM Philipp" or "edit whatever file seems relevant". CONTRIBUTING.md is the contract that makes the two-tier model legible. | Low | COLLAB-01. Two clear paths: (a) direct push for `.md` content files, (b) GitHub Issue for everything else. |
| YAML-based GitHub Issue form templates (not legacy markdown templates) | YAML forms enforce required fields and structure the report. Legacy markdown templates are free-text and produce inconsistent issues. GitHub has supported YAML forms since 2021 — they are the current standard. | Low | COLLAB-02. Three templates minimum: content request, design/page change, bug report. Each as a `.yml` file in `.github/ISSUE_TEMPLATE/`. |
| `config.yml` template chooser | Guides reporters to the right template and prevents blank issues. Adds a "link to docs" option to redirect simple questions. | Low | One `config.yml` in `.github/ISSUE_TEMPLATE/` with `blank_issues_enabled: false` and friendly descriptions. |
| Auto-labels applied by template | Content request issues automatically get `content` label; design changes get `design`; bugs get `bug`. Without this, all issues arrive unlabeled and triage takes longer. | Low | `labels:` key in each YAML template. |
| Clear expectation: design changes go through WebsiteMocker sandbox | Collaborators who try to directly edit Astro component files in a production repo will break things. CONTRIBUTING.md must explicitly state: "Design changes are handled by the site operator in the development sandbox. File an Issue." | Low | One paragraph in CONTRIBUTING.md. Not a technical control — a social contract. |

### Differentiators

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| `WebsiteMocker task ref` field in design change Issue template | Closes the feedback loop. When Philipp triages the Issue and creates a task in WebsiteMocker, he can link back to the originating Issue. The Issue template asking for this field is a forward-looking prompt. | Low | Optional free-text field in the design change template. Value: issue becomes the audit trail for what changed and why. |
| SLA expectations in CONTRIBUTING.md | Non-technical collaborators feel ignored when they don't know what response time to expect. One sentence ("content additions go live within minutes; design changes take 1-5 business days") eliminates the uncertainty. | Low | Single expectation-setting paragraph in CONTRIBUTING.md. |
| Issue template for "sandbox preview request" | Sometimes a collaborator wants to see a proposed design change before it's deployed. A template for "please show me X change in the sandbox" creates a legible request type. | Low | Fourth optional template. Links to the sandbox URL by default. |
| Closing Issues via commit message convention | When Philipp pushes the fix from WebsiteMocker, `fix(<slug>): closes org/repo#42` in the commit message auto-closes the Issue in the production repo. Creates a clean audit trail. | Low | GitHub supports `closes <owner>/<repo>#<number>` in commit messages across repos. Teach this in CONTRIBUTING.md. |

### Anti-Features

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Auto-sync GitHub Issues → WebsiteMocker task board | Adds a webhook or polling mechanism. Over-engineering for a solo operator who triages manually. | Philipp reads issues manually during triage and creates tasks in WebsiteMocker by hand. |
| Issue-to-branch automation | Auto-creating a branch per issue assumes the fix will be done in that branch. WebsiteMocker's sandbox model already handles this — every change goes through the sandbox regardless. | Ignore GitHub's "create a branch for this issue" button in favor of the normal sandbox → stage → deploy pipeline. |
| Separate issue tracker (Linear, Jira, Notion) | Adds a third system collaborators must learn. The two-tier model (direct push + GitHub Issues) is already two systems. Adding a third loses people. | GitHub Issues in the production repo is the intake; WebsiteMocker PROJECT.md is the execution tracker. |
| Required approval workflow for content PRs | For non-technical contributors, PRs are already a high-friction path. The two-tier model bypasses PRs entirely for content (direct push) and uses Issues (not PRs) for design changes. | Direct push for content; Issues for design. No PR requirement for either. |

### Feature Dependencies

```
CONTRIBUTING.md defines the two-tier model
  → YAML Issue templates enforce structured reports
    → config.yml routes reporters to correct template
      → auto-labels enable triage filtering
        → Philipp triages, creates WebsiteMocker task
          → fix deployed via sandbox → publish pipeline
            → commit message closes originating Issue
```

---

## Cross-Cutting MVP Recommendation

The four areas are ordered by dependency, not importance:

**Build in this sequence:**

1. **DEPLOY** (DEPLOY-01, DEPLOY-02, DEPLOY-03) — Highest priority. Production deploy is the sole gap between "stage 5 ready" and "live". Everything else is polish if this doesn't work. CNAME file and robots.txt swap are the two non-obvious steps that will cause production failures if missed.

2. **CONTENT** (CONTENT-01, CONTENT-02, CONTENT-03) — Standardize on Astro content collections for all content types before COLLAB, because CONTRIBUTING.md documents the content paths and those must be stable before publishing the docs.

3. **BRAND** (BRAND-01, BRAND-02) — Wire the `brand` block and update `/wm-add-news` to use it. Low complexity; high value for the social post draft quality.

4. **COLLAB** (COLLAB-01, COLLAB-02, COLLAB-03, COLLAB-04) — CONTRIBUTING.md and Issue templates go into each production repo after a site is published. They depend on the content paths being stable (CONTENT must be done first) and deploy working (DEPLOY must be done first).

**Defer (not this milestone):**

- `draft: true` frontmatter flag — useful but not blocking. Add when a collaborator actually needs it.
- Sandbox preview request Issue template — fourth template; add after the first three are tested.
- Vocabulary validation in `/wm-preflight` — medium complexity; the `brand.avoid` scan should come after the brand block is established and has real data.
- INGEST-01/02/03 — not covered in this feature research; the ingest pathway is a separate concern from the deploy + content + brand + collab features.

---

## Sources

- JamesIves/github-pages-deploy-action cross-repo configuration: https://github.com/JamesIves/github-pages-deploy-action
- Community discussion on deploying to a different repo: https://github.com/orgs/community/discussions/42772
- GitHub YAML issue form syntax (official docs): https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms
- Astro content collections documentation: https://docs.astro.build/en/guides/content-collections/
- GitHub About issue and pull request templates: https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates
