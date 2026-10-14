// Open Drops core (Phase 11): pure id, frontmatter, status, horizon, secret-scan,
// tombstone and listing logic. Node built-ins only, no npm dependency.
//
// Confidentiality rule: nothing in this file prints. Messages returned in errors and
// warnings use shortId (4 chars) only, never a full id, title or label.

import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const ID_RE = /^[0-9a-f]{32}$/;
export const MAX_DAYS = 90;
export const SOON_DAYS = 7;
export const DEFAULT_DAYS = 30;

const DAY_MS = 86400000;
const ALLOWED_KEYS = ['id', 'title', 'label', 'created', 'expires', 'attachments', 'withdrawn'];
const KEY_ORDER = ALLOWED_KEYS;
const ISO_OFFSET_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/;
const ATTACH_RE = /^[A-Za-z0-9._-]+\.pdf$/;
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;

/** 32 lowercase hex chars from crypto.randomBytes(16) (D-08). */
export function newId() {
  return randomBytes(16).toString('hex');
}

/** First n chars of an id, safe to show in messages. */
export function shortId(id, n = 4) {
  return String(id ?? '').slice(0, n);
}

/** Local-offset ISO 8601, e.g. 2026-10-14T10:00:00+02:00. */
export function isoWithOffset(date = new Date()) {
  const p = (n, w = 2) => String(n).padStart(w, '0');
  const off = -date.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  const a = Math.abs(off);
  return (
    `${p(date.getFullYear(), 4)}-${p(date.getMonth() + 1)}-${p(date.getDate())}` +
    `T${p(date.getHours())}:${p(date.getMinutes())}:${p(date.getSeconds())}` +
    `${sign}${p(Math.floor(a / 60))}:${p(a % 60)}`
  );
}

function unquote(v) {
  if (v.length >= 2 && (v[0] === '"' || v[0] === "'") && v[v.length - 1] === v[0]) {
    return { value: v.slice(1, -1), quoted: true };
  }
  return { value: v, quoted: false };
}

/**
 * Restricted frontmatter parser: `key: value` scalars and inline lists `[a.pdf, b.pdf]`.
 * Throws on anything else, naming the line number but never the value.
 */
export function parseDrop(text) {
  const src = String(text).replace(/\r\n/g, '\n');
  if (!src.startsWith('---\n')) throw new Error('frontmatter: missing opening --- on line 1');
  const lines = src.split('\n');
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      end = i;
      break;
    }
  }
  if (end < 0) throw new Error('frontmatter: missing closing ---');
  const fm = {};
  for (let i = 1; i < end; i++) {
    const line = lines[i];
    if (line.trim() === '') continue;
    const m = /^([A-Za-z_][A-Za-z0-9_]*):(.*)$/.exec(line);
    if (!m) throw new Error(`frontmatter: unparsable line ${i + 1}`);
    const key = m[1];
    const raw = m[2].trim();
    if (Object.prototype.hasOwnProperty.call(fm, key)) {
      throw new Error(`frontmatter: duplicate key on line ${i + 1}`);
    }
    if (raw.startsWith('[')) {
      if (!raw.endsWith(']')) throw new Error(`frontmatter: unterminated list on line ${i + 1}`);
      const inner = raw.slice(1, -1).trim();
      fm[key] = inner === '' ? [] : inner.split(',').map((s) => unquote(s.trim()).value);
    } else {
      const { value, quoted } = unquote(raw);
      if (!quoted && value === 'true') fm[key] = true;
      else if (!quoted && value === 'false') fm[key] = false;
      else fm[key] = value;
    }
  }
  const body = lines.slice(end + 1).join('\n').replace(/^\n/, '');
  return { fm, body };
}

