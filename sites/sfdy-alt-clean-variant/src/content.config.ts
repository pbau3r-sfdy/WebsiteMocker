import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { newsSchema, jobsSchema, announcementsSchema, blogSchema } from '../../_core/src/content.config.ts';
import { SITES, SITE_KEYS } from './data/sites';

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: newsSchema,
});

// SFDY extends the shared jobs schema with sites, reference codes and salary.
const jobs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/jobs' }),
  schema: jobsSchema
    .extend({
      location:       z.string().optional(),
      sites:          z.array(z.enum(SITE_KEYS)).default([]),
      // Positions based outside our own sites, e.g. Brussels for EU affairs.
      locations:      z.array(z.object({ city: z.string(), country: z.string().length(2) })).default([]),
      workplace:      z.enum(['onsite', 'hybrid', 'remote']).default('onsite'),
      reference:      z.string(),
      reports_to:     z.string().optional(),
      start:          z.string().default('As soon as possible'),
      summary:        z.string(),
      eligibility:    z.string().optional(),
      draft:          z.boolean().default(false), // dev preview only, never built
      priority:       z.boolean().default(false), // pinned to the top of the overview
      valid_through:  z.coerce.date().optional(),
      salary: z.object({
        min:      z.number(),
        max:      z.number().optional(),
        currency: z.string().default('EUR'),
        period:   z.enum(['month', 'year']).default('month'),
        gross:    z.boolean().default(true),
      }).optional(),
    })
    .superRefine((job, ctx) => {
      if (job.sites.length + job.locations.length === 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sites'], message: 'Set at least one of `sites` or `locations`.' });
      }
      if (job.draft) return; // salary rule enforced once a position is publishable
      for (const key of job.sites) {
        if (SITES[key].salaryRequired && !job.salary) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['salary'],
            message: `Positions in ${SITES[key].city} must state a salary (min, optional max).`,
          });
        }
      }
    }),
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
