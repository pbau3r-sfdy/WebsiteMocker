# Section lib: drops-core, drops-collection (pure logic). Sourced by verify-phase-11.sh.

LIB_JS=$(cat <<'JSEOF'
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
const [fx] = process.argv.slice(1);
const R = process.cwd();
const core = await import(pathToFileURL(path.join(R, '_scripts/lib/drops-core.mjs')).href);
const coll = await import(pathToFileURL(path.join(R, '_scripts/lib/drops-collection.mjs')).href);
const out = (name, ok) => console.log(`${ok ? 0 : 1}\t${name}`);
const throwsWith = (fn, re) => { try { fn(); return false; } catch (e) { return re ? re.test(e.message) : true; } };
const DAY = 86400000, now = Date.now();
const iso = (d) => core.isoWithOffset(new Date(now + d * DAY));
const good = (over = {}) => ({ id: 'a'.repeat(32), title: 'T', label: 'L', created: iso(-1), expires: iso(30), ...over });
const val = (fm, files = []) => core.validateDrop(fm, { folderId: 'a'.repeat(32), files, now });
const bad = (fm, files) => val(fm, files).errors.length > 0;

// ids
const a = core.newId(), b = core.newId();
out('newId matches ID_RE and two ids differ', core.ID_RE.test(a) && core.ID_RE.test(b) && a !== b);
out('shortId is 4 chars', core.shortId(a).length === 4);

// validation
out('valid drop has no errors', val(good()).errors.length === 0);
const g0 = good(); delete g0.expires;
out('missing expires rejected', bad(g0));
out('date-only expires rejected', bad(good({ expires: '2026-12-01' })));
out('expires without offset rejected', bad(good({ expires: '2026-12-01T10:00:00' })));
out('now+91d rejected (horizon)', bad(good({ expires: iso(91) })));
out('now+89d accepted', !bad(good({ expires: iso(89) })));
out('id != folder rejected', bad(good({ id: 'b'.repeat(32) })));
out('unknown key rejected', bad(good({ extra: 'x' })));
out('attachment ../x.pdf rejected', bad(good({ attachments: ['../x.pdf'] }), ['../x.pdf']));
out('attachment with space rejected', bad(good({ attachments: ['a b.pdf'] }), ['a b.pdf']));
out('attachment x.txt rejected', bad(good({ attachments: ['x.txt'] }), ['x.txt']));
out('attachment absent on disk rejected', bad(good({ attachments: ['x.pdf'] }), []));
out('attachment present accepted', !bad(good({ attachments: ['x.pdf'] }), ['x.pdf', 'drop.md']));
out('label with id rejected', bad(good({ label: 'see ' + 'a'.repeat(32) })));
out('label with 32-hex run rejected', bad(good({ label: 'x' + '0123456789abcdef'.repeat(2) })));
out('errors never contain full id', !val(good({ expires: iso(120) })).errors.join(' ').includes('a'.repeat(32)));

// statusOf
out('status active', core.statusOf(good({ expires: iso(30) }), now) === 'active');
out('status soon', core.statusOf(good({ expires: iso(3) }), now) === 'soon');
out('status expired', core.statusOf(good({ expires: iso(-1) }), now) === 'expired');
out('status invalid (unparsable)', core.statusOf(good({ expires: 'nope' }), now) === 'invalid');
out('status invalid (over horizon)', core.statusOf(good({ expires: iso(120) }), now) === 'invalid');
out('status withdrawn flag', core.statusOf(good({ withdrawn: true }), now) === 'withdrawn');
out('status withdrawn tombstone', core.statusOf(good(), now, new Set(['a'.repeat(32)])) === 'withdrawn');
const t0 = Date.parse('2026-07-01T12:00:00Z');
const s1 = core.statusOf(good({ expires: '2026-07-01T14:00:00+02:00' }), t0);
const s2 = core.statusOf(good({ expires: '2026-07-01T13:00:00+01:00' }), t0);
out('DST offsets for same instant agree', s1 === s2 && s1 === 'expired');

// frontmatter round trip
const fm = good({ attachments: ['x.pdf', 'y.pdf'], title: '[bracket] title' });
const rt = core.parseDrop(core.formatDrop(fm, 'Body text\n'));
out('format/parse round trip', JSON.stringify(rt.fm) === JSON.stringify(fm) && rt.body.trim() === 'Body text');
let pmsg = ''; try { core.parseDrop('---\nid: x\nSECRETVALUE\n---\n'); } catch (e) { pmsg = e.message; }
out('parse rejects junk line naming the line, not the value', /line 3/.test(pmsg) && !pmsg.includes('SECRETVALUE'));

// secrets (patterns assembled at runtime)
const hits = {
  'pem-private-key': '-----BEGIN ' + 'RSA PRIVATE KEY-----',
  'aws-access-key': 'AK' + 'IA' + 'ABCDEFGHIJKLMNOP',
  'github-token': 'gh' + 'p_' + 'a'.repeat(30),
  'slack-token': 'xo' + 'xb-' + '1234567890-abcdef',
  'bearer-token': 'Bearer ' + 'a'.repeat(24),
  'password-assignment': 'pass' + 'word: hunter2',
  'api-key-assignment': 'api_' + 'key = abc123',
};
for (const [n, t] of Object.entries(hits)) {
  const r = core.scanSecrets('x ' + t + ' y');
  out('scanSecrets flags ' + n, r.includes(n) && !r.join(' ').includes(t));
}
out('github_pat flagged', core.scanSecrets('github_' + 'pat_' + 'B'.repeat(30)).includes('github-token'));
out('scanSecrets clean text empty', core.scanSecrets('A harmless paragraph about launch vehicles.').length === 0);

// tombstones
const tj = core.addTombstone(null, 'c'.repeat(32), 'withdrawn', iso(0));
out('addTombstone then readTombstones', core.readTombstones(tj).has('c'.repeat(32)));
out('addTombstone is idempotent', JSON.parse(core.addTombstone(tj, 'c'.repeat(32), 'withdrawn', iso(0))).length === 1);
out('corrupt tombstone file fails closed', throwsWith(() => core.readTombstones('{nope'), /not valid JSON/));

// listing on generated fixtures
const goodDir = path.join(fx, 'good');
const ids = JSON.parse(fs.readFileSync(path.join(goodDir, 'ids.json'), 'utf8'));
const list = core.listDrops(goodDir, 'sfdy', now);
const st = (role) => list.find((d) => d.id === ids[role])?.status;
out('listDrops: active/soon/expired', st('active') === 'active' && st('soon') === 'soon' && st('expired') === 'expired');
out('listDrops: withdrawn flag and surviving tombstoned folder', st('withdrawnFlag') === 'withdrawn' && st('withdrawnTomb') === 'withdrawn');
out('listDrops: five drops, withdrawn.json is not an entry', list.length === 5);
out('listDrops rejects bad slug', throwsWith(() => core.listDrops(goodDir, '../x'), /slug/));
const esc = path.join(fx, 'esc'); fs.rmSync(esc, { recursive: true, force: true });
fs.mkdirSync(path.join(esc, 'sfdy'), { recursive: true });
fs.mkdirSync(path.join(esc, 'outside'), { recursive: true });
fs.symlinkSync(path.join(esc, 'outside'), path.join(esc, 'sfdy', 'd'.repeat(32)));
const el = core.listDrops(esc, 'sfdy', now);
out('symlinked drop folder reported invalid', el.length === 1 && el[0].status === 'invalid');

// resolveDrops gating
function site(name, wiring) {
  const d = path.join(fx, 'sites', name); fs.mkdirSync(d, { recursive: true });
  fs.writeFileSync(path.join(d, 'wiring.json'), JSON.stringify(wiring)); return d;
}
const on = site('on', { slug: 'sfdy', drops: { enabled: true } });
const off = site('off', { slug: 'sfdy' });
const SB = '/WebsiteMocker/sfdy';
const rd = (root, base, env) => coll.resolveDrops({ root, base, env, now });
const env = (e = {}) => ({ DROPS_DIR: goodDir, ...e });
const rOff = rd(off, '/', env());
out('resolveDrops: not enabled -> zero drops', rOff.enabled === false && rOff.drops.length === 0);
const rSb = rd(on, SB, env());
out('resolveDrops: sandbox without preview gated', rSb.gated === true && rSb.drops.length === 0);
out('resolveDrops: preview + CI throws', throwsWith(() => rd(on, SB, env({ DROPS_PREVIEW: '1', CI: 'true' }))));
out('resolveDrops: preview + GITHUB_ACTIONS throws', throwsWith(() => rd(on, SB, env({ DROPS_PREVIEW: '1', GITHUB_ACTIONS: 'true' }))));
out('resolveDrops: preview on base / throws', throwsWith(() => rd(on, '/', env({ DROPS_PREVIEW: '1' }))));
const rPv = rd(on, SB, env({ DROPS_PREVIEW: '1' }));
out('resolveDrops: sandbox preview serves active+soon', rPv.drops.length === 2);
const rPr = rd(on, '/', env());
const served = rPr.drops.map((d) => d.id).sort().join();
out('resolveDrops: prod returns active+soon only', served === [ids.active, ids.soon].sort().join());
out('resolveDrops: counts', rPr.counts.active === 1 && rPr.counts.soon === 1 && rPr.counts.expired === 1 && rPr.counts.withdrawn === 2);
const exDir = path.join(fx, 'bad-expiryless');
const ex = JSON.parse(fs.readFileSync(path.join(exDir, 'ids.json'), 'utf8')).expiryless;
let msg = ''; try { rd(on, '/', env({ DROPS_DIR: exDir })); } catch (e) { msg = e.message; }
out('resolveDrops: prod expiry-less throws with 4-char prefix only', msg.includes(ex.slice(0, 4)) && !msg.includes(ex));
out('resolveDrops: prod over-horizon throws', throwsWith(() => rd(on, '/', env({ DROPS_DIR: path.join(fx, 'bad-horizon') }))));
out('resolveDrops: REQUIRE + missing dir throws', throwsWith(() => rd(on, '/', { DROPS_DIR: path.join(fx, 'nope'), DROPS_REQUIRE: '1' })));
out('resolveDrops: missing dir without REQUIRE is empty', rd(on, '/', { DROPS_DIR: path.join(fx, 'nope') }).drops.length === 0);
out('resolveDrops: DROPS_DIR unset -> zero drops', rd(on, '/', {}).drops.length === 0);
out('resolveDrops: DROPS_DIR unset + REQUIRE throws', throwsWith(() => rd(on, '/', { DROPS_REQUIRE: '1' })));
out('resolveDropsDir has no default', coll.resolveDropsDir({}) === null);

// loader stub
const sets = []; let cleared = 0;
Object.assign(process.env, { DROPS_DIR: goodDir });
delete process.env.DROPS_PREVIEW; delete process.env.CI; delete process.env.GITHUB_ACTIONS;
const loader = coll.dropsLoader();
await loader.load({
  store: { clear() { cleared++; }, set(e) { sets.push(e); } },
  parseData: async ({ data }) => data,
  renderMarkdown: async (b) => ({ html: '<p>' + b + '</p>' }),
  generateDigest: (o) => 'd' + JSON.stringify(o).length,
  config: { root: pathToFileURL(on + '/'), base: '/' },
  logger: { info() {} },
});
out('loader: name, cleared store, set 2 entries', loader.name === 'websitemocker-drops' && cleared === 1 && sets.length === 2);
out('loader: entries carry data, body, rendered, digest', sets.every((e) => e.data && e.body && e.rendered && e.digest));
sets.length = 0;
await loader.load({
  store: { clear() {}, set(e) { sets.push(e); } },
  parseData: async ({ data }) => data, renderMarkdown: async () => ({}), generateDigest: () => 'x',
  config: { root: pathToFileURL(on + '/'), base: '/WebsiteMocker/sfdy' }, logger: { info() {} },
});
out('loader: sandbox without preview stores nothing', sets.length === 0);
JSEOF
)

