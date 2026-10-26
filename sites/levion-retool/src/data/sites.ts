// Company sites that positions can be attached to. Levion Materials operates from Munich only,
// as a division of Starflight Dynamics GmbH (same address as the company headquarters).
export interface CompanySite {
  key:       'munich';
  city:      string;
  country:   string;   // ISO 3166-1 alpha-2
  street?:   string;
  postcode?: string;
  employer:  string;
  blurb:     string;
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
    blurb: 'Special Materials division of Starflight Dynamics GmbH: microgravity crystal growth, in-space materials programmes and payloads.',
    salaryRequired: false,
  },
};

export const SITE_KEYS = Object.keys(SITES) as [CompanySite['key'], ...CompanySite['key'][]];
