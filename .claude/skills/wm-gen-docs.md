# /wm-gen-docs

Generate a self-contained branded HTML document from a Claude Design artifact and commit it to the target production repo's `docs/` folder — no Astro build required. The target site must exist in `sites/<slug>/` with `brand.doc_tokens` populated in `wiring.json`. If `brand.doc_tokens` is absent, the script will print the suggested values from `Layout.astro` — add them to `wiring.json` before re-running.

---

## Steps

### 1. Collect inputs

Ask for:
- **Target slug** — must exist in `sites/`; validate with `ls sites/<slug>/wiring.json`
- **Artifact** — operator pastes HTML content directly in chat, OR provides a path to a `.zip` Claude Design export in `_captures/<slug>/raw/`
- **Optional: `--name <n>`** — output filename slug (must match `^[a-z0-9-]+$`); defaults to `index`, writing `docs/index.html` (per D-08/D-09)
- **Optional: `--format md`** — also export GFM Markdown to `docs/<name>.md` alongside the HTML output
- **Optional: `--target-repo org/repo`** — override the `prod_repo` value in `wiring.json`; must be in the `pbau3r-sfdy/*` namespace (per DOCS-05)

### 2. Validate wiring.json

Check three preconditions before staging anything:

```bash
ls sites/<slug>/wiring.json
```

- **Slug must exist** — the above command must succeed; if it fails, run `/wm-new-site <slug>` first.
- **`prod_repo` must be set** — either in `wiring.json` or via `--target-repo`. If neither is available, stop and ask the operator to set it.
- **`brand.doc_tokens` must be populated** — run the following to check:

```bash
node -e "const w=JSON.parse(require('fs').readFileSync('sites/<slug>/wiring.json','utf-8')); console.log(JSON.stringify(w?.brand?.doc_tokens))"
```

If the output is `undefined`, `null`, or `{}`: instruct the operator to add `brand.doc_tokens` to `sites/<slug>/wiring.json` before re-running. (The script will also print a copy-paste suggestion from `Layout.astro` if they skip this step and run the script directly.)

### 3. Stage the artifact

**If the operator pasted HTML:** write it to `_captures/<slug>/raw/artifact.html`. Create the directory if it does not exist:

```bash
mkdir -p _captures/<slug>/raw/
# then write the pasted HTML to _captures/<slug>/raw/artifact.html
```

**If the operator is using a `.zip` export:** confirm the zip is at `_captures/<slug>/raw/<name>.zip`. The script will extract it automatically — no manual unzip needed.

### 4. Dry-run preview

Run the script without `--commit` to process the artifact and print the D-06 confirm summary:

```bash
node _scripts/ingest-artifact.mjs <slug> --mode docs [--name <n>] [--format md] [--target-repo org/repo] --dry-run
```

Parse and present the full output to the operator. Pay particular attention to: how many brand tokens were injected, the before → after values for each token, the estimated output file size, and the target repo and path.

### 5. Confirm summary and gate (D-06 / D-07)

Present the doc generation summary in the following format:

```
── Doc Generation Summary ─────────────────────────────────
  Brand tokens injected (N):
    --accent:       <before>  →  <after>
    --bg:           <before>  →  <after>
  Output:           docs/<name>.html:  <N> KB
  Target repo:      <org>/<repo> → docs/<name>.html
  [GFM export:      docs/<name>.md:  <N> KB]   ← only shown with --format md
────────────────────────────────────────────────────────────

Proceed with commit? (y/N)
```

Do NOT proceed to Step 6 until the operator explicitly types `y`.
This confirm step is MANDATORY — it cannot be bypassed in this skill, even if there are zero token changes. (D-07)

### 6. Generate and commit

Re-run the script with `--commit` to produce the final output and push it to the target repo via `gh api`:

```bash
node _scripts/ingest-artifact.mjs <slug> --mode docs [--name <n>] [--format md] [--target-repo org/repo] --commit
```

If this command fails (e.g. `gh` not authenticated, `prod_repo` not accessible, `422 Unprocessable Entity`), surface the exact error and stop. Do NOT retry silently.

### 7. Report done

Print the committed file URL:

```
https://github.com/<org>/<repo>/blob/main/docs/<name>.html
```

If `--format md` was used, also print:

```
https://github.com/<org>/<repo>/blob/main/docs/<name>.md
```

Report: brand tokens injected (count and names), output file committed, and the full repo path for operator confirmation.

---

## Notes

- **`brand.doc_tokens` must be set before running** — if absent, the script exits 1 and prints the suggested values from `Layout.astro` as a copy-paste snippet; add the field to `sites/<slug>/wiring.json` and re-run
- **`docs/` folder is created automatically** — the script creates `_captures/<slug>/docs/` locally and the `docs/` folder in the target repo on first commit; no manual setup required
- **`--force` is script-only, never used in this skill** — the skill always pauses for the confirm gate per D-07; `--force` bypasses interactive prompts in the script for scripting/CI use but is not exposed here
- **`--target-repo` must be in `pbau3r-sfdy/`** — the script warns if the target repo is outside the org; if the warning appears, confirm the repo name with the operator before proceeding
- **Additive only** — committing a doc does not delete other files in the `docs/` folder; each `--name` writes a separate file; `docs/index.html` is the default (no `--name` needed)
- **If `gh api` returns `422 Unprocessable Entity`** — the SHA fetch may have failed; check that `gh` is authenticated with `gh auth status` and that the target repo exists at `https://github.com/<org>/<repo>`
