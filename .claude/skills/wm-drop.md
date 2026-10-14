# /wm-drop

Create, list, check, withdraw and expire Open Drops: confidential-but-not-secret pages that live at an unguessable `/d/<id>/` URL on a drops-enabled site (`wiring.json` `"drops": { "enabled": true }`).

## Read this first

- Drops are for confidential-but-not-secret material only. They are NOT for export-controlled or classified data, and they are not encrypted.
- The built page lives in the PUBLIC gh-pages tree of the production repo behind an unguessable 32-hex URL. Anyone browsing that tree can see the folder names.
- Withdrawal is unlisting only: git history, CDN and web archives may retain copies. Say so to the operator whenever a withdrawal or expiry is requested.
- Full documentation: `docs/drops.md`.

## Setup

The private repo `pbau3r-sfdy/drops` is cloned to the gitignored `_drops/` folder (or any folder named by `DROPS_DIR`). The CLI reads and writes only there. Claude commits and pushes inside THAT clone only after the operator approves the exact change. The CLI itself never commits or pushes.

## Steps

### 1. Pick the action

Ask which action: `new`, `list`, `withdraw`, `expire`, `check`. Ask for the site slug (a site with `drops.enabled`, today `sfdy`).

### 2. new

Collect:
- **title** (required) and **label** (a short internal grouping tag; must not contain the id)
- **expiry**: default 30 days, maximum 90 (`--days N`, or `--expires <ISO 8601 with offset>`)
- **Markdown body**: write it to a temporary file and pass `--body-file`
- **optional PDFs** (`--pdf file.pdf`, repeatable): metadata is stripped with qpdf and verified; bookmarks, form fields and tag structure are not preserved. qpdf must be installed.

```bash
node _scripts/drop.mjs new --site <slug> --title "<title>" --label "<label>" --body-file <file.md> [--days 30] [--pdf <file.pdf>]
```

Nothing is written when validation fails. Show the operator the result (8-char id prefix, expiry, any WARN about secret-looking content) and then run `check`.

### 3. list and check

```bash
node _scripts/drop.mjs list --site <slug>
node _scripts/drop.mjs check <slug>          # add --live to compare with the public gh-pages listing
```

`check` fails on invalid, expiry-less or over-horizon drops, and on missing qpdf when PDFs exist. It warns on expired, soon-expiring (7 days), secret-looking bodies and an uncommitted or unpushed local drops clone.

### 4. withdraw and expire (dry run first)

```bash
node _scripts/drop.mjs withdraw <8-char-prefix> --site <slug>             # dry run
node _scripts/drop.mjs withdraw <8-char-prefix> --site <slug> --confirm   # acts
node _scripts/drop.mjs expire --site <slug>                               # dry run
node _scripts/drop.mjs expire --site <slug> --confirm                     # acts
```

Both remove the drop folder and append an id-only tombstone to `<slug>/withdrawn.json`. Withdrawal is unlisting only.

### 5. Commit and push the private repo (operator approval)

Show `git -C <drops clone> status` and `git -C <drops clone> diff --stat`. Only after the operator approves the exact change, commit and push inside the private drops clone (never in WebsiteMocker).

### 6. Preview locally

Drops never appear in sandbox builds or on CI. To preview on your machine (per the Phase 11 spike, this works under `astro dev`; restart the dev server after adding a drop):

```bash
cd sites/<slug>
DROPS_PREVIEW=1 DROPS_DIR=<absolute path to the drops clone> npm run dev
```

or run a local sandbox build with the same variables followed by `astro preview`. Never set `DROPS_PREVIEW` on CI and never deploy such a build.

### 7. Next steps

- After creating or editing a drop: `/wm-publish <slug>` (the publish check lists the drops that will go live).
- After a withdrawal or expiry: `/wm-publish <slug>`, then confirm the removed URL answers HTTP 404 (the CDN may serve the old page for up to 10 minutes).

## Rules

- Never paste a full drop id into chat history files, commit messages, GitHub issues or CI output. Use 4 or 8 character prefixes when reporting.
- Never read the MarketingBridge vault and never print a token.
- Never create a new gh-pages backup branch once drops exist (see `/wm-publish`).
- This skill does not publish; `/wm-publish` does, after the operator confirms the list.
