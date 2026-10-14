# Roadmap: WebsiteMocker

## Milestones

- ✅ **v1.0 MVP** — Phases 1-5 (shipped 2026-08-21)
- ✅ **v1.1 Doc Generation, Archive Ingestion & Documentation Expansion** — Phases 6-8 (completed 2026-08-25, archived 2026-10-14)
- ✅ **v1.2 Claude Design Sync, Analytics, Open Drops** — Phases 9-12 (shipped 2026-10-14)

## Phases

<details>
<summary>✅ v1.0 MVP (Phases 1-5) — SHIPPED 2026-08-21</summary>

- [x] Phase 1: Production Deploy Pipeline (2 plans)
- [x] Phase 2: Content System (9 plans)
- [x] Phase 3: Brand Consistency (3 plans)
- [x] Phase 4: Collaboration Infrastructure (5 plans)
- [x] Phase 5: Design Artifact Ingestion (3 plans)

Full archive: [v1.0-ROADMAP.md](milestones/v1.0-ROADMAP.md) · phase records: [v1.0-phases/](milestones/v1.0-phases/)

</details>

<details>
<summary>✅ v1.1 Doc Generation, Archive Ingestion & Documentation Expansion (Phases 6-8) — COMPLETED 2026-08-25</summary>

- [x] Phase 6: Doc Pipeline (3/3 plans) — completed 2026-08-24; human checks signed off 2026-10-14
- [x] Phase 7: Archive Module (2/2 plans) — completed 2026-08-25
- [x] Phase 8: Cleanup & Verification (6/6 plans) — completed 2026-08-25

Full archive: [v1.1-ROADMAP.md](milestones/v1.1-ROADMAP.md) · phase records: [v1.1-phases/](milestones/v1.1-phases/)

</details>

<details>
<summary>✅ v1.2 Claude Design Sync, Analytics, Open Drops (Phases 9-12) — SHIPPED 2026-10-14</summary>

- [x] Phase 9: Claude Design Connectivity (9/9 plans) — completed 2026-10-14
- [x] Phase 10: Analytics (5/5 plans) — completed 2026-10-14
- [x] Phase 11: Open Drops (6/6 plans) — completed 2026-10-14
- [x] Phase 11.1: Retool of the SFDY baseline before cutover (2/2 plans) — completed 2026-10-14
- [x] Phase 12: SFDY Cutover (6/6 plans) — completed 2026-10-14

Full archive: [v1.2-ROADMAP.md](milestones/v1.2-ROADMAP.md) · requirements: [v1.2-REQUIREMENTS.md](milestones/v1.2-REQUIREMENTS.md)

</details>

## Backlog

### Phase 999.1: Locked Drops (BACKLOG)

**Goal**: Encrypted drops whose key travels only in the URL fragment, with soft expiry (LOCK-01.. to be defined when promoted)
**Depends on**: Phase 11
**Requirements**: Not in the active milestone (LOCK-01.. in REQUIREMENTS.md Future Requirements)
**Notes**: Local CLI encrypts with a random AES-GCM key and only ciphertext is committed; key in the fragment (`/d/#<id>.<key>`); analytics must never record URL fragments (a constraint already honoured in Phase 10)
**Plans**: TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 22/22 | Complete | 2026-08-21 |
| 6-8 | v1.1 | 11/11 | Complete | 2026-08-25 |
| 9-12 (incl. 11.1) | v1.2 | 28/28 | Complete | 2026-10-14 |
