/**
 * design-block.mjs: validation of the optional `design` block in a site's
 * wiring.json (DSYNC-02). Absent block = no design connection.
 *
 * Shape (sites/<slug>/wiring.json -> "design"):
 *   source "design-system": { project_id: UUID, name?: string, globs?: string[] }
 *   source "artifact":      { url: https URL }   provenance only, never fetched (SD-04)
 *   source "local":         { path: string }     repo-relative or absolute, must exist
 *   any source, optional:   tokenMap: { "--from": "--to" | null }, allowHosts: string[]
 *
 * Library: takes `root` as an argument and never computes a root itself.
 */
import { existsSync, readFileSync } from 'fs';
import { isAbsolute, join, matchesGlob } from 'path';

export const DEFAULT_GLOBS = [
  'tokens/**', 'templates/website/**', 'ui_kits/website/**', 'components/**',
  'assets/logo/**', 'assets/logos/**', 'assets/brand/**', 'styles.css',
];

const SOURCES = ['design-system', 'artifact', 'local'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** D-02: true when the first normalised path segment is `uploads` (case-insensitive). */
export function isUploadsPath(relPath) {
  const segs = String(relPath).replace(/\\/g, '/').split('/').filter((s) => s && s !== '.');
  return segs.length > 0 && segs[0].toLowerCase() === 'uploads';
}

function globHitsUploads(glob) {
  const first = String(glob).replace(/\\/g, '/').replace(/^\.\//, '').split('/')[0];
  if (first.toLowerCase() === 'uploads') return true;
  try {
    return matchesGlob('uploads/probe.pdf', glob) || matchesGlob('uploads/a/b.pdf', glob);
  } catch {
    return false;
  }
}

/**
 * @param {object} block
 * @param {{root: string, skipPathExists?: boolean}} opts
 * @returns {{ok: boolean, errors: string[]}}
 */
export function validateDesignBlock(block, { root, skipPathExists = false } = {}) {
  const errors = [];
  if (!block || typeof block !== 'object' || Array.isArray(block)) {
    return { ok: false, errors: ['design block must be an object'] };
  }
  if (!SOURCES.includes(block.source)) {
    errors.push(`source must be one of ${SOURCES.join(', ')} (got ${JSON.stringify(block.source)})`);
  } else if (block.source === 'design-system') {
    if (typeof block.project_id !== 'string' || !UUID_RE.test(block.project_id)) {
      errors.push('project_id is required and must be a UUID');
    }
    if (block.name !== undefined && typeof block.name !== 'string') errors.push('name must be a string');
  } else if (block.source === 'artifact') {
    let u = null;
    try { u = new URL(block.url); } catch { /* invalid */ }
    if (!u || u.protocol !== 'https:') errors.push('url is required and must be an https URL');
  } else if (block.source === 'local') {
    if (typeof block.path !== 'string' || !block.path) {
      errors.push('path is required for source local');
    } else if (!skipPathExists) {
      const p = isAbsolute(block.path) ? block.path : join(root ?? '.', block.path);
      if (!existsSync(p)) errors.push(`local path does not exist: ${block.path}`);
    }
  }
  if (block.globs !== undefined) {
    if (!Array.isArray(block.globs) || block.globs.some((g) => typeof g !== 'string' || !g)) {
      errors.push('globs must be an array of non-empty strings');
    } else {
      for (const g of block.globs) {
        if (globHitsUploads(g)) errors.push(`glob ${JSON.stringify(g)} would match uploads/ which is never pulled (D-02)`);
      }
    }
  }
  if (block.tokenMap !== undefined) {
    if (!block.tokenMap || typeof block.tokenMap !== 'object' || Array.isArray(block.tokenMap)) {
      errors.push('tokenMap must be an object');
    } else {
      for (const [k, v] of Object.entries(block.tokenMap)) {
        if (!k.startsWith('--')) errors.push(`tokenMap key ${k} must start with --`);
        if (!(v === null || (typeof v === 'string' && v.startsWith('--')))) {
          errors.push(`tokenMap value for ${k} must be null or a string starting with --`);
        }
      }
    }
  }
  if (block.allowHosts !== undefined) {
    if (!Array.isArray(block.allowHosts) || block.allowHosts.some((h) => typeof h !== 'string' || !h)) {
      errors.push('allowHosts must be an array of hostnames');
    }
  }
  return { ok: errors.length === 0, errors };
}

/** @returns {{block: object|null, errors: string[]}} block null + errors [] when absent. */
export function readDesignBlock(root, slug) {
  const p = join(root, 'sites', slug, 'wiring.json');
  let wiring;
  try { wiring = JSON.parse(readFileSync(p, 'utf8')); } catch (e) {
    return { block: null, errors: [`cannot read ${p}: ${e.message}`] };
  }
  if (wiring.design === undefined) return { block: null, errors: [] };
  const { ok, errors } = validateDesignBlock(wiring.design, { root });
  return { block: ok ? wiring.design : null, errors };
}
