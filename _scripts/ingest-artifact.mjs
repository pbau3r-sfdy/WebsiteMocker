#!/usr/bin/env node
/**
 * ingest-artifact.mjs — Parse a Claude Design HTML artifact and extract Astro components.
 *
 * Usage:
 *   node _scripts/ingest-artifact.mjs <slug> [options]
 *
 * Modes:
 *   --analyze              Parse and report only (no file writes). Outputs JSON to stdout.
 *   --mode full            Full-site ingest: extract all sections as Astro components,
 *                          write index.astro, copy assets.
 *   --mode section         Single section ingest (write component only, do not modify pages).
 *   --mode docs            Docs mode: self-contained branded HTML output, no Astro build.
 *   --section <name>       Section name to extract (required with --mode section).
 *   --dry-run              Show what would happen without making any changes.
 *
 * What it does (docs mode):
 *   1. Detects artifact: uses _captures/<slug>/raw/artifact.html or auto-extracts from .zip
 *   2. Validates brand.doc_tokens in wiring.json; exits 1 with suggestions if absent (D-02)
 *   3. Injects brand.doc_tokens overrides into artifact :root {} via HAST tree walk
 *   4. Writes branded HTML to _captures/<slug>/docs/<name>.html
 *   5. Optionally exports GFM Markdown to _captures/<slug>/docs/<name>.md (--format md)
 *   6. Commits docs/<name>.html (and .md) to prod_repo via gh api PUT when --commit is passed
 *
 * Artifact location:
 *   _captures/<slug>/raw/artifact.html  — paste HTML here before running
 *
 * What it does (full mode):
 *   1. Checks astro.config.mjs for SITE_URL/SITE_BASE env var pattern (INGEST-02)
 *   2. Parses artifact HTML using hast-util-from-html
 *   3. Extracts each <section>/<nav>/<footer>/<header>/<main> as scoped .astro component
 *   4. Decodes base64 images to public/images/<slug>/
 *   5. Rewrites local src="/" and href="/" paths to {b}/ template literal pattern
 *   6. Writes sites/<slug>/src/pages/index.astro (full mode only)
 *   7. Surfaces Google Fonts CDN links as operator instructions
 *   8. Reports brand token candidates from artifact CSS (INGEST-07)
 *   9. Runs build verification
 */

import { execSync }                          from 'child_process';
import {
  existsSync, mkdirSync, cpSync, copyFileSync,
  readdirSync, readFileSync, writeFileSync, rmSync,
} from 'fs';
import { join, basename, dirname }           from 'path';
import { fileURLToPath }                     from 'url';
import { fromHtml } from 'hast-util-from-html';
import { toHtml }   from 'hast-util-to-html';
import AdmZip          from 'adm-zip';           // docs mode — zip extraction
import TurndownService  from 'turndown';           // docs mode — GFM export

// ── Resolve repo root ─────────────────────────────────────────────────────────
const ROOT = join(fileURLToPath(import.meta.url), '..', '..');

// ── Log helpers (defined early so they are available during validation) ────────
const log  = (...a) => console.log(...a);
const info = (...a) => console.log(' ', ...a);
const ok   = (...a) => console.log(' ✓', ...a);
const warn = (...a) => console.log(' ⚠', ...a);
const fail = (...a) => { console.error(' ✖', ...a); process.exit(1); };
// dry() is defined after DRY_RUN is parsed below

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function flag(name) {
  const i = args.indexOf(name);
  if (i !== -1) { args.splice(i, 1); return true; }
  return false;
}
function option(name) {
  const i = args.indexOf(name);
  if (i !== -1 && args[i + 1]) { const v = args[i + 1]; args.splice(i, 2); return v; }
  return null;
}

const DRY_RUN     = flag('--dry-run');
const analyzeOnly = flag('--analyze');
const modeArg     = option('--mode');
const sectionArg  = option('--section');
const slugArg     = args[0];

const dry = (...a) => DRY_RUN && console.log('  [dry]', ...a);

const USAGE = 'Usage: node _scripts/ingest-artifact.mjs <slug> [--analyze] [--mode docs|full|section] [--section <name>] [--name <n>] [--format md] [--target-repo org/repo] [--commit] [--force] [--dry-run]';

if (!slugArg || !/^[a-z0-9-]+$/.test(slugArg)) {
  fail(USAGE);
}

const slug    = slugArg;
const siteDir = join(ROOT, 'sites', slug);
if (!existsSync(siteDir)) fail(`sites/${slug} not found — run /wm-new-site first`);

// ── Utility helpers ───────────────────────────────────────────────────────────
function run(cmd, cwd = ROOT) {
  if (DRY_RUN) { dry(`${cmd}  [${cwd.replace(ROOT, '.')}]`); return; }
  execSync(cmd, {
    stdio: 'inherit', cwd,
    env: { ...process.env, PATH: `${join(ROOT, 'node_modules', '.bin')}:${process.env.PATH}` },
  });
}

function readJSON(p) {
  try { return JSON.parse(readFileSync(p, 'utf-8')); } catch { return null; }
}

// ── HELPER: extractCSSVars ────────────────────────────────────────────────────
// Returns a Map of '--name' → 'value' from a CSS string.
function extractCSSVars(cssText) {
  const vars = new Map();
  for (const [, name, value] of cssText.matchAll(/--([a-zA-Z0-9-]+)\s*:\s*([^;}\n]+)/g)) {
    vars.set(`--${name}`, value.trim());
  }
  return vars;
}

// ── HELPER: toPascalCase ──────────────────────────────────────────────────────
// Converts 'hero-content', 'hero', 'nav', 'footer' → 'HeroContent', 'Hero', 'Nav', 'Footer'.
function toPascalCase(str) {
  return str.split(/[-_\s]+/).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('');
}

