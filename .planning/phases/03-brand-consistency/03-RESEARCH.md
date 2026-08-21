# Phase 3: Brand Consistency — Research

**Researched:** 2026-08-20
**Domain:** Skill file authoring — wiring.json schema extension, markdown skill UX patterns
**Confidence:** HIGH (all findings from direct codebase inspection)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Brand Schema (BRAND-01)**
- Four fields exactly: `hashtags[]`, `vocabulary[]`, `avoid[]`, `voice` (string descriptor)
- No extensions in this phase — schema is intentionally minimal and iterative
- Schema should be discoverable: a well-commented template or JSON schema so Claude.ai can generate a brand block without manual instruction
- Brand block is optional enrichment — no publish gate, no enforcement when absent; sites without a brand block get no brand-aware behaviour

**`/wm-wire` UX (BRAND-02)**
- First run (no brand block): ask "define now or generate a stub?"; pre-fill suggestions from existing signals (capture DNA, site name, existing content/posts)
- Subsequent runs (brand block already exists): recency check — same day/session → skip "has anything changed?" prompt; otherwise ask what changed
- Artifact workflow: generate a single pre-filled template the operator takes to Claude.ai, fills with Claude's help, and pastes the result back. One artifact, one fill — not a terminal interview

**Content Skill Enforcement (BRAND-03)**
- No brand block → silent pass-through. Skills behave exactly as today. At most a one-time informational hint
- Hashtags (bi-directional): propose `brand.hashtags` for post; offer to enrich library with new hashtags from the post
- Avoid words: surface warning before committing if draft content matches a `brand.avoid` term — non-blocking, operator confirms or overrides
- Vocabulary: nudge toward preferred terms from `brand.vocabulary` — suggestion, not correction; operator always wins

### Claude's Discretion
- Where exactly to store brand block within wiring.json (top-level `brand` key is implied)
- JSON schema format for the brand template (JSON Schema, commented JSON, or markdown table)
- Exact wording of suggestions and warnings in content skills
- Whether to commit wiring.json changes automatically or prompt before committing
- Recency threshold for "same-day" check in `/wm-wire` subsequent runs

### Deferred Ideas (OUT OF SCOPE)
- Enforcing brand consistency in `/wm-update-hero` or other non-content skills
- Brand block as a publish gate
- Competitor terms list in brand schema
- Tone examples / sample sentences in brand schema
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| BRAND-01 | `brand` block added to `wiring.json` schema: `hashtags[]`, `vocabulary[]`, `avoid[]`, `voice` | Schema design documented below; all 4 active wiring.json files inspected for placement |
| BRAND-02 | `/wm-wire` detects missing `brand` block and prompts operator to build it interactively | Current wm-wire.md fully inspected; insertion point identified; artifact workflow pattern designed |
| BRAND-03 | `/wm-add-news` (and all content skills) read `brand.hashtags`, suggest for post tagging, scan draft against `brand.avoid` | All 4 content skills inspected; minimal change pattern identified; bi-directional enrichment logic mapped |
</phase_requirements>

---

## Summary

Phase 3 is entirely a skill-file and configuration authoring phase — no npm packages are installed, no Astro components are changed, no build pipeline is touched. The deliverables are: one schema definition (BRAND-01), one skill file update (BRAND-02), and four skill file updates (BRAND-03).

The existing `wm-wire.md` is a clean 5-section service wizard (Newsletter, Contact form, Social handles, Domain). Brand block slots in naturally as a sixth service section before the stage-advance step. The recency-check logic and the artifact-workflow pattern are the only genuinely new UX concepts in this skill.

All four content skills (wm-add-news, wm-add-job, wm-add-announcement, wm-add-blog) follow an identical gather → slug → write → commit pattern. BRAND-03 adds one new step between "finalize content" and "commit" — brand signal check. Because wm-add-job has no tags field, the hashtag enrichment applies only to news/announcement/blog; avoid and vocabulary nudges apply to all four.

A critical overlap exists between `keywords.json` (already has `hashtags` and `brand.avoid`) and the new `wiring.json brand` block. The planner must clarify the relationship so content skills do not read both sources ambiguously: `wiring.json brand` is the operator-curated voice guide; `keywords.json` is the SEO/platform-specific keyword dictionary. Brand block takes precedence for hashtag suggestions; keywords.json remains the fallback.

