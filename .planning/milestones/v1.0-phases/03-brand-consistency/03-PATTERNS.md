# Phase 3: Brand Consistency — Pattern Map

**Mapped:** 2026-08-20
**Files analyzed:** 9 (4 wiring.json configs + 1 wizard skill + 4 content skills)
**Analogs found:** 9 / 9

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `sites/sfdy-alt-clean/wiring.json` | config | transform | `sites/sfdy-alt-clean/wiring.json` (self — add key) | exact |
| `sites/mogwai-systems/wiring.json` | config | transform | `sites/sfdy-alt-clean/wiring.json` | exact |
| `sites/parrot-capital/wiring.json` | config | transform | `sites/sfdy-alt-clean/wiring.json` | exact |
| `sites/crestworks/wiring.json` | config | transform | `sites/sfdy-alt-clean/wiring.json` | exact |
| `.claude/skills/wm-wire.md` | utility/wizard | request-response | `.claude/skills/wm-wire.md` (self — extend) + `_core/.claude/skills/wm-reserve-socials.md` | exact + role-match |
| `_core/.claude/skills/wm-add-news.md` | utility/wizard | event-driven | `_core/.claude/skills/wm-add-news.md` (self — extend) + `_core/.claude/skills/wm-init-keywords.md` | exact + role-match |
| `_core/.claude/skills/wm-add-announcement.md` | utility/wizard | event-driven | `_core/.claude/skills/wm-add-news.md` | role-match |
| `_core/.claude/skills/wm-add-blog.md` | utility/wizard | event-driven | `_core/.claude/skills/wm-add-news.md` | role-match |
| `_core/.claude/skills/wm-add-job.md` | utility/wizard | event-driven | `_core/.claude/skills/wm-add-news.md` | role-match |

---

## Pattern Assignments

### BRAND-01: `sites/*/wiring.json` (config, transform)

**Analog:** `sites/sfdy-alt-clean/wiring.json`

**Current schema pattern** (lines 1-36 — full file):
```json
{
  "slug": "sfdy-alt-clean",
  "name": "Starflight Dynamics",
  "domain": "www.starflight-dynamics.com",
  "accent": "#00FB92",
  "contact": "mission-control@starflight-dynamics.com",
  "stage": 6,
  "prod_repo": "pbau3r-sfdy/starflight-dynamics",
  "sandbox_url": "pbau3r-sfdy.github.io/WebsiteMocker/sfdy-alt-clean",
  "last_deploy": "2026-08-08",
  "newsletter": { ... },
  "forms": { ... },
  "socials": { ... },
  "legal": {
    "impressum": "complete",
    "privacy": "complete"
  },
  "capture": "sfdy",
  "notes": "..."
}
```

**Brand stub insertion pattern** — copy this block; insert after `"legal"`, before `"notes"` (or before `"capture"`/`"notes"` if `"legal"` absent):
```json
"brand": {
  "hashtags": [],
  "vocabulary": [],
  "avoid": [],
  "voice": ""
}
```

**Field semantics for planner to encode:**
- `hashtags`: array of strings without `#` prefix — operator-curated; suggested by content skills when adding news/announcements/blog posts
- `vocabulary`: array of preferred term strings — skills nudge toward these
- `avoid`: array of terms to flag in draft content — non-blocking warning only
- `voice`: single string — informational in Phase 3, not read by content skills (deferred)

**Empty-array stubs are inert.** Content skills that check `brand.hashtags.length === 0` behave identically to "no brand block" — silent pass-through. This is the safe default.

---

### BRAND-02: `.claude/skills/wm-wire.md` (utility/wizard, request-response)

**Analog 1:** `.claude/skills/wm-wire.md` — existing service wizard (self-extension)
**Analog 2:** `_core/.claude/skills/wm-reserve-socials.md` — two-phase human-action-then-wire pattern

**Existing service section prompt pattern** (wm-wire.md, lines 12-13 and lines 47-49):
```
### <Service Name>
   - Ask: which service? / ask relevant fields
   - Update relevant file(s)
   - Update wiring.json <service> block

## Notes
- "Skip for later" leaves the field null — not counted against stage advancement
- "Not needed" sets `status: "skipped"` — counts as done for stage purposes
```

**Human-action wait pattern** (wm-reserve-socials.md, lines 28-34):
```
6. **Wait for confirmation** — ask the user: "Please register these handles and confirm when done."

7. **Wire** once confirmed:
   - Update wiring.json ...
   - Commit: `feat: wire ...`
   - Advance stage to 3 if other wiring is complete.
```