// ── HELPER: walkTree ──────────────────────────────────────────────────────────
// Recursively visits every node in a HAST tree, calling callback on each.
function walkTree(node, callback) {
  callback(node);
  if (node.children) {
    for (const child of node.children) {
      walkTree(child, callback);
    }
  }
}

// ── HELPER: extractSections ───────────────────────────────────────────────────
// Returns array of { name, tag, id, classes } for top-level body section elements.
function extractSections(htmlString) {
  const tree     = fromHtml(htmlString);
  const htmlNode = tree.children.find(n => n.tagName === 'html');
  const bodyNode = htmlNode?.children.find(n => n.tagName === 'body');
  const nodes    = bodyNode?.children.filter(
    n => n.type === 'element' && ['section', 'nav', 'footer', 'header', 'main'].includes(n.tagName)
  ) ?? [];
  return nodes.map(node => {
    const name = node.properties?.id
      || node.properties?.className?.[0]
      || node.tagName;
    return {
      name,
      tag:     node.tagName,
      id:      node.properties?.id   || null,
      classes: node.properties?.className || [],
    };
  });
}

// ── HELPER: extractStyleCSS ───────────────────────────────────────────────────
// Concatenates the text content of all <style> elements anywhere in the HTML tree.
function extractStyleCSS(htmlString) {
  const tree  = fromHtml(htmlString);
  const parts = [];
  walkTree(tree, node => {
    if (node.type === 'element' && node.tagName === 'style') {
      for (const child of (node.children || [])) {
        if (child.type === 'text') parts.push(child.value);
      }
    }
  });
  return parts.join('\n');
}

// ── HELPER: extractGoogleFontsLinks ──────────────────────────────────────────
// Returns an array of Google Fonts CDN href strings from <link rel="stylesheet"> tags.
function extractGoogleFontsLinks(htmlString) {
  const tree  = fromHtml(htmlString);
  const links = [];
  walkTree(tree, node => {
    if (
      node.type === 'element' &&
      node.tagName === 'link' &&
      Array.isArray(node.properties?.rel) &&
      node.properties.rel.includes('stylesheet') &&
      typeof node.properties?.href === 'string' &&
      node.properties.href.includes('fonts.googleapis.com')
    ) {
      links.push(node.properties.href);
    }
  });
  return links;
}

// ── HELPER: extractImages ─────────────────────────────────────────────────────
// Returns { images: string[], base64Images: number } from all <img> src attributes.
function extractImages(htmlString) {
  const tree     = fromHtml(htmlString);
  const images   = [];
  let base64Images = 0;
  walkTree(tree, node => {
    if (node.type === 'element' && node.tagName === 'img') {
      const src = node.properties?.src;
      if (typeof src === 'string') {
        if (src.startsWith('data:image')) {
          base64Images++;
        } else {
          images.push(src);
        }
      }
    }
  });
  return { images, base64Images };
}

// ── HELPER: findHtmlFiles ─────────────────────────────────────────────────────
// Recursively finds all .html files under dir. Used by zip extraction in docs mode.
function findHtmlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      results.push(...findHtmlFiles(join(dir, entry.name)));
    } else if (entry.name.endsWith('.html')) {
      results.push(join(dir, entry.name));
    }
  }
  return results;
}

// ── DOCS MODE HELPERS ─────────────────────────────────────────────────────────

// ── HELPER: warnMissingDocTokens ──────────────────────────────────────────────
// Warns the operator about a missing brand.doc_tokens field, prints copy-paste
// suggestion from Layout.astro :root vars, then exits 1 (D-02).
function warnMissingDocTokens(slug, siteDir) {
  warn(`brand.doc_tokens not set in sites/${slug}/wiring.json`);
  warn('Add this field before running --mode docs. Suggested values from Layout.astro:');
  const layoutPath = join(siteDir, 'src', 'layouts', 'Layout.astro');
  if (existsSync(layoutPath)) {
    const layoutCSS = extractStyleCSS(readFileSync(layoutPath, 'utf-8'));
    const vars = extractCSSVars(layoutCSS);
    log('  "brand": {');
    log('    "doc_tokens": {');
    for (const [name, val] of vars) {
      log(`      "${name}": "${val}",`);
    }
    log('    }');
    log('  }');
  }
  process.exit(1);
}

// ── HELPER: injectDocTokens ───────────────────────────────────────────────────
// Walks the HAST tree, finds <style> text nodes containing ':root', and applies
// brand.doc_tokens overrides. Returns { injectedHtml, beforeAfter }.
// Uses HAST tree walk to safely target only <style> elements (Pitfall 4 mitigation).
function injectDocTokens(html, docTokens) {
  const tree = fromHtml(html);
  const beforeAfter = [];
  walkTree(tree, node => {
    if (node.type === 'element' && node.tagName === 'style') {
      for (const child of (node.children || [])) {
        if (child.type === 'text' && child.value.includes(':root')) {
          let css = child.value;
          for (const [prop, newVal] of Object.entries(docTokens)) {
            const escapedProp = prop.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const propRe      = new RegExp(`(${escapedProp}\\s*:\\s*)[^;\\n]+`);
            // Find the existing value within :root {} only (for before/after reporting)
            let beforeVal = null;
            const rootMatch = css.match(/:root\s*\{([^}]*)\}/);
            if (rootMatch) {
              const inRoot = rootMatch[1].match(new RegExp(`${escapedProp}\\s*:\\s*([^;\\n]+)`));
              if (inRoot) beforeVal = inRoot[1].trim();
            }
            // Replace or append inside :root {} only — never touch component-level overrides
            const rootBlockRe = /(:root\s*\{)([^}]*)(})/g;
            css = css.replace(rootBlockRe, (_, open, body, close) => {
              const updated = propRe.test(body)
                ? body.replace(propRe, (_, prefix) => prefix + newVal)
                : body + `\n  ${prop}: ${newVal};`;
              return open + updated + close;
            });
            beforeAfter.push({ prop, before: beforeVal, after: newVal });
          }
          child.value = css;
        }
      }
    }
  });
  return { injectedHtml: toHtml(tree), beforeAfter };
}

