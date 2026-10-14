// Payload vectors for the shared transformRequest (TRANSFORM_FACTORY_SRC).
const HEX = '0123456789abcdef0123456789abcdef';
const S = { sanitise: true, exclude: [], eventNames: {} };
const N = { sanitise: false, exclude: [], eventNames: {} };
const TOK = 'A'.repeat(44);
const SLUG = 'a-'.repeat(22) + 'z'; // 45 chars, hyphenated
export const VECTORS = [
  { name: 'fragment stripped, query kept (sanitise false)', cfg: N, input: { n: 'pageview', u: 'https://e.com/a/b?x=1#frag' }, expect: { n: 'pageview', u: 'https://e.com/a/b?x=1' } },
  { name: 'fragment stripped plain url (sanitise false)', cfg: N, input: { n: 'pageview', u: 'https://e.com/a/b#frag' }, expect: { n: 'pageview', u: 'https://e.com/a/b' } },
  { name: 'query and fragment dropped (sanitise true)', cfg: S, input: { n: 'pageview', u: 'https://e.com/a/b?x=1#frag' }, expect: { n: 'pageview', u: 'https://e.com/a/b' } },
  { name: 'drop id masked', cfg: S, input: { n: 'pageview', u: 'https://e.com/d/' + HEX + '/' }, expect: { n: 'pageview', u: 'https://e.com/d/_ID_/' } },
  { name: 'drop id masked before file', cfg: S, input: { n: 'pageview', u: 'https://e.com/d/' + HEX + '/file.pdf' }, expect: { n: 'pageview', u: 'https://e.com/d/_ID_/file.pdf' } },
  { name: '44-char token segment masked', cfg: S, input: { n: 'pageview', u: 'https://e.com/t/' + TOK + '/x' }, expect: { n: 'pageview', u: 'https://e.com/t/_ID_/x' } },
  { name: '45-char hyphenated slug kept', cfg: S, input: { n: 'pageview', u: 'https://e.com/news/' + SLUG }, expect: { n: 'pageview', u: 'https://e.com/news/' + SLUG } },
  { name: 'props object cleaned', cfg: S, input: { n: 'File Download', u: 'https://e.com/', p: { url: 'https://e.com/d/' + HEX + '/x.pdf?sig=1#y' } }, expect: { n: 'File Download', u: 'https://e.com/', p: { url: 'https://e.com/d/_ID_/x.pdf' } } },
  { name: 'props JSON string cleaned, stays string', cfg: S, input: { n: 'x', u: 'https://e.com/', p: JSON.stringify({ url: 'https://e.com/d/' + HEX + '/x.pdf?sig=1#y' }) }, expect: { n: 'x', u: 'https://e.com/', p: JSON.stringify({ url: 'https://e.com/d/_ID_/x.pdf' }) } },
  { name: 'referrer reduced to origin', cfg: S, input: { n: 'pageview', u: 'https://e.com/', r: 'https://ref.com/path?q=1#x' }, expect: { n: 'pageview', u: 'https://e.com/', r: 'https://ref.com' } },
  { name: 'exclude prefix drops event', cfg: { sanitise: true, exclude: ['/private/'], eventNames: {} }, input: { n: 'pageview', u: 'https://e.com/private/x' }, expect: null },
  { name: 'exclude does not drop other paths', cfg: { sanitise: true, exclude: ['/private/'], eventNames: {} }, input: { n: 'pageview', u: 'https://e.com/public/x' }, expect: { n: 'pageview', u: 'https://e.com/public/x' } },
  { name: 'eventNames remap File Download', cfg: { sanitise: true, exclude: [], eventNames: { 'File Download': 'Download', 'Form: Submission': 'Form' } }, input: { n: 'File Download', u: 'https://e.com/' }, expect: { n: 'Download', u: 'https://e.com/' } },
  { name: 'eventNames remap Form: Submission', cfg: { sanitise: true, exclude: [], eventNames: { 'File Download': 'Download', 'Form: Submission': 'Form' } }, input: { n: 'Form: Submission', u: 'https://e.com/' }, expect: { n: 'Form', u: 'https://e.com/' } },
  { name: '404 path prop masked', cfg: S, input: { n: '404', u: 'https://e.com/d/' + HEX + '/missing', p: { path: '/d/' + HEX + '/missing' } }, expect: { n: '404', u: 'https://e.com/d/_ID_/missing', p: { path: '/d/_ID_/missing' } } },
];
