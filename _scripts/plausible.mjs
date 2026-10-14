// Plausible Analytics for WebsiteMocker sites (cookie-free; no consent banner is
// built, D-04, pending legal confirmation).
//
// Usage in a site's astro.config.mjs:
//   import plausible from '../../_scripts/plausible.mjs';
//   export default defineConfig({ ..., integrations: [plausible()] });
//
// Switched on per site in wiring.json. Every key is optional except service/status:
//   "analytics": {
//     "service": "plausible",
//     "status":  "configured",
//     "scriptId": "pa-xxxx",          // per-site loader token; without it the legacy data-domain script.js is used
//     "domain":  "example.com",       // production Plausible site name; defaults to wiring.domain without "www."
//     "host":    "https://plausible.io", // https origin, set when self-hosting
//     "sandbox": true,                // false = never track the sandbox preview
//     "sandboxScriptId": "pa-yyyy",   // separate Plausible site for sandbox builds
//     "sandboxUsesProdId": false,     // D-02 debug opt-in: sandbox reports to the PRODUCTION site
//     "events": { "outboundLinks": true, "fileDownloads": true, "formSubmissions": true }, // each default true
//     "sanitise": true,               // default true with scriptId: drop queries, mask ids, origin-only referrer
//     "exclude": ["/preview/"],       // path prefixes whose events are dropped
//     "eventNames": {},               // tracker event name -> contract name
//     "props": false,                 // customProperties (site, content_type); Business plan only
//     "statsApi": false               // used by the harness only, ignored here
//   }
//
// D-02 protective default: a sandbox build (base /WebsiteMocker/<slug>) of a scriptId
// site emits NOTHING unless sandboxScriptId is set or sandboxUsesProdId is true. The
// opt-in logs a loud warning on every build; remove sandboxUsesProdId before the
// Phase 12 cutover. Legacy sites (no scriptId) keep the old behaviour: sandbox previews
// report to SANDBOX_DOMAIN, filter by page path.
// Production builds (/wm-publish, base "/") report to the site's own identity.
// Identity mismatches throw '[plausible] ANLY-03: ...' and fail the build.
// Nothing is injected in `astro dev`.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { isSandbox, SANDBOX_DOMAIN } from './lib/env.mjs';
import { resolveIdentity, buildSnippet, SANDBOX_OPT_IN_WARNING } from './lib/plausible-snippet.mjs';

export { SANDBOX_DOMAIN };

export default function plausible() {
  return {
    name: 'websitemocker-plausible',
    hooks: {
      'astro:config:setup': ({ config, command, injectScript, logger }) => {
        if (command !== 'build') return;

        const file = join(fileURLToPath(config.root), 'wiring.json');
        if (!existsSync(file)) return;
        const wiring = JSON.parse(readFileSync(file, 'utf8'));
        const a = wiring.analytics ?? {};
        if (a.service !== 'plausible' || a.status !== 'configured') return;

        const sandbox = isSandbox(config.base);
        // Not caught on purpose: an ANLY-03 Error must fail `astro build`.
        const identity = resolveIdentity(wiring, { sandbox });
        if (!identity.emit) {
          if (identity.reason === 'no domain') {
            logger.warn('analytics.service is plausible but no domain is set; skipping');
          } else {
            logger.info(`Plausible: nothing emitted (${identity.reason})`);
          }
          return;
        }
        if (identity.debugOptIn) logger.warn(SANDBOX_OPT_IN_WARNING);

        const { code, warnings } = buildSnippet(identity, wiring, {
          base: config.base,
          slug: wiring.slug ?? '',
        });
        for (const w of warnings) logger.warn(w);
        injectScript('head-inline', code);
        logger.info(
          `Plausible → ${identity.label} (${sandbox ? 'sandbox' : 'production'}${identity.debugOptIn ? ', debug opt-in' : ''})`,
        );
      },
    },
  };
}
