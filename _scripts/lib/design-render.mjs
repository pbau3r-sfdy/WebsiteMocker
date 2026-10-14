/**
 * design-render.mjs — render a staged JSX design-system component to static HTML (DSYNC-09).
 *
 * Path (09-SPIKE SD-06): esbuild bundle (React bundled in), then renderToStaticMarkup inside a
 * `node --permission` child that can read only the bundle dir (no fs write, no child process,
 * no network, no workers). Components that need a DOM fall back to headless Chrome via Playwright
 * with every non-file:// request aborted.
 *
 * Untrusted code never runs before scanImports() has passed.
 */
import { build, transformSync } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..', '..');
const WORKER = join(HERE, '..', 'design-render-worker.mjs');

const ALLOWED_BARE = new Set(['react', 'react/jsx-runtime', 'react-dom', 'react-dom/server']);
const FORBIDDEN = [
  'require(', 'process.', 'child_process', 'eval(', 'new Function',
  'import(', 'fetch(', 'XMLHttpRequest', 'WebSocket',
];

function inside(root, p) {
  const r = resolve(root);
  const t = resolve(p);
  return t === r || t.startsWith(r + sep);
}

/**
 * Static check of component source. Returns { ok, imports, refused }.
 * Relative specifiers are accepted here; renderComponent resolves them against
 * stagingRoot (pass opts.fromDir + opts.stagingRoot to check containment too).
 */
