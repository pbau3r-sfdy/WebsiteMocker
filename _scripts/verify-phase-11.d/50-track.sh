# Section track: drop tracking through sanitised mode (DROP-06, D-07). Sourced by verify-phase-11.sh.

sec_track() {
  echo; echo "== track =="
  local T="$FX/track" AF=_scripts/fixtures/analytics ES id out w wp site=https://www.example.com rc
  ES="$AF/eval-snippet.mjs"; w="$AF/wiring/drops-on.json"; wp="$AF/wiring/drops-props-on.json"
  rm -rf "${FX:?}/track"; mkdir -p "$T"

  # (1) shared payload vectors, drop group
  rc=0
  while IFS= read -r line; do
    case "$line" in
      "PASS "*) check "vector ${line#PASS }" 0 ;;
      "FAIL "*) check "vector ${line#FAIL }" 1 ;;
    esac
  done < <(node --input-type=module -e "
    import { TRANSFORM_FACTORY_SRC } from './_scripts/lib/plausible-snippet.mjs';
    import { VECTORS } from './$AF/payloads.mjs';
    const dv = VECTORS.filter(v => /^drops? ?(site)?:|^no drops cfg/.test(v.name));
    if (dv.length < 20) console.log('FAIL drop vector count ' + dv.length);
    for (const v of dv) {
      const fn = new Function('return (' + TRANSFORM_FACTORY_SRC + ')')()(v.cfg);
      const got = fn(JSON.parse(JSON.stringify(v.input)));
      console.log((JSON.stringify(got) === JSON.stringify(v.expect) ? 'PASS ' : 'FAIL ') + v.name);
    }" 2>&1)

  # (2) emitted snippet, random id, every event type
  id=$(node -p "require('crypto').randomBytes(16).toString('hex')")
  local U="$site/d/$id/"
  out=$(node "$ES" "$w" / "$site" "$U" pageview '' "https://ref.example/d/$id/?x=1")
  check "pageview: id absent, masked path" "$([ "$(echo "$out" | grep -c "$id")" = 0 ] && echo "$out" | grep -q '/d/_ID_/' && echo 0 || echo 1)"
  out=$(node "$ES" "$w" / "$site" "$U" 'Drop Download' "{\"url\":\"$U/secret-offer.pdf\"}")
  check "Drop Download: id absent" "$([ "$(echo "$out" | grep -c "$id")" = 0 ] && echo 0 || echo 1)"
  check "Drop Download: kept, no p key" "$(echo "$out" | grep -q '"n":"Drop Download"' && ! echo "$out" | grep -q '"p"' && echo 0 || echo 1)"
  out=$(node "$ES" "$w" / "$site" "$U" 'File Download' "{\"url\":\"$U/x.pdf\"}")
  check "File Download on drop page is null" "$([ "$out" = null ] && echo 0 || echo 1)"
  out=$(node "$ES" "$w" / "$site" "$U" 'Outbound Link: Click' "{\"url\":\"https://o.example/$id\"}")
  check "Outbound Link on drop page is null" "$([ "$out" = null ] && echo 0 || echo 1)"
  out=$(node "$ES" "$w" / "$site" "$site/d/$id/gone" 404 "{\"path\":\"/d/$id/gone\"}")
  check "404: kept, id absent" "$([ "$(echo "$out" | grep -c "$id")" = 0 ] && echo "$out" | grep -q '"n":"404"' && echo 0 || echo 1)"
  out=$(node "$ES" "$wp" / "$site" "$U" 'Drop Download' "{\"label\":\"q3-deck\",\"url\":\"$U/x.pdf\"}")
  check "props on: Drop Download keeps only label" "$(echo "$out" | grep -q '"p":{"label":"q3-deck"}' && [ "$(echo "$out" | grep -c "$id")" = 0 ] && echo 0 || echo 1)"

  # (3) non-drop control
  out=$(node "$ES" "$w" / "$site" "$site/news/x" 'File Download' '{"url":"https://example.com/a.pdf"}')
  check "non-drop page keeps File Download" "$(echo "$out" | grep -q '"n":"File Download"' && echo 0 || echo 1)"
  out=$(node "$ES" "$w" / "$site" "$site/news/x" 'Outbound Link: Click' '{"url":"https://o.example/"}')
  check "non-drop page keeps outbound event" "$(echo "$out" | grep -q '"n":"Outbound Link: Click"' && echo 0 || echo 1)"

  # (4) sites without drops get a byte-identical snippet
  out=$(node --input-type=module -e "
    import fs from 'node:fs';
    import { resolveIdentity, buildSnippet } from './_scripts/lib/plausible-snippet.mjs';
    const A = JSON.parse(fs.readFileSync('$AF/wiring/prod-script.json', 'utf8'));
    const B = JSON.parse(fs.readFileSync('$w', 'utf8')); delete B.drops;
    const C = JSON.parse(fs.readFileSync('$w', 'utf8'));
    const code = (x) => buildSnippet(resolveIdentity(x, { sandbox: false, site: 'https://www.example.com' }), x, { base: '/', slug: 'fx' }).code;
    console.log(code(A) === code(B) && !code(A).includes('\"drops\"') && code(C).includes('\"drops\":true') && !code(C).includes('\"dropProps\"') ? 'OK' : 'BAD');
  " 2>&1)
  check "no drops -> byte-identical snippet, cfg gains no drops key" "$([ "$out" = OK ] && echo 0 || echo 1)"

  # (5) production build with fixture drops
  gen_fx good track/good
  local a; a=$(fx_id active track/good)
  build_prod_fx track "$PWD/$T/good"; rc=$?
  check "track: production build with fixture exits 0" "$rc"
  [ "$rc" = 0 ] || { tail -20 "$T/build.log"; return; }
  local page="$OUT/d/$a/index.html" sc
  check "active id occurs only inside its own dist folder" "$([ -z "$(grep -rIl -- "$a" "$OUT" 2>/dev/null | grep -v -F "$OUT/d/$a/")" ] && echo 0 || echo 1)"
  check "id absent from the injected inline snippet (index.html)" "$([ "$(grep -c -- "$a" "$OUT/index.html")" = 0 ] && echo 0 || echo 1)"
  sc=$(node -e "
    const s = require('fs').readFileSync('$page', 'utf8');
    const m = [...s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].map(x => x[1]).join('\n');
    console.log(m.includes('$a') ? 'LEAK' : 'CLEAN');")
  check "id absent from every script on the drop page" "$([ "$sc" = CLEAN ] && echo 0 || echo 1)"
  check "drop page has data-drop-download hook" "$(grep -q 'data-drop-download' "$page" && echo 0 || echo 1)"
  check "drop page fires Drop Download goal" "$(grep -q "Drop Download" "$page" && echo 0 || echo 1)"
  check "props false: no data-drop-label in page" "$([ "$(grep -c 'data-drop-label=' "$page")" = 0 ] && echo 0 || echo 1)"
  check "props false: fixture label text absent from page" "$([ "$(grep -c 'fixture-active' "$page")" = 0 ] && echo 0 || echo 1)"
}
