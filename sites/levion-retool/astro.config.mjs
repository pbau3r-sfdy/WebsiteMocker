import { defineConfig } from 'astro/config';

const base = (process.env.SITE_BASE || '/WebsiteMocker/levion-retool').replace(/\/$/, '');

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.levion-materials.com',
  base: base || '/',
  output: 'static',
  // Keep the original Wix permalinks working (the redirect target must carry the base path).
  redirects: {
    '/kopie-von-imprint': `${base}/privacy-policy`,
    // Position filled (closed jobs are not built). Remove this redirect when the posting is reopened.
    '/program-and-business-dev-manager': `${base}/careers`,
  },
});
