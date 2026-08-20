import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { newsSchema, jobsSchema, announcementsSchema, blogSchema } from '../../_core/src/content.config.ts';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: newsSchema,
});

const jobs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/jobs' }),
  schema: jobsSchema,
});

const announcements = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/announcements' }),
  schema: announcementsSchema,
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/blog' }),
  schema: blogSchema,
});

export const collections = { news, jobs, announcements, blog };
