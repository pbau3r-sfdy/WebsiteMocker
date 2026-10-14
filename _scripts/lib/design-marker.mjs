/**
 * design-marker.mjs: public-safe design markers (SD-11).
 *   sites/<slug>/DESIGN.md  one per site with a design block
 *   DESIGNER.md (root)      index of design-linked, non-archived sites
 * Output is deterministic (no timestamps) and never contains project ids,
 * URLs, local paths or design content. Functions take `root`.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { validateDesignBlock } from './design-block.mjs';
import { readLock, checkComponent } from './design-lock.mjs';

function readWiring(root, slug) {
  try { return JSON.parse(readFileSync(join(root, 'sites', slug, 'wiring.json'), 'utf8')); } catch { return null; }
}

// A block with only a path-existence problem still renders (the path is never emitted).
function renderableBlock(wiring, root) {
  if (!wiring || wiring.design === undefined) return null;
  const { ok } = validateDesignBlock(wiring.design, { root, skipPathExists: true });
  return ok ? wiring.design : null;
}

function roleOf(w) {
  if (w.stage === 6) return `live (${w.domain ?? 'domain unset'})`;
  if (w.template === true) return 'template (design reference only)';
  return 'sandbox, not live';
}

function sourceOf(block) {
  if (block.source === 'design-system') return block.name || 'unnamed design system';
  if (block.source === 'local') return 'local export (no design system)';
  return 'exported artifact (no design system)';
}

function handEdited(root, slug) {
  const dir = join(root, 'sites', slug, 'src', 'components');
  if (!existsSync(dir)) return [];
  const lock = readLock(join(root, 'sites', slug));
  const out = [];
  for (const f of readdirSync(dir).sort()) {
    if (!f.endsWith('.astro') || f.endsWith('.incoming.astro')) continue;
    const name = f.replace(/\.astro$/, '');
    const state = checkComponent(lock, name, readFileSync(join(dir, f), 'utf8'));
    if (state === 'edited' || state === 'untracked') out.push(name);
  }
  return out;
}

export function renderDesignMd(root, slug) {
  const w = readWiring(root, slug);
  const block = renderableBlock(w, root);
  if (!block) return null;
  const edited = handEdited(root, slug);
  return [
    `# Design target: ${slug}`,
    '',
    `Role: ${roleOf(w)}`,
    '',
    `Design source: ${sourceOf(block)}`,
    '',
    'Stack rules:',
    '- Astro 5.x (do not upgrade).',
    `- Components go to \`sites/${slug}/src/components/\` as \`.astro\`, never \`src/pages/\`.`,
    '- Tokens land in `wiring.json` `brand.doc_tokens`; `Layout.astro` is changed only through an operator-approved proposal.',
    '',
    'Hand-edited sections (do not overwrite):',
    ...(edited.length ? edited.map((n) => `- ${n}`) : ['- none']),
    '',
    'Delivery: export a zip from Claude Design and drop it into `_staging/design/inbox/` in this repo (gitignored), then run `/wm-design-pull ' + slug + '`.',
    '',
    `Source of truth: the design block in sites/${slug}/wiring.json.`,
    '',
  ].join('\n');
}

export function renderDesignerIndex(root) {
  const rows = [];
  const sitesDir = join(root, 'sites');
  const slugs = existsSync(sitesDir) ? readdirSync(sitesDir).sort() : [];
  for (const slug of slugs) {
    const w = readWiring(root, slug);
    if (!w || w.archived === true) continue;
    const block = renderableBlock(w, root);
    if (!block) continue;
    rows.push(`| ${slug} | ${roleOf(w)} | ${sourceOf(block)} |`);
  }
  return [
    '# Designer targets',
    '',
    'Sites in this repo that are linked to Claude Design. Each has a `sites/<slug>/DESIGN.md` with the rules a Designer must respect. The machine-readable source of truth is the `design` block in each site\'s `wiring.json`.',
    '',
    ...(rows.length
      ? ['| Slug | Role | Design source |', '| --- | --- | --- |', ...rows]
      : ['none yet']),
    '',
  ].join('\n');
}

/** Write or delete sites/<slug>/DESIGN.md and rewrite DESIGNER.md. Returns touched paths (repo-relative). */
export function writeMarkers(root, slug, { dryRun = false } = {}) {
  const touched = [];
  const mdPath = join(root, 'sites', slug, 'DESIGN.md');
  const md = renderDesignMd(root, slug);
  if (md === null) {
    if (existsSync(mdPath)) { if (!dryRun) rmSync(mdPath); touched.push(`sites/${slug}/DESIGN.md`); }
  } else {
    if (!dryRun) writeFileSync(mdPath, md);
    touched.push(`sites/${slug}/DESIGN.md`);
  }
  if (!dryRun) writeFileSync(join(root, 'DESIGNER.md'), renderDesignerIndex(root));
  touched.push('DESIGNER.md');
  return touched;
}
