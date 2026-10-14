---
phase: 04-collaboration-infrastructure
reviewed: 2026-08-21T00:00:00Z
depth: standard
files_reviewed: 11
files_reviewed_list:
  - _scripts/init-prod-repo.mjs
  - _scripts/verify-phase-04.sh
  - _templates/.github/ISSUE_TEMPLATE/bug-report.yml
  - _templates/.github/ISSUE_TEMPLATE/config.yml
  - _templates/.github/ISSUE_TEMPLATE/content-request.yml
  - _templates/.github/ISSUE_TEMPLATE/design-change.yml
  - _templates/.github/workflows/content-ci.yml
  - _templates/CONTRIBUTING.md
  - .claude/skills/wm-init-collab.md
  - .claude/skills/wm-publish.md
  - .github/workflows/content-sync.yml
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Phase 04: Code Review Report

**Reviewed:** 2026-08-21
**Depth:** standard
**Files Reviewed:** 11
**Status:** issues_found

## Summary

Reviewed all eleven files constituting the Phase 4 collaboration infrastructure: the production-repo
bootstrap script, the verification harness, four issue template files, a content-CI template, a
CONTRIBUTING template, two operator skill files, and the WebsiteMocker-side sync receiver workflow.

The security architecture is sound at the workflow level: `client_payload.slug` is correctly routed
through an env var rather than interpolated into shell commands (T-04-01), `find -type f -name
'*.md'` guards against symlinks and non-Markdown files (T-04-02), label creation and PAT separation
between `WM_DISPATCH_PAT` and `WM_PUBLISH_PAT` are correct, and the concurrency/cancel logic is
appropriate for both sides of the dispatch.

One critical finding: the `/wm-init-collab` skill instructions direct the operator to paste the live
PAT token into the AI session before the `gh secret set` command, exposing the credential to the
assistant and its conversation history. Three warnings cover a shell-injection vector in
`init-prod-repo.mjs` (git identity interpolation), a silent failure path for empty production repos,
and a missing top-level `permissions:` block on the sync receiver. Four info-level items cover
minor gaps in template token detection, hardcoded IPs, integration-test fragility, and a floating
action tag.

---

## Critical Issues

### CR-01: `/wm-init-collab` instructs operator to paste live PAT into the AI chat session

**File:** `.claude/skills/wm-init-collab.md:64`

**Issue:** Step 5, after asking the operator to generate the fine-grained PAT, says:

> "Paste the token so it can be stored, then run:
> `gh secret set WM_DISPATCH_PAT --body "<token>" --repo <prod_repo>`"

In a Claude Code / AI-assistant workflow, "paste the token so it can be stored" means the operator
is being asked to share the token value with the AI in the chat turn. The AI would then substitute
it into the shell command it runs on the operator's behalf. The token is therefore exposed to:
- the full conversation history (stored by Anthropic)
- any context windows passed to sub-agents spawned from this session
- transcript logging if the operator has that enabled

The `**Important:**` note two lines below (line 70) correctly prohibits writing the token into
files, commits, and `wiring.json`, but says nothing about the chat — the omission is the bug.
`WM_DISPATCH_PAT` is a `Contents: read-write` PAT on the WebsiteMocker repo; exposure is a direct
secrets-compromise risk.

**Fix:** Replace the "paste" instruction with an explicit directive to run the command independently:

```markdown
**5. Set the secret** — run this command in your terminal (not in this chat).
Copy the token value directly from GitHub and paste it into the terminal only:

```bash
gh secret set WM_DISPATCH_PAT --repo <prod_repo>
```

`gh secret set` without `--body` opens a secure prompt for the token value.
The token must never be shared in this chat session.
```

Using `gh secret set` without `--body` reads the value from stdin interactively, preventing the
token from ever appearing as a command-line argument (which would also be visible in shell history).

---

## Warnings

### WR-01: Shell injection via git identity interpolation in `init-prod-repo.mjs`

