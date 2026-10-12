import { defineConfig } from 'astro/config';
import plausible from '../../_scripts/plausible.mjs';

const SITE_URL = process.env.SITE_URL || 'https://pbau3r-sfdy.github.io';
const SITE_BASE = process.env.SITE_BASE || '/WebsiteMocker/mogwai-systems';

export default defineConfig({
  site: SITE_URL,
  base: SITE_BASE,
  output: 'static',
  integrations: [plausible()],
});
