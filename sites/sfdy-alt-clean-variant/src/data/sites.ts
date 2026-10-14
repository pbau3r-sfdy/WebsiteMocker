// Company sites that positions can be attached to. Imprint/legal pages stay
// GmbH-only; `employer` is shown on a position only when it differs from the
// site operator, so the Lithuanian entity appears on Vilnius posts alone.
export interface CompanySite {
  key:       'munich' | 'vilnius';
  city:      string;
  country:   string;   // ISO 3166-1 alpha-2
  street?:   string;
  postcode?: string;
  employer:  string;
  blurb:     string;
  // Lithuanian Labour Code: job ads must state the base salary or range.
  salaryRequired: boolean;
}

export const OPERATOR = 'Starflight Dynamics GmbH';

export const SITES: Record<CompanySite['key'], CompanySite> = {
  munich: {
    key: 'munich',
    city: 'Munich',
    country: 'DE',
    street: 'Tal 44',
    postcode: '80331',
    employer: OPERATOR,
    blurb: 'Headquarters. Systems engineering, orbital and platform technologies.',
    salaryRequired: false,
  },
  vilnius: {
    key: 'vilnius',
    city: 'Vilnius',
    country: 'LT',
    employer: 'Starflight Dynamics UAB',
    blurb: 'Tools, advanced concepts and operations preparation.',
    salaryRequired: true,
  },
};

export const SITE_KEYS = Object.keys(SITES) as [CompanySite['key'], ...CompanySite['key'][]];
