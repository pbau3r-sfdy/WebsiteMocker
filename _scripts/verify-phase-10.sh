#!/usr/bin/env bash
# verify-phase-10.sh — Fixture-only verification for Phase 10: Analytics (ANLY-08)
# Usage: bash _scripts/verify-phase-10.sh [env|snippet|assert|sanitise|gate|notfound|all]
# Exit codes: 0 = all selected checks pass, 1 = one or more failures, 2 = invalid argument
#
# Fixtures live in _scripts/fixtures/analytics/. The integration is driven through a stub
# astro:config:setup hook; the gate CLI runs with WM_ROOT pointing at a temp root.
# No real site is touched, no network, no Plausible account.

set -euo pipefail
PASS=0
FAIL=0

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FX="$REPO/_scripts/fixtures/analytics"
SC="$REPO/_scripts"
SB=/WebsiteMocker/fx
TMPS=()
cleanup() { for d in "${TMPS[@]:-}"; do [ -n "$d" ] && rm -rf "$d"; done; return 0; }
trap cleanup EXIT

check() {
  local label="$1" result="$2"
  if [ "$result" = "0" ]; then
    echo "  PASS  $label"
    PASS=$((PASS + 1))
  else
    echo "  FAIL  $label"
    FAIL=$((FAIL + 1))
  fi
}

skip() { echo "  SKIP  $1"; }

SECTION="${1:-all}"
want() { [ "$SECTION" = "all" ] || [ "$SECTION" = "$1" ]; }

case "$SECTION" in
  env|snippet|assert|sanitise|gate|notfound|all) ;;
  *) echo "Usage: bash _scripts/verify-phase-10.sh [env|snippet|assert|sanitise|gate|notfound|all]" >&2; exit 2 ;;
esac

mkroot() { T=$(mktemp -d); T=$(cd "$T" && pwd -P); TMPS+=("$T"); mkdir -p "$T/sites"; }

run() {
  if OUT=$("$@" 2>&1); then RC=0; else RC=$?; fi
}
rcis() { [ "$RC" = "$1" ] && echo 0 || echo 1; }
has() { printf '%s' "$OUT" | grep -qF -- "$1" && echo 0 || echo 1; }
hasnt() { printf '%s' "$OUT" | grep -qF -- "$1" && echo 1 || echo 0; }
both() { [ "$1" = 0 ] && [ "$2" = 0 ] && echo 0 || echo 1; }

# drive <wiring fixture> <base> [command]: run the integration hook, output in OUT
drive() { run node "$FX/drive-plausible.mjs" "$FX/wiring/$1" "$2" "${3:-build}"; }
# ok_drive: assert rc 0 and no hashBasedRouting, set R
nohash() { check "$1: no hashBasedRouting" "$(hasnt hashBasedRouting)"; }

echo "Phase 10: Analytics — Fixture Verification"
echo "=========================================================="

# ── env ────────────────────────────────────────────────────────────────────────
if want env; then
  echo ""
  echo "── ANLY-01: isSandbox helper ──"
  for pair in "/WebsiteMocker/x:true" "/WebsiteMocker:true" "/:false" "/WebsiteMockerX:false"; do
    b="${pair%%:*}"; exp="${pair##*:}"
    run node --input-type=module -e "
      import { isSandbox } from '$SC/lib/env.mjs';
      process.stdout.write(String(isSandbox('$b')));"
    check "isSandbox('$b') is $exp" "$([ "$OUT" = "$exp" ] && echo 0 || echo 1)"
  done
  n=$(grep -c "startsWith('/WebsiteMocker')" "$SC/plausible.mjs" || true)
  check "plausible.mjs has no inline sandbox test (single helper)" "$([ "$n" = 0 ] && echo 0 || echo 1)"
fi

