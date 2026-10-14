#!/usr/bin/env node
/**
 * drop.mjs: operator CLI for Open Drops (Phase 11).
 *
 *   node _scripts/drop.mjs new --site <slug> --title T [--label L] --body-file b.md
 *        [--days N | --expires ISO] [--pdf a.pdf ...]
 *   node _scripts/drop.mjs list [--site <slug>] [--json]
 *   node _scripts/drop.mjs withdraw <id-prefix> [--site <slug>] [--confirm]
 *   node _scripts/drop.mjs expire [--site <slug>] [--confirm]
 *   node _scripts/drop.mjs check <slug> [--ci] [--json] [--live] [--strict] [--emit-masks]
 *
 * Destructive commands are dry-run unless --confirm is given. The CLI only writes inside
 * DROPS_DIR (default for the CLI only: <repo>/_drops). It never commits or pushes.
 * In CI (--ci or GITHUB_ACTIONS=true) output carries counts and 4-char id prefixes only.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  ID_RE, MAX_DAYS, DEFAULT_DAYS, newId, shortId, isoWithOffset, formatDrop, validateDrop,
  scanSecrets, readTombstones, addTombstone, listDrops, statusOf,
} from './lib/drops-core.mjs';
import { requireQpdf, stripPdf, verifyPdf } from './lib/pdf-strip.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DAY = 86400000;
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const UNLIST = 'Withdrawal is unlisting only: git history, CDN and web archives may retain copies.';

const VALUE_FLAGS = new Set(['site', 'title', 'label', 'body-file', 'days', 'expires', 'pdf']);
const BOOL_FLAGS = new Set(['confirm', 'ci', 'json', 'live', 'strict', 'emit-masks']);

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function parseArgs(argv) {
  const pos = [];
  const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (BOOL_FLAGS.has(k)) flags[k] = true;
      else if (VALUE_FLAGS.has(k)) {
        const v = argv[++i];
        if (v === undefined) die(`Missing value for --${k}`);
        if (k === 'pdf') (flags.pdf ||= []).push(v);
        else flags[k] = v;
      } else die(`Unknown flag --${k}`);
    } else pos.push(a);
  }
  return { pos, flags };
}

const inActions = process.env.GITHUB_ACTIONS === 'true';
let CI = inActions;

function dropsDir() {
  const d = process.env.DROPS_DIR;
  return path.resolve(d && d.trim() !== '' ? d : path.join(ROOT, '_drops'));
}

function wiringOf(slug) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, 'sites', slug, 'wiring.json'), 'utf8'));
  } catch {
    return null;
  }
}

function requireSite(slug) {
  if (!SLUG_RE.test(String(slug))) die('Invalid --site (expected lowercase letters, digits, hyphens)');
  const w = wiringOf(slug);
  if (!w || w.drops?.enabled !== true) die(`Site "${slug}" does not have drops.enabled in wiring.json`);
  return w;
}

function sitesFor(site) {
  if (site) {
    requireSite(site);
    return [site];
  }
  const out = [];
  for (const n of fs.readdirSync(path.join(ROOT, 'sites'))) {
    if (SLUG_RE.test(n) && wiringOf(n)?.drops?.enabled === true) out.push(n);
  }
  return out;
}

/** Id for display: 4 chars in CI, 8 otherwise. Never a full id. */
const idOut = (id) => shortId(id, CI ? 4 : 8);

