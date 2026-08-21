# Phase 3: Brand Consistency — Context

**Gathered:** 2026-08-20
**Status:** Ready for planning
**Source:** Discuss-phase conversation

<domain>
## Phase Boundary

This phase delivers a structured `brand` block in `wiring.json` for active sites, tooling to build and maintain it via `/wm-wire`, and write-time brand awareness in all content skills. It does NOT gate publishing on brand presence — brand is optional enrichment.

</domain>

<decisions>
## Implementation Decisions

### Brand Schema (BRAND-01)

- Four fields as specified: `hashtags[]`, `vocabulary[]`, `avoid[]`, `voice`
- No extensions in this phase — schema is intentionally minimal and iterative
- Schema should be discoverable: a well-commented template or JSON schema so Claude.ai / Claude.design can pick it up and generate a brand block without manual instruction
- Brand block is **optional enrichment** — no publish gate, no enforcement when absent. Sites without a brand block simply get no brand-aware behaviour. Life goes on.

### `/wm-wire` UX (BRAND-02)

- **First run (no brand block):** Ask a guided question — "define now or generate a stub?" In practice, brand elements usually emerge during site generation, so the skill should offer to pre-fill suggestions from existing signals: capture DNA, site name, existing content/posts.
- **Subsequent runs (brand block already exists):** Apply a recency check — if the block was touched the same day / same session, skip the "has anything changed?" prompt (assume iterative design work, brand unchanged). Otherwise ask what changed.
- **Artifact workflow:** Generate a single Claude.ai artifact covering all four fields. Operator fills it out once in Claude.ai with Claude's help, pastes result back into the skill. Minimal back-and-forth is the design constraint — one artifact, one fill. Not a terminal-only interview.

### Content Skill Enforcement (BRAND-03)

- **No brand block → silent pass-through.** Skills behave exactly as they do today. At most, a one-time informational hint ("no brand block found — run `/wm-wire` to set one up") may surface, but the operator is never blocked.
- **Hashtags (bi-directional enrichment):** When a brand block exists, propose hashtags from `brand.hashtags` as suggestions for the post. Also offer to add new hashtags from the post back into `brand.hashtags` — news is about new things, the library should grow with usage.
- **Avoid words (soft signal):** If draft content matches a term in `brand.avoid`, surface a warning before committing — but do not block. Operator confirms or overrides.
- **Vocabulary (preferred-term suggestions):** `vocabulary[]` is a preferred-terms reference list. If the draft contains concepts that could be expressed using vocabulary terms, the skill makes a suggestion. Operator always wins — this is a nudge, not a correction.

### Claude's Discretion

- Where exactly to store brand block within `wiring.json` (top-level `brand` key is implied)
- JSON schema format for the brand template (JSON Schema, commented JSON, or markdown table)
- Exact wording of suggestions and warnings in content skills
- Whether to commit `wiring.json` changes automatically or prompt before committing
- Recency threshold for "same-day" check in `/wm-wire` subsequent runs

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Site wiring and brand
- `sites/*/wiring.json` — current wiring schema (brand block will be added here)
- `CLAUDE.md` — site categories, wiring.json fields, skill quick-reference

### Content skills (to be extended for BRAND-03)
- `.claude/skills/wm-add-news.md` — primary content skill, BRAND-03 reference implementation
- `_core/.claude/skills/` — inherited content skills directory

### Wire skill (to be extended for BRAND-02)
- `.claude/skills/wm-wire.md` — existing wire skill, BRAND-02 extends this

### Active sites with wiring.json
- `sites/sfdy-alt-clean/wiring.json`
- `sites/mogwai-systems/wiring.json`
- `sites/parrot-capital/wiring.json`
- `sites/crestworks/wiring.json`

</canonical_refs>

<specifics>
## Specific Ideas

- **Claude.ai artifact for brand definition:** `/wm-wire` should be able to generate and publish a Claude artifact (structured page with the four fields) that the operator takes to Claude.ai, fills in, and pastes back. This is the primary brand-definition UX — not a terminal interview.
- **Pre-fill from existing signals:** When building a brand block for the first time, pull from: capture DNA (`_captures/<slug>/capture.json`), site name, existing content posts, any existing `wiring.json` metadata.
- **Bi-directional hashtag enrichment:** The brand hashtag library grows with each post — new hashtags from content flow back in, not just out.
- **Iterative by design:** Brand blocks start as stubs and are enriched over time. The tooling must support partial/incomplete brand blocks gracefully.

</specifics>

<deferred>
## Deferred Ideas

- Enforcing brand consistency in `/wm-update-hero` or other non-content skills (possible Phase 4+ extension)
- Brand block as a publish gate (explicitly decided against in this phase)
- Competitor terms list in brand schema (decided against for now — keep schema minimal)
- Tone examples / sample sentences in brand schema (deferred — four fields sufficient for Phase 3)

</deferred>

---

*Phase: 03-brand-consistency*
*Context gathered: 2026-08-20 via discuss-phase conversation*