**File:** `_scripts/init-prod-repo.mjs:324-325`

**Issue:** The script reads the operator's git user name and email via `capture()` and then
interpolates them directly into `execSync` shell command strings:

```js
const gitName  = capture('git config user.name')  || 'github-actions[bot]';
const gitEmail = capture('git config user.email') || 'github-actions[bot]@users.noreply.github.com';

execSync(`git config user.name "${gitName}"`,   { stdio: 'inherit', cwd: tmp });
execSync(`git config user.email "${gitEmail}"`, { stdio: 'inherit', cwd: tmp });
```

A git user name or email containing shell metacharacters (`"`, `$()`, backtick, `;`) would break
out of the double-quoted context and execute arbitrary commands in the temp-clone directory.
Example: a `user.name` of `x"; touch /tmp/pwned; echo "` would run `touch /tmp/pwned`. The risk
is limited to the operator's own machine with their own git config, but this pattern is insecure.

**Fix:** Use the `--global` fallback default path via the git `-c` flag, or pass values via a
`git` command using the array form with `spawnSync` to avoid shell parsing entirely:

```js
const { spawnSync } = await import('child_process');

function gitConfig(key, fallback, cwd) {
  spawnSync('git', ['config', key, fallback === undefined
    ? (capture(`git config ${key}`) || 'github-actions[bot]')
    : fallback
  ], { stdio: 'inherit', cwd });
}

spawnSync('git', ['config', 'user.name',  gitName],  { stdio: 'inherit', cwd: tmp });
spawnSync('git', ['config', 'user.email', gitEmail], { stdio: 'inherit', cwd: tmp });
```

Alternatively, since the temp clone runs in a CI-like context, always use the bot identity without
reading the local git config at all — eliminate the `capture()` calls and hardcode the bot values.

---

### WR-02: Orphan branch creation fails silently for truly empty production repos

**File:** `_scripts/init-prod-repo.mjs:278-283`

**Issue:** When the production repo has no `main` branch, the script takes the orphan path:

```js
run(`git clone --depth 1 ${cloneUrl} ${tmp}`);
execSync('git checkout --orphan main', { stdio: 'inherit', cwd: tmp });
execSync('git rm -rf . --quiet', { stdio: 'inherit', cwd: tmp });
```

For a repo that has zero commits (freshly created with no default branch), `git clone --depth 1`
warns but exits 0, producing an empty working tree. `git checkout --orphan main` succeeds. Then
`git rm -rf . --quiet` fails with:

```
fatal: pathspec '.' did not match any files
```

`execSync` throws, the `try` block aborts, the `finally` cleans up the temp dir, and the script
exits with an uncaught exception — leaving no template files committed and no useful error message
about the root cause.

This edge case arises when a production repo is created but has never had any commits (not even a
README). The more common case (repo has a `gh-pages` branch but no `main`) works correctly because
`gh-pages` files populate the index for `git rm` to remove.

**Fix:** Guard the `git rm` call so it only runs when there is actually something staged:

```js
// Only needed when the cloned branch had content to clear
const hasStagedFiles = capture('git ls-files', tmp);
if (hasStagedFiles) {
  execSync('git rm -rf . --quiet', { stdio: 'inherit', cwd: tmp });
}
```

---

### WR-03: Missing top-level `permissions:` block on `content-sync.yml`

**File:** `.github/workflows/content-sync.yml:26`

**Issue:** The file comment explains that `GITHUB_TOKEN` is not used and therefore no `permissions:`
block is needed. However, without an explicit block, `GITHUB_TOKEN` retains the repository's default
permissions (typically `contents: write` and `pull-requests: write` for the default GitHub Actions
setting). `actions/checkout@v7` uses the provided PAT (`persist-credentials: false` is correctly
set), so no write via GITHUB_TOKEN is performed today. But:

1. Any future step added to this workflow would silently inherit broad `GITHUB_TOKEN` permissions.
2. If the repository's default Actions permission is ever changed to `read-and-write`, the workflow
   becomes a vector for privilege escalation via workflow modification.

