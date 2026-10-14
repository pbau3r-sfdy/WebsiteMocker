---
phase: 2
slug: content-system
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-20
---

# Phase 2 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| developer → git | Schema, component, and page template changes committed locally and pushed | Source files (TypeScript, Astro) — no secrets |
| operator → skill → git | Content skills (`/wm-add-*`) generate `.md` files committed to the repo | Content frontmatter + body authored by operator |
| Astro build → filesystem | `glob()` loaders read content directories at build time — read-only access | `.md` content files in `src/content/<collection>/` |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-02-01 | Tampering | `_core/src/content.config.ts` (schema library) | accept | Schema-only file; no `defineCollection`/runtime execution; changes tracked in git | closed |
| T-02-02 | Tampering | `_core` news + jobs page templates | accept | Static build-time rendering; no runtime injection surface; all templates are Astro static output | closed |
| T-02-03 | Tampering | `_core` announcements + blog templates | accept | Static build-time rendering; git-tracked | closed |
| T-02-04-A | Tampering | URL integrity — `entry.id` vs former `post.slug` for sfdy-alt-clean news | mitigate | Verified: `entry.id` for `YYYY-MM-DD-slug.md` files equals `YYYY-MM-DD-slug` — identical to former slug, preserving all 6 live news article URLs. Build verify passes. | closed |
| T-02-04-B | Tampering | Legacy `content/config.ts` deletion for sfdy-alt-clean | mitigate | Deleted in same commit as `content.config.ts` creation; build verify confirms Astro 5 Content Layer activated with no breakage | closed |
| T-02-05 | Tampering | parrot-capital `Layout.astro` CSS token stubs | accept | Token stubs use hardcoded brand palette derived from existing `index.astro` — no sensitive data; static CSS only | closed |
| T-02-06 | Tampering | Cross-directory `_core` imports in sfdy-alt-clean pages | mitigate | Build verify passes on all 3 active sites confirming Vite filesystem allows the relative `../../_core/` import; fallback `vite.server.fs.allow` pattern documented | closed |
| T-02-07 | Tampering | Cross-directory `_core` imports in mogwai-systems pages | mitigate | Build verify passes; SUMMARY confirms no new endpoints or auth paths; same Vite pattern as T-02-06 | closed |
| T-02-08 | Tampering | Cross-directory `_core` imports in parrot-capital pages | mitigate | Build verify passes; SUMMARY confirms no new endpoints; same Vite pattern | closed |
| T-02-09 | Tampering | Skill-generated content files (`/wm-add-*` output) | accept | All content commits go through git; operator reviews before push; no automated trust escalation; skill files are markdown prompt documents only | closed |
| T-02-SC | Tampering | npm/pip/cargo installs across all 9 plans | accept | No new npm installs in any plan — all Content Layer API features built into `astro@5` already present in the lockfile | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-01 | T-02-01 | Schema library is purely additive TypeScript; no execution path; changes are code-reviewed in git history | Phase 2 plan | 2026-08-20 |
| AR-02 | T-02-02 | Page templates render only statically at build time; no dynamic input reaches the renderer | Phase 2 plan | 2026-08-20 |
| AR-03 | T-02-03 | Same as AR-02 for announcements and blog templates | Phase 2 plan | 2026-08-20 |
| AR-04 | T-02-05 | CSS token stubs contain no secrets; brand palette is publicly visible in the deployed site | Phase 2 plan | 2026-08-20 |
| AR-05 | T-02-09 | Content skill output is operator-authored markdown; no automated injection path exists | Phase 2 plan | 2026-08-20 |
| AR-06 | T-02-SC | Astro 5 Content Layer is already in the dependency tree; zero new supply chain surface added | Phase 2 plan | 2026-08-20 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-20 | 11 | 11 | 0 | gsd-secure-phase (orchestrator) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-20
