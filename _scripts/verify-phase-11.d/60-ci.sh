# Section ci: workflow hardening, log hygiene, redaction proof, token evaluator (DROP-04, DROP-05, DROP-07, DROP-08, DROP-09).
# Sourced by verify-phase-11.sh.

sec_ci() {
  echo; echo "== ci =="
  local C="$FX/ci" P=.github/workflows/publish.yml D=.github/workflows/deploy.yml H=.github/workflows/drops-health.yml
  local pub hlt n rc expr f lines raw filt
  rm -rf "${C:?}"; mkdir -p "$C"
  # comment lines stripped first so header prose cannot invalidate a gate
  pub=$(grep -v '^ *#' "$P"); hlt=$(grep -v '^ *#' "$H")

  # publish.yml static assertions
  check "publish: checks out pbau3r-sfdy/drops" "$(echo "$pub" | grep -q 'repository: pbau3r-sfdy/drops' && echo 0 || echo 1)"
  check "publish: drops checkout uses the PAT and path _drops" "$(echo "$pub" | grep -A6 'repository: pbau3r-sfdy/drops' | grep -q 'WM_PUBLISH_PAT' && echo "$pub" | grep -A6 'repository: pbau3r-sfdy/drops' | grep -q 'path: _drops' && echo 0 || echo 1)"
  check "publish: drops checkout has persist-credentials false" "$(echo "$pub" | grep -A6 'repository: pbau3r-sfdy/drops' | grep -q 'persist-credentials: false' && echo 0 || echo 1)"
  check "publish: drops checkout is depth 1" "$(echo "$pub" | grep -A6 'repository: pbau3r-sfdy/drops' | grep -q 'fetch-depth: 1' && echo 0 || echo 1)"
  n=$(echo "$pub" | grep -c "if: steps.wiring.outputs.drops_enabled == 'true'")
  check "publish: three steps guarded by drops_enabled" "$([ "$n" = 3 ] && echo 0 || echo 1)"
  check "publish: wiring step emits drops_enabled" "$(echo "$pub" | grep -q "drops_enabled=" && echo 0 || echo 1)"
  check "publish: qpdf installed via apt-get" "$(echo "$pub" | grep -q 'apt-get install -y qpdf' && echo 0 || echo 1)"
  check "publish: check runs drop.mjs with --ci --live --emit-masks" "$(echo "$pub" | grep -q 'drop.mjs check "\$SLUG" --ci --live --emit-masks' && echo 0 || echo 1)"
  check "publish: build gets DROPS_DIR and DROPS_REQUIRE" "$(echo "$pub" | grep -q 'DROPS_DIR:' && echo "$pub" | grep -q 'DROPS_REQUIRE:' && echo 0 || echo 1)"
  check "publish: build uses pipefail" "$(echo "$pub" | grep -q 'set -o pipefail' && echo 0 || echo 1)"
  check "publish: build output goes through the 32-hex sed filter" "$(echo "$pub" | grep -q "sed -E 's/\[0-9a-f\]{32}/<id>/g'" && echo 0 || echo 1)"
  check "publish: JamesIves keeps clean true" "$(echo "$pub" | grep -q 'clean: true' && echo 0 || echo 1)"
  check "publish: no permissions block added" "$(echo "$pub" | grep -q '^permissions:' && echo 1 || echo 0)"

  # deploy.yml untouched and free of drops
  check "deploy: no drops, DROPS_ or WM_PUBLISH_PAT" "$(grep -v '^ *#' "$D" | grep -Eq 'drops|DROPS_|WM_PUBLISH_PAT' && echo 1 || echo 0)"
  check "deploy: not modified in the working tree" "$(git diff --quiet HEAD -- "$D" && echo 0 || echo 1)"

  # drops-health.yml
  check "health: has a cron schedule" "$(echo "$hlt" | grep -q 'cron:' && echo 0 || echo 1)"
  check "health: has workflow_dispatch" "$(echo "$hlt" | grep -q 'workflow_dispatch' && echo 0 || echo 1)"
  check "health: permissions contents read" "$(echo "$hlt" | grep -q 'contents: read' && echo 0 || echo 1)"
  check "health: runs check-drops-token" "$(echo "$hlt" | grep -q 'check-drops-token.mjs' && echo 0 || echo 1)"
  check "health: strict live check per site" "$(echo "$hlt" | grep -q 'drop.mjs check "\$slug" --ci --live --strict' && echo 0 || echo 1)"
  for f in 'continue-on-error' 'set -x' 'MarketingBridge' 'vault' 'gh workflow run' 'GITHUB_STEP_SUMMARY' 'JamesIves'; do
    check "health: no '$f'" "$(echo "$hlt" | grep -qi -- "$f" && echo 1 || echo 0)"
  done
  check "health: no line echoes the token" "$(echo "$hlt" | grep -Eq '(echo|printf).*(WM_PUBLISH_PAT|GH_TOKEN)' && echo 1 || echo 0)"
  check "health: token only in env, not in run" "$(echo "$hlt" | grep -E 'run:' | grep -q 'secrets\.' && echo 1 || echo 0)"
  check "health: drops checkout persist-credentials false" "$(echo "$hlt" | grep -A6 'repository: pbau3r-sfdy/drops' | grep -q 'persist-credentials: false' && echo 0 || echo 1)"
  lines=$(grep -l 'pbau3r-sfdy/drops' .github/workflows/* 2>/dev/null | xargs -n1 basename | sort | tr '\n' ' ')
  check "only publish.yml and drops-health.yml reference the drops repo" "$([ "$lines" = "drops-health.yml publish.yml " ] && echo 0 || echo 1)"
  check "no workflow other than publish or health uses the PAT with drops" "$(grep -l 'DROPS_DIR' .github/workflows/* | xargs -n1 basename | sort | tr '\n' ' ' | grep -qx 'drops-health.yml publish.yml ' && echo 0 || echo 1)"
  for f in .github/workflows/publish.yml .github/workflows/drops-health.yml; do
    check "$f parses as YAML" "$(node -e "require('js-yaml').load(require('fs').readFileSync('$f','utf8'))" 2>/dev/null && echo 0 || echo 1)"
  done

  # log hygiene: no console.log interpolating id/title/label without shortId/idOut
  for f in _scripts/drop.mjs _scripts/check-drops-token.mjs; do
    lines=$(grep -v '^ *\(//\|\*\)' "$f" | grep 'console\.\(log\|error\|warn\)' | grep -E '\.(id|title|label)\b|\$\{id\}' \
      | grep -v 'shortId\|idOut' | grep -v '// local-only' | grep -vF '::add-mask::')
    check "$f: no console output interpolates id/title/label unshortened" "$([ -z "$lines" ] && echo 0 || echo 1)"
    [ -z "$lines" ] || echo "$lines" | sed 's/^/        /'
  done
  check "check-drops-token states write scope is unverifiable" "$(grep -q 'write scope is not verifiable' _scripts/check-drops-token.mjs && echo 0 || echo 1)"
  check "check-drops-token makes no write request" "$(grep -Eq "method: *'(POST|PUT|PATCH|DELETE)'" _scripts/check-drops-token.mjs && echo 1 || echo 0)"
  check "check-drops-token does not print the token" "$(grep -E 'console\.' _scripts/check-drops-token.mjs | grep -Eq '\$\{token\}|, token\b|\(token\)' && echo 1 || echo 0)"
  rc=0; env -u GH_TOKEN node _scripts/check-drops-token.mjs >/dev/null 2>&1 || rc=$?
  check "check-drops-token exits 2 without GH_TOKEN" "$([ "$rc" = 2 ] && echo 0 || echo 1)"

  # redaction proof on a real fixture build log
  gen_fx good ci/clean   # generated before the PDF exists: no attachment, so check passes cleanly
  node _scripts/fixtures/drops/make-pdf.mjs "$C/fixture.pdf" >/dev/null
  gen_fx good ci/good
  build_prod_fx ci "$PWD/$C/good"; rc=$?
  check "fixture production build exits 0" "$rc"
  raw="$C/build.log"; filt="$C/build.filtered.log"
  expr=$(grep "sed -E" "$P" | head -1 | sed -E "s/.*sed -E '([^']*)'.*/\1/")
  check "redaction expression extracted from publish.yml" "$([ -n "$expr" ] && echo 0 || echo 1)"
  sed -E "$expr" "$raw" > "$filt"
  check "filtered build log has zero 32-hex matches" "$([ "$(grep -Eco '[0-9a-f]{32}' "$filt")" = 0 ] && echo 0 || echo 1)"
  echo "  INFO  raw build log 32-hex matches: $(grep -Eo '[0-9a-f]{32}' "$raw" | wc -l | tr -d ' ') (informational)"

  # token evaluator vectors
  node --input-type=module -e "
    import { evaluate } from './_scripts/check-drops-token.mjs';
    const now = Date.UTC(2030, 0, 1), DAY = 86400000;
    const hdr = (d) => new Date(now + d * DAY).toISOString().slice(0, 19).replace('T', ' ') + ' UTC';
    const base = { drops: { status: 200, private: true }, others: [{ repo: 'a/b', status: 200 }], now };
    const t = [
      ['30 days ok', evaluate({ ...base, expiryHeader: hdr(30) }).ok === true],
      ['10 days fail', evaluate({ ...base, expiryHeader: hdr(10) }).ok === false],
      ['13.9 days fail', evaluate({ ...base, expiryHeader: hdr(13.9) }).ok === false],
      ['14.1 days ok', evaluate({ ...base, expiryHeader: hdr(14.1) }).ok === true],
      ['absent ok with warning', (() => { const r = evaluate({ ...base, expiryHeader: null }); return r.ok && r.warnings.length === 1; })()],
      ['unparsable fail', evaluate({ ...base, expiryHeader: 'soon' }).ok === false],
      ['private false fail', evaluate({ ...base, drops: { status: 200, private: false }, expiryHeader: hdr(30) }).ok === false],
      ['non-200 names repo', (() => { const r = evaluate({ ...base, others: [{ repo: 'a/b', status: 404 }], expiryHeader: hdr(30) }); return !r.ok && r.failures[0].includes('a/b'); })()],
      ['drops 404 fail', evaluate({ ...base, drops: { status: 404 }, expiryHeader: hdr(30) }).ok === false],
    ];
    for (const [n, ok] of t) console.log((ok ? 'PASS' : 'FAIL') + ' ' + n);
  " > "$C/eval.out" 2>&1
  while read -r r n; do check "token evaluate: $n" "$([ "$r" = PASS ] && echo 0 || echo 1)"; done < <(grep -E '^(PASS|FAIL) ' "$C/eval.out" | sed -E 's/^(PASS|FAIL) /\1 /')
  check "token evaluator produced all vectors" "$([ "$(grep -Ec '^(PASS|FAIL) ' "$C/eval.out")" = 9 ] && echo 0 || echo 1)"

  # CI-mode strict check against the fixture with a live list holding expired + tombstoned ids
  local e t out
  e=$(fx_id expired ci/good); t=$(fx_id withdrawnTomb ci/good)
  printf '["%s","%s"]\n' "$e" "$t" > "$C/live.json"
  out=$(DROPS_DIR="$PWD/$C/good" DROPS_LIVE_LIST_FILE="$PWD/$C/live.json" node _scripts/drop.mjs check "$SLUG" --ci --live --strict 2>&1); rc=$?
  check "strict check with expired/withdrawn ids still live exits 1" "$([ "$rc" = 1 ] && echo 0 || echo 1)"
  check "strict output reports the live problem" "$(echo "$out" | grep -qE 'still live|missing from source|not publishable' && echo 0 || echo 1)"
  check "strict output contains no full id" "$(echo "$out" | grep -Eq '[0-9a-f]{32}' && echo 1 || echo 0)"
  check "strict output shows 4-char prefix" "$(echo "$out" | grep -q "${e:0:4}" && echo 0 || echo 1)"
  printf '[]\n' > "$C/live-empty.json"
  DROPS_DIR="$PWD/$C/clean" DROPS_LIVE_LIST_FILE="$PWD/$C/live-empty.json" node _scripts/drop.mjs check "$SLUG" --ci --live --strict >/dev/null 2>&1; rc=$?
  check "strict check with a clean live list exits 0" "$([ "$rc" = 0 ] && echo 0 || echo 1)"
  check "live section exists and is syntax-clean" "$(bash -n _scripts/verify-phase-11.d/80-live.sh 2>/dev/null && echo 0 || echo 1)"
}
