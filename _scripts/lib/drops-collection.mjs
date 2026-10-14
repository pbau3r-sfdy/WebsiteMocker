// Open Drops gating (Phase 11). resolveDrops is the ONLY place that decides whether
// drops are visible, so the content loader and the Astro integration cannot disagree.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isSandbox } from './env.mjs';
import { listDrops, shortId } from './drops-core.mjs';

/** DROPS_DIR only. No implicit default: builds are opt-in via the env var. */
export function resolveDropsDir(env = process.env) {
  const d = env.DROPS_DIR;
  return d && String(d).trim() !== '' ? path.resolve(String(d)) : null;
}

function emptyCounts() {
  return { active: 0, soon: 0, expired: 0, withdrawn: 0, invalid: 0 };
}

function result(over) {
  return { enabled: false, gated: false, reason: '', dir: null, drops: [], counts: emptyCounts(), ...over };
}

function rootPath(root) {
  if (root instanceof URL) return fileURLToPath(root);
  return String(root);
}

/**
 * @param {{ root: string|URL, base: string, env?: object, now?: number }} p root is the site directory
 */
export function resolveDrops({ root, base, env = process.env, now = Date.now() }) {
  const siteDir = rootPath(root);
  let wiring = {};
  try {
    wiring = JSON.parse(fs.readFileSync(path.join(siteDir, 'wiring.json'), 'utf8'));
  } catch {
    wiring = {};
  }
  if (wiring?.drops?.enabled !== true) return result({ reason: 'drops not enabled in wiring.json' });

  const sandbox = isSandbox(base);
  const preview = env.DROPS_PREVIEW === '1';
  const require_ = env.DROPS_REQUIRE === '1';

  if (preview && (env.CI || env.GITHUB_ACTIONS)) {
    throw new Error('[drops] DROPS_PREVIEW is local-only and must never be set in CI');
  }
  if (preview && !sandbox) {
    throw new Error('[drops] DROPS_PREVIEW is for sandbox builds only (base must be /WebsiteMocker/...)');
  }
  if (sandbox && !preview) {
    return result({ enabled: true, gated: true, reason: 'sandbox build without DROPS_PREVIEW=1 (D-09)' });
  }

  const dir = resolveDropsDir(env);
  if (!dir || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
    if (require_) {
      throw new Error('[drops] DROPS_REQUIRE=1 but DROPS_DIR is unset or missing');
    }
    return result({ enabled: true, reason: 'no drops directory', dir });
  }

  const slug = wiring.slug;
  const all = listDrops(dir, slug, now);
  const counts = emptyCounts();
  const drops = [];
  for (const d of all) {
    counts[d.status] += 1;
    if (d.status === 'invalid') {
      if (!sandbox) {
        throw new Error(`[drops] drop ${shortId(d.id)} is invalid: ${d.errors.join('; ') || 'unknown error'}`);
      }
      continue;
    }
    if (d.status === 'active' || d.status === 'soon') drops.push(d);
  }
  return result({ enabled: true, reason: 'ok', dir, drops, counts });
}

/** Astro content-layer loader object (no astro:content import, testable from Node). */
export function dropsLoader() {
  return {
    name: 'websitemocker-drops',
    async load({ store, parseData, renderMarkdown, generateDigest, config, logger }) {
      const res = resolveDrops({ root: config.root, base: config.base, env: process.env });
      store.clear();
      for (const d of res.drops) {
        const data = await parseData({ id: d.id, data: { ...d.fm } });
        const rendered = await renderMarkdown(d.body);
        store.set({
          id: d.id,
          data,
          body: d.body,
          rendered,
          digest: generateDigest({ fm: d.fm, body: d.body }),
        });
      }
      logger?.info?.(`drops: ${res.drops.length} served (${res.reason})`);
    },
  };
}
