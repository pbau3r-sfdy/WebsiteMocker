import { defineConfig } from 'astro/config';

// Production build: SITE_URL=https://parrot-capital.com SITE_BASE=/ npm run build
// Sandbox default:  serves at pbau3r-sfdy.github.io/WebsiteMocker/parrot-capital/
const SITE_URL  = process.env.SITE_URL  ?? 'https://pbau3r-sfdy.github.io';
const SITE_BASE = process.env.SITE_BASE ?? '/WebsiteMocker/parrot-capital';

export default defineConfig({
  site:   SITE_URL,
  base:   SITE_BASE,
  output: 'static',
});
