// Single source of truth for company facts used across imprint, privacy, contact, footer and structured data.
export const SITE = {
  name: 'Levion Materials',
  tagline: 'Advanced materials made in space',
  url: 'https://www.levion-materials.com',
  division: 'Levion Materials is the Special Materials division of Starflight Dynamics GmbH.',
};

export const COMPANY = {
  name: 'Starflight Dynamics GmbH',
  street: 'Tal 44',
  postcode: '80331',
  city: 'Munich',
  country: 'Germany',
  register: 'Amtsgericht München, HRB 282254',
  vat: 'DE360871568',
  ceo: 'Dr. Philipp Bauer',
  ceoTitle: 'Managing Director',
};

export const EMAIL = {
  general: 'lab@levion-materials.com',
  press: 'lab@levion-materials.com',
  careers: 'careers@levion-materials.com',
};

export const SOCIALS: { label: string; href: string }[] = [
  { label: 'LinkedIn',  href: 'https://www.linkedin.com/company/levion-materials/' },
  { label: 'Instagram', href: 'https://www.instagram.com/levion_materials/' },
];

// Web3Forms public access key for the contact form (same mechanism as starflight-dynamics.com).
// Public key (safe in page source), created for lab@levion-materials.com at web3forms.com, so messages are delivered to EMAIL.general.
export const WEB3FORMS_KEY = '5e41296e-dbbc-4bd0-8540-494bf9dd9898';

// Newsletter signup endpoint (same mechanism as starflight-dynamics.com: a Mailchimp hosted form POST).
// Create an audience for Levion in Mailchimp, copy its "Embedded form" action URL and paste it here.
export const NEWSLETTER_ACTION = 'REPLACE_WITH_LEVION_MAILCHIMP_FORM_ACTION_URL';

/** Called from the layout: a production build (base "/") must not ship placeholder integrations. */
export function assertLaunchReady(base: string) {
  if (base !== '/' && base !== '') return;   // sandbox builds may keep the placeholders
  const open = [
    WEB3FORMS_KEY.startsWith('REPLACE') && 'WEB3FORMS_KEY (contact form)',
    NEWSLETTER_ACTION.startsWith('REPLACE') && 'NEWSLETTER_ACTION (footer newsletter)',
  ].filter(Boolean);
  if (open.length) throw new Error(`[levion-retool] Not launch-ready, set in src/data/site.ts: ${open.join(', ')}`);
}
