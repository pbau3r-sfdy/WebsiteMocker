import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.levion-materials.com',
  base: process.env.SITE_BASE ?? '/WebsiteMocker/levion-alternate-recut',
  output: 'static',
});
