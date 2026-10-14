// Drives the real plausible() astro:config:setup hook with a stub and prints JSON.
// Usage: node drive-plausible.mjs <wiring.json> <base> [command]
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import plausible from '../../plausible.mjs';

const [wiringPath, base, command = 'build'] = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), 'wm-anly-'));
let code = 0;
try {
  copyFileSync(resolve(wiringPath), join(dir, 'wiring.json'));
  const scripts = [], info = [], warn = [];
  plausible().hooks['astro:config:setup']({
    config: { root: pathToFileURL(dir + '/'), base },
    command,
    injectScript: (stage, code) => scripts.push({ stage, code }),
    logger: { info: (m) => info.push(m), warn: (m) => warn.push(m) },
  });
  console.log(JSON.stringify({ ok: true, scripts, info, warn }));
} catch (e) {
  console.log(JSON.stringify({ ok: false, error: e.message }));
  code = 3;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
process.exit(code);
