# Retrospective

## Milestone: v1.2 — Claude Design Sync, Analytics, Open Drops

**Shipped:** 2026-10-14
**Phases:** 5 (9, 10, 11, 11.1, 12) | **Plans:** 28

### What Was Built
- Claude Design connectivity (pull, seed, guarded staging), cookie-free Plausible analytics with a sanitising transform and privacy gate, Open Drops from a private repo with PDF stripping and a nightly health check, and the cutover of the renamed baseline `sfdy` to www.starflight-dynamics.com.

### What Worked
- Fixture harnesses per phase (`verify-phase-NN.sh`) with a live mode; they caught real defects (stale assertions, a harness `rm -rf`, ids in logs).
- Plan-checker revision loops found verify commands that could not pass before execution.
- Doing the live lifecycle test (publish, click, withdraw, 404) with the real browser and Plausible found things fixtures could not (the goal was missing, CDN delay on the 404).

### What Was Inefficient
- Phase order assumptions broke once (10-05 needed 11.1 first).
- The design seed plan assumed tokens/logos; the dry run against the real project showed the overwrite would have destroyed richer content, so the plan changed late.
- Credentials: an expired token blocked the contributor sync and cost a detour; the vault is off-limits to Claude by design.

### Patterns Established
- Operator gates in autonomous waves: Claude stops before any external write and records approvals.
- Never print ids or tokens; CI prints counts and 4-character prefixes only.
- Dry-run and compare against the real remote state before any overwrite.

### Key Lessons
- Compare against the live remote before writing; do not trust a plan written from local assumptions.
- A green fixture is not a live proof; keep a live mode and run it.
- Record operator authorizations (here: Plausible configuration) so later runs need no repeat approval.

### Cost Observations
- Mostly executor subagents run one at a time on the main tree.
