import { SITES, type CompanySite } from './sites';

export const CAREERS_EMAIL = 'careers@starflight-dynamics.com';

// Company-wide benefits shown on every position. Empty → section hidden.
// TODO: fill in with real benefits before advertising.
export const OFFERS: { title: string; text: string }[] = [];

export const ABOUT =
  'Starflight Dynamics is a Munich-based space company developing sovereign orbital defense vehicles and the propulsion systems that drive them. Technologies for the High Frontier.';

export const EQUAL_OPPORTUNITY =
  'Starflight Dynamics is an equal-opportunity employer. Applications are assessed on qualifications and experience alone, regardless of gender, origin, religion, disability, age or sexual identity.';

// Drafts are visible in `astro dev` only.
export const isPublished = (j: { data: { open?: boolean; draft: boolean } }) =>
  j.data.open !== false && (import.meta.env.DEV || !j.data.draft);

export function applyHref(reference: string, title: string) {
  return `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(`${reference} ${title}`)}`;
}

const WORKPLACE = { onsite: 'onsite', hybrid: 'hybrid', remote: 'remote' } as const;

type Place = { city: string; country: string };

export function jobPlaces(d: { sites: CompanySite['key'][]; locations: Place[] }): Place[] {
  return [...d.sites.map(k => SITES[k]), ...d.locations];
}

export function siteLabel(d: { sites: CompanySite['key'][]; locations: Place[]; workplace: keyof typeof WORKPLACE }) {
  const places = jobPlaces(d).map(p => `${p.city}, ${p.country}`).join(' / ');
  return `${places} (${WORKPLACE[d.workplace]})`;
}

export function salaryLabel(s?: { min: number; max?: number; currency: string; period: 'month' | 'year'; gross: boolean }) {
  if (!s) return undefined;
  const fmt = (n: number) => n.toLocaleString('en-GB');
  const range = s.max ? `${fmt(s.min)}–${fmt(s.max)}` : `from ${fmt(s.min)}`;
  return `${s.currency} ${range} / ${s.period}${s.gross ? ' (gross)' : ''}`;
}
