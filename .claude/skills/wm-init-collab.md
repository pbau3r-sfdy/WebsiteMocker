# /wm-init-collab

Make a site's production repo contributor-ready: create the `main` branch, install
CONTRIBUTING.md and the issue templates, create the labels, install `content-ci.yml`,
and set up `WM_DISPATCH_PAT`. Safe to re-run — any item already in place is reported as
`unchanged` rather than re-created.

## Steps

**1. Identify the site** — ask if the slug is ambiguous. Read
`sites/<slug>/wiring.json` and confirm `prod_repo` and `domain` are both set. If either
is missing, stop with:

```
Error: <field> not set in sites/<slug>/wiring.json — run /wm-wire first
```

**2. Dry run the installer** — run the script without `--confirm` to preview every action
it will take. Present the full output to the operator, including the resolved site name,
the target production repo, the template files that will be written, and whether
`content-ci.yml` is in the install set (only installed for stage-6 sites):

```bash
node _scripts/init-prod-repo.mjs <slug>
```

Review the plan with the operator and ask for confirmation before proceeding to Step 3.

**3. Execute** — once the operator confirms, run with `--confirm`:

```bash
node _scripts/init-prod-repo.mjs <slug> --confirm
```

Present the script's `created / unchanged / updated` summary. On a re-run most lines
will read `unchanged` — this is correct behaviour, not a problem.

**4. Check WM_DISPATCH_PAT** — run:

```bash
gh secret list --repo <prod_repo>
```

Look for `WM_DISPATCH_PAT` in the output. If it is present, report that automated content
sync is live and skip to Step 6.

**5. Guide the operator through creating the token** (only when Step 4 found it missing).

This is the one step no command can perform. Follow these instructions without leaving the
session:

1. Go to **GitHub Settings → Developer settings → Fine-grained personal access tokens →
   Generate new token**
2. Name the token `WM_DISPATCH_PAT`
3. Resource owner: **`pbau3r-sfdy`** (not your personal account)
4. Repository access: **"Only select repositories"** → add `pbau3r-sfdy/WebsiteMocker`
   and nothing else
5. Repository permissions → **Contents: Read and write**; leave every other permission at
   "No access"
6. Expiration: **1 year** (this is the maximum fine-grained PAT lifetime — calendar
   reminder recommended, see Notes)
7. Generate and copy the token value

Paste the token so it can be stored, then run:

```bash
gh secret set WM_DISPATCH_PAT --body "<token>" --repo <prod_repo>
```

**Important:** The token value must never be written into a file, a commit message, or
`wiring.json`. Use the `--body` flag to pass it directly to `gh` and nowhere else.

### Why not reuse WM_PUBLISH_PAT?

`WM_PUBLISH_PAT` is a Classic PAT with `repo` scope and can push to any
`pbau3r-sfdy/*` repository. Production repos are contributor-writeable, and a
contributor who edits `content-ci.yml` can read any secret that workflow can access. Using
`WM_PUBLISH_PAT` there would let a contributor trigger pushes to any org repo.

`WM_DISPATCH_PAT` is a fine-grained token scoped only to `pbau3r-sfdy/WebsiteMocker`
with `Contents: Read and write`. Its blast radius is limited to triggering a content
sync and writing files in WebsiteMocker — it cannot touch any production repo.

**6. Verify and report** — confirm the end state by printing a summary block:

```
── Init-collab complete for <slug> ─────────────────────────────────

Production repo : https://github.com/<prod_repo>
Default branch  : main
Labels          : content-request, design-change, bug
content-ci.yml  : installed (or: not installed — stage < 6)
WM_DISPATCH_PAT : set (or: not set — run this skill again after setting it)

Contributor onboarding:
Share this URL with contributors:
  https://github.com/<prod_repo>
  → read CONTRIBUTING.md for the content workflow
```

## Notes

- Safe to re-run at any time; the installer reports `unchanged` for anything already in
  place — repeated runs are expected and harmless (D-B2)
- A contributor content push does **not publish**. It triggers `content-sync.yml`, which
  copies `.md` files into `sites/<slug>/src/content/` on WebsiteMocker and stops. The
  live site is unchanged until the operator explicitly runs `/wm-publish <slug>` (D-A3)
- Sync is additive: a file deleted from the production repo is not removed from
  WebsiteMocker or from the live site (D-A4)
- `/wm-add-news` and all other content skills are unaffected — they still commit directly
  to WebsiteMocker without touching the production repo (D-A5)
- `content-ci.yml` is only installed for stage-6 sites; for earlier stages only docs,
  issue templates, and labels are installed — re-run after the site goes live to add it
- Watch a sync run: `gh run list --workflow content-sync.yml --limit 5`
- Fine-grained PATs cap at a 1-year expiry. When `WM_DISPATCH_PAT` expires, contributor
  pushes succeed but the dispatch to WebsiteMocker is silently dropped — content does not
  reach WebsiteMocker, but the contributor sees no error. Set a calendar reminder to renew
  the token before it expires
- `gh-pages` is generated output and is never touched by this skill — it is overwritten on
  every `/wm-publish` run
- `WM_DISPATCH_PAT` lives in each production repo's Actions secrets.
  `WM_PUBLISH_PAT` (Classic PAT, `repo` scope) lives only in WebsiteMocker's secrets and
  must never be stored in a production repo