**Primary recommendation:** Three plans — BRAND-01 (schema + stub blocks in all active wiring.json), BRAND-02 (wm-wire.md update), BRAND-03 (four content skill updates).

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Brand schema definition | Config (wiring.json) | — | wiring.json is the single source of truth per site; dashboard already reads it |
| Brand block authoring UI | Skill (wm-wire.md) | Claude.ai (artifact fill) | Wizard lives in the skill; operator delegates editorial refinement to Claude.ai |
| Write-time brand awareness | Content skills (_core/.claude/skills/) | wiring.json (read) | Skills run at content creation time; they read brand block but do not own it |
| Bi-directional hashtag enrichment | Content skills | wiring.json (write back) | Skills update wiring.json when operator approves new hashtags |

---

## Standard Stack

This phase has no npm dependencies. The "stack" is:

| Asset | Location | Role |
|-------|----------|------|
| Skill files | `.claude/skills/`, `_core/.claude/skills/` | Markdown instructions Claude follows |
| `wiring.json` | `sites/<slug>/wiring.json` | Per-site configuration; receives new `brand` key |
| `keywords.json` | `sites/<slug>/keywords.json` | Existing brand vocabulary; secondary signal source |
| `_captures/<slug>/` | `CAPTURE.md`, `capture.json` | Design DNA; primary pre-fill signal for new brand blocks |

No package installation. No build step changes.

---

## Package Legitimacy Audit

Not applicable — this phase installs no external packages.

---

## Architecture Patterns

### System Architecture Diagram

```
Operator
   │
   ├── /wm-wire
   │      │
   │      ├── [no brand block] → read signals (capture DNA, keywords.json, content posts)
   │      │         → generate pre-filled template
   │      │         → print: "Take this to Claude.ai, fill it, paste back"
   │      │         → [operator pastes completed JSON]
   │      │         → validate + write wiring.json brand block
   │      │
   │      └── [brand block exists] → recency check
   │                → same-day: skip "has anything changed?" prompt
   │                → older: "What changed?" → update wiring.json
   │
   └── /wm-add-news | /wm-add-blog | /wm-add-announcement | /wm-add-job
          │
          ├── [no brand block in wiring.json] → silent pass-through (no disruption)
          │
          └── [brand block exists]
                 ├── hashtags: propose brand.hashtags as tags[] suggestions
                 ├── avoid scan: grep draft body for brand.avoid terms → warn (non-blocking)
                 ├── vocabulary: suggest preferred terms if applicable
                 ├── operator confirms/modifies tags
                 ├── new tags? → offer to add to brand.hashtags (bi-directional)
                 └── commit content + wiring.json together
```

### Recommended Skill File Layout (BRAND-03 pattern)

Each content skill gets a new step inserted between "Write the Markdown file" and "Commit and push". Approximate placement:

**wm-add-news.md**: New Step 4.5 (or renumber to Step 5, shift social post to Step 6):
```
Brand signal check (wiring.json brand block, if present):
  - No brand block → continue silently
  - brand.hashtags → propose for tags[] field; operator accepts or modifies
  - brand.avoid → scan body text; warn on matches (non-blocking confirmation)
  - brand.vocabulary → note preferred terms applicable to the draft
  After finalising tags: "Any of these tags are new to your brand kit: [new-tags]. Add to brand.hashtags? (y/N)"
  If yes: update wiring.json brand.hashtags
```

**wm-add-job.md**: Narrower check — avoid scan and vocabulary nudge only (no tags field, no hashtag enrichment).

**wm-add-announcement.md, wm-add-blog.md**: Same as wm-add-news (all have tags[]).

### Placement of `brand` key in wiring.json

[VERIFIED: direct file inspection] Current wiring.json files vary in structure. Recommended placement: top-level key, after `legal`, before `notes`. This groups identity fields logically and keeps `notes` as the closing free-text field.

```json
{
  "slug": "sfdy-alt-clean",
  ...
  "legal": { "impressum": "complete", "privacy": "complete" },
  "brand": {
    "hashtags": [],
    "vocabulary": [],
    "avoid": [],
    "voice": ""
  },
  "notes": "..."
}
```