**Read → propose → wait → paste → validate → write pattern** (wm-init-keywords.md, lines 7-30):
```
1. Read all content (wiring.json, content files, existing keywords.json if any)
2. Extract and propose full JSON structure
3. Show the proposed JSON and ask for approval or edits
4. Write the approved version
5. Commit
```

**New Brand Block section to add** — inserts between "### Domain" (step 3, last service) and step 4 (stage advance). Copy the three-way prompt shape from existing services:

```
### Brand block
   Ask: "Configure now, skip for later, or mark as not needed?"

   **Configure now:**
   - Check wiring.json `brand` key:
     - **No brand block or empty stubs:** first-run path
       - Read signals: `_captures/<slug>/CAPTURE.md` or `capture.json` (if capture exists),
         `keywords.json` (if exists), existing `src/content/**/*.md` tags arrays,
         `wiring.json` name and domain
       - Generate pre-filled brand template with extracted signals
       - Print:
         "Here is your brand kit template for [Site Name] — pre-filled with signals
          from the codebase. Take this to Claude.ai and ask Claude to help you refine
          and complete it. Then paste the finished JSON back here.
          ```json
          {
            "hashtags": ["<extracted>"],
            "vocabulary": ["<extracted>"],
            "avoid": ["<extracted-if-any>"],
            "voice": "<brief descriptor>"
          }
          ```"
       - Wait for operator to paste completed JSON back
       - Validate: confirm exactly four keys present; hashtags/vocabulary/avoid are arrays;
         voice is a string. If invalid, report what to fix before proceeding.
       - Write validated JSON as `wiring.json brand` block
     - **Brand block already present (non-empty):** recency-check path
       - Check `wiring.json last_deploy` or any available session signal for same-day context
       - Same-day context → skip "has anything changed?" prompt; proceed directly to
         any requested field update
       - Older context → ask: "Has anything in your brand voice or hashtags changed
         since you last ran /wm-wire?"
       - Apply any changes operator provides; write updated block

   **Skip for later:** leave brand key absent or as empty stub — does not block stage advance

   **Not needed:** set `"brand": { "status": "skipped" }` — counts as done for stage purposes
```

**Stage advance rule** (wm-wire.md, lines 39-40 — copy verbatim logic):
```
4. **Advance stage** if all services are configured or skipped:
   - All sections done → set `stage: 3`
```
Brand block "skip" and "not needed" both count as done — do NOT gate stage advance on brand presence.

**Commit pattern** (wm-wire.md, line 43):
```bash
git commit -m "feat(<slug>): wire services"
```

---

### BRAND-03: `_core/.claude/skills/wm-add-news.md` (utility/wizard, event-driven)

**Analog:** `_core/.claude/skills/wm-add-news.md` (self-extension)

**Current step structure** (wm-add-news.md, lines 5-48):
```
1. Gather (title, date, summary, body, image, credit)
2. Generate slug
3. Copy any images
4. Write the Markdown file
5. Draft a social post using keywords.json
6. Commit and push
7. Report
```

**New Step 5 — Brand signal check** — inserts between current Step 4 (Write Markdown) and current Step 5 (Draft social post). Renumber social post → Step 6, commit → Step 7, report → Step 8:

```
5. **Brand signal check** (skip entirely if no `wiring.json brand` key, or brand block has all-empty arrays):
   - Read `sites/<site-slug>/wiring.json` → check for `brand` key
   - **No brand block or all-empty arrays** → continue silently to Step 6 (no output)
   - **brand.hashtags non-empty:**
     - Present: "Your brand kit includes: [list]. Add any of these as tags for this post?"
     - Operator picks applicable tags or proposes different ones
     - After operator finalises tags: identify any tags not already in brand.hashtags
     - For each new tag ask: "Add '[tag]' to your brand hashtag kit? (y/N)" — default N
     - If operator confirms: stage update to wiring.json brand.hashtags (write in next step with content)
   - **brand.avoid non-empty:**
     - Scan draft body text for each term in brand.avoid (plain string match, case-insensitive)
     - If found: "⚠ Draft contains '[term]' which is on your avoid list. Continue anyway? (y/N)"
     - Non-blocking — operator confirms or overrides; never block commit
   - **brand.vocabulary non-empty:**
     - Review draft body; if a concept could be expressed using a vocabulary term, note it:
       "Suggestion: consider using '[vocabulary term]' here instead."
     - Operator always wins — this is a nudge, not a correction
   - **voice field:** informational only in Phase 3 — do not read or enforce in this skill
```

