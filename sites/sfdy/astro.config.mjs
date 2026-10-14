import { defineConfig } from 'astro/config';
import plausible from '../../_scripts/plausible.mjs';
import internalPages from '../../_scripts/internal-pages.mjs';
import drops from '../../_scripts/drops.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.starflight-dynamics.com',
  base: process.env.SITE_BASE || '/WebsiteMocker/sfdy',
  output: 'static',
  integrations: [plausible(), internalPages(), drops()],
});
