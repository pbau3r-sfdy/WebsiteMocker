# Feature Research

**Domain:** Solo-operator static-site framework, v1.2 additions: design-system sync, privacy-friendly analytics, unlisted "open drop" sharing
**Researched:** 2026-10-14
**Confidence:** MEDIUM (Plausible facts HIGH from official docs; Claude Design sync MEDIUM, secondary sources only, DesignSync limits are a spike item; drop patterns from general practice, MEDIUM-LOW)

## Feature Landscape

### 1. Claude Design Sync (DSYNC)

How comparable tools behave: Claude Design's own flow is Export -> "Hand off to Claude Code" (bundle URL: design files, chat, README), plus `/design-sync` for pull/push of design-system components, tokens, typography, spacing. Figma/Style Dictionary/Tokens Studio flows share one pattern: pull to a staging area, transform tokens to a normalized format, diff, then apply. Nobody overwrites hand-edited output blindly.

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| `design` block in wiring.json (project ref, last-pulled, file allowlist) | Every sync tool has a per-project config | LOW | Mirrors existing `brand`/`analytics` blocks |
| Pull to `_captures/<slug>/raw/` staging (never straight into `src/`) | Staging then transform is standard (Style Dictionary, Figma exports) | LOW-MED | Reuses capture dir convention |
| Idempotent re-pull; report added/changed/removed files since last pull | Users expect to see what changed before applying | MED | Hash manifest in raw/ |
| Hand-off to `ingest-artifact.mjs --mode section` so manual edits survive | Core promise of the feature | MED | Depends on section-mode merge semantics; spike how it treats edited sections |
| Token mapping into `brand.doc_tokens` (colors, fonts, radii, spacing) | Tokens are the main value of a design system | MED | Fixed mapping table with explicit unmapped-token report |
| Dry-run / diff before apply | Safety expectation for any sync touching source | LOW-MED | Ties into existing dry-run habit (`--confirm` pattern) |
| Spike documenting DesignSync limits (auth, file size, what is exposed) | Mechanism is new and under-documented | LOW | Already planned; gates everything |

#### Differentiators

| Feature | Value | Complexity | Notes |
|---|---|---|---|
| JSX components rendered to static HTML via Playwright | Gets React-based design components into Astro without a React runtime | MED-HIGH | Playwright already used by capture; snapshot per component state |
| Drift report: sandbox vs design project (tokens changed upstream) | Tells operator when a re-pull is worthwhile | MED | Cheap once manifest exists |
| Crestworks pilot as acceptance test | Proves the loop on a real live site | MED | Stage 6 site, so regression risk; use sandbox first |
| Optional push-back (tokens/components to Claude Design) | Closes the loop like `/design-sync` | HIGH | Keep optional and last; may depend on undocumented API |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Auto-pull on schedule / CI | "Always in sync" | Overwrites reviewed work; violates no-auto-publish decision D-A6 | Manual `/wm-design-pull`, review diff |
| Two-way merge engine | Feels complete | Becomes a VCS; conflict resolution is unbounded | Section-mode ingest + git diff as the review tool |
| Bundling full React/JSX runtime in sites | "Use the real components" | Breaks lightweight static output | Render to static HTML at pull time |
| Local copy of CDN fonts | Offline robustness | Already ruled out in PROJECT.md | Keep CDN injection |
| Full design-token pipeline (Style Dictionary, multi-platform) | Standards compliance | Overkill for one operator, one web target | Single mapping table to doc_tokens |

### 2. Analytics on one Plausible SaaS subscription (ANLY)

Plausible facts (official docs): optional measurements are outbound links, file downloads, form submissions, 404 pages, custom events/props, hashed routing, revenue. Newer snippet uses `plausible.init({...})` with `fileDownloads`, `outboundLinks`, `formSubmissions`; legacy path used `script.file-downloads.outbound-links.tagged-events.js` filename extensions. 404 tracking is not automatic: the 404 page must fire a `404` event (with the path as a prop). Custom props must be registered in Plausible settings to show in the dashboard. Goals must be created per event name in the Plausible site settings to appear as conversions.

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| Single provider config in wiring.json `analytics` (existing) extended with an `events` switch set | Already the config surface | LOW | Extend existing `_scripts/plausible.mjs` integration |
| File-download, outbound-link, form-submission events | Standard Plausible measurements; trivial to enable | LOW | Use `plausible.init` flags; check the integration's current snippet is the new-style one |
| 404 event from `404.astro` | Dead-link detection is the usual reason to add it | LOW | Needs explicit `plausible('404', {props:{path}})` call |
| One Plausible site per domain, sandbox shared site retained | One subscription covers many sites (plan has a site/pageview budget) | LOW | Document pageview quota math in `/wm-wire` |
| Privacy-policy snippet (cookie-free, no personal data, EU/self-described processor) | Legal expectation in DE; CLAUDE.md already requires it before going live | LOW | Snippet template in `/wm-wire` step, inserted into legal page; stage-4 checks |
| `/wm-wire` analytics step | Skills-first rule | LOW | Existing wizard extension |
| Goal/prop setup checklist (manual in Plausible UI) | Events do not show without goals; most common "it doesn't work" cause | LOW | Print the exact goal names to create |

