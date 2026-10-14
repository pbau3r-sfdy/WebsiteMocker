import type { CollectionEntry } from 'astro:content';

export const stamp = (d: Date) =>
  d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

/** Headline without the legacy "COMPANY ANNOUNCEMENT:" prefix. */
export const headline = (p: CollectionEntry<'news'>) =>
  p.data.title.replace(/^COMPANY ANNOUNCEMENT:\s*/i, '');

/** Short form for cards and lists. */
export const cardTitle = (p: CollectionEntry<'news'>) => p.data.short ?? headline(p);
