/** Capabilities: shared by the home grid and the Capabilities page. */
export interface Capability {
  id: string; img: string; site: 'Munich' | 'Vilnius';
  title: string; short: string; body: string;
  line?: string; home?: boolean; // home-page teaser
  status?: string; statusLink?: { text: string; href: string }; // public facts only
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'propulsion', img: 'propulsion.webp', site: 'Munich', title: 'Propulsion', short: 'Propulsion', home: true,
    line: 'Dual-mode, water-based propulsion that combines fast manoeuvres and long endurance in one technology.',
    status: 'Under contract in the REAGAN programme since July 2025.',
    statusLink: { text: 'On track, first major milestones cleared →', href: '/news/2025-11-04-reagan-milestone' },
    body: 'Our water-based propulsion uses the same hardware for both high-thrust manoeuvres and high-efficiency endurance. Water is safe to handle, store and launch.',
  },
  {
    id: 'payloads', img: 'payloads.webp', site: 'Munich', title: 'Payloads', short: 'Payloads', home: true,
    line: 'The equipment that enables our missions, built for our own platforms and ready to integrate on others.',
    body: 'We develop our payloads together with our platforms, so that payload, platform and mission fit from the outset. They can also be integrated on other platforms.',
  },
  {
    id: 'platforms', img: 'platforms.webp', site: 'Munich', title: 'High-endurance platforms', short: 'Platforms', home: true,
    line: 'High-endurance platforms, producible at scale, built around our own propulsion and payloads.',
    body: 'Our platforms maintain proximity to other objects for inspection and space domain awareness. They combine commercial subsystems with our proprietary technology in a hardened design, producible at scale.',
    status: 'Demonstration mission OVERWATCH in preparation.',
  },
  {
    id: 'mission-preparation', img: 'concept-development.webp', site: 'Vilnius', title: 'Concept development and mission preparation', short: 'Mission preparation', home: true,
    line: 'Simulation to plan and rehearse missions, from first concept to the final run before flight.',
    body: 'Our simulation systems let space forces think through operations before they happen. Large forces use them to develop how they operate at scale; smaller forces, to see what they can achieve, alone and with partners.',
  },
  {
    id: 'derivatives', img: 'derivatives.webp', site: 'Vilnius', title: 'Derivatives', short: 'Derivatives',
    body: 'What we build for defence also has uses beyond that original purpose. We carry our technologies into dual-use and commercial applications, and our simulation tools into training and analysis.',
  },
];
