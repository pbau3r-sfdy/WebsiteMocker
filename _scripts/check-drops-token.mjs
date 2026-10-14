#!/usr/bin/env node
/**
 * Drops token health check (D-06).
 *
 * Usage: GH_TOKEN=... node _scripts/check-drops-token.mjs
 * Exit:  0 ok, 1 failed check, 2 usage/config error (no token).
 *
 * Checks that the publish token is valid, is not about to expire (fails below 14 days,
 * warns when the token has no expiry), can read WebsiteMocker, every drops-enabled
 * stage-6 production repo and the drops repo, and that the drops repo is private.
 * The token is read only from env GH_TOKEN and is never printed. Output carries repo
 * names, HTTP status codes and the expiry date only.
 * Write scope cannot be verified without a write probe, which this check never makes.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const MIN_DAYS = 14;
const DAY = 86400000;

export function parseExpiry(header) {
  if (header == null || String(header).trim() === '') return { absent: true };
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2}) UTC$/.exec(String(header).trim());
  if (!m) return { invalid: true };
  const t = Date.parse(`${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}Z`);
  return Number.isNaN(t) ? { invalid: true } : { time: t };
}

/** Pure evaluation. Returns { ok, failures[], warnings[], daysLeft|null }. */
export function evaluate({ drops, others = [], expiryHeader, now = Date.now() }) {
  const failures = [];
  const warnings = [];
  let daysLeft = null;
  if (!drops || drops.status !== 200) failures.push(`pbau3r-sfdy/drops not readable (HTTP ${drops ? drops.status : 'none'})`);
  else if (drops.private !== true) failures.push('pbau3r-sfdy/drops is not private');
  for (const o of others) {
    if (o.status !== 200) failures.push(`${o.repo} not readable (HTTP ${o.status})`);
  }
  const e = parseExpiry(expiryHeader);
  if (e.absent) warnings.push('token has no expiry');
  else if (e.invalid) failures.push('token expiry header is unparsable');
  else {
    daysLeft = (e.time - now) / DAY;
    if (daysLeft < MIN_DAYS) failures.push(`token expires in ${daysLeft.toFixed(1)} days (minimum ${MIN_DAYS})`);
  }
  return { ok: failures.length === 0, failures, warnings, daysLeft };
}

async function api(url, token) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'websitemocker-drops-token-check',
      Authorization: `Bearer ${token}`,
    },
  });
  let json = null;
  if (res.status === 200) {
    try { json = await res.json(); } catch { json = null; }
  }
  return { status: res.status, json, expiry: res.headers.get('github-authentication-token-expiration') };
}

async function main() {
  const token = process.env.GH_TOKEN;
  if (!token) {
    console.error('check-drops-token: GH_TOKEN is not set');
    process.exit(2);
  }
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const prodRepos = [];
  for (const d of fs.readdirSync(path.join(root, 'sites'))) {
    try {
      const w = JSON.parse(fs.readFileSync(path.join(root, 'sites', d, 'wiring.json'), 'utf8'));
      if (w.drops && w.drops.enabled === true && w.stage === 6 && /^[\w.-]+\/[\w.-]+$/.test(w.prod_repo || '')) prodRepos.push(w.prod_repo);
    } catch { /* not a site */ }
  }
  const base = 'https://api.github.com/repos/';
  const dropsRes = await api(`${base}pbau3r-sfdy/drops`, token);
  const others = [];
  for (const repo of ['pbau3r-sfdy/WebsiteMocker', ...prodRepos]) {
    others.push({ repo, status: (await api(`${base}${repo}`, token)).status });
  }
  others.push({ repo: 'pbau3r-sfdy/drops (contents)', status: (await api(`${base}pbau3r-sfdy/drops/contents/`, token)).status });
  const r = evaluate({
    drops: { status: dropsRes.status, private: dropsRes.json && dropsRes.json.private },
    others,
    expiryHeader: dropsRes.expiry,
  });
  console.log(`checked ${others.length + 1} repos`);
  if (r.daysLeft != null) console.log(`token expiry: ${dropsRes.expiry} (${r.daysLeft.toFixed(1)} days left)`);
  for (const w of r.warnings) console.log(`::warning::${w}`);
  for (const f of r.failures) console.log(`FAIL ${f}`);
  console.log('write scope is not verifiable by this check');
  console.log(r.ok ? 'token check: PASS' : 'token check: FAIL');
  process.exit(r.ok ? 0 : 1);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) {
  main().catch(() => {
    console.error('check-drops-token: unexpected error');
    process.exit(1);
  });
}