# ── snippet ────────────────────────────────────────────────────────────────────
if want snippet; then
  echo ""
  echo "── ANLY-02/04: snippet output ──"
  ALL=""
  drive unconfigured.json /; check "unconfigured emits nothing" "$(both "$(rcis 0)" "$(has '"scripts":[]')")"
  drive skipped.json /; check "status skipped emits nothing" "$(both "$(rcis 0)" "$(has '"scripts":[]')")"
  drive prod-script.json / dev; check "dev command emits nothing" "$(has '"scripts":[]')"
  drive prod-script.json /; ALL="$ALL$OUT"
  check "production scriptId: loader URL" "$(has 'pa-FIXTUREprod01.js')"
  check "production scriptId: plausible.init" "$(has 'plausible.init')"
  check "production scriptId: outboundLinks:true" "$(has 'outboundLinks:true')"
  check "production scriptId: transformRequest" "$(has 'transformRequest')"
  check "production scriptId: no customProperties by default" "$(hasnt customProperties)"
  drive prod-legacy.json /; ALL="$ALL$OUT"
  check "production legacy: dataset.domain" "$(has 'dataset.domain')"
  check "production legacy: example.com" "$(has 'example.com')"
  check "production legacy: www. stripped" "$(hasnt 'www.example.com')"
  drive prod-script.json "$SB"
  check "sandbox default (D-02): nothing emitted" "$(has '"scripts":[]')"
  drive sandbox-own.json "$SB"; ALL="$ALL$OUT"
  check "sandbox sandboxScriptId: sandbox loader" "$(has 'pa-FIXTUREsbx02.js')"
  check "sandbox sandboxScriptId: prod id absent" "$(hasnt 'pa-FIXTUREprod01')"
  drive sandbox-optin.json "$SB"; ALL="$ALL$OUT"
  check "sandbox sandboxUsesProdId: prod loader" "$(has 'pa-FIXTUREprod01.js')"
  check "sandbox sandboxUsesProdId: warning emitted" "$(has 'sandboxUsesProdId')"
  drive sandbox-off.json "$SB"
  check "sandbox:false emits nothing" "$(has '"scripts":[]')"
  drive prod-legacy.json "$SB"; ALL="$ALL$OUT"
  check "sandbox legacy: SANDBOX_DOMAIN" "$(has 'pbau3r-sfdy.github.io')"
  drive events-off.json /; ALL="$ALL$OUT"
  check "events off: outboundLinks:false" "$(has 'outboundLinks:false')"
  check "events off: fileDownloads:false" "$(has 'fileDownloads:false')"
  check "events off: formSubmissions:false" "$(has 'formSubmissions:false')"
  drive props-on.json /; ALL="$ALL$OUT"
  check "props on: customProperties" "$(has customProperties)"
  drive eventnames.json /; ALL="$ALL$OUT"
  check "eventNames config embedded" "$(has 'Form: Submission')"
  OUT="$ALL"; nohash "all emitted snippets"
fi

# ── assert ─────────────────────────────────────────────────────────────────────
if want assert; then
  echo ""
  echo "── ANLY-03: identity assertions ──"
  drive bad-scriptid.json /
  check "ANLY-03 bad scriptId throws" "$(both "$(rcis 3)" "$(has '[plausible] ANLY-03:')")"
  check "ANLY-03 bad scriptId: no script injection in output" "$(hasnt '<script>alert')"
  drive contradictory.json "$SB"
  check "ANLY-03 sandbox:false + sandboxUsesProdId throws" "$(both "$(rcis 3)" "$(has '[plausible] ANLY-03:')")"
  drive same-ids.json "$SB"
  check "ANLY-03 sandboxScriptId == scriptId throws" "$(both "$(rcis 3)" "$(has '[plausible] ANLY-03:')")"
  drive github-domain.json /
  check "ANLY-03 github.io domain in production throws" "$(both "$(rcis 3)" "$(has '[plausible] ANLY-03:')")"
  drive legacy-sanitise.json /
  check "ANLY-03 sanitise on legacy site throws" "$(both "$(rcis 3)" "$(has '[plausible] ANLY-03:')")"
  drive bad-host.json /
  check "ANLY-03 bad host throws" "$(both "$(rcis 3)" "$(has '[plausible] ANLY-03:')")"
fi

