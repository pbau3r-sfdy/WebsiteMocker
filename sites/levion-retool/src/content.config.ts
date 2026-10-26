import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { jobsSchema } from '../../../_core/src/content.config.ts';
import { SITES, SITE_KEYS } from './data/sites';

// Blog posts shown on /news and /post/<slug> (mirrors the live Wix blog).
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title:     z.string(),
    date:      z.coerce.date(),
    updated:   z.string().optional(),   // free text, e.g. "Aktualisiert: 11. Mai"
    readTime:  z.string(),              // e.g. "2 Min. Lesezeit"
    excerpt:   z.string(),
    thumb:     z.string(),   // path under public/images, used on /news and in "Aktuelle Beiträge"
    likes:     z.number().default(0),
  }),
});

// Levion extends the shared jobs schema with sites, reference codes and salary.
const jobs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/jobs' }),
  schema: jobsSchema
    .extend({
      location:       z.string().optional(),
      sites:          z.array(z.enum(SITE_KEYS)).default([]),
      // Positions based outside our own sites, e.g. Brussels for EU affairs.
      locations:      z.array(z.object({ city: z.string(), country: z.string().length(2) })).default([]),
      // One mode, or several when the role allows a choice (e.g. [onsite, hybrid]).
      workplace:      z.union([z.enum(['onsite', 'hybrid', 'remote']), z.array(z.enum(['onsite', 'hybrid', 'remote'])).min(1)]).default('onsite'),
      reference:      z.string().optional(),      // HR-assigned code; hidden when absent
      reports_to:     z.string().optional(),
      start:          z.string().optional(),
      summary:        z.string(),
      eligibility:    z.string().optional(),
      hiring_steps:   z.array(z.string()).default([]), // optional "How we hire" list shown in the apply card
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


export const collections = { news, jobs };
