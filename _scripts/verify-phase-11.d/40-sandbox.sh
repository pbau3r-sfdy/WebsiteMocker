# Section sandbox: sandbox gating of drops (D-09, W1). Sourced by verify-phase-11.sh.

sec_sandbox() {
  echo; echo "== sandbox =="
  local B="$FX/sandbox" G="$FX/sandbox/good" a rc
  rm -rf "${FX:?}/sandbox"; mkdir -p "$B"
  gen_fx good sandbox/good
  a=$(fx_id active sandbox/good)

  build_sandbox_fx sandbox "$PWD/$G"; rc=$?
  check "sandbox build without DROPS_PREVIEW exits 0" "$rc"
  check "sandbox build has no d/ directory" "$([ -e "$OUT/d" ] && echo 1 || echo 0)"

  if [ -n "${CI:-}" ] || [ -n "${GITHUB_ACTIONS:-}" ]; then
    echo "  SKIP  local DROPS_PREVIEW=1 build (CI environment)"
  else
    build_sandbox_fx sandbox "$PWD/$G" DROPS_PREVIEW=1; rc=$?
    check "sandbox build with DROPS_PREVIEW=1 exits 0" "$rc"
    check "sandbox preview contains the active drop" "$([ -f "$OUT/d/$a/index.html" ] && echo 0 || echo 1)"
  fi

  build_sandbox_fx sandbox "$PWD/$G" CI=true DROPS_PREVIEW=1; rc=$?
  check "CI=true DROPS_PREVIEW=1 build fails" "$([ "$rc" != 0 ] && echo 0 || echo 1)"
  check "CI failure states local-only" "$(grep -q 'local-only' "$B/build.log" && echo 0 || echo 1)"

  build_prod_fx sandbox "$PWD/$G" DROPS_PREVIEW=1; rc=$?
  check "DROPS_PREVIEW=1 on a production base fails" "$([ "$rc" != 0 ] && echo 0 || echo 1)"

  check "deploy.yml has no drops, DROPS_ or WM_PUBLISH_PAT" "$([ "$(grep -v '^ *#' .github/workflows/deploy.yml | grep -Ec 'drops|DROPS_|WM_PUBLISH_PAT')" = 0 ] && echo 0 || echo 1)"

  # W1: production build with DROPS_DIR unset reads nothing even if _drops/ exists
  local made=0
  if [ ! -e _drops ]; then
    made=1; mkdir -p _drops; cp -R "$G/sfdy" _drops/sfdy
  fi
  local lock="$FX/.build.lock" n=0
  while ! mkdir "$lock" 2>/dev/null; do sleep 1; n=$((n+1)); [ $n -gt 600 ] && break; done
  rm -rf "dist/${SLUG:?}"
  env -u DROPS_DIR SITE_URL=$PROD_URL SITE_BASE=/ node _scripts/build-single.mjs $SLUG >"$B/w1.log" 2>&1; rc=$?
  check "production build with DROPS_DIR unset exits 0" "$rc"
  check "no d/ directory when DROPS_DIR is unset" "$([ -e "dist/$SLUG/d" ] && echo 1 || echo 0)"
  rm -rf "dist/${SLUG:?}"; rmdir "$lock" 2>/dev/null
  [ "$made" = 1 ] && rm -rf _drops
}