function readTomb(slugDir) {
  const p = path.join(slugDir, 'withdrawn.json');
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function nextSteps(slug) {
  console.log('\nNext steps:');
  console.log('  1. Review, commit and push the private drops repo (this CLI never does that).');
  console.log(`  2. Run /wm-publish ${slug}.`);
  console.log('  3. After publishing, confirm the removed URL answers HTTP 404 (CDN cache up to 10 minutes).');
  console.log(UNLIST);
}

// ---------------------------------------------------------------- new
function cmdNew(flags) {
  const slug = flags.site;
  if (!slug) die('new: --site is required');
  requireSite(slug);
  if (!flags.title || String(flags.title).trim() === '') die('new: --title is required');
  if (!flags['body-file']) die('new: --body-file is required');
  if (flags.days !== undefined && flags.expires !== undefined) die('new: use either --days or --expires, not both');
  if (inActions) die('new: not available in CI');

  let body;
  try {
    body = fs.readFileSync(path.resolve(flags['body-file']), 'utf8');
  } catch {
    die('new: body file not readable');
  }

  const now = Date.now();
  let expires;
  if (flags.expires !== undefined) expires = String(flags.expires);
  else {
    const days = flags.days === undefined ? DEFAULT_DAYS : Number(flags.days);
    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) die(`new: --days must be an integer from 1 to ${MAX_DAYS}`);
    expires = isoWithOffset(new Date(now + days * DAY));
  }

  // PDFs: tool check and name validation BEFORE anything is written.
  const pdfs = flags.pdf || [];
  const attachments = [];
  if (pdfs.length) {
    try {
      requireQpdf();
    } catch (e) {
      die(e.message);
    }
    for (const p of pdfs) {
      if (!fs.existsSync(p) || !fs.statSync(p).isFile()) die('new: a --pdf file does not exist');
      let name = path.basename(p).replace(/[^A-Za-z0-9._-]/g, '-');
      name = name.replace(/\.pdf$/i, '.pdf');
      if (!/^[A-Za-z0-9._-]+\.pdf$/.test(name)) die('new: PDF file name must end in .pdf');
      if (attachments.includes(name)) die('new: duplicate PDF file name');
      attachments.push(name);
    }
  }

  const id = newId();
  const fm = {
    id,
    title: String(flags.title),
    ...(flags.label ? { label: String(flags.label) } : {}),
    created: isoWithOffset(new Date(now)),
    expires,
    ...(attachments.length ? { attachments } : {}),
  };
  const v = validateDrop(fm, { folderId: id, files: attachments, now });
  if (v.errors.length) die('new: invalid drop\n' + v.errors.map((e) => '  ' + e).join('\n'));
  for (const w of v.warnings) console.log(`WARN ${w}`);
  let text;
  try {
    text = formatDrop(fm, body);
  } catch (e) {
    die(`new: ${e.message}`);
  }
  const hits = scanSecrets(body);
  if (hits.length) console.log(`WARN body looks like it contains secrets (${hits.join(', ')}); review before publishing`);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drop-new-'));
  try {
    pdfs.forEach((p, i) => {
      const out = path.join(tmp, attachments[i]);
      try {
        stripPdf(p, out);
        verifyPdf(out);
      } catch (e) {
        die(e.message);
      }
    });
    const dir = path.join(dropsDir(), slug, id);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'drop.md'), text);
    for (const a of attachments) fs.copyFileSync(path.join(tmp, a), path.join(dir, a));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log(`Created drop ${shortId(id, 8)} for ${slug} (expires ${expires})`);
  console.log(`Local URL path: /d/${id}/`); // local-only
  console.log('Next: commit and push the private drops repo, then /wm-publish ' + slug);
}

// ---------------------------------------------------------------- list
function cmdList(flags) {
  const now = Date.now();
  const rows = [];
  for (const slug of sitesFor(flags.site)) {
    for (const e of listDrops(dropsDir(), slug, now)) {
      rows.push({
        site: slug,
        id: CI ? shortId(e.id, 4) : e.id,
        short: idOut(e.id),
        label: CI ? undefined : e.fm?.label ?? '',
        expires: CI ? undefined : e.fm?.expires ?? '',
        status: e.status,
      });
    }
  }
  if (flags.json) {
    console.log(JSON.stringify(rows.map((r) => ({ ...r, short: undefined })), null, 2));
    return;
  }
  for (const r of rows) {
    console.log(CI ? `${r.site}  ${r.short}  ${r.status}` : `${r.site}  ${r.short}  ${r.label || '-'}  ${r.expires || '-'}  ${r.status}`);
  }
  if (!rows.length) console.log('No drops.');
}

// ---------------------------------------------------------------- withdraw / expire
function removeDrop(slug, slugDir, id, reason) {
  const target = path.resolve(slugDir, id);
  const rel = path.relative(slugDir, target);
  if (!ID_RE.test(id) || rel === '' || rel.startsWith('..') || path.isAbsolute(rel)) die('Refusing to touch a path outside the site drops folder');
  if (fs.lstatSync(target).isSymbolicLink()) die(`Refusing to remove symlinked drop ${shortId(id)}`);
  const tomb = addTombstone(readTomb(slugDir), id, reason, isoWithOffset());
  fs.rmSync(target, { recursive: true, force: true });
  fs.writeFileSync(path.join(slugDir, 'withdrawn.json'), tomb);
}

function cmdWithdraw(pos, flags) {
  const prefix = (pos[0] || '').toLowerCase();
  if (!/^[0-9a-f]{8,32}$/.test(prefix)) die('withdraw: give an id prefix of at least 8 hex characters');
  const matches = [];
  for (const slug of sitesFor(flags.site)) {
    for (const e of listDrops(dropsDir(), slug)) {
      if (ID_RE.test(e.id) && e.id.startsWith(prefix)) matches.push({ slug, e });
    }
  }
  if (matches.length === 0) die('withdraw: no drop matches that prefix');
  if (matches.length > 1) die(`withdraw: prefix is ambiguous (${matches.length} drops match); give more characters`);
  const { slug, e } = matches[0];
  if (!flags.confirm) {
    console.log(`DRY RUN: would remove drop ${idOut(e.id)} (${slug}) and add a tombstone. Re-run with --confirm.`);
    return;
  }
  removeDrop(slug, path.resolve(dropsDir(), slug), e.id, 'withdrawn');
  console.log(`Withdrawn drop ${idOut(e.id)} (${slug}); tombstone written.`);
  nextSteps(slug);
}