export function scanImports(source, opts = {}) {
  const refused = [];
  let js;
  try {
    js = transformSync(source, { loader: 'jsx', format: 'esm', jsx: 'automatic' }).code;
  } catch (e) {
    return { ok: false, imports: [], refused: [`syntax error: ${String(e.message).split('\n')[0]}`] };
  }
  const specs = new Set();
  const re = /(?:^|[\s;}])(?:import|export)\s*(?:[^'"`;]*?\sfrom\s*)?["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(js))) specs.add(m[1]);
  for (const s of specs) {
    if (ALLOWED_BARE.has(s)) continue;
    if (s.startsWith('./') || s.startsWith('../')) {
      if (opts.stagingRoot && opts.fromDir && !inside(opts.stagingRoot, resolve(opts.fromDir, s))) {
        refused.push(s);
      }
      continue;
    }
    refused.push(s);
  }
  for (const id of FORBIDDEN) if (source.includes(id)) refused.push(`identifier: ${id}`);
  return { ok: refused.length === 0, imports: [...specs], refused };
}

/** Scan the entry and every relative file it reaches (inside stagingRoot). */
function scanTree(entryPath, stagingRoot, seen = new Set()) {
  const abs = resolve(entryPath);
  if (seen.has(abs)) return [];
  seen.add(abs);
  if (!inside(stagingRoot, abs)) return [`${entryPath} (outside staging root)`];
  if (!existsSync(abs)) return [`${entryPath} (missing)`];
  const src = readFileSync(abs, 'utf8');
  const r = scanImports(src, { stagingRoot, fromDir: dirname(abs) });
  const refused = r.refused.map((x) => `${basename(abs)}: ${x}`);
  for (const s of r.imports) {
    if (!(s.startsWith('./') || s.startsWith('../'))) continue;
    const base = resolve(dirname(abs), s);
    const cand = [base, base + '.jsx', base + '.js', join(base, 'index.jsx'), join(base, 'index.js')]
      .find((c) => existsSync(c) && /\.[jt]sx?$/.test(c));
    if (cand) refused.push(...scanTree(cand, stagingRoot, seen));
    else if (!existsSync(base)) refused.push(`${basename(abs)}: unresolved ${s}`);
  }
  return refused;
}

const COMMON = {
  bundle: true,
  jsx: 'automatic',
  logLevel: 'silent',
  nodePaths: [join(ROOT, 'node_modules')],
  absWorkingDir: ROOT,
  loader: { '.css': 'empty', '.svg': 'dataurl', '.png': 'dataurl' },
};

async function renderSsr(entryPath, outDir, name) {
  const wrapperPath = join(outDir, `${name}.wrapper.jsx`);
  writeFileSync(wrapperPath, [
    `import { createElement } from 'react';`,
    `import { renderToStaticMarkup } from 'react-dom/server.browser';`,
    `import Component from ${JSON.stringify(resolve(entryPath))};`,
    `export default renderToStaticMarkup(createElement(Component));`,
    '',
  ].join('\n'));
  const bundlePath = join(outDir, `${name}.bundle.mjs`);
  await build({ ...COMMON, entryPoints: [wrapperPath], format: 'esm', platform: 'node', outfile: bundlePath });
  const html = execFileSync(
    process.execPath,
    ['--permission', `--allow-fs-read=${outDir}`, `--allow-fs-read=${WORKER}`, WORKER, bundlePath],
    { timeout: 20000, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
  return html;
}

async function renderPlaywright(entryPath, outDir, name) {
  const wrapperPath = join(outDir, `${name}.client.jsx`);
  writeFileSync(wrapperPath, [
    `import { createElement } from 'react';`,
    `import { createRoot } from 'react-dom/client';`,
    `import Component from ${JSON.stringify(resolve(entryPath))};`,
    `createRoot(document.getElementById('root')).render(createElement(Component));`,
    '',
  ].join('\n'));
  const jsPath = join(outDir, `${name}.client.js`);
  await build({ ...COMMON, entryPoints: [wrapperPath], format: 'iife', platform: 'browser', outfile: jsPath });
  const pagePath = join(outDir, `${name}.page.html`);
  writeFileSync(pagePath,
    `<!doctype html><html><body><div id="root"></div><script src="${pathToFileURL(jsPath).href}"></script></body></html>`);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.route('**/*', (r) => (r.request().url().startsWith('file://') ? r.continue() : r.abort()));
    await page.goto(pathToFileURL(pagePath).href);
    await page.waitForSelector('#root > *', { timeout: 10000 });
    return await page.$eval('#root', (el) => el.innerHTML);
  } finally {
    await browser.close();
  }
}

/**
 * renderComponent(entryPath, { stagingRoot, outDir, method = 'ssr', fallback = true })
 *   -> { html, method: 'ssr' | 'playwright' }
 * Throws on refused imports, render error and empty output.
 */
export async function renderComponent(entryPath, { stagingRoot, outDir, method = 'ssr', fallback = true } = {}) {
  if (!stagingRoot || !outDir) throw new Error('renderComponent: stagingRoot and outDir are required');
  const refused = scanTree(entryPath, stagingRoot);
  if (refused.length) {
    throw new Error(`refused: ${entryPath}: ${refused.join('; ')}`);
  }
  mkdirSync(outDir, { recursive: true });
  const abs = realpathSync(resolve(outDir)); // permission model realpaths the bundle; symlinked tmp dirs need the real path
  const name = basename(entryPath).replace(/\.[^.]+$/, '');

  let html;
  let used = method;
  if (method === 'ssr') {
    try {
      html = await renderSsr(entryPath, abs, name);
    } catch (e) {
      if (!fallback) throw new Error(`render failed (ssr): ${name}: ${String(e.stderr || e.message).split('\n').find((l) => /Error/.test(l)) || e.message}`);
      try {
        html = await renderPlaywright(entryPath, abs, name);
        used = 'playwright';
      } catch (e2) {
        throw new Error(`render failed for ${name}: ssr: ${String(e.stderr || e.message).split('\n').find((l) => /Error/.test(l)) || e.message}; playwright: ${e2.message.split('\n')[0]}`);
      }
    }
  } else {
    html = await renderPlaywright(entryPath, abs, name);
    used = 'playwright';
  }
  if (!html || html.trim() === '') throw new Error(`empty render: ${entryPath}`);
  return { html, method: used };
}
