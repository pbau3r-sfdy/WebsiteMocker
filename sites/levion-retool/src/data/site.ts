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
// Public key (safe in page source). Deliberately the SAME key as starflight-dynamics.com: Levion is a division of the same
// company, so enquiries land in the same mailbox. They stay distinguishable by the subject set on the form
// ("New contact message — Levion Materials"). The earlier Levion-only key (lab@, 5e41296e…) is unused; it can be
// swapped back here if Levion ever needs its own routing or quota.
export const WEB3FORMS_KEY = '9989c0a0-65ba-45e5-aebf-c070acaaf430';

// Newsletter signup: a Mailchimp hosted-form POST, the same mechanism as starflight-dynamics.com. Levion shares the
// Starflight Dynamics Mailchimp audience (same controller); Levion subscribers are marked with tag 2452 so they can be
// targeted separately. Values come from the embedded form "Levion Materials website" (Mailchimp: Forms → Embed).
export const NEWSLETTER = {
  action: 'https://starflight-dynamics.us17.list-manage.com/subscribe/post?u=fdebab77920a5ad885afd229c&id=88bca13b57&f_id=002cc2e1f0',
  tagId: '2452',
  honeypot: 'b_fdebab77920a5ad885afd229c_88bca13b57',   // bot trap: must stay empty and hidden
};
export const NEWSLETTER_ACTION = NEWSLETTER.action;

/** Called from the layout: a production build (base "/") must not ship placeholder integrations. */
export function assertLaunchReady(base: string) {
  if (base !== '/' && base !== '') return;   // sandbox builds may keep the placeholders
  const open = [
    WEB3FORMS_KEY.startsWith('REPLACE') && 'WEB3FORMS_KEY (contact form)',
    NEWSLETTER.action.startsWith('REPLACE') && 'NEWSLETTER.action (footer newsletter)',
  ].filter(Boolean);
  if (open.length) throw new Error(`[levion-retool] Not launch-ready, set in src/data/site.ts: ${open.join(', ')}`);
}
