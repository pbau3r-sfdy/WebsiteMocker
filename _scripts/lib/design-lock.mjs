/**
 * design-lock.mjs: sites/<slug>/design.lock.json helpers (DSYNC-04, D-04).
 * The lock holds ids, hashes and byte counts only, never design content.
 * Library: takes `siteDir` as an argument and never computes a root itself.
 */
import { createHash } from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

/** sha256 hex. Text is LF-normalised first (CRLF, lone CR); binary (NUL byte) is hashed raw. */
export function hashContent(bufOrString) {
  const h = createHash('sha256');
  if (typeof bufOrString === 'string') {
    h.update(bufOrString.replace(/\r\n?/g, '\n'), 'utf8');
  } else if (bufOrString.includes(0)) {
    h.update(bufOrString);
  } else {
    h.update(bufOrString.toString('utf8').replace(/\r\n?/g, '\n'), 'utf8');
  }
  return h.digest('hex');
}

export function emptyLock(source) {
  return { version: 1, source, pulledAt: null, revision: null, files: {}, components: {}, tokens: null };
}

export function readLock(siteDir) {
  const p = join(siteDir, 'design.lock.json');
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, 'utf8'));
}

const sortKeys = (o) => Object.fromEntries(Object.keys(o ?? {}).sort().map((k) => [k, o[k]]));

export function writeLock(siteDir, lock) {
  const out = { ...lock, files: sortKeys(lock.files), components: sortKeys(lock.components) };
  writeFileSync(join(siteDir, 'design.lock.json'), JSON.stringify(out, null, 2) + '\n');
}

/** Compare two `files` maps on sha256. All result arrays are sorted. */
export function diffFiles(prevFiles = {}, nextFiles = {}) {
  const added = [], changed = [], removed = [], unchanged = [];
  for (const k of Object.keys(nextFiles)) {
    if (!(k in prevFiles)) added.push(k);
    else if (prevFiles[k].sha256 !== nextFiles[k].sha256) changed.push(k);
    else unchanged.push(k);
  }
  for (const k of Object.keys(prevFiles)) if (!(k in nextFiles)) removed.push(k);
  return { added: added.sort(), changed: changed.sort(), removed: removed.sort(), unchanged: unchanged.sort() };
}

/** @returns 'absent' | 'clean' | 'edited' | 'untracked' */
export function checkComponent(lock, name, currentContent) {
  if (currentContent === null || currentContent === undefined) return 'absent';
  const entry = lock?.components?.[name];
  if (!entry) return 'untracked';
  return entry.sha256 === hashContent(currentContent) ? 'clean' : 'edited';
}

export function recordComponent(lock, name, from, content) {
  lock.components = lock.components ?? {};
  lock.components[name] = { from, sha256: hashContent(content) };
  return lock;
}
