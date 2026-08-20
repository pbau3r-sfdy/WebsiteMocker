import { z } from 'astro:content';

/**
 * Canonical Zod schema library — imported by all per-site content.config.ts files.
 * Date fields use coerce.date() so date strings from the GitHub web UI don't break CI.
 *
 * Each site's src/content.config.ts handles defineCollection + glob() wiring.
 * This file exports schema objects only — no defineCollection, no glob(), no collections export.
 */

export const newsSchema = z.object({
  title:       z.string(),
  date:        z.coerce.date(),
  summary:     z.string(),
  image:       z.string().optional(),
  imageCredit: z.string().optional(),
  tags:        z.array(z.string()).optional(),
  /** Short teaser used in card titles (e.g. sfdy-alt-clean homepage reads short ?? title) */
  short:       z.string().optional(),
});

export const jobsSchema = z.object({
  title:      z.string(),
  department: z.string().optional(),
  location:   z.string(),
  type:       z.enum(['full-time', 'part-time', 'contract']),
  open:       z.boolean().default(true),
  date:       z.coerce.date(),
});

export const announcementsSchema = z.object({
  title:   z.string(),
  date:    z.coerce.date(),
  summary: z.string(),
  tags:    z.array(z.string()).optional(),
});

export const blogSchema = z.object({
  title:   z.string(),
  date:    z.coerce.date(),
  author:  z.string().optional(),
  summary: z.string(),
  image:   z.string().optional(),
  tags:    z.array(z.string()).optional(),
});