#### Differentiators

| Feature | Value | Complexity | Notes |
|---|---|---|---|
| Stats API tile on dashboard (visitors, top pages per site) | One-glance health across sites | MED | See cost warning below; fetch at build time in CI, not in browser |
| Custom props conventions (`site`, `drop_id`, `content_type`) | Lets one shared Plausible site be sliced; drop tracking relies on it | LOW | Define naming once |
| Preflight check: analytics configured, goals listed, policy snippet present | Catches silent no-data | LOW-MED | Extends `/wm-preflight` |
| Drop view/download events (see Drops) | Answers "did the client open it" | LOW | Needs the same event plumbing |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Cookie banner | Compliance reflex | Not needed with cookie-free Plausible; adds UX cost | Privacy-policy mention only |
| Per-visitor identification / user IDs in props | Attribution for drops | Defeats privacy model, legal exposure | Aggregate counts per drop id |
| Heatmaps / session replay / A/B | Feature creep | Needs a second service | None |
| Live Stats API calls from the browser | Live tile | Exposes API key | Build-time fetch (cached JSON) |
| Self-hosted Plausible now | Cost saving | Already parked | Revisit if quota is exceeded |
| Revenue / ecommerce tracking | Present in Plausible | No shops | Skip |

**Cost risk (important):** Stats API requires the Plausible **Business** plan, and keys are team-scoped (HIGH confidence, official docs; rate limit 600 req/h). If the subscription is a cheaper tier, the dashboard tile violates "one subscription" without upgrade. Fallback options: (a) a public shared-link iframe/link per site in the dashboard (no API needed), (b) just deep-link to Plausible. Decide this before committing to the tile. The API key must live in CI secrets or local env, never in the public repo or built dashboard (repo is public).

### 3. Open Drops (DROP)

Comparable patterns: Google Docs "anyone with the link", Notion public pages, Dropbox/WeTransfer links, Pitch/DocSend (view tracking, expiry, revocation; DocSend is the paid differentiator), unlisted YouTube. Expected behavior: unguessable URL, not indexed, expiry, ability to revoke, some view signal. On GitHub Pages with a public repo, hard facts: the Markdown source is publicly readable in the repo (or the sandbox repo), nothing is access-controlled, and withdrawal only removes future access (cached/forwarded copies persist). Therefore the "confidential, not secret" framing must be stated to the operator and recipient.

#### Table Stakes

| Feature | Why Expected | Complexity | Notes |
|---|---|---|---|
| `/d/<random-id>/` with a CSPRNG id (>=16 chars base32/hex, ~80+ bits) | Unguessability is the only access control | LOW | Generator script; never derive from title |
| Markdown body is the data; rendered by a dedicated Astro route | Matches existing content-collection model | LOW-MED | New `drops` collection; excluded from nav, sitemap, RSS, search, dashboard public lists |
| `noindex` meta, `Referrer-Policy: no-referrer` via meta tag, `robots.txt` NOT listing the path | Headers unavailable on Pages; meta works. Listing `/d/` in robots.txt would advertise it | LOW | Do not link from any indexed page |
| `expires` frontmatter: build omits or replaces with "withdrawn" stub after date | Core "expires/withdraw" ask | MED | Static site only changes on rebuild; need scheduled rebuild or accept that expiry is soft until next publish. Flag explicitly |
| `withdraw` (status frontmatter or script): remove content AND attachments, keep stub | Revocation expectation | MED | Also purge from git history decision: default no (public repo history still holds the text); document it |
| Optional PDF attachments served from the drop folder | Early drafts are often PDFs | LOW-MED | PDFs need `X-Robots`-equivalent: not possible via meta, so rely on unguessable path and no inbound links; noindex cannot be enforced for PDFs on Pages |
| Analytics tracking for drop views and PDF downloads | "Did they open it" | LOW | Props `drop_id`; depends on ANLY events |
| Preflight warnings (drop within indexed paths, missing noindex, expired but still present, linked from sitemap, secrets-looking content) | Prevents accidental exposure | MED | Extends `/wm-preflight` |
| Verify script: built `dist` check that every drop page has noindex/no-referrer, is absent from sitemap, expired drops are stubs | Operator trust | MED | Pure Node over `dist/` |
| Publishing path that keeps drops out of the production site by default unless intended | Drops live under the same site | LOW-MED | Per-site opt-in flag in wiring.json |

#### Differentiators

| Feature | Value | Complexity | Notes |
|---|---|---|---|
| Per-recipient ids (one id per recipient) | Distinct view counts per recipient without identifying visitors | LOW-MED | Cheap with generator; works with analytics by `drop_id` |
| Branded drop layout using site tokens | Looks professional vs generic share links | LOW | Reuse brand block |
| `/wm-drop` skill (new, list, expire, withdraw) | Skills-first | MED | Wraps scripts |
| Expiry banner ("valid until ...") and "draft, confidential" label | Sets expectations | LOW | |
| Scheduled rebuild (Actions cron) to make expiry effective | Makes expiry real without manual publish | MED | Conflicts with no-auto-publish decision D-A6; sandbox-only cron is the compromise |