// ── HELPER: ghApiPutFile ──────────────────────────────────────────────────────
// Commits a single file to a GitHub repo via gh api PUT.
// Fetches existing SHA before PUT to prevent 422 on updates (Pitfall 1).
// Content is passed via --input - stdin JSON body to avoid shell injection (T-06-03).
function ghApiPutFile(repoFullName, repoPath, fileBytes, commitMessage) {
  const [owner, repo] = repoFullName.split('/');
  const apiPath = `repos/${owner}/${repo}/contents/${repoPath}`;

  // 1. Fetch existing SHA (null if new file) — required for updates (Pitfall 1)
  let sha = null;
  try {
    const result = execSync(`gh api ${apiPath} --jq .sha`, { encoding: 'utf-8' }).trim();
    if (result && result !== 'null') { sha = result; info(`updating existing ${repoPath} (sha: ${sha.slice(0, 8)}…)`); }
  } catch (err) {
    // Only suppress 404 (file not found); rethrow auth, network, or other errors
    const msg = (err.message || '') + (err.stderr ? err.stderr.toString() : '');
    if (!msg.includes('404') && !msg.includes('Not Found')) throw err;
    info(`creating new ${repoPath}`); /* file does not exist yet — no SHA needed */
  }

  // 2. Build JSON body — never shell-interpolate the base64 string (T-06-03)
  const body = JSON.stringify({
    message: commitMessage,
    content: fileBytes.toString('base64'),
    ...(sha ? { sha } : {}),
  });

  // 3. PUT via stdin
  execSync(`gh api ${apiPath} --method PUT --input -`, {
    input: body,
    stdio: ['pipe', 'inherit', 'inherit'],
  });
}

