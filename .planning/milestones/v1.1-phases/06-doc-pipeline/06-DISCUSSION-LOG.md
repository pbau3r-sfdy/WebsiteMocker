# Phase 6: Doc Pipeline — Discussion Log

**Session:** 2026-08-24
**Operator:** Philipp Bauer
**Areas discussed:** Brand token injection, Zip entry detection, Skill UX (confirm before push), Doc naming

---

## Area 1: Brand Token Injection

**Question 1:** What CSS custom properties from wiring.json get injected into the artifact HTML?

| Option | Description |
|--------|-------------|
| --accent only | Inject just `--accent` — zero setup, works immediately |
| brand.doc_tokens map (selected) | New field in wiring.json — operator defines which CSS vars to override |
| Auto-match artifact :root vars | Script guesses based on var name patterns — fragile |

**Selected:** `brand.doc_tokens` map in wiring.json

**Follow-up:** Operator asked if option 2 requires a refactor or site rebuilds. Clarified: wiring.json is read at runtime by scripts — no Astro rebuild needed. One JSON edit per site (~5 min per site via /wm-wire). 4 active sites total.

**Clarification question:** Given no rebuild required, prefer option 1 (zero setup) or option 2 (full control)?

**Selected:** brand.doc_tokens map — operator plans a re-wiring session after Phase 6 ships.

**Decision:** `brand.doc_tokens` is a new optional field under the `brand` block in `wiring.json`. If absent, script warns and prints Layout.astro :root vars as copy-paste suggestions.

---

## Area 2: Zip Entry Detection

**Question:** How should ingest-artifact.mjs pick the entry HTML when a .zip is placed in _captures/<slug>/raw/?

| Option | Description |
|--------|-------------|
| index.html at root | Predictable, Claude Design typically exports index.html |
| Largest .html file | Resilient to naming, but fragile with multi-file zips |
| Prompt when multiple found (selected) | Auto if single, numbered list if multiple |

**Selected:** Auto if single .html file; numbered list prompt if multiple; fail with clear error if none found.

**Clarifying question:** Even for single-file zips — auto-use without prompting?

**Selected:** Yes — zero-friction for single-file zips, explicit selection only when needed.

---

## Area 3: Skill UX — Confirm Before Push

**Question:** Should /wm-gen-docs pause before the gh api commit?

| Option | Description |
|--------|-------------|
| Show summary, require confirm (selected) | Matches /wm-ingest UX; prevents accidental overwrites |
| Fire-and-forget | Faster, but no chance to catch wrong target or artifact |

**Selected:** Mandatory confirm-before-push.

**Question:** What does the confirm summary include?

| Item | Selected |
|------|----------|
| Brand tokens injected (before → after) | ✓ |
| Output file size | ✓ |
| Target repo + path | ✓ |
| GFM export size (if --format md) | ✓ |

All four items selected — full summary.

---

## Area 4: Doc Naming — One per Repo or Named Docs

**Question:** Always docs/index.html, or optional named docs?

| Option | Description |
|--------|-------------|
| Always docs/index.html | Matches DOCS-04 exactly; single doc per repo |
| Optional --name flag (selected) | docs/<name>.html alongside index.html for multi-doc repos |

**Selected:** Optional --name flag.

**Clarifying question:** What's the filename pattern with and without --name?

**Selected:** No --name → docs/index.html (canonical); --name foo → docs/foo.html. GFM export follows same naming: docs/foo.md.

---

## Claude's Discretion Items

(Not discussed — left to implementation)
- Whether a `--force` flag bypasses the confirm step in the underlying script (for CI use)
- Temp directory cleanup strategy after zip extraction
- GFM conversion library choice (recommend: turndown)
- Whether `--mode docs` shares parsing helpers with `--mode full` / `--mode section` (should yes)

---

## Deferred Ideas

- Re-wiring session for 4 active sites (brand.doc_tokens population) — operator task post-Phase 6
- `--force` flag in the skill — Claude's discretion
- GFM export to GitHub Wiki (separate from docs/ folder) — out of scope for Phase 6