**Commit pattern when wiring.json was updated** (extend existing commit step):
```bash
git add src/content/news/<slug>.md public/images/news/ sites/<site-slug>/wiring.json
git commit -m "content(<slug>): add news — <title>"
git push
```
If wiring.json was NOT changed, omit it from the `git add` — keep git history clean.

**Social post hashtag priority rule** (new Step 6 replacement):
```
6. **Draft a social post**:
   - Hashtag source priority:
     1. `wiring.json brand.hashtags` (if non-empty) — use these for social draft
     2. `keywords.json hashtags.<platform>` — fallback when brand block is absent or empty
   - Do NOT combine both sources in one prompt — pick one source, not both
   - Keep it ≤280 chars for Twitter; ≤4 hashtags for LinkedIn
   - Include the sandbox URL
```

---

### BRAND-03: `_core/.claude/skills/wm-add-announcement.md` (utility/wizard, event-driven)

**Analog:** `_core/.claude/skills/wm-add-news.md` (same brand-check pattern; has tags[])

**Current step structure** (wm-add-announcement.md, lines 5-35):
```
1. Gather (title, date, summary, tags, body)
2. Generate slug
3. Write the Markdown file  ← insert brand check after this step
4. Commit and push
5. Report
```

**New step to insert** — after current Step 3 (Write Markdown), before Step 4 (Commit):

Apply the identical brand signal check described for wm-add-news above (Step 5 verbatim). Announcements have tags[] frontmatter, so full treatment applies: hashtag suggestions, avoid scan, vocabulary nudge, bi-directional enrichment.

**Commit pattern when wiring.json was updated:**
```bash
git add src/content/announcements/<slug>.md sites/<site-slug>/wiring.json
git commit -m "content(<site-slug>): add announcement — <title>"
git push
```

---

### BRAND-03: `_core/.claude/skills/wm-add-blog.md` (utility/wizard, event-driven)

**Analog:** `_core/.claude/skills/wm-add-news.md` (same brand-check pattern; has tags[])

**Current step structure** (wm-add-blog.md, lines 5-46):
```
1. Gather (title, date, author, summary, image, tags, body)
2. Generate slug
3. Copy any images
4. Write the Markdown file  ← insert brand check after this step
5. Commit and push
6. Report
```

**New step to insert** — after current Step 4 (Write Markdown), before Step 5 (Commit):

Apply the identical brand signal check described for wm-add-news above (Step 5 verbatim). Blog posts have tags[] frontmatter, so full treatment applies: hashtag suggestions, avoid scan, vocabulary nudge, bi-directional enrichment.

**Commit pattern when wiring.json was updated:**
```bash
git add src/content/blog/<slug>.md public/images/blog/ sites/<site-slug>/wiring.json
git commit -m "content(<site-slug>): add blog post — <title>"
git push
```

---

### BRAND-03: `_core/.claude/skills/wm-add-job.md` (utility/wizard, event-driven)

**Analog:** `_core/.claude/skills/wm-add-news.md` (narrower brand-check — no tags[])

**Current step structure** (wm-add-job.md, lines 5-43):
```
1. Gather (title, department, location, type, open, date, body)
2. Generate slug
3. Write the Markdown file  ← insert brand check after this step
4. Commit and push
5. Report
```

**New step to insert** — after current Step 3 (Write Markdown), before Step 4 (Commit):

```
4. **Brand signal check** (narrower — no hashtag enrichment; job listings have no tags[]):
   - Read `sites/<site-slug>/wiring.json` → check for `brand` key
   - **No brand block or all-empty arrays** → continue silently (no output)
   - **brand.avoid non-empty:**
     - Scan draft body text for each term in brand.avoid (plain string match, case-insensitive)
     - If found: "⚠ Draft contains '[term]' which is on your avoid list. Continue anyway? (y/N)"
     - Non-blocking — operator confirms or overrides; never block commit
   - **brand.vocabulary non-empty:**
     - Review draft body; if a concept could be expressed using a vocabulary term, note it:
       "Suggestion: consider using '[vocabulary term]' here instead."
     - Operator always wins
   - **brand.hashtags:** not applicable to job listings — skip
   - **voice field:** informational only in Phase 3 — do not enforce
```

wiring.json is never modified by wm-add-job (no hashtag enrichment path). Commit stays as-is:
```bash
git add src/content/jobs/<slug>.md
git commit -m "content(<site-slug>): add job — <title>"
git push
```

---

## Shared Patterns

### Three-way Service Prompt (Configure / Skip / Not Needed)
**Source:** `.claude/skills/wm-wire.md` lines 47-49
**Apply to:** BRAND-02 brand block section in wm-wire.md
```
- "Skip for later" leaves the field null — not counted against stage advancement
- "Not needed" sets `status: "skipped"` — counts as done for stage purposes
```

