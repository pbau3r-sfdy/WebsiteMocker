// Open Drops Astro integration (Phase 11). Registers /d/[id] only for production-like
// builds with wiring drops.enabled and emits stripped PDF attachments at build end.
// All gating lives in resolveDrops (lib/drops-collection.mjs); never log full ids.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDrops } from './lib/drops-collection.mjs';
import { requireQpdf, stripPdf, verifyPdf } from './lib/pdf-strip.mjs';

const ROUTE = fileURLToPath(new URL('../_core/src/drops/[id].astro', import.meta.url));

export default function drops() {
  let siteDir = '';
  let base = '/';
  let enabled = false;
  return {
    name: 'websitemocker-drops',
    hooks: {
      'astro:config:setup': ({ config, command, injectRoute, updateConfig, logger }) => {
        siteDir = fileURLToPath(config.root);
        base = config.base;
        const res = resolveDrops({ root: siteDir, base, env: process.env });
        if (!res.enabled || res.gated) return;
        enabled = true;
        injectRoute({ pattern: '/d/[id]', entrypoint: ROUTE, prerender: true });
        let wiring = {};
        try { wiring = JSON.parse(fs.readFileSync(path.join(siteDir, 'wiring.json'), 'utf8')); } catch { /* none */ }
        updateConfig({
          vite: {
            define: {
              __DROPS_CONFIG__: JSON.stringify({
                accent: wiring.accent || '#00FB92',
                props: wiring.analytics?.props === true,
              }),
            },
          },
        });
        const c = res.counts;
        logger.info(`${res.drops.length} drops served (${c.active} active, ${c.soon} soon, ${c.expired} expired skipped, ${c.withdrawn} withdrawn skipped)`);
        if (command === 'dev' && process.env.DROPS_PREVIEW === '1') {
          logger.info('dev preview works, restart the dev server after adding a drop (no file watcher)');
        }
      },
      'astro:build:done': async ({ dir }) => {
        if (!enabled) return;
        const res = resolveDrops({ root: siteDir, base, env: process.env });
        if (!res.enabled || res.gated || res.drops.length === 0) return;
        const outDir = fileURLToPath(dir);
        const atts = [];
        for (const d of res.drops) {
          for (const name of d.fm.attachments || []) atts.push({ d, name });
        }
        if (atts.length === 0) return;
        if (atts.some((a) => /\.pdf$/i.test(a.name))) requireQpdf();
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'drops-'));
        try {
          for (const { d, name } of atts) {
            const src = path.join(d.dir, name);
            const dest = path.join(outDir, 'd', d.id, name);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            if (/\.pdf$/i.test(name)) {
              const t = path.join(tmp, `${d.id}-${path.basename(name)}`);
              stripPdf(src, t);
              verifyPdf(t);
              fs.copyFileSync(t, dest);
            } else {
              fs.copyFileSync(src, dest);
            }
          }
        } finally {
          fs.rmSync(tmp, { recursive: true, force: true });
        }
      },
    },
  };
}
