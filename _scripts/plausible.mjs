// Plausible Analytics for WebsiteMocker sites (cookie-free, no consent banner needed).
//
// Usage in a site's astro.config.mjs:
//   import plausible from '../../_scripts/plausible.mjs';
//   export default defineConfig({ ..., integrations: [plausible()] });
//
// Switched on per site in wiring.json:
//   "analytics": {
//     "service": "plausible",
//     "status":  "configured",
//     "domain":  "example.com",            // optional, production; defaults to wiring.domain without "www."
//     "sandbox": true,                      // optional, false = do not track the sandbox preview
//     "host":    "https://plausible.io"     // optional, set to the instance URL when self-hosting
//   }
//
// Sandbox builds (base /WebsiteMocker/<slug>) report to one shared Plausible site,
// SANDBOX_DOMAIN; filter by page path (/WebsiteMocker/<slug>/…) to see one site.
// Production builds (/wm-publish, base "/") report to the site's own domain.
// Nothing is injected in `astro dev`.

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

export const SANDBOX_DOMAIN = 'pbau3r-sfdy.github.io';

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

        const sandbox = config.base.startsWith('/WebsiteMocker');
        if (sandbox && a.sandbox === false) return;

        const domain = sandbox
          ? SANDBOX_DOMAIN
          : (a.domain ?? wiring.domain ?? '').replace(/^www\./, '');
        if (!domain) {
          logger.warn('analytics.service is plausible but no domain is set; skipping');
          return;
        }
        const src = `${(a.host ?? 'https://plausible.io').replace(/\/$/, '')}/js/script.js`;

        // The queue stub lets pages call plausible('Event') before the script has loaded.
        injectScript('head-inline', [
          'window.plausible=window.plausible||function(){(window.plausible.q=window.plausible.q||[]).push(arguments)};',
          `(function(){var s=document.createElement('script');s.defer=true;s.dataset.domain=${JSON.stringify(domain)};s.src=${JSON.stringify(src)};document.head.appendChild(s)})();`,
        ].join(''));
        logger.info(`Plausible → ${domain}${sandbox ? ' (sandbox)' : ''}`);
      },
    },
  };
}