### Human-action Gate (Generate → Wait → Human Does → Paste Back → Wire)
**Source:** `_core/.claude/skills/wm-reserve-socials.md` lines 28-34
**Apply to:** BRAND-02 "Configure now" first-run path
```
Step N: Generate pre-filled template; print for operator
Step N+1: Wait for confirmation — "Take this to Claude.ai, fill it, paste back here"
Step N+2: Validate pasted content; write to config; commit
```

### Read → Extract → Propose → Approve → Write → Commit
**Source:** `_core/.claude/skills/wm-init-keywords.md` lines 7-30
**Apply to:** BRAND-02 signal pre-fill logic when building brand block for first time
```
1. Read all available signals (wiring.json, capture DNA, keywords.json, content posts)
2. Extract relevant values per field
3. Propose structured JSON template (pre-filled)
4. Wait for approval / operator edits (via Claude.ai artifact)
5. Write approved version to wiring.json
6. Commit
```

### Silent Pass-Through When Config Absent
**Source:** Established by CONTEXT.md decisions; enforced in all BRAND-03 skills
**Apply to:** All four content skills
```
- No brand block → zero output, zero prompts, zero disruption
- All-empty arrays → treat same as absent — silent pass-through
- Informational hint ("no brand block — run /wm-wire") is optional and only if surfacing for first time in a session; never on every run
```

### Bi-directional Enrichment — Opt-In Default N
**Source:** Established by CONTEXT.md Pitfall 3 decision
**Apply to:** wm-add-news, wm-add-announcement, wm-add-blog (not wm-add-job)
```
After operator finalises tags, for each new tag not in brand.hashtags:
  Ask: "Add '[tag]' to your brand hashtag kit? (y/N)"
  Default: N — operator must explicitly opt in
  If yes: stage wiring.json change; commit with content in same commit
```

### Priority Rule — brand vs. keywords.json
**Source:** RESEARCH.md "Keywords.json Overlap and Resolution"
**Apply to:** All four content skills; especially wm-add-news social post step
```
Hashtag source priority:
  1. wiring.json brand.hashtags — for tags[] frontmatter suggestions + bi-directional enrichment
  2. keywords.json hashtags.<platform> — fallback for social post draft when brand block absent/empty
Never combine both sources in one prompt — pick one, not both.
```

### Paste-Back Validation
**Source:** RESEARCH.md Pitfall 4; no prior analog (new pattern)
**Apply to:** BRAND-02 "Configure now" path, after operator pastes JSON
```
Validate before writing:
  - Confirm exactly four keys: hashtags, vocabulary, avoid, voice
  - hashtags, vocabulary, avoid must be arrays (even if empty)
  - voice must be a string
  - If any field is wrong: report exact fix needed before proceeding; do not write partial data
```

---

## Placement Reference

### wiring.json: brand block insertion point

Insert after `"legal"` block, before `"notes"` key. If `"legal"` is absent, insert before `"notes"`. If neither exists, add at end:

```json
{
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

### wm-wire.md: new section insertion point

Insert `### Brand block` service section after `### Domain` and before step 4 (stage advance). Renumber if needed:

```
3. Walk through each service:
   ### Newsletter ...
   ### Contact form ...
   ### Social handles ...
   ### Domain ...
   ### Brand block   ← NEW

4. Advance stage ...
5. Commit ...
6. Report ...
```

### Content skills: brand check step insertion point

| Skill | Insert after | Becomes new step |
|---|---|---|
| wm-add-news.md | Step 4 (Write Markdown) | Step 5; social post → 6; commit → 7; report → 8 |
| wm-add-announcement.md | Step 3 (Write Markdown) | Step 4; commit → 5; report → 6 |
| wm-add-blog.md | Step 4 (Write Markdown) | Step 5; commit → 6; report → 7 |
| wm-add-job.md | Step 3 (Write Markdown) | Step 4; commit → 5; report → 6 |

---

## No Analog Found

All files have existing analogs. No entries in this section.

---

## Metadata

**Analog search scope:** `.claude/skills/`, `_core/.claude/skills/`, `sites/*/wiring.json`
**Files read:** 9 (wm-wire.md, wm-add-news.md, wm-add-job.md, wm-add-announcement.md, wm-add-blog.md, wm-init-keywords.md, wm-reserve-socials.md, sfdy-alt-clean/wiring.json, plus CONTEXT.md + RESEARCH.md)
**Pattern extraction date:** 2026-08-20