// ── runDocsMode ───────────────────────────────────────────────────────────────
// Implements --mode docs end-to-end: artifact detection, brand token injection,
// local output, optional GFM export, and gh api PUT commit.
function runDocsMode(slug, siteDir, opts) {
  const { nameArg, formatArg, targetRepoArg, commitFlag, forceFlag } = opts;

  // a. VALIDATE flags (D-10: --name must match ^[a-z0-9-]+$; T-06-01, T-06-02)
  if (nameArg && !/^[a-z0-9-]+$/.test(nameArg)) {
    fail('--name must match ^[a-z0-9-]+$');
  }
  const outputName = nameArg || 'index';

  if (targetRepoArg && !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(targetRepoArg)) {
    fail('--target-repo must match org/repo format');
  }
  if (targetRepoArg && !targetRepoArg.startsWith('pbau3r-sfdy/')) {
    warn(`--target-repo "${targetRepoArg}" is outside the pbau3r-sfdy org — proceed with caution`);
  }

  // b. READ wiring.json
  const wiring    = readJSON(join(ROOT, 'sites', slug, 'wiring.json')) ?? {};
  const docTokens = wiring?.brand?.doc_tokens;
  if (!docTokens || Object.keys(docTokens).length === 0) {
    warnMissingDocTokens(slug, siteDir); // calls process.exit(1)
  }

  const rawProdRepo = targetRepoArg || wiring?.prod_repo;
  if (rawProdRepo && !/^[a-zA-Z0-9._-]+\/[a-zA-Z0-9._-]+$/.test(rawProdRepo)) {
    fail(`prod_repo value "${rawProdRepo}" contains invalid characters — check wiring.json`);
  }
  const prodRepo = rawProdRepo;
  if (!prodRepo) {
    fail(`prod_repo not set in sites/${slug}/wiring.json — pass --target-repo org/repo`);
  }

  // c. ARTIFACT DETECTION
  const rawDir       = join(ROOT, '_captures', slug, 'raw');
  const artifactPath = join(rawDir, 'artifact.html');
  let   htmlPath     = null;
  let   extractedDir = null; // set when a zip is extracted (for cleanup in step g)

  if (existsSync(artifactPath)) {
    htmlPath = artifactPath;
    ok('using artifact.html');
  } else {
    let zipFiles = [];
    if (existsSync(rawDir)) {
      zipFiles = readdirSync(rawDir).filter(f => f.endsWith('.zip'));
    }
    if (zipFiles.length === 0) {
      fail(`No artifact found at _captures/${slug}/raw/artifact.html and no .zip file in _captures/${slug}/raw/ — stage the artifact first`);
    }

    const zipPath = join(rawDir, zipFiles[0]);
    extractedDir  = join(rawDir, 'extracted');

    if (!DRY_RUN) {
      new AdmZip(zipPath).extractAllTo(extractedDir, true);
      ok(`extracted ${zipFiles[0]} to raw/extracted/`);

      // T-06-04: zip slip mitigation — verify all HTML paths stay under extractedDir
      const rawHtmlFiles = findHtmlFiles(extractedDir);
      const htmlFiles    = rawHtmlFiles.filter(p => {
        if (!p.startsWith(extractedDir)) {
          fail(`Zip slip detected: ${basename(p)} escapes the extraction directory — aborting`);
        }
        return true;
      });

      if (htmlFiles.length === 0) {
        fail(`No HTML file found in zip ${zipFiles[0]} — check the zip contents`);
      } else if (htmlFiles.length === 1) {
        htmlPath = htmlFiles[0];
        ok(`auto-selected ${basename(htmlFiles[0])}`);
      } else if (!forceFlag) {
        log('Multiple HTML files found in zip. Select one:');
        htmlFiles.forEach((f, i) => log(`  ${i + 1}. ${basename(f)}`));
        let reply;
        try {
          reply = execSync('read reply < /dev/tty && echo $reply', {
            encoding: 'utf-8', stdio: ['pipe', 'pipe', 'inherit'],
          }).trim();
        } catch {
          fail('Interactive file selection requires a TTY — re-run with --force to auto-select the first HTML file');
        }
        const idx = parseInt(reply, 10);
        if (isNaN(idx) || idx < 1 || idx > htmlFiles.length) {
          fail('Invalid choice');
        }
        htmlPath = htmlFiles[idx - 1];
      } else {
        htmlPath = htmlFiles[0];
        warn(`--force: auto-selected ${basename(htmlFiles[0])} (first of ${htmlFiles.length} HTML files)`);
      }
    } else {
      dry(`would extract ${zipFiles[0]} to raw/extracted/`);
    }
  }

  // d. READ and PROCESS artifact
  const htmlString = DRY_RUN
    ? '<html><head><style>:root{}</style></head><body></body></html>'
    : readFileSync(htmlPath, 'utf-8');
  const { injectedHtml, beforeAfter } = injectDocTokens(htmlString, docTokens);

  // e. WRITE local output
  const docsDir    = join(ROOT, '_captures', slug, 'docs');
  const outputPath = join(docsDir, outputName + '.html');
  if (!DRY_RUN) {
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(outputPath, injectedHtml, 'utf-8');
    ok(`wrote _captures/${slug}/docs/${outputName}.html`);
  } else {
    dry(`would write _captures/${slug}/docs/${outputName}.html`);
  }

  // f. PRINT SUMMARY (D-06 format)
  const fileSize = DRY_RUN ? '?' : `${Math.round(Buffer.byteLength(injectedHtml, 'utf-8') / 1024)} KB`;
  log('── Doc Generation Summary ─────────────────────────────────');
  log(`  Brand tokens injected (${beforeAfter.length}):`);
  for (const { prop, before, after } of beforeAfter) {
    log(`    ${prop}: ${before || '(new)'}  →  ${after}`);
  }
  log(`  Output:           docs/${outputName}.html:  ${fileSize}`);
  log(`  Target repo:      ${prodRepo} → docs/${outputName}.html`);
  if (formatArg === 'md') {
    log(`  GFM export:       docs/${outputName}.md: (pending)`);
  }
  log('────────────────────────────────────────────────────────────');

  // g. CLEANUP extracted/ on success (leave on failure for debugging)
  if (extractedDir && existsSync(extractedDir) && !DRY_RUN) {
    try {
      rmSync(extractedDir, { recursive: true });
      ok('cleaned up raw/extracted/');
    } catch {
      warn('Could not clean up raw/extracted/ — leaving for debugging');
    }
  }

  // ── GFM EXPORT ───────────────────────────────────────────────────────────────
  let gfmOutputPath = null;
  if (formatArg === 'md' && !DRY_RUN) {
    const bodyMatch   = injectedHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    const bodyContent = bodyMatch ? bodyMatch[1] : injectedHtml;
    const td          = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced' });
    const gfmContent  = td.turndown(bodyContent);
    gfmOutputPath     = join(docsDir, outputName + '.md');
    writeFileSync(gfmOutputPath, gfmContent, 'utf-8');
    ok(`wrote _captures/${slug}/docs/${outputName}.md`);
  } else if (formatArg === 'md' && DRY_RUN) {
    dry(`would write _captures/${slug}/docs/${outputName}.md`);
  }

  // ── COMMIT ────────────────────────────────────────────────────────────────────
  if (commitFlag && !DRY_RUN) {
    ok(`committing docs/${outputName}.html to ${prodRepo}...`);
    const htmlBytes = readFileSync(outputPath);
    ghApiPutFile(prodRepo, `docs/${outputName}.html`, htmlBytes, `docs: add ${outputName}.html [wm-gen-docs]`);
    ok(`committed docs/${outputName}.html to github.com/${prodRepo}`);
    if (gfmOutputPath) {
      const gfmBytes = readFileSync(gfmOutputPath);
      ghApiPutFile(prodRepo, `docs/${outputName}.md`, gfmBytes, `docs: add ${outputName}.md [wm-gen-docs]`);
      ok(`committed docs/${outputName}.md to github.com/${prodRepo}`);
    }
  } else if (commitFlag && DRY_RUN) {
    dry(`would call gh api PUT → ${prodRepo}/docs/${outputName}.html`);
  }

  // ── DONE BANNER ───────────────────────────────────────────────────────────────
  if (commitFlag && !DRY_RUN) {
    const gfmLine = gfmOutputPath ? `\n  and docs/${outputName}.md` : '';
    log(`
${'═'.repeat(52)}
 ✅  docs/${outputName}.html generated for ${slug}.
${'═'.repeat(52)}

Committed: github.com/${prodRepo}/blob/main/docs/${outputName}.html${gfmLine}
Next steps:
  /wm-gen-docs ${slug} --name <n>              ← generate another doc
  /wm-gen-docs ${slug} --format md             ← also export GFM Markdown
  /wm-gen-docs ${slug} --target-repo org/repo  ← route to a different repo
`);
  } else {
    log(`
${'═'.repeat(52)}
 ✅  docs/${outputName}.html generated for ${slug}.
${'═'.repeat(52)}

Staged at: _captures/${slug}/docs/${outputName}.html
Run with --commit to push to ${prodRepo}
Next steps:
  Add --format md to also export GFM Markdown
  Add --target-repo org/repo to route to a different repo
  Add --commit to push docs/${outputName}.html to ${prodRepo}
`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// ANALYZE FLOW — exits 0 with JSON report; no file writes
// ═══════════════════════════════════════════════════════════════════════════════

if (analyzeOnly) {
  const artifactPath = join(ROOT, '_captures', slug, 'raw', 'artifact.html');
  if (!existsSync(artifactPath)) {
    fail(`No artifact found at _captures/${slug}/raw/artifact.html — paste HTML and re-run /wm-ingest`);
  }

  const htmlString  = readFileSync(artifactPath, 'utf-8');
  const sections    = extractSections(htmlString);
  const artifactCSS = extractStyleCSS(htmlString);
  const artifactVars = extractCSSVars(artifactCSS);

  const layoutPath    = join(siteDir, 'src', 'layouts', 'Layout.astro');
  const layoutContent = existsSync(layoutPath) ? readFileSync(layoutPath, 'utf-8') : '';
  const existingVars  = extractCSSVars(layoutContent);

  const collisions = [...artifactVars.entries()]
    .filter(([name, val]) => existingVars.has(name) && existingVars.get(name) !== val)
    .map(([name, val]) => ({ name, existing: existingVars.get(name), artifact: val }));

  const googleFontsLinks = extractGoogleFontsLinks(htmlString);
  const { images, base64Images } = extractImages(htmlString);

  process.stdout.write(JSON.stringify({
    sections,
    artifactVars:  Object.fromEntries(artifactVars),
    existingVars:  Object.fromEntries(existingVars),
    collisions,
    googleFontsLinks,
    images,
    base64Images,
  }, null, 2) + '\n');
  process.exit(0);
}

// ── MODE GUARD ────────────────────────────────────────────────────────────────
if (modeArg !== 'full' && modeArg !== 'section' && modeArg !== 'docs') {
  fail(USAGE);
}

// ── SECTION MODE VALIDATION ───────────────────────────────────────────────────
if (modeArg === 'section' && !sectionArg) {
  fail('--mode section requires --section <name>');
}

// ── DOCS MODE DISPATCH ────────────────────────────────────────────────────────
if (modeArg === 'docs') {
  const nameArg       = option('--name');
  const formatArg     = option('--format');
  const targetRepoArg = option('--target-repo');
  const commitFlag    = flag('--commit');
  const forceFlag     = flag('--force');
  runDocsMode(slug, siteDir, { nameArg, formatArg, targetRepoArg, commitFlag, forceFlag });
  process.exit(0);
}

// ═══════════════════════════════════════════════════════════════════════════════
// WRITE-MODE HELPERS (used by full-site and section modes)
// ═══════════════════════════════════════════════════════════════════════════════

// ── HELPER: extractScopedCSS ──────────────────────────────────────────────────
// Returns only the CSS rules whose selector contains the section's class or id.
// Excludes global-only rules (:root, html, body, *).
// Uses simple split-on-} approach as specified (MVP — does not handle nested @media).
function extractScopedCSS(cssText, sectionClass, sectionId) {
  if (!cssText) return '';
  if (/@media\s/.test(cssText)) {
    warn('Artifact contains @media blocks — responsive rules are not extracted by this MVP parser. Add them manually to the component <style>.');
  }
  const rules = [];
  const blocks = cssText.split('}');
  for (const block of blocks) {
    const braceIdx = block.indexOf('{');
    if (braceIdx === -1) continue;
    const selector    = block.slice(0, braceIdx).trim();
    const declarations = block.slice(braceIdx + 1).trim();
    if (!selector || !declarations) continue;
    // Exclude stand-alone global rules
    if (/^(:root|html|body|\*)$/.test(selector)) continue;
    const matchesClass = sectionClass && selector.includes(`.${sectionClass}`);
    const matchesId    = sectionId    && selector.includes(`#${sectionId}`);
    if (matchesClass || matchesId) {
      rules.push(`${selector} {\n  ${declarations.replace(/\s+/g, ' ').trim()}\n}`);
    }
  }
  const raw = rules.join('\n');
  // Rewrite local absolute url() paths to BASE_URL template literal pattern.
  // Skip external (http/https) and embedded (data:) URIs — only absolute local paths starting with /.
  const rewritten = raw.replace(
    /url\(['"]?(\/[^'")]+)['"]?\)/g,
    (_match, path) => `url(\`\${b}${path}\`)`
  );
  return rewritten;
}

// ── HELPER: rewriteLocalPaths ─────────────────────────────────────────────────
// Rewrites local src="/" and href="/" attribute values to {b}/ template literal syntax.
// External URLs (http/https) and protocol-relative (//) are left unchanged.
function rewriteLocalPaths(html, slug) {
  // src="/images/..." → src={`${b}/images/<slug>/...`}
  html = html.replace(/src="(\/[^"]*)"/g, (match, path) => {
    if (path.startsWith('//')) return match; // protocol-relative
    if (path.startsWith('/images/')) {
      const filename = path.slice('/images/'.length);
      return `src={\`\${b}/images/${slug}/${filename}\`}`;
    }
    return `src={\`\${b}${path}\`}`;
  });
  // href="/..." → href={`${b}/...`} (local only — skip protocol-relative)
  html = html.replace(/href="(\/[^"]*)"/g, (match, path) => {
    if (path.startsWith('//')) return match;
    return `href={\`\${b}${path}\`}`;
  });
  return html;
}

