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
    id: 'job-listings', title: 'Real job listings',
    detail: 'All 30 positions are placeholders (dummy content). Replace them with the real openings.',
    where: [
      { label: 'Careers · banner', path: '/jobs' },
      { label: 'Position page · banner', path: '/jobs/jedi-master' },
    ],
  },
];

/** Ideas to leverage later. Not open points: nothing on the site depends on them, so they are
    listed on /open-points without a yellow marker and not counted. */
export const PARKED: { title: string; detail: string }[] = [
  {
    title: 'Reachable by public transport',
    detail: 'Both offices are reachable by public transport. Possible perk for “What SFDY offers” once the perks are defined; not used on the site for now.',
  },
  {
    title: 'Name the Bundeswehr in the positioning line',
    detail: 'Once Bundeswehr contracts are running. Announce it as a news item first.',
  },
  {
    title: '“Programmes and partners”',
    detail: 'Rename “Ecosystem partners” on Home to “Programmes and partners” and add programme references (e.g. REAGAN), once we are free to show them.',
  },
];

export const pointById = (id: string) => {
  const p = OPEN_POINTS.find(o => o.id === id);
  if (!p) throw new Error(`Unknown open point "${id}" (add it to src/data/open-points.ts)`);
  return p;
};