sec_lib() {
  echo; echo "== lib =="
  rm -rf "${FX:?}/lib"; mkdir -p "$FX/lib"
  gen_fx good lib/good; gen_fx bad-expiryless lib/bad-expiryless; gen_fx bad-horizon lib/bad-horizon
  local rc name f
  while IFS=$'\t' read -r rc name; do
    [ -z "$name" ] && continue
    check "$name" "$rc"
  done < <(node --input-type=module -e "$LIB_JS" "$FX/lib" 2>&1 | sed -E 's/^([^01].*)$/1\t\1/')
  for f in _scripts/lib/drops-core.mjs _scripts/lib/drops-collection.mjs _scripts/lib/pdf-strip.mjs; do
    [ -f "$f" ] || continue
    check "no Math.random in $f" "$([ "$(grep -v '^ *//' "$f" | grep -c 'Math.random')" = 0 ] && echo 0 || echo 1)"
  done
  check "drops-core prints nothing (no console.*)" "$([ "$(grep -v '^ *//' _scripts/lib/drops-core.mjs | grep -c 'console\.')" = 0 ] && echo 0 || echo 1)"
  check "drops-core has no id/title logging" "$([ "$(grep -v '^ *//' _scripts/lib/drops-core.mjs | grep 'console' | grep -cE '\.(id|title)\b')" = 0 ] && echo 0 || echo 1)"
}
