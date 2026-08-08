import { defineCollection, z } from 'astro:content';

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    /** Short headline used on the home grid; falls back to title. */
    short: z.string().optional(),
    date: z.date(),
    summary: z.string(),
    image: z.string().optional(),
  }),
});

export const collections = { news };