function fmtScalar(v) {
  if (typeof v === 'boolean') return String(v);
  const s = String(v);
  if (/[\r\n]/.test(s)) throw new Error('frontmatter: value contains a newline');
  if (s !== s.trim() || /^[[\]"']/.test(s) || s === 'true' || s === 'false' || s === '') {
    if (s.includes('"')) throw new Error('frontmatter: value cannot be quoted safely');
    return `"${s}"`;
  }
  return s;
}

export function formatDrop(fm, body = '') {
  const out = ['---'];
  for (const k of KEY_ORDER) {
    if (!(k in fm) || fm[k] === undefined || fm[k] === null) continue;
    const v = fm[k];
    if (Array.isArray(v)) out.push(`${k}: [${v.join(', ')}]`);
    else out.push(`${k}: ${fmtScalar(v)}`);
  }
  out.push('---', '');
  return out.join('\n') + (body ? body.replace(/\n*$/, '\n') : '');
}

/** Validate parsed frontmatter. Messages use the 4-char id prefix only. */
export function validateDrop(fm, { folderId, files = [], now = Date.now() } = {}) {
  const errors = [];
  const warnings = [];
  const sid = shortId(folderId ?? fm?.id);
  const tag = `drop ${sid}`;
  if (!fm || typeof fm !== 'object') return { errors: [`${tag}: no frontmatter`], warnings };

  for (const k of Object.keys(fm)) {
    if (!ALLOWED_KEYS.includes(k)) errors.push(`${tag}: unknown key "${k.slice(0, 24)}"`);
  }
  if (typeof fm.id !== 'string' || !ID_RE.test(fm.id)) errors.push(`${tag}: id is not 32 lowercase hex`);
  else if (folderId !== undefined && fm.id !== folderId) errors.push(`${tag}: id does not equal its folder name`);

  if (fm.title === undefined || fm.title === '') warnings.push(`${tag}: no title`);
  if (fm.label !== undefined) {
    const label = String(fm.label);
    if (/[0-9a-fA-F]{32}/.test(label) || (typeof fm.id === 'string' && fm.id && label.includes(fm.id))) {
      errors.push(`${tag}: label must not contain the id or a 32-hex run`);
    }
  }

  let createdMs = null;
  if (fm.created === undefined) warnings.push(`${tag}: no created date`);
  else if (typeof fm.created !== 'string' || !ISO_OFFSET_RE.test(fm.created) || Number.isNaN(Date.parse(fm.created))) {
    errors.push(`${tag}: created must be ISO 8601 with offset`);
  } else createdMs = Date.parse(fm.created);

  if (fm.expires === undefined || fm.expires === '') {
    errors.push(`${tag}: expires is missing (expiry-less drops are invalid)`);
  } else if (typeof fm.expires !== 'string' || !ISO_OFFSET_RE.test(fm.expires) || Number.isNaN(Date.parse(fm.expires))) {
    errors.push(`${tag}: expires must be ISO 8601 with offset (no date-only, no missing offset)`);
  } else {
    const exp = Date.parse(fm.expires);
    if (createdMs !== null && exp <= createdMs) errors.push(`${tag}: expires must be after created`);
    if (exp - now > MAX_DAYS * DAY_MS) errors.push(`${tag}: expires is more than ${MAX_DAYS} days out (horizon)`);
  }

  if (fm.attachments !== undefined) {
    if (!Array.isArray(fm.attachments)) errors.push(`${tag}: attachments must be a list`);
    else {
      for (const a of fm.attachments) {
        if (typeof a !== 'string' || !ATTACH_RE.test(a)) errors.push(`${tag}: attachment name not allowed`);
        else if (!files.includes(a)) errors.push(`${tag}: attachment missing on disk`);
      }
    }
  }
  if (fm.withdrawn !== undefined && typeof fm.withdrawn !== 'boolean') {
    errors.push(`${tag}: withdrawn must be true or false`);
  }
  return { errors, warnings };
}

/** active | soon | expired | invalid | withdrawn, compared in UTC epoch. */
export function statusOf(fm, now = Date.now(), tombstones = new Set()) {
  if (fm && (fm.withdrawn === true || (typeof fm.id === 'string' && tombstones.has(fm.id)))) return 'withdrawn';
  if (!fm || typeof fm.expires !== 'string' || !ISO_OFFSET_RE.test(fm.expires)) return 'invalid';
  const exp = Date.parse(fm.expires);
  if (Number.isNaN(exp)) return 'invalid';
  if (exp <= now) return 'expired';
  if (exp - now > MAX_DAYS * DAY_MS) return 'invalid';
  if (exp - now <= SOON_DAYS * DAY_MS) return 'soon';
  return 'active';
}

const SECRET_PATTERNS = [
  ['pem-private-key', /-----BEGIN [A-Z ]*PRIVATE KEY-----/],
  ['aws-access-key', /\bAKIA[0-9A-Z]{16}\b/],
  ['github-token', /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})/],
  ['slack-token', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['bearer-token', /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/],
  ['password-assignment', /\bpassword\s*[:=]\s*\S+/i],
  ['api-key-assignment', /\bapi[_-]?key\s*[:=]\s*\S+/i],
];