# ── sanitise ───────────────────────────────────────────────────────────────────
if want sanitise; then
  echo ""
  echo "── ANLY-05: sanitising transformRequest ──"
  run node --input-type=module -e "
    import { TRANSFORM_FACTORY_SRC, PROPS_FACTORY_SRC } from '$SC/lib/plausible-snippet.mjs';
    import { VECTORS } from '$FX/payloads.mjs';
    for (const v of VECTORS) {
      const fn = new Function('return (' + TRANSFORM_FACTORY_SRC + ')')()(v.cfg);
      const got = fn(JSON.parse(JSON.stringify(v.input)));
      console.log((JSON.stringify(got) === JSON.stringify(v.expect) ? 'PASS ' : 'FAIL ') + v.name);
    }
    const mk = (base, pathname) => {
      globalThis.location = { pathname };
      return JSON.stringify(new Function('return (' + PROPS_FACTORY_SRC + ')')()({ site: 'fx', base, types: ['news','blog','announcements','press'] })());
    };
    const a = mk('/WebsiteMocker/fx', '/WebsiteMocker/fx/news/a');
    console.log((a === JSON.stringify({ site: 'fx', content_type: 'news' }) ? 'PASS ' : 'FAIL ') + 'props: news content_type under sandbox base');
    const d = mk('/', '/d/0123456789abcdef0123456789abcdef/');
    console.log((d === JSON.stringify({ site: 'fx', content_type: 'drop' }) ? 'PASS ' : 'FAIL ') + 'props: drop content_type at base /');
  "
  while IFS= read -r line; do
    case "$line" in
      "PASS "*) check "${line#PASS }" 0 ;;
      "FAIL "*) check "${line#FAIL }" 1 ;;
    esac
  done <<< "$OUT"
  check "sanitise vector runner exited 0" "$(rcis 0)"
fi

# ── gate ───────────────────────────────────────────────────────────────────────
if want gate; then
  echo ""
  echo "── ANLY-06: privacy gate ──"
  mkroot
  cp -R "$FX/gate/sites/." "$T/sites/"
  g() { run env WM_ROOT="$T" node "$SC/check-analytics-gate.mjs" "$@"; }
  g gate-ok;              check "gate-ok passes (0)" "$(rcis 0)"
  g gate-missing;         check "gate-missing fails (1)" "$(rcis 1)"
  g gate-noanalytics;     check "gate-noanalytics fails (1)" "$(rcis 1)"
  g gate-sandbox;         check "gate-sandbox not enforced (0)" "$(rcis 0)"
  g gate-sandbox --live;  check "gate-sandbox --live fails (1)" "$(rcis 1)"
  g gate-off;             check "gate-off not applicable (0)" "$(rcis 0)"
  g no-such-slug;         check "unknown slug exits 2" "$(rcis 2)"
fi

# ── notfound ───────────────────────────────────────────────────────────────────
if want notfound; then
  echo ""
  echo "── 404 event (reskin-2) ──"
  P404="$REPO/sites/sfdy-alt-clean-reskin-2/src/pages/404.astro"
  if [ -f "$P404" ]; then
    check "404.astro exists" 0
    OUT=$(cat "$P404")
    check "404.astro calls plausible('404'" "$(has "plausible('404'")"
    check "404.astro sends path: location.pathname" "$(has 'path: location.pathname')"
    check "404.astro guards window.plausible" "$(has 'window.plausible')"
  else
    check "404.astro exists (created by plan 10-05)" 1
  fi
  run node --input-type=module -e "
    import { VECTORS } from '$FX/payloads.mjs';
    process.exit(VECTORS.some(v => v.name.startsWith('404')) ? 0 : 1)"
  check "404 path vector exists" "$(rcis 0)"
  B="$REPO/dist/sfdy-alt-clean-reskin-2/404.html"
  if [ -f "$B" ]; then
    OUT=$(cat "$B"); check "built 404.html contains plausible('404'" "$(has "plausible('404'")"
  else
    skip "built 404.html (dist not built)"
  fi
fi

echo ""
echo "=========================================================="
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