// ── HELPER: decodeBase64 ──────────────────────────────────────────────────────
// Decodes a data:image/... base64 URI, writes the binary to destDir/name.ext,
// returns the filename written (e.g. 'hero-0.png'), or null if not a valid data URI.
function decodeBase64(dataUri, destDir, name) {
  const match = dataUri.match(
    /^data:image\/(png|jpg|jpeg|gif|webp|svg\+xml);base64,([\s\S]+)$/
  );
  if (!match) return null;
  const mimeToExt = { png: 'png', jpg: 'jpg', jpeg: 'jpg', gif: 'gif', webp: 'webp', 'svg+xml': 'svg' };
  const ext      = mimeToExt[match[1]] || 'bin';
  const filename = `${name}.${ext}`;
  if (!DRY_RUN) {
    mkdirSync(destDir, { recursive: true });
    writeFileSync(join(destDir, filename), Buffer.from(match[2], 'base64'));
  }
  return filename;
}

// ── HELPER: convertLinkedStylesheets ─────────────────────────────────────────
// Replaces non-Google-Fonts <link rel="stylesheet"> tags with inline <style> blocks.
// If the CSS file cannot be found locally, leaves the <link> unchanged and warns.
function convertLinkedStylesheets(html, artifactDir) {
  return html.replace(/<link[^>]+rel="stylesheet"[^>]*>/gi, (match) => {
    if (match.includes('fonts.googleapis.com')) return match; // keep Google Fonts CDN links
    const hrefMatch = match.match(/href="([^"]*)"/);
    if (!hrefMatch) return match;
    const href = hrefMatch[1];
    if (href.startsWith('http') || href.startsWith('//')) return match; // external
    const cssPath = join(artifactDir, href);
    if (existsSync(cssPath)) {
      try {
        const css = readFileSync(cssPath, 'utf-8');
        return `<style>\n${css}\n</style>`;
      } catch {
        warn(`Could not read linked stylesheet: ${href}`);
        return match;
      }
    }
    warn(`Linked stylesheet not found locally (leaving as-is): ${href}`);
    return match;
  });
}

