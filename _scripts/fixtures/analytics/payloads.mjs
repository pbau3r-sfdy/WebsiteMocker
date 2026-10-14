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
  // Phase 11 drop whitelist (D-07)
  ...dropVectors(),
];

function dropVectors() {
  const D = { sanitise: true, exclude: [], eventNames: {}, base: '/', drops: true };
  const DP = { ...D, dropProps: true };
  const DB = { ...D, base: '/WebsiteMocker/fx' };
  const U = 'https://e.com/d/' + HEX + '/';
  const M = 'https://e.com/d/_ID_/';
  const ev = (cfg, name, n, u, p, exp) => ({ name, cfg, input: p === undefined ? { n, u } : { n, u, p }, expect: exp });
  return [
    ev(D, 'drop: pageview kept and masked', 'pageview', U, undefined, { n: 'pageview', u: M }),
    { name: 'drop: pageview referrer reduced', cfg: D, input: { n: 'pageview', u: U, r: 'https://ref.com/d/' + HEX + '/?q=1' }, expect: { n: 'pageview', u: M, r: 'https://ref.com' } },
    ev(D, 'drop: Drop Download props removed', 'Drop Download', U, { url: U + 'secret-offer.pdf' }, { n: 'Drop Download', u: M }),
    ev(D, 'drop: Drop Download JSON-string props removed', 'Drop Download', U, JSON.stringify({ url: U + 'x.pdf' }), { n: 'Drop Download', u: M }),
    ev(D, 'drop: Drop Download label ignored when props off', 'Drop Download', U, { label: 'secret' }, { n: 'Drop Download', u: M }),
    ev(DP, 'drop: Drop Download keeps only label when props on', 'Drop Download', U, { label: 'q3-deck', url: U + 'x.pdf', other: 'y' }, { n: 'Drop Download', u: M, p: { label: 'q3-deck' } }),
    ev(DP, 'drop: Drop Download label masked when id-like', 'Drop Download', U, { label: HEX }, { n: 'Drop Download', u: M, p: { label: '_ID_' } }),
    ev(DP, 'drop: Drop Download without label drops props', 'Drop Download', U, { url: U + 'x.pdf' }, { n: 'Drop Download', u: M }),
    ev(D, 'drop: File Download dropped', 'File Download', U, { url: U + 'x.pdf' }, null),
    ev(D, 'drop: Outbound Link dropped', 'Outbound Link: Click', U, { url: 'https://evil.example/x' }, null),
    ev(D, 'drop: Form Submission dropped', 'Form: Submission', U, undefined, null),
    ev(D, 'drop: unknown custom event dropped', 'Whatever', U, undefined, null),
    ev(D, 'drop: 404 kept, path prop masked', '404', 'https://e.com/d/' + HEX + '/missing', { path: '/d/' + HEX + '/missing' }, { n: '404', u: M + 'missing', p: { path: '/d/_ID_/missing' } }),
    ev(DB, 'drop: sandbox base-prefixed path matches', 'File Download', SBX + '/WebsiteMocker/fx/d/' + HEX + '/', undefined, null),
    ev(D, 'drop: uppercase hex matches', 'File Download', 'https://e.com/d/' + HEX.toUpperCase() + '/', undefined, null),
    ev(D, 'drop: percent-encoded segment matches', 'File Download', 'https://e.com/%64/' + HEX + '/', undefined, null),
    ev(D, 'drop: dot segments resolve', 'File Download', 'https://e.com/x/../d/' + HEX + '/', undefined, null),
    ev(D, 'drop: query and fragment ignored for matching', 'File Download', U + '?a=1#f', undefined, null),
    ev(D, 'drop: no trailing slash matches', 'File Download', 'https://e.com/d/' + HEX, undefined, null),
    ev(D, 'drop: /d/ alone is not a drop page', 'File Download', 'https://e.com/d/', undefined, { n: 'File Download', u: 'https://e.com/d/' }),
    ev(D, 'drop: /d/short/ is not a drop page', 'File Download', 'https://e.com/d/short/', undefined, { n: 'File Download', u: 'https://e.com/d/short/' }),
    ev(D, 'drop: /data/<hex>/ is not a drop page', 'File Download', 'https://e.com/data/' + HEX + '/', undefined, { n: 'File Download', u: 'https://e.com/data/_ID_/' }),
    ev(D, 'drop: 31-hex is not a drop page', 'File Download', 'https://e.com/d/' + HEX.slice(1) + '/', undefined, { n: 'File Download', u: 'https://e.com/d/' + HEX.slice(1) + '/' }),
    ev(D, 'drops site: File Download kept on non-drop page', 'File Download', 'https://e.com/news/x', { url: 'https://e.com/a.pdf' }, { n: 'File Download', u: 'https://e.com/news/x', p: { url: 'https://e.com/a.pdf' } }),
    ev(D, 'drops site: outbound kept on non-drop page', 'Outbound Link: Click', 'https://e.com/news/x', { url: 'https://o.example/' }, { n: 'Outbound Link: Click', u: 'https://e.com/news/x', p: { url: 'https://o.example/' } }),
    ev(S, 'no drops cfg: File Download kept on drop-shaped path', 'File Download', U, undefined, { n: 'File Download', u: M }),
  ];
}
