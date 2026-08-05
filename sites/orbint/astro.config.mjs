import { defineConfig } from 'astro/config';

// Sandbox deployment — served at pbau3r-sfdy.github.io/WebsiteMocker/orbint
// For production packaging: change site to 'https://orbint.de' and remove base
export default defineConfig({
  site: 'https://pbau3r-sfdy.github.io',
  base: '/WebsiteMocker/orbint',
  output: 'static',
});
