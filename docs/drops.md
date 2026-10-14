# Open Drops

## What a drop is

A drop is a single page on a drops-enabled site (`"drops": { "enabled": true }` in `wiring.json`, today `sfdy`) at an unguessable URL `/d/<id>/`, where `<id>` is 32 random hex characters. The page is noindex, sends no referrer, carries a neutral title and links to nothing else. Every drop has a mandatory expiry, at most 90 days out (default 30 days).

## What a drop is not

- Drops are for confidential-but-not-secret material only: drafts, price lists, partner briefings that you would share by a private link.
- They are NOT for export-controlled or classified data.
- There is no encryption and no password. Locked (password) drops are backlog item 999.1.
- The URL is the only protection. Anyone who has it can read the page.

## Exposure and limits

- **Public tree (D-03).** The built folder sits in the PUBLIC `gh-pages` tree of the production repo. Anyone browsing that tree can see the folder names (the ids), though not the Markdown source.
- **Withdrawal is unlisting only.** Removing a drop and publishing again removes it from the live site, but git history, CDN caches and web archives may retain copies. Treat a withdrawn drop as possibly seen.
- **No backups of the public tree.** Never create a NEW gh-pages backup branch (or any other copy of the public tree) once drops exist, because the backup would keep withdrawn drops publicly visible. Do not use the Phase 12 backup/restore recipe on a branch that contains withdrawn drops. The existing pre-drops backup `gh-pages-old-2026-08` is allowed and must not be deleted.
- **PDFs.** Attachments are rebuilt with qpdf and metadata (Info, XMP, embedded files, JavaScript, open actions) is stripped and verified. Bookmarks, form fields and tag structure are not preserved. qpdf 11 or newer must be installed (`brew install qpdf`).
- **Local cache.** The Astro `.astro` cache holds drop bodies on the machine that built them.
- **CI logs.** CI logs of the public WebsiteMocker repository are world-readable. CI therefore prints counts and 4-character id prefixes only, and `drop.mjs check --ci --emit-masks` registers the active ids with `::add-mask::` so GitHub redacts them from later output.
- **Forbidden location.** Drops must never be stored under `sites/<slug>/src/content/drops`: that folder would be synced and committed to the public WebsiteMocker repo. Drop source lives only in the private repo `pbau3r-sfdy/drops`. `sync-content.sh` denies the folder, and the harness fails if it appears.

## Lifecycle

1. `node _scripts/drop.mjs new --site <slug> --title ... --body-file ... [--days N] [--pdf file.pdf]` (or `/wm-drop`). Nothing is written when validation fails.
2. `node _scripts/drop.mjs list` and `node _scripts/drop.mjs check <slug>`. `check` fails on invalid, expiry-less or over-horizon drops and on missing qpdf when PDFs exist; it warns on expired, soon-expiring (7 days) and secret-looking drops and on an uncommitted or unpushed local clone.
3. Commit and push the private drops repo (the CLI never does this; the operator approves the exact change).
4. `/wm-publish <slug>`. The publish step lists the drops about to go live and the live comparison (`check --live`).
5. Withdraw: `node _scripts/drop.mjs withdraw <8-char-prefix>` (dry run, then `--confirm`). It deletes the folder and appends an id-only tombstone to `<slug>/withdrawn.json`. Commit, push, `/wm-publish`, then confirm the URL answers HTTP 404 (CDN `max-age` is 600 s).
6. Expire: expired drops are removed only by `node _scripts/drop.mjs expire --confirm` followed by a publish. The nightly job only warns about expired or soon-expiring drops; it never publishes (D-04, D-05).

### Live comparison

`check --live` lists `d/` on the `gh-pages` branch of the production repo through the GitHub contents API (directory names only). The request is authenticated when `GH_TOKEN` or `GITHUB_TOKEN` is set. A 403 or 429 is retried three times with backoff; on the publish path it then becomes a WARN and the comparison is skipped, but with `--strict` (the nightly health job) it fails. `--strict` also fails for drops that are live but expired, withdrawn or missing from the source.

## Local builds

Builds read drops only when `DROPS_DIR` is set explicitly. There is no implicit `_drops/` default for builds, so cloning the private repo never leaks real drops into ordinary local or harness builds. The harness always sets `DROPS_DIR` to a fixture or an empty temp directory, and `publish.yml` sets it explicitly. Only the CLI defaults to `_drops/`, for operator convenience.

## Preview

Sandbox builds never contain drops and `deploy.yml` has neither the token nor the private repo. To preview a drop locally, set `DROPS_PREVIEW=1` and `DROPS_DIR` to the drops clone. Per the Phase 11 spike this works under `astro dev` (restart the dev server after adding a drop) and for a local sandbox build followed by `astro preview`. `DROPS_PREVIEW` is local-only and fails the build on CI.

## Tracking

With Plausible sanitised mode a drop view is reported as the masked path `/d/_ID_/` (the id never reaches analytics) and a PDF download as the plain `Drop Download` goal. Subtract 404 hits when reading the numbers. Grouping by `label` is deferred until the Business-plan decision and activates only with `analytics.props`.

## Token

- **One token (D-02, D-06).** `WM_PUBLISH_PAT` now writes the site and also reads the confidential drafts from `pbau3r-sfdy/drops`. Compromise of that token exposes both.
- **Nightly health (`drops-health.yml`).** It checks that the token is valid, that its expiry is not near (fails when fewer than 14 days remain), that it can read WebsiteMocker, the production repo and `pbau3r-sfdy/drops`, and that `pbau3r-sfdy/drops` is private.
- **What it cannot check.** The write scope is unverifiable by the check: a read-only probe cannot prove write permission. The first failing publish or content sync is the signal.

Token expiry date: not yet recorded (operator fills at gate G2)

Renewal checklist:

1. Create a new fine-grained token with contents read/write on WebsiteMocker and the production repo, and read on `pbau3r-sfdy/drops`.
2. Update the repository secret `WM_PUBLISH_PAT` in GitHub (never paste the value into chat, files or logs).
3. Run `drops-health` manually and confirm it passes.
4. Re-test the contributor content sync.
5. Update the expiry date line above.

Scheduled workflows in public repositories are disabled after 60 days without repository activity. If `drops-health` stops running, re-enable it manually in the Actions tab. This document never contains a token value.

## Rollback

1. Set `drops.enabled` to false in `sites/<slug>/wiring.json` and run `/wm-publish <slug>`; the deploy cleans the branch, so the `d/` folders disappear.
2. Disable the `drops-health` workflow.
3. Reduce the token's access to the private repo.
4. Archive the private repo `pbau3r-sfdy/drops`.

Remember that rollback is also unlisting only: copies may persist in caches and archives.
