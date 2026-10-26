import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE } from '../data/site';

// Static sitemap of every public page (redirects and the 404 are left out).
export const GET: APIRoute = async ({ site }) => {
  const origin = (site ?? new URL(SITE.url)).origin;
  const b = import.meta.env.BASE_URL.replace(/\/$/, '');
  const posts = await getCollection('news');
  const jobs = (await getCollection('jobs')).filter(j => j.data.open);
  const paths = [
    '/', '/team/', '/news/', '/careers/', '/contact/', '/imprint/', '/privacy-policy/',
    ...posts.map(p => `/post/${p.id}/`),
    ...jobs.map(j => `/${j.id}/`),
  ];
  const urls = paths.map(p => `  <url><loc>${origin}${b}${p}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml' },
  });
};
