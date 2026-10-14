// Payload vectors for the shared transformRequest (TRANSFORM_FACTORY_SRC).
const HEX = '0123456789abcdef0123456789abcdef';
const S = { sanitise: true, exclude: [], eventNames: {} };
const N = { sanitise: false, exclude: [], eventNames: {} };
const TOK = 'A'.repeat(44);
const SLUG = 'a-'.repeat(22) + 'z'; // 45 chars, hyphenated
const UUID = '123e4567-e89b-12d3-a456-426614174000';
const EXB = { sanitise: true, exclude: ['/preview/'], eventNames: {}, base: '/WebsiteMocker/fx' };
const EX0 = { sanitise: true, exclude: ['/preview/'], eventNames: {}, base: '/' };
const SBX = 'https://pbau3r-sfdy.github.io';
const kept = (cfg, name, u) => ({ name, cfg, input: { n: 'pageview', u }, expect: { n: 'pageview', u } });
const dropped = (cfg, name, u) => ({ name, cfg, input: { n: 'pageview', u }, expect: null });
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
  // CR-01: exclude under the sandbox base, segment boundary, normalisation
  dropped(EXB, 'exclude matches under sandbox base', SBX + '/WebsiteMocker/fx/preview/x'),
  dropped(EXB, 'exclude matches exact dir under sandbox base (no trailing slash)', SBX + '/WebsiteMocker/fx/preview'),
  dropped(EXB, 'exclude with query under sandbox base', SBX + '/WebsiteMocker/fx/preview/x?a=1#f'),
  kept(EXB, 'exclude keeps other site under /WebsiteMocker', SBX + '/WebsiteMocker/other/preview/x'),
  kept(EXB, 'exclude keeps /previews (segment boundary, sandbox)', SBX + '/WebsiteMocker/fx/previews/x'),
  kept(EX0, 'exclude keeps /previews (segment boundary, base /)', 'https://e.com/previews/x'),
  dropped(EX0, 'exclude matches at base /', 'https://e.com/preview/x'),
  dropped(EX0, 'exclude: double slash collapsed', 'https://e.com//preview/x'),
  dropped(EX0, 'exclude: percent-encoded segment decoded', 'https://e.com/%70review/x'),
  dropped(EX0, 'exclude: dot segments resolved', 'https://e.com/a/../preview/x'),
  dropped(EX0, 'exclude: case-insensitive', 'https://e.com/Preview/x'),
  dropped(EXB, 'exclude: double slash under sandbox base', SBX + '//WebsiteMocker//fx//preview/x'),
  // WR-01: dashed UUIDs, emails, mixed tokens
  { name: 'dashed UUID segment masked', cfg: S, input: { n: 'pageview', u: 'https://e.com/u/' + UUID + '/x' }, expect: { n: 'pageview', u: 'https://e.com/u/_ID_/x' } },
  { name: 'email segment masked', cfg: S, input: { n: 'pageview', u: 'https://e.com/people/jane.doe@example.com' }, expect: { n: 'pageview', u: 'https://e.com/people/_ID_' } },
  { name: 'percent-encoded email segment masked', cfg: S, input: { n: 'pageview', u: 'https://e.com/people/jane%40example.com/x' }, expect: { n: 'pageview', u: 'https://e.com/people/_ID_/x' } },
  { name: 'base64url-style mixed token masked', cfg: S, input: { n: 'pageview', u: 'https://e.com/t/Ab3-_Zk9QwErTyUiOpAsDfGh/x' }, expect: { n: 'pageview', u: 'https://e.com/t/_ID_/x' } },
  kept(S, 'long lowercase hyphenated slug with digits kept', 'https://e.com/news/launch-of-the-2026-propulsion-programme'),
  kept(S, 'short mixed segment kept', 'https://e.com/news/Q3-2026'),
  { name: '404 path prop: email masked', cfg: S, input: { n: '404', u: 'https://e.com/jane@example.com', p: { path: '/jane@example.com' } }, expect: { n: '404', u: 'https://e.com/_ID_', p: { path: '/_ID_' } } },
  { name: '404 path prop: coarse first segment kept', cfg: S, input: { n: '404', u: 'https://e.com/old', p: { path: '/old' } }, expect: { n: '404', u: 'https://e.com/old', p: { path: '/old' } } },
];
