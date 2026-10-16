import { SITES, type CompanySite } from './sites';

export const CAREERS_EMAIL = 'join-the-crew@starflight-dynamics.com';

// Company-wide benefits shown on every position. Empty → section hidden.
export const OFFERS: { title: string; text: string }[] = [
  { title: 'Responsibility',     text: 'A challenging position in the space industry with high responsibilities' },
  { title: 'Permanent contract', text: 'A permanent contract and 30 days of vacation' },
  { title: 'Flexibility',        text: 'Flexible hours' },
  { title: 'Benefits',           text: 'Employee benefits, such as fitness programmes, mobility allowance, and shopping vouchers' },
  { title: 'Share options',      text: "Access to the company's virtual share options programme" },
];

export const ABOUT = [
  "Starflight Dynamics (SFDY) is a Munich-based SpaceTech company building the foundational technologies for Europe's next generation of orbital infrastructure. Founded in 2023, we develop dual-use systems for space and defence: a green, water-based orbital propulsion stack and modular platforms for in-orbit operations.",
  "Working with partners such as the University of the German Armed Forces in Munich and the BAAINBw, we're a small, ambitious team moving fast from prototype to orbit. Join us and help shape how Europe operates, and defends its interests, in space.",
];

export const ENCOURAGEMENT = [
  "Research shows that people from underrepresented groups are statistically less likely to apply for a role unless they meet every single requirement listed. If that's you — but you're genuinely excited about building the foundations of Europe's orbital infrastructure — we'd strongly encourage you to apply anyway. We care more about drive and capability than a perfect match on paper.",
  'We believe diversity of background and perspective drives better engineering and better decisions, and we welcome applications regardless of gender, age, nationality, disability, religion, or sexual orientation. Severely disabled applicants will be given preference where equally qualified.',
];

export const EQUAL_OPPORTUNITY =
  'Starflight Dynamics welcomes applications regardless of gender, age, nationality, disability, religion, or sexual orientation.';

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

export function siteLabel(d: { sites: CompanySite['key'][]; locations: Place[]; workplace: keyof typeof WORKPLACE | (keyof typeof WORKPLACE)[] }) {
  const places = jobPlaces(d).map(p => `${p.city}, ${p.country}`).join(' / ');
  const modes = [d.workplace].flat().map(w => WORKPLACE[w]).join(' or ');
  return `${places} (${modes})`;
}

export function salaryLabel(s?: { min: number; max?: number; currency: string; period: 'month' | 'year'; gross: boolean }) {
  if (!s) return undefined;
  const fmt = (n: number) => n.toLocaleString('en-GB');
  const range = s.max ? `${fmt(s.min)}–${fmt(s.max)}` : `from ${fmt(s.min)}`;
  return `${s.currency} ${range} / ${s.period}${s.gross ? ' (gross)' : ''}`;
}