function cmdExpire(flags) {
  let total = 0;
  const slugsTouched = new Set();
  for (const slug of sitesFor(flags.site)) {
    const slugDir = path.resolve(dropsDir(), slug);
    for (const e of listDrops(dropsDir(), slug)) {
      if (e.status !== 'expired') continue;
      total++;
      if (!flags.confirm) console.log(`DRY RUN: would remove expired drop ${idOut(e.id)} (${slug})`);
      else {
        removeDrop(slug, slugDir, e.id, 'expired');
        slugsTouched.add(slug);
        console.log(`Removed expired drop ${idOut(e.id)} (${slug})`);
      }
    }
  }
  if (!total) console.log('No expired drops.');
  else if (!flags.confirm) console.log(`DRY RUN: ${total} expired drop(s). Re-run with --confirm.`);
  else for (const s of slugsTouched) nextSteps(s);
}

// ---------------------------------------------------------------- check
function git(args) {
  const r = spawnSync('git', args, { encoding: 'utf8' });
  return r.error || r.status !== 0 ? null : r.stdout;
}

async function liveListing(prodRepo, strict) {
  // returns { ids:Set|null, warn?:string, fail?:string }
  if (process.env.DROPS_LIVE_LIST_FILE) {
    let arr;
    try {
      arr = JSON.parse(fs.readFileSync(process.env.DROPS_LIVE_LIST_FILE, 'utf8'));
    } catch {
      return { ids: null, fail: 'live listing override file is not valid JSON' };
    }
    if (!Array.isArray(arr)) return { ids: null, fail: 'live listing override must be a JSON array' };
    return { ids: new Set(arr.filter((n) => typeof n === 'string' && ID_RE.test(n))) };
  }
  const override = process.env.DROPS_LIVE_STATUS;
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  const url = `https://api.github.com/repos/${prodRepo}/contents/d?ref=gh-pages`;
  let status = 0;
  let json = null;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (override) status = Number(override);
    else {
      try {
        const res = await fetch(url, {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'websitemocker-drop-cli',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        status = res.status;
        if (status === 200) json = await res.json();
      } catch {
        return { ids: null, fail: 'live listing request failed (network)' };
      }
    }
    if ((status === 403 || status === 429) && !override && attempt < 3) {
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
      continue;
    }
    break;
  }
  if (status === 404) return { ids: new Set() };
  if (status === 403 || status === 429) {
    return strict
      ? { ids: null, fail: `live comparison failed: HTTP ${status} after retries` }
      : { ids: null, warn: `live comparison skipped: HTTP ${status}` };
  }
  if (status !== 200 || !Array.isArray(json)) return { ids: null, fail: `live listing failed: HTTP ${status}` };
  return { ids: new Set(json.filter((x) => x && x.type === 'dir' && ID_RE.test(String(x.name))).map((x) => x.name)) };
}

async function cmdCheck(pos, flags) {
  const slug = pos[0];
  if (!slug) die('check: <slug> is required');
  const wiring = requireSite(slug);
  if (flags.ci) CI = true;
  if (flags['emit-masks'] && !inActions) die('check: --emit-masks works only when GITHUB_ACTIONS=true');
  const dir = dropsDir();
  const now = Date.now();
  const fails = [];
  const warns = [];
  const drops = listDrops(dir, slug, now);
  const counts = { active: 0, soon: 0, expired: 0, withdrawn: 0, invalid: 0 };
  for (const d of drops) counts[d.status] = (counts[d.status] || 0) + 1;

  for (const d of drops) {
    if (d.status === 'invalid') {
      if (d.errors.length) fails.push(...d.errors);
      else fails.push(`drop ${shortId(d.id)}: invalid`);
    } else if (d.status !== 'withdrawn') {
      for (const e of d.errors) warns.push(e);
    }
    if (d.status === 'expired') warns.push(`drop ${shortId(d.id)}: expired in source; run drop.mjs expire`);
    if (d.status === 'soon') warns.push(`drop ${shortId(d.id)}: expires within 7 days`);
    if (d.status !== 'withdrawn') {
      const hits = scanSecrets(d.body);
      if (hits.length) warns.push(`drop ${shortId(d.id)}: body looks like it contains secrets (${hits.join(', ')})`);
    }
  }

  // PDFs: qpdf must exist when any publishable drop carries attachments.
  const live = drops.filter((d) => d.status === 'active' || d.status === 'soon');
  const withPdf = live.filter((d) => Array.isArray(d.fm?.attachments) && d.fm.attachments.length);
  if (withPdf.length) {
    try {
      requireQpdf();
      for (const d of withPdf) {
        for (const a of d.fm.attachments) {
          const f = path.join(d.dir, a);
          if (!fs.existsSync(f)) continue;
          try {
            verifyPdf(f);
          } catch (e) {
            fails.push(`drop ${shortId(d.id)}: ${e.message.replace(/ in .*$/, '')}`);
          }
        }
      }
    } catch (e) {
      fails.push(e.message);
    }
  }

  // Local clone state (operator machines only).
  if (!CI && fs.existsSync(path.join(dir, '.git'))) {
    const st = git(['-C', dir, 'status', '--porcelain']);
    if (st === null) warns.push('could not read git status of the local drops clone');
    else if (st.trim() !== '') warns.push('local drops clone has uncommitted changes; commit and push before publishing');
    const ahead = git(['-C', dir, 'rev-list', '--count', '@{u}..HEAD']);
    if (ahead === null) warns.push('could not determine whether the local drops clone is pushed');
    else if (Number(ahead.trim()) > 0) warns.push('local drops clone has unpushed commits; push before publishing');
  }

  // Live comparison.
  let liveInfo = null;
  if (flags.live) {
    const prodRepo = wiring.prod_repo;
    if (!prodRepo && !process.env.DROPS_LIVE_LIST_FILE) fails.push('--live needs prod_repo in wiring.json');
    else {
      const r = await liveListing(prodRepo, !!flags.strict);
      if (r.fail) fails.push(r.fail);
      else if (r.warn) warns.push(r.warn);
      else if (r.ids) {
        const publishable = new Set(live.map((d) => d.id));
        const goLive = [...publishable].filter((i) => !r.ids.has(i));
        const disappear = [...r.ids].filter((i) => !publishable.has(i));
        liveInfo = { goLive: goLive.length, disappear: disappear.length };
        if (flags.strict) {
          const byId = new Map(drops.map((d) => [d.id, d]));
          for (const i of disappear) {
            const d = byId.get(i);
            const why = !d ? 'missing from source' : d.status === 'withdrawn' ? 'withdrawn but still live' : d.status === 'expired' ? 'expired but still live' : 'not publishable but live';
            fails.push(`drop ${shortId(i)}: ${why}`);
          }
        }
      }
    }
  }

  const failed = fails.length > 0;
  if (flags.json) {
    console.log(JSON.stringify({
      slug, counts, publish: live.map((d) => (CI ? shortId(d.id, 4) : d.id)),
      warnings: warns, errors: fails, live: liveInfo, ok: !failed,
    }, null, 2));
  } else {
    console.log(`drops ${slug}: ${counts.active} active, ${counts.soon} soon, ${counts.expired} expired, ${counts.withdrawn} withdrawn, ${counts.invalid} invalid`);
    console.log(`Drops about to be published: ${live.length}`);
    for (const d of live) {
      console.log(CI ? `  ${shortId(d.id, 4)}` : `  ${idOut(d.id)}  ${d.fm.label || '-'}  expires ${d.fm.expires}  ${d.status}`);
    }
    if (liveInfo) console.log(`will go live ${liveInfo.goLive}\nwill disappear ${liveInfo.disappear}`);
    for (const w of warns) console.log(`WARN ${w}`);
    for (const f of fails) console.log(`FAIL ${f}`);
    console.log(failed ? `check: FAIL (${fails.length})` : 'check: PASS');
  }
  if (flags['emit-masks']) for (const d of live) console.log(`::add-mask::${d.id}`);
  process.exit(failed ? 1 : 0);
}

// ---------------------------------------------------------------- main
async function main() {
  const [cmd, ...rest] = process.argv.slice(2);
  const { pos, flags } = parseArgs(rest);
  if (flags.ci) CI = true;
  switch (cmd) {
    case 'new': return cmdNew(flags);
    case 'list': return cmdList(flags);
    case 'withdraw': return cmdWithdraw(pos, flags);
    case 'expire': return cmdExpire(flags);
    case 'check': return cmdCheck(pos, flags);
    default:
      die('Usage: node _scripts/drop.mjs <new|list|withdraw|expire|check> [options]', cmd ? 1 : 2);
  }
}

main().catch((e) => die(`drop: ${e.message}`));
