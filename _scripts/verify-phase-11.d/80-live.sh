# Section live (opt-in, never part of `all`): checks the live site and the health workflow.
# Ids come only from the gitignored file _staging/phase11/ids (ACTIVE_ID=, WITHDRAWN_ID=, EXPIRED_ID=)
# or the environment (env overrides). They are never printed in full (4-char prefixes only).

sec_live() {
  echo; echo "== live =="
  local idf="$FX/ids" ACTIVE_ID_ENV=${ACTIVE_ID:-} WITHDRAWN_ID_ENV=${WITHDRAWN_ID:-} EXPIRED_ID_ENV=${EXPIRED_ID:-}
  if [ -f "$idf" ]; then set -a; . "$idf"; set +a; fi
  [ -n "$ACTIVE_ID_ENV" ] && ACTIVE_ID=$ACTIVE_ID_ENV
  [ -n "$WITHDRAWN_ID_ENV" ] && WITHDRAWN_ID=$WITHDRAWN_ID_ENV
  [ -n "$EXPIRED_ID_ENV" ] && EXPIRED_ID=$EXPIRED_ID_ENV
  local base=${PROD_URL:-https://www.starflight-dynamics.com}

  code() { curl -s -o /dev/null -w '%{http_code}' -H 'Cache-Control: no-cache' "$1"; }
  # expect_code <label> <id> <want>: retry six times, 15 s apart (CDN max-age 600 s, D-05)
  expect_code() {
    local label=$1 id=$2 want=$3 i got=""
    for i in 1 2 3 4 5 6; do
      got=$(code "$base/d/$id/?v=$RANDOM")
      [ "$got" = "$want" ] && break
      sleep 15
    done
    check "$label (${id:0:4}) answers $want" "$([ "$got" = "$want" ] && echo 0 || echo 1)"
  }
  skip() { echo "  SKIP  $1 ($2 is not set)"; }

  if [ -n "${ACTIVE_ID:-}" ]; then
    expect_code "active drop" "$ACTIVE_ID" 200
    local page; page=$(curl -s -H 'Cache-Control: no-cache' "$base/d/$ACTIVE_ID/?v=$RANDOM")
    check "active drop page has noindex" "$(echo "$page" | grep -q 'noindex' && echo 0 || echo 1)"
    check "active drop page has no-referrer" "$(echo "$page" | grep -q 'no-referrer' && echo 0 || echo 1)"
  else skip "active drop checks" ACTIVE_ID; fi
  if [ -n "${WITHDRAWN_ID:-}" ]; then expect_code "withdrawn drop" "$WITHDRAWN_ID" 404; else skip "withdrawn drop check" WITHDRAWN_ID; fi
  if [ -n "${EXPIRED_ID:-}" ]; then expect_code "expired drop" "$EXPIRED_ID" 404; else skip "expired drop check" EXPIRED_ID; fi

  local rnd; rnd=$(node -p "require('crypto').randomBytes(16).toString('hex')")
  expect_code "random never-existing id" "$rnd" 404

  local listing; listing=$(curl -s "https://api.github.com/repos/pbau3r-sfdy/starflight-dynamics/contents/d?ref=gh-pages")
  local v n
  for v in WITHDRAWN_ID EXPIRED_ID; do
    n=${!v:-}
    if [ -n "$n" ]; then check "gh-pages listing does not contain $v (${n:0:4})" "$(echo "$listing" | grep -q "$n" && echo 1 || echo 0)"
    else skip "gh-pages listing check" "$v"; fi
  done

  local run concl created age
  run=$(gh run list --workflow drops-health.yml --limit 1 --json conclusion,createdAt 2>/dev/null)
  concl=$(echo "$run" | jq -r '.[0].conclusion // empty' 2>/dev/null)
  created=$(echo "$run" | jq -r '.[0].createdAt // empty' 2>/dev/null)
  check "last drops-health run concluded success" "$([ "$concl" = success ] && echo 0 || echo 1)"
  age=999999
  if [ -n "$created" ]; then age=$(( $(date +%s) - $(node -p "Math.floor(Date.parse('$created')/1000)") )); fi
  check "last drops-health run is under 36 hours old" "$([ "$age" -lt 129600 ] && echo 0 || echo 1)"
}
