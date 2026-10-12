import { BOILERPLATE } from './positioning';
import { SITES, type CompanySite } from './sites';

export const CAREERS_EMAIL = 'join-the-crew@starflight-dynamics.com';

// Company-wide benefits shown on every position. Empty → section hidden.
// Being defined by SFDY; add entries here once they are available.
export const OFFERS: { title: string; text: string }[] = [];

export const ABOUT = BOILERPLATE;

export const EQUAL_OPPORTUNITY =
  'Starflight Dynamics is an equal-opportunity employer. Applications are assessed on qualifications and experience alone, regardless of gender, origin, religion, disability, age or sexual identity.';

// This reskin is a sandbox-only preview for internal review, so draft (placeholder)
// positions are built too; they carry the yellow "to be resolved" banner.
export const isPublished = (j: { data: { open?: boolean; draft: boolean } }) =>
  j.data.open !== false;

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
