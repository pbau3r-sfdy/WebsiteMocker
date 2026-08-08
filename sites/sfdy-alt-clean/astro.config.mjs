import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.starflight-dynamics.com',
  base: process.env.SITE_BASE || '/WebsiteMocker/sfdy-alt-clean',
  output: 'static',
});
