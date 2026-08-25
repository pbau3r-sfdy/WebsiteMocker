import { defineConfig } from 'astro/config';

const SITE_URL  = process.env.SITE_URL  || 'https://pbau3r-sfdy.github.io';
const SITE_BASE = process.env.SITE_BASE || '/WebsiteMocker/{{SITE_SLUG}}';

export default defineConfig({
  site:   SITE_URL,
  base:   SITE_BASE,
  output: 'static',
});
