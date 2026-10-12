import { defineConfig } from 'astro/config';
import plausible from '../../_scripts/plausible.mjs';

export default defineConfig({
  site: process.env.SITE_URL || 'https://www.starflight-dynamics.com',
  base: process.env.SITE_BASE || '/WebsiteMocker/sfdy-alt-clean-reskin',
  output: 'static',
  integrations: [plausible()],
});
