# Parked for later

Ideas to leverage later. Nothing here is in use or blocking; when an item is picked up, build it into the site and remove it from this list.
Open points that block a launch do not belong here: they live in each site's `src/data/open-points.ts`.

| Added | Site | Idea | Notes |
|---|---|---|---|
| 2026-10-12 | sfdy-alt-clean-reskin | Reachable by public transport | Both offices (Munich, Tal 44; Vilnius, Gynėjų g. 4-333) are reachable by public transport. Possible perk for "What SFDY offers" once the perks are defined. Also shown under "Parked for later" on the site's `/open-points` page. |
| 2026-10-12 | all sites | Plausible Analytics | Built into the framework (`_scripts/plausible.mjs`) and off everywhere. Needs a Plausible account and a privacy policy section before a site is switched on. See CLAUDE.md, "Analytics (Plausible)". |
| 2026-10-12 | sfdy-alt-clean-reskin-2 | Name the Bundeswehr in the positioning line | Trigger: Bundeswehr contracts are running. Announce as a news item first. (website-changes-2026-10-12, item 9) |
| 2026-10-12 | sfdy-alt-clean-reskin-2 | "Ecosystem partners" → "Programmes and partners", with programme references (e.g. REAGAN) | Trigger: once free to show them. (website-changes-2026-10-12, item 10) |
| 2026-10-14 | all sites | Self-hosted Plausible | Parked from milestone v1.2 (one SaaS subscription for now). `_scripts/plausible.mjs` already takes `analytics.host`, so cutover is a config change; needs a runbook (docker-compose, ClickHouse + Postgres, ~2 GB RAM), privacy-policy update and a CSV import check. |