// ── HELPER: toAstroComponent ──────────────────────────────────────────────────
// Builds a scoped Astro component string from section HTML, scoped CSS, name, date.
function toAstroComponent(sectionHtml, scopedCSS, componentName, date) {
  const hasLocalAssets = sectionHtml.includes('{b}/') || scopedCSS.includes('${b}');
  const frontmatter = hasLocalAssets
    ? `---\n// ${componentName} — extracted from Claude Design artifact ${date}\nconst b = import.meta.env.BASE_URL.replace(/\\/$/, '');\n---`
    : `---\n// ${componentName} — extracted from Claude Design artifact ${date}\n---`;
  return `${frontmatter}\n\n${sectionHtml}\n\n<style>\n${scopedCSS}\n</style>\n`;
}

// ── HELPER: writeSectionMode ──────────────────────────────────────────────────
// Extracts a single named section from the artifact and writes it as a scoped
// Astro component under sites/<slug>/src/components/. NEVER writes to src/pages/.
function writeSectionMode(slug, sectionName, sections, cssText, siteDir, date) {
  // 1. Find the matching section entry
  const section = sections.find(s =>
    s.id === sectionName ||
    s.classes[0] === sectionName ||
    s.name.toLowerCase() === sectionName.toLowerCase()
  );
  if (!section) {
    fail(`Section "${sectionName}" not found in artifact. Available: ${sections.map(s => s.name).join(', ')}`);
  }

  // 2. Re-parse artifact HTML from disk and locate the matching element node
  const artifactPath = join(ROOT, '_captures', slug, 'raw', 'artifact.html');
  const htmlString   = readFileSync(artifactPath, 'utf-8');
  const tree         = fromHtml(htmlString);
  const htmlNode     = tree.children.find(n => n.tagName === 'html');
  const bodyNode     = htmlNode?.children.find(n => n.tagName === 'body');
  const sectionNode  = bodyNode?.children.find(n => {
    if (n.type !== 'element') return false;
    if (n.tagName !== section.tag) return false;
    const nodeId    = n.properties?.id             || null;
    const nodeClass = n.properties?.className?.[0] || null;
    if (section.id    && nodeId    === section.id)          return true;
    if (section.classes[0] && nodeClass === section.classes[0]) return true;
    // fallback: match by tag when no id/class
    if (!section.id && !section.classes[0] && n.tagName === section.tag) return true;
    return false;
  });

  if (!sectionNode) {
    fail(`Could not locate section node for "${sectionName}" in parsed HTML tree.`);
  }

  // 3. sectionHtml from the matched node
  let sectionHtml = toHtml(sectionNode);

  // 4. Scoped CSS — exclude :root/body/html/* rules
  const scopedCSS = extractScopedCSS(cssText, section.classes[0] || null, section.id || null);

  // 5. Convert linked stylesheets
  sectionHtml = convertLinkedStylesheets(sectionHtml, join(ROOT, '_captures', slug, 'raw'));

  // 6. Handle base64 images → public/images/<slug>/
  const publicImagesDir = join(siteDir, 'public', 'images', slug);
  let localBase64Idx = 0;
  sectionHtml = sectionHtml.replace(/src="(data:image\/[^"]*)"/g, (match, dataUri) => {
    const filename = decodeBase64(dataUri, publicImagesDir, `${sectionName}-${localBase64Idx}`);
    if (filename) {
      localBase64Idx++;
      if (!DRY_RUN) {
        ok(`decoded base64 image → public/images/${slug}/${filename}`);
      } else {
        dry(`would decode base64 image → public/images/${slug}/${filename}`);
      }
      return `src={\`\${b}/images/${slug}/${filename}\`}`;
    }
    return match;
  });

  // 7. Rewrite remaining local paths to {b}/ template literal pattern
  sectionHtml = rewriteLocalPaths(sectionHtml, slug);

  // 8. Component name (PascalCase)
  const componentName = toPascalCase(sectionName);

  // 9. Build the Astro component string
  const component = toAstroComponent(sectionHtml, scopedCSS, componentName, date);

  // 10. Component output path — ONLY src/components/, never src/pages/
  const componentPath = join(siteDir, 'src', 'components', `${componentName}.astro`);

  // 11. Write (or dry-run)
  if (!DRY_RUN) {
    mkdirSync(join(siteDir, 'src', 'components'), { recursive: true });
    writeFileSync(componentPath, component, 'utf-8');
    ok(`wrote ${componentName}.astro`);
  } else {
    dry(`would write ${componentName}.astro`);
  }

  // 13. Print manual import instruction (always, even in dry-run — INGEST-03)
  log('\nComponent staged. To use it, add to your page:');
  log(`  import ${componentName} from '../components/${componentName}.astro';`);
  log(`  <${componentName} />`);
  log('No existing pages were modified.');
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL-SITE WRITE FLOW
// ═══════════════════════════════════════════════════════════════════════════════

