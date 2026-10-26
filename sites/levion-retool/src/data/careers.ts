import { SITES, type CompanySite } from './sites';
import { EMAIL } from './site';

export const CAREERS_EMAIL = EMAIL.careers;

// Company-wide benefits shown on every position. Empty → section hidden.
// Levion lists its benefits per position in the job text, so there is no shared block.
export const OFFERS: { title: string; text: string }[] = [];

export const ABOUT = [
  'Levion is a space technology company developing hardware to produce space-grown, high-quality semiconductor crystalline material for applications in radiation detection, medical imaging, and other high-performance sectors. Our flight-ready payload is targeting launch in 2028.',
  'We are a small, high-output team working across the full development cycle, from system design and ESA review through to flight qualification. Levion Materials is the Special Materials division of Starflight Dynamics GmbH.',
];

export const ENCOURAGEMENT = [
  "Research shows that people from underrepresented groups are statistically less likely to apply for a role unless they meet every single requirement listed. If that's you — but you're genuinely excited about building Europe's in-space materials capability — we'd strongly encourage you to apply anyway. We care more about drive and capability than a perfect match on paper.",
  'We believe diversity of background and perspective drives better engineering and better decisions, and we welcome applications regardless of gender, age, nationality, disability, religion, or sexual orientation. Severely disabled applicants will be given preference where equally qualified.',
];

export const EQUAL_OPPORTUNITY =
  'Levion Materials welcomes applications regardless of gender, age, nationality, disability, religion, or sexual orientation.';

// Departments listed after the technical ones on the overview.
const NON_TECHNICAL = ['General'];
export const isTechnical = (dept: string) => !NON_TECHNICAL.includes(dept);

// Drafts are visible in `astro dev` and in sandbox builds (base `/WebsiteMocker/<slug>`),
// never in a production build (base `/`, see /wm-publish).
const SANDBOX = import.meta.env.BASE_URL !== '/';
export const isPublished = (j: { data: { open?: boolean; draft: boolean } }) =>
  j.data.open !== false && (import.meta.env.DEV || SANDBOX || !j.data.draft);

export function applyHref(reference: string | undefined, title: string) {
  return `mailto:${CAREERS_EMAIL}?subject=${encodeURIComponent(reference ? `${reference} ${title}` : title)}`;
}

// Position pages live at the site root (https://www.levion-materials.com/<slug>), as on the original site.
export const jobHref = (id: string) => `${import.meta.env.BASE_URL.replace(/\/$/, '')}/${id}`;

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
