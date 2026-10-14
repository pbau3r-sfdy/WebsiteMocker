import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { newsSchema, announcementsSchema, blogSchema, dropsSchema } from '../../_core/src/content.config.ts';
import { dropsLoader } from '../../../_scripts/lib/drops-collection.mjs';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  // `kicker` is the category label shown next to the date (Team, Programme, Contract …).
  schema: newsSchema.extend({ kicker: z.string().optional() }),
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/announcements' }),
  schema: announcementsSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: blogSchema,
});

// Open Drops: loaded from DROPS_DIR only (never from src/content), gated by resolveDrops.
const drops = defineCollection({ loader: dropsLoader(), schema: dropsSchema });

export const collections = { news, announcements, blog, drops };
