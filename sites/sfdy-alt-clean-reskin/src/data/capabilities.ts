/** Capabilities: shared by the home grid and the Capabilities page. */
export interface Capability {
  id: string; img: string; site: 'Munich' | 'Vilnius';
  title: string; short: string; body: string;
  line?: string; home?: boolean; // home-page teaser
}

export const CAPABILITIES: Capability[] = [
  {
    id: 'propulsion', img: 'propulsion.webp', site: 'Munich', title: 'Propulsion', short: 'Propulsion', home: true,
    line: 'Dual-mode, water-based propulsion that combines fast manoeuvres and long endurance in one technology.',
    body: 'Developed under contract in the REAGAN programme, our water-based propulsion uses the same hardware for both high-thrust manoeuvres and high-efficiency endurance. Water is safe to handle, store and launch.',
  },
  {
    id: 'payloads', img: 'payloads.webp', site: 'Munich', title: 'Payloads', short: 'Payloads', home: true,
    line: 'Payloads for operations in orbit, designed for use on our platforms and on others’.',
    body: 'We develop our payloads together with our platforms, so that payload, platform and mission fit from the outset. They can also be integrated on other platforms.',
  },
  {
    id: 'platforms', img: 'platforms.webp', site: 'Munich', title: 'High-endurance platforms', short: 'Platforms', home: true,
    line: 'High-endurance platforms designed to sustain close-proximity operations.',
    body: 'Our platforms stay in orbit for long periods, moving and working close to other objects: carrying out inspection, providing escort and positioning where it matters. They combine commercial subsystems with our own propulsion and payloads in a single platform; our demonstration mission, OVERWATCH, is in preparation.',
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