const artifactPath = join(ROOT, '_captures', slug, 'raw', 'artifact.html');
if (!existsSync(artifactPath)) {
  fail(`No artifact found at _captures/${slug}/raw/artifact.html — paste HTML and re-run /wm-ingest`);
}

// ── INGEST-02: astro.config.mjs env var check — inject if absent ──────────────
const configPath = join(siteDir, 'astro.config.mjs');
if (existsSync(configPath)) {
  const configContent = readFileSync(configPath, 'utf-8');
  if (configContent.includes('SITE_URL') && configContent.includes('SITE_BASE')) {
    ok('astro.config.mjs: SITE_URL/SITE_BASE env var pattern confirmed');
  } else {
    const injection = '// injected by /wm-ingest — needed for sandbox/production routing\n  site: process.env.SITE_URL,\n  base: process.env.SITE_BASE || \'/\',';
    const patched = configContent.replace('defineConfig({', `defineConfig({\n  ${injection}`);
    if (patched === configContent) {
      warn('astro.config.mjs: defineConfig({ not found — SITE_URL/SITE_BASE pattern not injected. Add manually.');
    } else if (!DRY_RUN) {
      writeFileSync(configPath, patched, 'utf-8');
      ok('astro.config.mjs: injected SITE_URL/SITE_BASE env var pattern');
    } else {
      dry('would inject SITE_URL/SITE_BASE env var pattern into astro.config.mjs');
    }
  }
}

const htmlString  = readFileSync(artifactPath, 'utf-8');
const cssText     = extractStyleCSS(htmlString);
const artifactVars = extractCSSVars(cssText);
const date        = new Date().toISOString().slice(0, 10);

// ── Create output directories ─────────────────────────────────────────────────
const componentsDir  = join(siteDir, 'src', 'components');
const publicImagesDir = join(siteDir, 'public', 'images', slug);

if (!DRY_RUN) {
  mkdirSync(componentsDir,   { recursive: true });
  mkdirSync(publicImagesDir, { recursive: true });
} else {
  dry(`would create dirs: src/components/, public/images/${slug}/`);
}

// ── SECTION MODE ROUTING ──────────────────────────────────────────────────────
// Section mode: extract one named section as a component, then exit.
// NEVER calls writeFileSync on src/pages/ — only src/components/ and public/images/.
if (modeArg === 'section') {
  const sections = extractSections(htmlString);
  writeSectionMode(slug, sectionArg, sections, cssText, siteDir, date);
  process.exit(0);
}

// ── Parse HAST tree and iterate sections ─────────────────────────────────────
const tree     = fromHtml(htmlString);
const htmlNode = tree.children.find(n => n.tagName === 'html');
const bodyNode = htmlNode?.children.find(n => n.tagName === 'body');
const sectionNodes = bodyNode?.children.filter(
  n => n.type === 'element' && ['section', 'nav', 'footer', 'header', 'main'].includes(n.tagName)
) ?? [];

const componentNames = [];
const usedNames = new Map(); // baseName → count; tracks collisions across loop iterations
let base64Count = 0;

for (const node of sectionNodes) {
  const sectionId    = node.properties?.id   || null;
  const sectionClass = node.properties?.className?.[0] || null;
  const name = sectionId || sectionClass || node.tagName;

  let sectionHtml = toHtml(node);
  const scopedCSS  = extractScopedCSS(cssText, sectionClass, sectionId);

  // Convert local <link rel="stylesheet"> to inline <style>
  sectionHtml = convertLinkedStylesheets(sectionHtml, join(ROOT, '_captures', slug, 'raw'));

  // Decode base64 images → public/images/<slug>/
  let localBase64Idx = 0;
  sectionHtml = sectionHtml.replace(/src="(data:image\/[^"]*)"/g, (match, dataUri) => {
    const filename = decodeBase64(dataUri, publicImagesDir, `${name}-${localBase64Idx}`);
    if (filename) {
      localBase64Idx++;
      base64Count++;
      if (!DRY_RUN) {
        ok(`decoded base64 image → public/images/${slug}/${filename}`);
      } else {
        dry(`would decode base64 image → public/images/${slug}/${filename}`);
      }
      return `src={\`\${b}/images/${slug}/${filename}\`}`;
    }
    return match;
  });

  // Rewrite remaining local src="/" and href="/" paths to {b}/ pattern
  sectionHtml = rewriteLocalPaths(sectionHtml, slug);

  const baseName   = toPascalCase(name);
  const useCount   = usedNames.get(baseName) ?? 0;
  usedNames.set(baseName, useCount + 1);
  if (useCount > 0) {
    warn(`Duplicate section name "${baseName}" — writing as ${baseName}${useCount + 1}.astro`);
  }
  const componentName = useCount === 0 ? baseName : `${baseName}${useCount + 1}`;
  const component     = toAstroComponent(sectionHtml, scopedCSS, componentName, date);
  const componentPath = join(componentsDir, `${componentName}.astro`);

  // Nav/Footer overwrite protection (checked in both real and dry-run modes)
  if ((componentName === 'Nav' || componentName === 'Footer') && existsSync(componentPath)) {
    const coreTemplatePath = join(ROOT, '_core', 'src', 'components', `${componentName}.astro`);
    const existingContent  = readFileSync(componentPath, 'utf-8');
    const coreContent      = existsSync(coreTemplatePath) ? readFileSync(coreTemplatePath, 'utf-8') : null;
    if (coreContent && existingContent !== coreContent) {
      warn(`${componentName}.astro has been customized — skipping overwrite. Review artifact ${componentName} manually.`);
      componentNames.push(componentName);
      continue;
    }
  }

  if (!DRY_RUN) {
    writeFileSync(componentPath, component, 'utf-8');
    ok(`wrote component: ${componentName}.astro`);
  } else {
    dry(`would write ${componentName}.astro`);
  }
  componentNames.push(componentName);
}