### Anti-Patterns to Avoid

- **Reading from both keywords.json and wiring.json brand ambiguously:** Skills must have a clear priority rule. Use `wiring.json brand.hashtags` as primary (operator-curated, specific); use `keywords.json hashtags.*` only when no brand block exists and only for the social post draft step (not for tags[] frontmatter).
- **Blocking on missing brand block:** Any code path that raises an error or blocks commit when `brand` is absent breaks the "optional enrichment" contract.
- **Prompting for brand on every content skill run when no block exists:** A persistent nag defeats the "silent pass-through" principle. At most, one informational hint on first encounter within a session.
- **Committing wiring.json separately from content on every run:** Creates noisy git history. Commit together in one commit when wiring.json changes, or accumulate and commit at end.

---

## Current Skill File Audit

### wm-wire.md (BRAND-02 target) [VERIFIED: direct file inspection]

Current steps:
1. Identify site
2. Read current wiring.json
3. Walk through services: Newsletter → Contact form → Social handles → Domain
4. Advance stage to 3 if all services configured/skipped
5. Commit all changes
6. Report

**Gap:** No brand block service section. No recency check logic. No artifact workflow pattern.

**BRAND-02 insertion point:** Add new service section between "Domain" and stage-advance step. The service pattern ("Configure now, skip for later, or mark as not needed") already exists — brand block follows the same prompt shape, with the artifact-generation workflow on "Configure now".

**Stage advance:** The brand block must NOT block stage advancement. It is optional — "not needed" or "skip" must both count as done for stage purposes, consistent with the existing pattern for other services.

### wm-add-news.md (BRAND-03 primary reference) [VERIFIED: direct file inspection]

Current steps:
1. Gather (title, date, summary, body, image, credit)
2. Generate slug
3. Copy images
4. Write Markdown file
5. Draft social post using keywords.json
6. Commit and push
7. Report

**Gap:** No brand block read. No avoid scan. No hashtag suggestion from wiring.json. No bi-directional enrichment.

**BRAND-03 insertion point:** Between Step 4 (write file) and Step 5 (social post). New Step 5 becomes brand signal check. Renumber social post to Step 6, commit to Step 7, report to Step 8.

**Hashtag source priority after BRAND-03:**
- tags[] frontmatter: `wiring.json brand.hashtags` (suggested, operator picks)
- Social post draft: `wiring.json brand.hashtags` primary, `keywords.json hashtags.*` fallback

### wm-add-job.md [VERIFIED: direct file inspection]

No tags[] field in frontmatter. BRAND-03 applies: avoid word scan + vocabulary nudge only. No hashtag enrichment.

### wm-add-announcement.md [VERIFIED: direct file inspection]

Has tags[]. Full brand treatment: hashtag suggestions, avoid scan, vocabulary nudge, bi-directional enrichment.

### wm-add-blog.md [VERIFIED: direct file inspection]

Has tags[]. Full brand treatment: same as announcement.

---

## Pre-Fill Signal Inventory (BRAND-02 artifact generation)

When wm-wire runs brand block setup for the first time, it reads these signals to pre-fill the template:

