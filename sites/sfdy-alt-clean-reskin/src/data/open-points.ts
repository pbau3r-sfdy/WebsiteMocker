/** Open points to resolve before launch. Each <Tbd id> marker on the site points to one
    entry; the /open-points page lists them with links to every place they appear. */
export interface OpenPoint {
  id: string;
  title: string;
  detail: string;
  owner?: string;
  where: { label: string; path: string }[]; // path without base, anchor added automatically
}

export const OPEN_POINTS: OpenPoint[] = [
  {
    id: 'vilnius-address', title: 'Vilnius street address',
    detail: 'Street address of Starflight Dynamics UAB. Needed in the Imprint, on the Contact page and for the joint-controller clause in the Privacy policy.',
    where: [
      { label: 'Imprint · Lithuanian entity', path: '/imprint' },
      { label: 'Contact · Vilnius address', path: '/contact' },
      { label: 'Privacy · 01 Controller', path: '/privacy-policy' },
    ],
  },
  {
    id: 'uab-vat', title: 'Starflight Dynamics UAB VAT number',
    detail: 'VAT number of the Lithuanian entity, if registered. Otherwise remove the line from the Imprint.',
    where: [{ label: 'Imprint · Lithuanian entity', path: '/imprint' }],
  },
  {
    id: 'careers-mailbox', title: 'careers@ mailbox',
    detail: 'careers@starflight-dynamics.com is used for applications, the open application and the Contact page, but the mailbox is not set up yet.',
    where: [
      { label: 'Contact · Careers', path: '/contact' },
      { label: 'Position page · banner', path: '/jobs/jedi-master' },
    ],
  },
  {
    id: 'job-listings', title: 'Real job listings',
    detail: 'All 30 positions are placeholders (dummy content). Replace them with the real openings and their salaries; Vilnius positions must state a salary.',
    where: [
      { label: 'Careers · banner', path: '/jobs' },
      { label: 'Position page · banner', path: '/jobs/jedi-master' },
    ],
  },
  {
    id: 'offers', title: '“What SFDY offers” benefits',
    detail: 'The benefits section on position pages is empty and therefore hidden. Write the offer (benefits, equipment, relocation, etc.) once for all positions.',
    where: [{ label: 'Position page · banner', path: '/jobs/jedi-master' }],
  },
];

export const pointById = (id: string) => {
  const p = OPEN_POINTS.find(o => o.id === id);
  if (!p) throw new Error(`Unknown open point "${id}" (add it to src/data/open-points.ts)`);
  return p;
};
