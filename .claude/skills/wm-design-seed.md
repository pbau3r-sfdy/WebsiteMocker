# /wm-design-seed

Seed or incrementally update a Claude Design design-system project from a site's `brand.doc_tokens` and logos (DSYNC-11). Writes to Claude Design are persistent and external, so every write is gated on the operator approving the exact path list. Needs the model-side `DesignSync` tool (Claude Code session). This skill is droppable: no other skill depends on it.
The script `_scripts/design-seed.mjs` builds the bundle and path list; the model only relays approved paths.

---

## Steps

### 1. Collect inputs

Ask for the **site slug** (validate with `ls sites/<slug>/wiring.json`) and whether the target is a **new project** or an **existing project** (name or id). Confirm 09-SPIKE.md SD-09 says "keep" (it does: seeding stays in plan 09-09). Optionally ask which logo files under `sites/<slug>/public/` to include.

### 2. Existing project: list files

For an existing project call `list_files`, then write `_staging/design-seed/<slug>/listing.json` as `[{ "path": "<path>" }, ...]`. Entries under `uploads/` are never targeted.

### 3. Build the bundle

```bash
node _scripts/design-seed.mjs <slug> --existing-listing _staging/design-seed/<slug>/listing.json --logo sites/<slug>/public/<logo> --project-id <uuid> --name "<project name>"
# new project: omit --existing-listing and --project-id
```

Use `--dry-run` first to preview. Binary logos (png) are uploaded from disk with `localPath` in step 7 (SD-02, SD-09); if that fails, seed tokens only and list the logos as manual uploads.

### 4. Show the exact path list and STOP

Show every path with its action (create or update), bytes and sha256 prefix. Do NOT call create_project, finalize_plan or write_files until the operator approves this exact list by typing `approve`. Existing paths are overwritten only when listed as `update` and approved.

### 5. New project: create

Only for a new project: `create_project` with the operator-approved name. Record the returned project id.

### 6. Finalize the plan

`finalize_plan` with exactly the approved paths (writes only, `deletes` empty, `localDir` = `_staging/design-seed/<slug>/files`). Show the returned plan and get a second `approve`.

### 7. Write

`write_files` with exactly those paths, using `localPath` into `_staging/design-seed/<slug>/files/` so bytes are uploaded byte-exact without passing through the model.

### 8. Verify

`list_files` again. Confirm every approved path exists and no other path changed compared with the pre-run listing. Record project id, paths written and the comparison in the SUMMARY.

### 9. Offer to connect

Offer to save the design block so the site can pull from the project later:

```bash
node _scripts/design-connect.mjs <slug> --source design-system --project-id <uuid> --name "<project name>" --dry-run
```

Write only on a yes, then commit `sites/<slug>/wiring.json` (and the regenerated markers) with explicit paths.

---

## Notes

- Incremental only: never delete project files, never replace a project wholesale.
- Never write under `uploads/`.
- Operator approval is required per run, twice (before and after `finalize_plan`).
- Seed sources are limited to `brand.doc_tokens` and logos under `sites/<slug>/public/`. No secrets.
- `_staging/` is gitignored; nothing in the bundle is committed.