| Signal Source | Available Fields | Quality |
|---------------|-----------------|---------|
| `wiring.json` | name, domain, accent, contact | HIGH — always present |
| `keywords.json` | brand.avoid, hashtags.twitter/linkedin/instagram, primary, secondary | HIGH — present for sfdy-alt-clean; may be absent for others |
| `_captures/<capture>/CAPTURE.md` | Extracted page text, any hashtags used in captured site (e.g. #SFDY-UPDATES) | MEDIUM — rich for sfdy; sparse for parrot-capital; null for mogwai |
| `_captures/<capture>/capture.json` | tokens (colors, fonts), nav items | LOW for brand voice; useful for vocabulary signals |
| `src/content/news/*.md` | Existing tags[] arrays, vocabulary used in post body | MEDIUM — site-dependent |

**Per-site capture coverage:** [VERIFIED: direct file inspection]
- sfdy-alt-clean: `capture = "sfdy"` → CAPTURE.md is rich (page text, `#SFDY-UPDATES` hashtag visible)
- mogwai-systems: `capture = null` → no capture DNA; use wiring.json + any content posts only
- parrot-capital: `capture = "parrot-capital"` → capture.json exists but sections are empty; CAPTURE.md has page structure
- crestworks: `capture = "crestworks-rework"` → capture directory exists

wm-wire must handle missing capture gracefully — pre-fill from whatever sources are available.

---

## Keywords.json Overlap and Resolution

[VERIFIED: direct file inspection — sfdy-alt-clean/keywords.json]

`keywords.json` already contains:
- `brand.avoid` — list of terms to avoid (empty in sfdy, may be populated elsewhere)
- `hashtags.twitter`, `hashtags.linkedin`, `hashtags.instagram` — platform-specific hashtag lists (empty in sfdy)

**Resolution rule for the planner to encode in content skills:**

> `wiring.json brand` is the operator-curated voice/hashtag guide. `keywords.json` is the SEO/platform keyword dictionary. When both exist: use `wiring.json brand.hashtags` for tagging suggestions and bi-directional enrichment; use `keywords.json hashtags` only for platform-specific social post drafts when brand block is absent.

This avoids double-prompting operators and keeps the two files with distinct responsibilities.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Hashtag suggestion UI | Custom interactive picker | Simple "these hashtags match: [list] — include any?" prompt in skill |
| Avoid-word regex engine | Pattern matching code | Plain grep/string scan instruction in skill; Claude does the check at runtime |
| Brand block validation | JSON schema validator script | Inline validation instruction in skill ("check that all four keys are present, values are correct types") |

---

## Common Pitfalls

### Pitfall 1: Stage Advance Blocked by Missing Brand Block
**What goes wrong:** wm-wire's stage-3 advancement logic requires brand block to be present or explicitly skipped. If neither path is offered, sites with incomplete brand blocks get stuck at stage 2 in perpetuity.
**Why it happens:** Copying the service prompt pattern without confirming the "not needed" and "skip for later" paths count as done.
**How to avoid:** Brand block section must include "Configure now / Skip for later / Not needed" options exactly as other services do. Only "Configure now" writes a block; all three options allow stage advance.
**Warning signs:** Operator complains that stage didn't advance after running wm-wire.

### Pitfall 2: Noisy Warnings When No Brand Block Exists
**What goes wrong:** Content skill warns "no brand block found — run /wm-wire" on every single run, interrupting the operator's flow for something they may have intentionally not set up yet.
**Why it happens:** Over-zealous informational messaging without respecting the "silent pass-through" decision.
**How to avoid:** Zero output when brand block is absent. The one-time hint is optional and should surface only on first use within a session — never on every commit.
**Warning signs:** Operator feedback that content skills feel slower or noisier than before Phase 3.

### Pitfall 3: Bi-directional Enrichment Overwrites Without Asking
**What goes wrong:** Skill automatically adds all new post tags back to brand.hashtags without asking, gradually diluting the curated library with one-off tags.
**Why it happens:** Implementing "enrich library" as automatic rather than prompted.
**How to avoid:** Always ask explicitly: "These tags are new to your brand kit: [tags]. Add to brand.hashtags? (y/N)". Default to No. Operator confirms each addition.
**Warning signs:** brand.hashtags growing with low-value or one-off tags over time.

### Pitfall 4: Artifact Paste-Back Not Validated
**What goes wrong:** Operator pastes malformed JSON (wrong field names, string where array expected) and wm-wire silently writes it or crashes.
**Why it happens:** The artifact workflow depends on freeform paste — no schema enforcement before write.
**How to avoid:** Skill instruction must include validation step before writing: "Verify the pasted JSON has exactly these four keys: hashtags (array), vocabulary (array), avoid (array), voice (string). If any are wrong, tell the operator what to fix before proceeding."

### Pitfall 5: Keywords.json and brand Block Both Prompting
**What goes wrong:** A content skill reads both `wiring.json brand.hashtags` AND `keywords.json hashtags` and presents a combined list of suggestions, confusing the operator about which source to trust.
**Why it happens:** Trying to be comprehensive without defining priority.
**How to avoid:** Priority rule (wiring.json brand first, keywords.json as fallback) encoded explicitly in each content skill step.

---

## Code Examples

### Brand Block — Minimal Stub [VERIFIED: designed for this phase]
```json
"brand": {
  "hashtags": [],
  "vocabulary": [],
  "avoid": [],
  "voice": ""
}
```

### Brand Block — Populated Example (SFDY) [ASSUMED — illustrative]
```json
"brand": {
  "hashtags": ["SFDY", "SFDYUpdates", "HighFrontier", "SpaceDefense"],
  "vocabulary": ["orbital propulsion", "sovereign space capability", "high frontier"],
  "avoid": ["startup", "disruption", "pivot"],
  "voice": "Technical, visionary, understated confidence — no hype language"
}
```

### Artifact Template Block (output by wm-wire for operator to take to Claude.ai)
```
Here is your brand kit template for [Site Name] — pre-filled with signals from the codebase.
Take this to Claude.ai and ask Claude to help you refine and complete it. Then paste the 
finished JSON back here.

```json
{
  "hashtags": ["<extracted-hashtag-1>", "<extracted-hashtag-2>"],
  "vocabulary": ["<primary-keyword-1>", "<primary-keyword-2>"],
  "avoid": ["<avoid-term-if-found>"],
  "voice": "<brief descriptor based on captured page tone>"
}
```

Fields:
- hashtags: brand hashtags without the # (will be suggested whenever you add a news post or announcement)
- vocabulary: preferred terms — the skill will nudge you to use these when drafting content
- avoid: words/phrases that conflict with your brand tone — the skill will warn if draft content uses them
- voice: one sentence describing your brand's communication style (for context, not enforced)
```

### wm-add-news — Brand Check Step (new Step 5 skeleton)
```
5. **Brand signal check** (wiring.json brand block, if it exists):
   - Read `sites/<site-slug>/wiring.json` → check for `brand` key
   - **No brand block** → continue silently to social post draft
   - **brand.hashtags** → "Your brand kit includes: [list]. Add any of these as tags? (list applicable ones)"
   - **brand.avoid** → scan body text for each term; if found: "⚠ Draft contains '[term]' which is on your avoid list. Continue anyway? (y/N)"
   - **brand.vocabulary** → if body could use a preferred term, note it as a suggestion
   - After operator finalises tags: compare with brand.hashtags; for any new tag ask "Add '[tag]' to your brand hashtag kit? (y/N)"
   - If brand.hashtags was updated: write change to wiring.json (will be committed in next step)
```

---

## Reusable Patterns from Existing Skills

### Pattern 1: wm-init-keywords — "Read → Extract → Propose → Approve → Write → Commit"
[VERIFIED: direct file inspection]

`wm-init-keywords` reads all site content, extracts signals, proposes a full JSON structure, waits for operator approval or edits, then writes and commits. This is the exact pattern for BRAND-02's "Configure now" path — the only difference is the operator's approval step involves an external tool (Claude.ai) rather than an in-terminal edit.

### Pattern 2: wm-reserve-socials — "Research → Generate Template → Human Action → Wire"
[VERIFIED: direct file inspection]

`wm-reserve-socials` generates candidates, then waits ("Please register these handles and confirm when done") before wiring. The artifact workflow in BRAND-02 follows the same two-phase structure: generate template → wait for human action (fill in Claude.ai) → paste back → wire.

### Pattern 3: wm-wire — Service Section Template
[VERIFIED: direct file inspection]

The three-way prompt ("Configure now / Skip for later / Not needed") is already the standard pattern. Brand block uses it verbatim, with the "Configure now" path expanding into the artifact workflow.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Brand block JSON placed before `notes` field is the preferred position | Architecture Patterns — wiring.json placement | Visual preference only; any top-level position works. Low risk. |
| A2 | mogwai-systems has no existing keywords.json | Pre-Fill Signal Inventory | If keywords.json exists, pre-fill has more signal. Skill should check for it regardless. |
| A3 | Social post draft in wm-add-news uses keywords.json hashtags as fallback (not primary) | Keywords.json Overlap | If user expects keywords.json to remain primary for social drafts, priority rule needs adjustment. Confirm with operator if unclear. |
| A4 | Bi-directional enrichment defaults to N (opt-in) | Common Pitfalls | If operator prefers auto-add, the default could flip. Low risk — conservative default is safer. |

---

## Open Questions

1. **Does mogwai-systems have a keywords.json?**
   - What we know: wiring.json has `capture: null`, no keywords.json found in site root during inspection
   - What's unclear: keywords.json may exist but wasn't checked directly
   - Recommendation: Planner should add a "check for keywords.json" instruction to the pre-fill step; graceful degradation if absent

2. **Should brand block stubs be added to all 4 active wiring.json files as part of BRAND-01, or only created on first wm-wire run?**
   - What we know: BRAND-01 requirement says "brand block added to wiring.json schema" — schema definition, not necessarily population
   - What's unclear: "Added to schema" could mean document the schema, or actually insert stubs
   - Recommendation: Add minimal stubs to all 4 active wiring.json files in BRAND-01 plan. Stubs make the schema immediately discoverable by Claude.ai when operators read wiring.json directly. Stubs with empty arrays are inert — content skills see them as "exists but empty" and behave like no-op.

3. **Voice field: how does it influence content skills?**
   - What we know: `voice` is a string descriptor; BRAND-03 specifies hashtag suggestions, avoid scan, and vocabulary nudge — but not voice enforcement
   - What's unclear: Whether voice should surface in content skills at all in Phase 3
   - Recommendation: In Phase 3, voice is informational only — displayed in the artifact template for operator context but not actively read by content skills. Content skills read hashtags, avoid, vocabulary. Voice is deferred to Phase 4+ where richer brand enforcement could apply. Planner should encode this explicitly in content skill instructions.

---

## Environment Availability

Step 2.6: All dependencies are existing skill files and JSON config files already present in the repo. No external tools, services, or runtimes required. SKIPPED (no external dependencies).

---

## Security Domain

`security_enforcement` is not set in config.json (absent = enabled). However, this phase produces only markdown instruction files and JSON configuration stubs. There is no executable code, no user-facing input validation surface, no authentication, no cryptography, and no external service integration. ASVS categories V2–V6 do not apply to markdown skill files.

The only security-adjacent concern: avoid-word scanning reads `wiring.json` content. That file is developer-controlled and not user-supplied input. No injection risk.

---

## Sources

### Primary (HIGH confidence)
- Direct file inspection: `.claude/skills/wm-wire.md` — current skill structure, service prompt pattern, stage advance logic
- Direct file inspection: `_core/.claude/skills/wm-add-news.md`, `wm-add-job.md`, `wm-add-announcement.md`, `wm-add-blog.md` — current content skill structure and step order
- Direct file inspection: `sites/sfdy-alt-clean/wiring.json`, `sites/mogwai-systems/wiring.json`, `sites/parrot-capital/wiring.json`, `sites/crestworks/wiring.json` — current schema, brand key absent in all
- Direct file inspection: `sites/sfdy-alt-clean/keywords.json` — overlap analysis with new brand block
- Direct file inspection: `_captures/sfdy/CAPTURE.md`, `_captures/parrot-capital/capture.json` — pre-fill signal quality assessment
- Direct file inspection: `_core/.claude/skills/wm-init-keywords.md`, `wm-reserve-socials.md` — reusable skill patterns
- Direct file inspection: `.planning/phases/03-brand-consistency/03-CONTEXT.md` — all locked decisions
- Direct file inspection: `.planning/config.json` — nyquist_validation: false confirmed

### Secondary (MEDIUM confidence)
- None — all findings from direct codebase inspection

### Tertiary (LOW confidence — ASSUMED)
- A2–A4 in Assumptions Log above

---

## Metadata

**Confidence breakdown:**
- Brand schema: HIGH — trivial JSON design with locked field names
- wm-wire.md change: HIGH — existing pattern fully inspected; insertion point clear
- Content skills change: HIGH — all four files inspected; step insertion point clear
- Artifact UX pattern: MEDIUM — new pattern for this skill library; no prior example to copy exactly, but two analogous patterns (wm-init-keywords, wm-reserve-socials) provide a solid template
- Keywords.json overlap resolution: MEDIUM — rule is reasoned from file inspection; operator may have different mental model of priority

**Research date:** 2026-08-20
**Valid until:** Stable — skill files and wiring.json are internal; no external dependency versions to expire
