// qpdf wrapper for DROP-05: rebuild a PDF, scrub metadata channels, verify the result.
// All calls use spawnSync with argument arrays (never a shell). No npm PDF library.
// Messages never include file content; file names are reduced to the basename.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const MIN_MAJOR = 11;
const SCRUB_KEYS = ['/PieceInfo', '/Metadata', '/Info', '/AF', '/EmbeddedFiles'];
const DENY = [
  '/Info', '/Metadata', '/PieceInfo', '/EmbeddedFiles', '/AF', '/JavaScript', '/JS',
  '/OpenAction', '/Producer', '/Creator', '/Author', '/XMP', 'x:xmpmeta',
];
const BIG = 1024 * 1024 * 1024;

function qpdf(args) {
  return spawnSync('qpdf', args, { encoding: 'latin1', maxBuffer: BIG });
}

export function requireQpdf() {
  const r = qpdf(['--version']);
  const m = !r.error && r.status === 0 ? /qpdf version (\d+)\./.exec(r.stdout || '') : null;
  if (r.error || !m) {
    throw new Error('[drops] DROP-05: qpdf not found (brew install qpdf / apt install qpdf)');
  }
  if (Number(m[1]) < MIN_MAJOR) {
    throw new Error(`[drops] DROP-05: qpdf ${m[1]} is too old, version ${MIN_MAJOR} or newer is required`);
  }
}

function scrub(node) {
  if (Array.isArray(node)) {
    for (const v of node) scrub(v);
  } else if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) {
      if (SCRUB_KEYS.includes(k)) delete node[k];
      else scrub(node[k]);
    }
  }
}

function ok(r) {
  return !r.error && (r.status === 0 || r.status === 3);
}

export function stripPdf(src, dest) {
  requireQpdf();
  const s = path.resolve(src);
  const d = path.resolve(dest);
  const base = path.basename(s);
  if (qpdf(['--is-encrypted', s]).status === 0) {
    throw new Error(`[drops] DROP-05: ${base} is encrypted; remove the password protection first`);
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drops-pdf-'));
  try {
    const t1 = path.join(tmp, 'rebuilt.pdf');
    const tj = path.join(tmp, 'doc.json');
    // Step 1: copy only the pages into an empty document (drops catalog, Info, XMP, outlines).
    if (!ok(qpdf(['--empty', '--pages', s, '--', '--object-streams=disable', '--deterministic-id', t1]))) {
      throw new Error(`[drops] DROP-05: qpdf could not rebuild ${base}`);
    }
    // Step 2: full JSON round trip, scrubbing the deny keys from every object (never a partial update).
    if (!ok(qpdf(['--json-output', '--json-stream-data=none', t1, tj]))) {
      throw new Error(`[drops] DROP-05: qpdf could not serialise ${base}`);
    }
    const doc = JSON.parse(fs.readFileSync(tj, 'utf8'));
    scrub(doc);
    fs.writeFileSync(tj, JSON.stringify(doc));
    if (!ok(qpdf([`--update-from-json=${tj}`, t1, '--object-streams=disable', '--deterministic-id', d]))) {
      throw new Error(`[drops] DROP-05: qpdf could not apply the scrubbed update to ${base}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function firstHit(text, tokens) {
  return tokens.find((t) => text.includes(t));
}

/** Throws naming the first offending token (never file content). */
export function verifyPdf(file, { markers = [] } = {}) {
  requireQpdf();
  const f = path.resolve(file);
  const base = path.basename(f);
  const chk = qpdf(['--check', f]);
  if (chk.error || chk.status !== 0 || /WARNING/i.test((chk.stdout || '') + (chk.stderr || ''))) {
    throw new Error(`[drops] DROP-05: qpdf --check failed or warned for ${base}`);
  }
  const pages = qpdf(['--show-npages', f]);
  if (pages.error || pages.status !== 0 || Number(String(pages.stdout).trim()) < 1) {
    throw new Error(`[drops] DROP-05: ${base} has no pages`);
  }
  const tokens = [...DENY, ...markers];
  const raw = fs.readFileSync(f).toString('latin1');
  let hit = firstHit(raw, tokens);
  if (hit) throw new Error(`[drops] DROP-05: forbidden token ${hit} survives in ${base} (raw bytes)`);

  // Decoded views: object streams or compression could hide bytes from the raw search.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drops-pdf-'));
  try {
    const qdf = path.join(tmp, 'v.qdf');
    if (!ok(qpdf(['--qdf', '--object-streams=disable', f, qdf]))) {
      throw new Error(`[drops] DROP-05: could not decode ${base} for verification`);
    }
    hit = firstHit(fs.readFileSync(qdf).toString('latin1'), tokens);
    if (hit) throw new Error(`[drops] DROP-05: forbidden token ${hit} survives in ${base} (decoded)`);
    const js = qpdf(['--json=2', f]);
    if (js.error || js.status !== 0) throw new Error(`[drops] DROP-05: could not inspect ${base}`);
    hit = firstHit(js.stdout || '', tokens);
    if (hit) throw new Error(`[drops] DROP-05: forbidden token ${hit} survives in ${base} (json)`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
