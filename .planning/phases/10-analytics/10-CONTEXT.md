# Phase 10: Analytics - Context

**Gathered:** 2026-10-14
**Status:** Ready for planning
**Source:** Discuss session with the operator (four gray areas, answered in one turn) plus ANLY-01..09 in REQUIREMENTS.md

<domain>
## Phase Boundary

Optional, per-site, cookie-free Plausible analytics for WebsiteMocker sites (ANLY-01..09). Scope of the live wiring: `sites/sfdy-alt-clean-reskin-2` only, built on top of the Phase 11.1 changes. Every other site stays unconfigured. The requirement list in REQUIREMENTS.md is the contract; this file records the operator's answers on the open points.
</domain>

<decisions>
## Implementation Decisions

- **D-01: Tag and scope of tracking.** The operator supplied the Plausible site-ID tag (script `https://plausible.io/js/pa-h84OFEpVhPIHGnzKLeThr.js` with the inline `plausible.init()` stub) for the Plausible site `starflight-dynamics.com` (registered without `www.`; 30-day trial from 2026-10-14; dashboard currently says "could not detect Plausible" because no tag is installed). Use it through `analytics.scriptId` (ANLY-02), not hand-pasted. The ID is public. The operator expects debugging ("we will debug things") before it reports cleanly. The separate shared sandbox Plausible site (`pbau3r-sfdy.github.io`) is NOT being created now.
- **D-02: Sandbox behaviour.** Default stays protective (ANLY-03): a sandbox build never reports into the production Plausible site. Because the operator wants to debug the provided tag on `sfdy-alt-clean-reskin-2` before the cutover, the plan must offer an explicit, loudly logged opt-in in `wiring.json` (suggested key `analytics.sandboxUsesProdId: true`) that lets sandbox builds of that one site use the production script ID for debugging, with a build warning and a documented removal step at cutover (Phase 12). Without the opt-in a sandbox build emits nothing. This opt-in design is Claude's discretion; flag it in the plan summary for the operator.
- **D-03: Plan scope.** Start with the core on whatever Plausible plan the operator has: script emission, outbound-link/download/form events, 404 event, the sanitised tracking mode, `/wm-wire` step, preflight/publish privacy gate, `verify-phase-10.sh`. The Business-plan extras (custom event properties such as `site` and `content_type`, and the Stats API aggregates tile, ANLY-07) are built conditionally and stay off until the operator picks the Business plan; decide that "in due course". Code must degrade cleanly when props are unavailable.
- **D-04: Consent.** No consent banner. Plausible sets no cookies. The privacy policy gets the Plausible section in Phase 11.1 (draft text, RETL-05); Phase 10 treats a privacy policy containing that section as the prerequisite for switching analytics on for a live site (ANLY-06). Record as an open item for the operator/legal reviewer (the reviewer, Jonas Radtke, expects a banner) that the no-banner decision should be confirmed; do not build one.
- **D-05: Only one site.** ANLY-09 applies to `sfdy-alt-clean-reskin-2` only, after Phase 11.1 (job removal, privacy text) has landed. `design-pilot` and every other site keep `analytics.status` unconfigured/skipped. After the Phase 12 cutover the site reports as `starflight-dynamics.com` (the `www.` stripping default in `plausible.mjs` already matches the registered site).
- **D-06: Ordering.** Phase 10 execution follows Phase 11.1 (privacy section and job removal must already be in the site). Planning can proceed now.
- **D-07: Git hygiene.** The working tree holds much unrelated uncommitted work. Stage explicit paths only, never `git add -A`. Do not push; the operator decides. No Astro version change, no new npm dependency without a checkpoint.

### Claude's Discretion
- Structure of `_scripts/lib/env.mjs` (`isSandbox`), event helper placement, wording of warnings, harness layout, how the sanitised mode is implemented.
</decisions>

<canonical_refs>
## Canonical References

- `.planning/REQUIREMENTS.md` ANLY-01..ANLY-09 and the Plausible plan note (Business-plan features)
- `.planning/research/SUMMARY.md`, `STACK.md`, `FEATURES.md`, `PITFALLS.md`, `ARCHITECTURE.md` (milestone research on Plausible)
- `_scripts/plausible.mjs` (current Astro integration: domain-based tag, `SANDBOX_DOMAIN`, sandbox detection by base path)
- `CLAUDE.md` section "Analytics (Plausible)"
- `.claude/skills/wm-wire.md` (service wizard to extend), `/wm-preflight`, `/wm-publish`
- `sites/sfdy-alt-clean-reskin-2/wiring.json`, `src/pages/privacy-policy.astro`, `src/pages/404.astro`
- `.planning/phases/11.1-retool-sfdy-alt-clean-reskin-2-before-cutover-review-feedbac/11.1-CONTEXT.md` (D-08 privacy text)
- Memory note: `plausible-site-snippet.md`
</canonical_refs>

<code_context>
## Existing Code Insights

- `_scripts/plausible.mjs` injects a domain-based inline loader (`data-domain`, `script.js`), skips `astro dev`, and decides sandbox by `config.base.startsWith('/WebsiteMocker')`. It already strips `www.` from the production domain and supports `host` and `sandbox: false`.
- Sites reference it through `integrations: [plausible()]` in `astro.config.mjs`. Several sites already carry an `analytics` block (`design-pilot`, `levion`, `parrot-capital`); others say `status: skipped`.
</code_context>

<specifics>
## Specific Ideas

The pasted tag uses Plausible's newer site-ID format (`pa-…` script URL plus an inline `plausible.init()` stub, no `data-domain`). Outbound-link, file-download and form events are configured through that init call in the new format, which the plan should confirm against Plausible's current docs.
</specifics>

<deferred>
## Deferred Ideas

- A second Plausible site for sandbox traffic (needs a plan with 2+ sites).
- Business plan decision (custom props, Stats API tile): "in due course".
- Confirming the no-banner decision with the legal reviewer.
</deferred>

---
*Phase: 10-analytics*
*Context gathered: 2026-10-14*
