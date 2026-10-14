# Phase 11: Open Drops - Discussion Log

> Audit trail only. Not consumed by downstream agents.

**Date:** 2026-10-14
**Areas discussed:** where drop sources live; expiry that takes effect; tracking without leaking the id; creating drops and PDFs

- Sources: options gitignored local / committed / private repo. Chosen: private repo `pbau3r-sfdy/drops`. Built output in the public gh-pages tree: accepted and documented.
- Access: reuse `WM_PUBLISH_PAT` (chosen) vs a new read-only secret. Operator note: if a new secret is added it must be kept current; led to the nightly token check.
- Expiry: manual sweep plus a warning (chosen) vs scheduled daily publish. Secret health: nightly token check that alerts (chosen).
- Tracking: masked pageview plus plain download event (chosen); per-drop label deferred to a Business-plan decision.
- Workflow: /wm-drop writes to the private repo; preview with DROPS_PREVIEW=1 (chosen). Added by Claude: preview is local only, public sandbox deploy never builds drops.
