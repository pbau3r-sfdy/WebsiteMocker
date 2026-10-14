// Shared environment helpers for WebsiteMocker build scripts (ANLY-01).
//
// isSandbox() is the single test for "is this a sandbox build?". A sandbox build
// has an Astro base of /WebsiteMocker or /WebsiteMocker/<slug>; a production
// build (/wm-publish) has base "/". The Plausible integration uses it today;
// Phase 11 drops.mjs imports this same helper rather than re-implementing it.
//
// Node built-ins only; no repo-root computation.

export const SANDBOX_DOMAIN = 'pbau3r-sfdy.github.io';
export const SANDBOX_BASE_PREFIX = '/WebsiteMocker';

/**
 * @param {string | { base?: string } | undefined} baseOrConfig an Astro base string or a config object with `base`
 * @returns {boolean} true only for /WebsiteMocker or /WebsiteMocker/... (segment boundary)
 */
export function isSandbox(baseOrConfig) {
  const base =
    baseOrConfig && typeof baseOrConfig === 'object' ? baseOrConfig.base : baseOrConfig;
  if (typeof base !== 'string') return false;
  return base === SANDBOX_BASE_PREFIX || base.startsWith(SANDBOX_BASE_PREFIX + '/');
}
