---
phase: 3
slug: 03-brand-consistency
status: verified
threats_open: 0
asvs_level: 1
created: 2026-08-20
---

# Phase 3 — Security

> Per-phase security contract: threat register, accepted risks, and audit trail.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| operator → wiring.json | Developer-controlled config written by operator directly or via skill; not user-supplied untrusted input | Brand metadata (hashtags, vocabulary, avoid, voice) — no PII |
| operator paste → wm-wire validation | Operator pastes JSON from Claude.ai; skill validates structure before writing to wiring.json | JSON object: 4 string/array fields |
| skill → wiring.json (read) | Content skills read operator-curated brand data at write time | Brand metadata — developer-controlled file |
| skill → wiring.json (write) | Bi-directional enrichment path writes operator-approved hashtags back; gated by explicit confirmation | brand.hashtags array — operator-approved only |

---

## Threat Register

| Threat ID | Category | Component | Disposition | Mitigation | Status |
|-----------|----------|-----------|-------------|------------|--------|
| T-03-01 | Tampering | wiring.json brand block | accept | Developer-controlled source in private repo; no external write path; low-value target | closed |
| T-03-02 | Information Disclosure | brand.avoid / brand.hashtags in wiring.json | accept | No PII; brand terminology intentionally visible to operators; not exposed to end users | closed |
| T-03-02-01 | Tampering | Paste-back JSON validation in wm-wire | mitigate | wm-wire.md validates exactly 4 keys (hashtags, vocabulary, avoid, voice) + correct types before writing; reports exact field name + expected type on failure; will not write until validation passes | closed |
| T-03-02-02 | Spoofing | wm-wire reading capture/keywords.json signal sources | accept | All signal sources are developer-controlled files in the same repo; no external or user-controlled input | closed |
| T-03-03-01 | Tampering | Bi-directional enrichment write to wiring.json | mitigate | wm-add-news/announcement/blog require explicit per-hashtag `(y/N)` confirmation (default N) before staging any write; confirmed additions written to disk immediately before commit; no auto-add path exists | closed |
| T-03-03-02 | Denial of Service | Avoid scan blocking commit | accept | Avoid scan is explicitly non-blocking; operator confirms (y) or overrides any match; commit never blocked by avoid matches | closed |
| T-03-03-03 | Tampering | Operator content body scanned against brand.avoid | accept | Scan is read-only; brand.avoid sourced from developer-controlled wiring.json; no injection surface | closed |

*Status: open · closed*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-03-01 | T-03-01 | wiring.json is a source-controlled developer config with no public write path; risk appetite matches a sandbox with private repo | operator | 2026-08-20 |
| AR-03-02 | T-03-02 | Brand metadata contains no personal data; all values are business-facing terminology visible only to operators | operator | 2026-08-20 |
| AR-03-03 | T-03-02-02 | Capture and keywords.json are repo files authored by the operator; reading them introduces no external trust surface | operator | 2026-08-20 |
| AR-03-04 | T-03-03-02 | Non-blocking avoid scan is a conscious UX decision documented in CONTEXT.md; blocking would prevent valid content writes | operator | 2026-08-20 |
| AR-03-05 | T-03-03-03 | Avoid scan reads brand.avoid (operator-defined); content body is the author's own text; read-only operation with no write-back | operator | 2026-08-20 |

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-08-20 | 7 | 7 | 0 | claude-sonnet-4-6 (inline — register_authored_at_plan_time: true, mitigations verified in implementation) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-08-20