/** Returns pattern NAMES only, never matched text. */
export function scanSecrets(text) {
  const s = String(text ?? '');
  return SECRET_PATTERNS.filter(([, re]) => re.test(s)).map(([name]) => name);
}

/** Tombstone ids from withdrawn.json text. Corrupt content throws (fail closed). */
export function readTombstones(jsonText) {
  if (jsonText === null || jsonText === undefined || String(jsonText).trim() === '') return new Set();
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new Error('withdrawn.json is not valid JSON');
  }
  if (!Array.isArray(data)) throw new Error('withdrawn.json must be a JSON array');
  const ids = new Set();
  for (const e of data) {
    if (e && typeof e.id === 'string' && ID_RE.test(e.id)) ids.add(e.id);
  }
  return ids;
}

export function addTombstone(jsonText, id, reason, atIso) {
  if (!ID_RE.test(String(id))) throw new Error('addTombstone: invalid id');
  let data = [];
  if (jsonText !== null && jsonText !== undefined && String(jsonText).trim() !== '') {
    try {
      data = JSON.parse(jsonText);
    } catch {
      throw new Error('withdrawn.json is not valid JSON');
    }
    if (!Array.isArray(data)) throw new Error('withdrawn.json must be a JSON array');
  }
  if (!data.some((e) => e && e.id === id)) data.push({ id, at: atIso, reason });
  return JSON.stringify(data, null, 2) + '\n';
}

function within(parent, child) {
  const rel = path.relative(parent, child);
  return rel !== '' && !rel.startsWith('..') && !path.isAbsolute(rel);
}

/**
 * Reads <dropsDir>/<slug>/<id>/drop.md for every drop. Never throws on one bad drop:
 * it is reported with status invalid and errors.
 */
export function listDrops(dropsDir, slug, now = Date.now()) {
  if (!SLUG_RE.test(String(slug))) throw new Error('listDrops: invalid slug');
  const slugDir = path.resolve(dropsDir, slug);
  if (!fs.existsSync(slugDir) || !fs.statSync(slugDir).isDirectory()) return [];
  const realSlug = fs.realpathSync(slugDir);
  const tombPath = path.join(slugDir, 'withdrawn.json');
  const tombstones = fs.existsSync(tombPath) ? readTombstones(fs.readFileSync(tombPath, 'utf8')) : new Set();

  const out = [];
  for (const name of fs.readdirSync(slugDir).sort()) {
    const dir = path.join(slugDir, name);
    const lst = fs.lstatSync(dir);
    if (!lst.isDirectory() && !lst.isSymbolicLink()) continue;
    const entry = { id: name, fm: null, body: '', status: 'invalid', errors: [], warnings: [], dir };
    out.push(entry);
    const tag = `drop ${shortId(name)}`;
    if (lst.isSymbolicLink()) {
      entry.errors.push(`${tag}: symlinked drop folder not allowed`);
      continue;
    }
    let real;
    try {
      real = fs.realpathSync(dir);
    } catch {
      entry.errors.push(`${tag}: folder unreadable`);
      continue;
    }
    if (!within(realSlug, real)) {
      entry.errors.push(`${tag}: folder escapes the slug directory`);
      continue;
    }
    if (!ID_RE.test(name)) {
      entry.errors.push(`${tag}: folder name is not 32 lowercase hex`);
      continue;
    }
    const mdPath = path.join(dir, 'drop.md');
    let text;
    try {
      const mdLst = fs.lstatSync(mdPath);
      if (mdLst.isSymbolicLink() || !within(realSlug, fs.realpathSync(mdPath))) {
        entry.errors.push(`${tag}: drop.md escapes the drop folder`);
        continue;
      }
      text = fs.readFileSync(mdPath, 'utf8');
    } catch {
      entry.errors.push(`${tag}: drop.md missing`);
      continue;
    }
    let parsed;
    try {
      parsed = parseDrop(text);
    } catch (e) {
      entry.errors.push(`${tag}: ${e.message}`);
      continue;
    }
    entry.fm = parsed.fm;
    entry.body = parsed.body;
    const files = fs.readdirSync(dir);
    const v = validateDrop(parsed.fm, { folderId: name, files, now });
    entry.errors = v.errors;
    entry.warnings = v.warnings;
    let status = statusOf(parsed.fm, now, tombstones);
    // The folder name is authoritative for tombstones even if fm.id is wrong.
    if (tombstones.has(name)) status = 'withdrawn';
    if ((status === 'active' || status === 'soon') && v.errors.length) status = 'invalid';
    entry.status = status;
  }
  return out;
}
