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