**Fix:** Add a minimal permissions block that explicitly restricts GITHUB_TOKEN:

```yaml
permissions:
  contents: read  # GITHUB_TOKEN not used for writes; WM_PUBLISH_PAT handles the push
```

This makes the intent explicit and prevents accidental expansion if additional steps are added later.

---

## Info

### IN-01: Token assertion regex misses hyphenated placeholder patterns

**File:** `_scripts/init-prod-repo.mjs:164`

**Issue:** The post-render assertion that catches unsubstituted placeholders uses:

```js
const leftover = content.match(/\{\{[A-Z_]+\}\}/);
```

The character class `[A-Z_]+` only matches uppercase letters and underscores. A new template token
like `{{SITE-SLUG}}` (with a hyphen) would silently pass through unsubstituted since the regex
does not match it.

**Fix:** Extend the character class to include hyphens:

```js
const leftover = content.match(/\{\{[A-Z_-]+\}\}/);
```

---

### IN-02: Hardcoded GitHub Pages IP addresses in `wm-publish.md`

**File:** `.claude/skills/wm-publish.md:46-53`

**Issue:** The DNS handoff guide hardcodes four GitHub Pages apex IP addresses:

```
185.199.108.153  185.199.109.153  185.199.110.153  185.199.111.153
```

GitHub has changed these IPs in the past. If they change again, operators following this skill
would configure DNS pointing at stale addresses, causing the live site to return errors until the
discrepancy is noticed.

**Fix:** Add a note to verify against GitHub's current documentation before applying:

```markdown
> **Verify IPs:** GitHub occasionally changes these addresses. Always cross-check at
> https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site
> before setting DNS records.
```

---

### IN-03: Verification harness hard-codes site slugs for integration checks

**File:** `_scripts/verify-phase-04.sh:288-302`

**Issue:** Section 03 of the verification harness runs the installer script directly against
`mogwai-systems` and `parrot-capital` as live integration probes:

```bash
node _scripts/init-prod-repo.mjs mogwai-systems > /dev/null 2>&1 && R=0 || R=1
...
PC_OUT=$(node _scripts/init-prod-repo.mjs parrot-capital 2>&1 || true)
```

These tests succeed only if both slugs have `wiring.json` files with valid `prod_repo` and `domain`
fields. In a clean clone, a CI environment, or after a site is archived/renamed, these checks fail
with a cryptic "No wiring.json found" error that looks like a script bug rather than a missing
fixture.

**Fix:** Either gate these checks with a comment that they are environment-specific integration
tests, or add a preflight `test -f` guard that skips gracefully when the fixtures are missing:

```bash
if test -f sites/mogwai-systems/wiring.json; then
  node _scripts/init-prod-repo.mjs mogwai-systems > /dev/null 2>&1 && R=0 || R=1
  check "_scripts/init-prod-repo.mjs mogwai-systems: exits 0 in dry-run" "$R"
else
  echo "  SKIP  _scripts/init-prod-repo.mjs mogwai-systems (fixture not present)"
fi
```

---

### IN-04: Floating major tag on `peter-evans/repository-dispatch` in content-ci.yml template

**File:** `_templates/.github/workflows/content-ci.yml:43`

**Issue:**

```yaml
uses: peter-evans/repository-dispatch@v4
```

The comment in the file (lines 50-53) acknowledges this and documents the accepted risk. The finding
is recorded here for completeness, not as a contradiction of the documented decision. A future
change to the production repo's threat profile (broader PAT, org-level permissions) would require
pinning to a commit SHA at that time. The acknowledged risk is currently acceptable.

**Fix (future-proofing):** When the threat profile changes, pin with a comment:

```yaml
uses: peter-evans/repository-dispatch@f2696f72bc4cc1b1eb2c2da14f49f8ae6f9e9a1 # v4.0.0
```

---

_Reviewed: 2026-08-21_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
