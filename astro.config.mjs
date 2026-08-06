import { defineConfig } from 'astro/config';

// Dashboard — root of the WebsiteMocker monorepo
// Each site in sites/ has its own astro.config.mjs with base: '/WebsiteMocker/site-name'
export default defineConfig({
  site: 'https://pbau3r-sfdy.github.io',
  base: '/WebsiteMocker',
  output: 'static',
});
