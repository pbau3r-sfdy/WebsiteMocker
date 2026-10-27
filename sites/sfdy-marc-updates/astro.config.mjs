import { defineConfig } from 'astro/config';
import plausible from '../../_scripts/plausible.mjs';
import internalPages from '../../_scripts/internal-pages.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.starflight-dynamics.com',
  base: process.env.SITE_BASE || '/WebsiteMocker/sfdy-marc-updates',
  output: 'static',
  // drops() is deliberately left out: confidential drops belong to the live site only.
  integrations: [plausible(), internalPages()],
});
