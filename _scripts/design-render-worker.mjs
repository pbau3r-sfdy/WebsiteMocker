#!/usr/bin/env node
/**
 * design-render-worker.mjs — child-process SSR entry.
 * Run only under `node --permission --allow-fs-read=<bundleDir> --allow-fs-read=<this file>`.
 * The bundle (built by lib/design-render.mjs) default-exports the rendered HTML string.
 * HTML goes to stdout; nothing else is written.
 */
import { pathToFileURL } from 'node:url';

const bundlePath = process.argv[2];
if (!bundlePath) {
  console.error('design-render-worker: bundle path required');
  process.exit(2);
}
const mod = await import(pathToFileURL(bundlePath).href);
// react-dom's scheduler keeps a MessageChannel open; exit explicitly once stdout is flushed.
process.stdout.write(String(mod.default ?? ''), () => process.exit(0));