// ── Write index.astro (full mode only) ───────────────────────────────────────
if (modeArg === 'full') {
  const wiring   = readJSON(join(siteDir, 'wiring.json')) ?? {};
  const siteName = wiring.name || slug;

  const importBlock = `import Layout from '../layouts/Layout.astro';\n`
    + componentNames.map(n => `import ${n} from '../components/${n}.astro';`).join('\n');

  const componentSlots = componentNames.map(n => `  <${n} />`).join('\n');

  const indexContent = `---\n${importBlock}\n\nconst b = import.meta.env.BASE_URL.replace(/\\/$/, '');\n---\n\n<Layout title="${siteName}">\n${componentSlots}\n</Layout>\n`;

  const indexPath     = join(siteDir, 'src', 'pages', 'index.astro');
  const coreIndexPath = join(ROOT, '_core', 'src', 'pages', 'index.astro');

  if (existsSync(indexPath)) {
    const existingContent = readFileSync(indexPath, 'utf-8');
    const coreContent = existsSync(coreIndexPath) ? readFileSync(coreIndexPath, 'utf-8') : null;
    if (coreContent && existingContent !== coreContent) {
      warn('index.astro has been customized — skipping overwrite. Review artifact sections and merge manually.');
      // components are already written; skip only the page write
    } else if (!DRY_RUN) {
      writeFileSync(indexPath, indexContent, 'utf-8');
      ok('wrote index.astro');
    } else {
      dry('would write index.astro');
    }
  } else if (!DRY_RUN) {
    writeFileSync(indexPath, indexContent, 'utf-8');
    ok('wrote index.astro');
  } else {
    dry('would write index.astro');
  }
}

// ── Google Fonts CDN links — inject into Layout.astro <head> ──────────────────
const googleFontsLinks = extractGoogleFontsLinks(htmlString);
const layoutPath = join(siteDir, 'src', 'layouts', 'Layout.astro');
if (googleFontsLinks.length > 0) {
  if (!existsSync(layoutPath)) {
    warn(`Layout.astro not found at ${layoutPath} — Google Fonts links not injected. Add manually.`);
    for (const href of googleFontsLinks) log(`  <link rel="stylesheet" href="${href}">`);
  } else {
    const layoutSrc = readFileSync(layoutPath, 'utf-8');
    if (layoutSrc.includes('fonts.googleapis.com')) {
      ok('Google Fonts links already in Layout.astro — skipped');
    } else {
      const linkTags = googleFontsLinks
        .map(href => `  <link rel="stylesheet" href="${href}">`)
        .join('\n');
      const updated = layoutSrc.replace('</head>', `${linkTags}\n</head>`);
      if (updated === layoutSrc) {
        warn('Layout.astro: </head> not found — Google Fonts links not injected. Add manually.');
        for (const href of googleFontsLinks) log(`  <link rel="stylesheet" href="${href}">`);
      } else if (!DRY_RUN) {
        writeFileSync(join(siteDir, 'src', 'layouts', 'Layout.astro'), updated, 'utf-8');
        ok(`injected ${googleFontsLinks.length} Google Fonts link(s) into Layout.astro`);
      } else {
        dry(`would inject ${googleFontsLinks.length} Google Fonts link(s) into Layout.astro`);
      }
    }
  }
} else {
  info('No Google Fonts CDN links found in artifact.');
}

// ── INGEST-07: Brand token candidates (informational only — not written to wiring.json) ──
const layoutContent = existsSync(layoutPath) ? readFileSync(layoutPath, 'utf-8') : '';
const existingVars  = extractCSSVars(layoutContent);

log('\nBrand token candidates from artifact:');
for (const [name, val] of artifactVars.entries()) {
  const existing = existingVars.get(name);
  if (existing) {
    if (existing !== val) {
      log(`  ${name}: ${val}  (currently: ${existing} — CONFLICT, keep existing?)`);
    } else {
      log(`  ${name}: ${val}  (same as existing)`);
    }
  } else {
    log(`  ${name}: ${val}  (new)`);
  }
}
log('These are informational only — update Layout.astro :root {} manually to adopt any token values.');

// ── Build verification (skipped in dry-run via run() guard) ──────────────────
log('\n── Build verification');
run(`node _scripts/build-all.js ${slug}`, ROOT);
if (!DRY_RUN) ok('Build passed');

// ── Done banner ───────────────────────────────────────────────────────────────
log(`
${'═'.repeat(52)}
 ✅  sites/${slug} ingest complete.
${'═'.repeat(52)}

Components written to: sites/${slug}/src/components/
Next steps:
  cd sites/${slug} && npm run dev     ← preview locally
  /wm-wire                            ← update brand tokens
  /wm-publish ${slug}                  ← push to production
`);