#### Anti-Features

| Feature | Why Requested | Why Problematic | Alternative |
|---|---|---|---|
| Passwords / "protected" claims on drops | Feels secure | Client-side only checks are theater on static hosting | Locked Drops (encrypted, backlog Phase 12) for real confidentiality |
| Storing truly secret data (credentials, contracts with PII) as open drops | Convenience | Public repo + permanent git history | Only confidential-not-secret; preflight warns on patterns |
| Server-side token or Worker enforcement | Real revocation | Rejected: second service | Accept soft revocation |
| Visitor-level tracking (IP, fingerprint) | "Who opened it" | Privacy-policy conflict | Per-recipient id counts |
| Linking drops from site pages, sitemap, RSS, dashboard | Discoverability | Breaks unguessability | Operator shares URL out-of-band |
| Large file hosting (videos, many PDFs) | WeTransfer-like use | Repo/Pages size limits | Cap attachment size in verify script |
| Drops in public sandbox dashboard listing | Visibility | Sandbox repo is public | Exclude from dashboard and index |

## Feature Dependencies

```
Analytics events (ANLY) ──requires──> existing plausible.mjs integration + wiring.json analytics
Stats API tile ──requires──> Plausible Business plan + CI secret + build-time fetch
Drop tracking ──requires──> ANLY events + custom props (drop_id)
Drop preflight/verify ──requires──> drops collection + /wm-preflight
Drop expiry (effective) ──requires──> rebuild trigger (cron or manual publish)
DSYNC ingest ──requires──> ingest-artifact.mjs --mode section (existing)
DSYNC token mapping ──requires──> brand.doc_tokens (existing)
DSYNC JSX rendering ──requires──> Playwright (existing in capture)
DSYNC push-back ──enhances──> pull (independent, last)
Locked Drops (backlog) ──requires──> Open Drops
```

### Dependency Notes

- Phase order DSYNC -> ANLY -> DROP is sound: DROP depends on ANLY, DSYNC is independent.
- Drop tracking and privacy snippet must land in ANLY so DROP only consumes them.
- Drops conflict with "no auto-publish" only if expiry is made automatic.

## MVP Definition

### Launch With (v1.2)

- [ ] DSYNC spike + `design` block + pull to raw/ + section-mode ingest + token mapping + diff report (Crestworks pilot in sandbox first)
- [ ] ANLY: events (downloads, outbound, forms, 404), props convention, privacy snippet, `/wm-wire` step, goals checklist
- [ ] DROP: CSPRNG ids, drops collection, noindex/no-referrer, expires/withdraw, PDFs, analytics props, preflight + verify script, `/wm-drop`

### Add After Validation

- [ ] Stats API dashboard tile (once plan tier is confirmed; else shared-link fallback)
- [ ] JSX-to-static rendering (if spike shows components are needed beyond tokens/templates)
- [ ] Per-recipient ids, drift report, sandbox cron for expiry

### Future Consideration

- [ ] Push-back to Claude Design (undocumented surface)
- [ ] Locked Drops, Phase 12
- [ ] Self-hosted Plausible (parked)

## Feature Prioritization Matrix

| Feature | User Value | Cost | Priority |
|---|---|---|---|
| Pull to raw + section ingest + token map | HIGH | MED | P1 |
| Plausible events + 404 + privacy snippet | HIGH | LOW | P1 |
| Drops core (id, noindex, expiry, withdraw) | HIGH | MED | P1 |
| Drop preflight + verify | HIGH | MED | P1 |
| Drop analytics props | MED | LOW | P1 |
| JSX static render | MED | HIGH | P2 |
| Stats API tile | MED | MED (+plan cost) | P2 |
| Per-recipient ids | MED | LOW | P2 |
| Push-back | LOW | HIGH | P3 |

## Competitor Feature Analysis

| Feature | Comparable | Our Approach |
|---|---|---|
| Design sync | Figma + Style Dictionary, `/design-sync` | Staging + section ingest + manual review diff |
| Analytics events | Plausible, Fathom, Pirsch (all offer download/outbound/404) | Plausible init flags + explicit 404 call |
| Secret-link sharing | Google "anyone with link", DocSend (tracking, expiry, revoke) | Unguessable id + soft expiry; honest about static-host limits |

## Sources

- Plausible script extensions: https://plausible.io/docs/script-extensions (HIGH)
- Plausible file downloads tracking: https://plausible.io/docs/file-downloads-tracking (HIGH)
- Plausible Stats API (Business plan requirement, 600 req/h, bearer key): https://plausible.io/docs/stats-api (HIGH; verify current plan pricing before committing)
- Claude Design handoff and /design-sync: https://claudefa.st/blog/guide/mechanics/claude-design-handoff , https://pasqualepillitteri.it/en/news/5308/claude-code-claude-design-two-way-sync-design-sync (MEDIUM, secondary; validate in spike)
- Unlisted-link/drop patterns: general practice, no single source (LOW-MEDIUM)

---
*Feature research for: WebsiteMocker v1.2*
*Researched: 2026-10-14*
