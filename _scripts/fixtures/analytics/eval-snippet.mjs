// Runs the emitted head-inline snippet in a vm with a stub window/document and applies the
// resulting transformRequest to one event. Usage:
//   node eval-snippet.mjs <wiring.json> <base> <site> <eventUrl> [eventName] [propsJson] [referrer]
// Prints the transformed payload as JSON ("null" when the event is dropped).
import { mkdtempSync, copyFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import vm from 'node:vm';
import plausible from '../../plausible.mjs';

const [wiringPath, base, site, eventUrl, eventName = 'pageview', propsJson, referrer] = process.argv.slice(2);
const dir = mkdtempSync(join(tmpdir(), 'wm-anly-'));
try {
  copyFileSync(resolve(wiringPath), join(dir, 'wiring.json'));
  const scripts = [];
  plausible().hooks['astro:config:setup']({
    config: { root: pathToFileURL(dir + '/'), base, site },
    command: 'build',
    injectScript: (stage, code) => scripts.push(code),
    logger: { info() {}, warn() {} },
  });
  if (scripts.length !== 1) throw new Error(`expected 1 injected script, got ${scripts.length}`);
  const window = {};
  const document = { createElement: () => ({ dataset: {} }), head: { appendChild() {} } };
  vm.runInNewContext(scripts[0], { window, document });
  const input = { n: eventName, u: eventUrl };
  if (propsJson) input.p = JSON.parse(propsJson);
  if (referrer) input.r = referrer;
  const out = window.plausible.o.transformRequest(input);
  console.log(JSON.stringify(out));
} catch (e) {
  console.log('ERROR ' + e.message);
  process.exitCode = 3;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
