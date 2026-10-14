# Brand Block Schema — wiring.json

## Purpose

The brand block is a top-level JSON key in each site's `wiring.json`, storing the operator-curated brand identity in four fields. It is consumed by `/wm-wire` for interactive authoring and by all four content skills (`/wm-add-news`, `/wm-add-announcement`, `/wm-add-blog`, `/wm-add-job`) for write-time brand awareness.

## Field Reference

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `hashtags` | array of strings | Operator-curated brand hashtags without the `#` prefix. Content skills suggest these when the operator adds news posts, announcements, or blog posts. Grows bi-directionally — new hashtags from content can be added back (opt-in). | `["SFDY", "HighFrontier"]` |
| `vocabulary` | array of strings | Preferred brand terms. Content skills nudge the operator toward these terms when drafting content. Non-blocking — operator always wins. | `["orbital propulsion", "sovereign space capability"]` |
| `avoid` | array of strings | Words and phrases that conflict with brand tone. Content skills warn (non-blocking) when draft text contains any of these. Operator confirms or overrides. | `["startup", "disruption"]` |
| `voice` | string | One-sentence descriptor of brand communication style. Informational only in Phase 3 — stored for context but NOT read or enforced by content skills in this phase. | `"Technical, visionary, understated confidence"` |

## Minimal Stub

Copy this into `wiring.json` to initialise the brand block.

```json
"brand": {
  "hashtags": [],
  "vocabulary": [],
  "avoid": [],
  "voice": ""
}
```

## Populated Example

SFDY illustrative values — replace with your own brand identity.

```json
"brand": {
  "hashtags": ["SFDY", "SFDYUpdates", "HighFrontier", "SpaceDefense"],
  "vocabulary": ["orbital propulsion", "sovereign space capability", "high frontier"],
  "avoid": ["startup", "disruption", "pivot"],
  "voice": "Technical, visionary, understated confidence — no hype language"
}
```

## Notes

Brand block is optional enrichment — sites without a brand block (or with all-empty arrays) get silent pass-through in all content skills. Empty arrays are treated identically to a missing field. The `voice` field is informational in Phase 3; active voice enforcement is deferred to a later phase.
