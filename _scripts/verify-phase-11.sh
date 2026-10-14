#!/usr/bin/env bash
# verify-phase-11.sh: Phase 11 (Open Drops) verification dispatcher.
# Usage: bash _scripts/verify-phase-11.sh [lib|pdf|cli|build|sandbox|track|ci|docs|live|all]
# Exit codes: 0 = all selected checks pass, 1 = failure, 2 = bad usage.
# Sections live in _scripts/verify-phase-11.d/NN-name.sh and define sec_<name>.
# A missing section file prints SKIP and does not fail (later plans add their own files).
# `all` = lib pdf cli build sandbox track ci docs, strictly sequential (offline only;
# `live` is opt-in and never part of `all`).

set -u
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"
export REPO
SLUG=sfdy
FX=_staging/phase11
PROD_URL=https://www.starflight-dynamics.com
SB_URL=https://pbau3r-sfdy.github.io
PASS=0; FAIL=0
export FX PROD_URL SB_URL SLUG
mkdir -p "$FX"

check() { if [ "$2" = 0 ]; then PASS=$((PASS+1)); echo "  PASS  $1"; else FAIL=$((FAIL+1)); echo "  FAIL  $1"; fi; }

gen_fx() { # gen_fx <variant> [section]; writes $FX/<section>/ (section defaults to variant)
  local v=$1 s=${2:-$1}
  rm -rf "${FX:?}/${s:?}"; mkdir -p "$FX/$s"
  node _scripts/fixtures/drops/gen.mjs "$v" "$FX/$s" >/dev/null
}
fx_id() { # fx_id <name> [section]; reads ids.json of a generated fixture
  node -p "require('./$FX/${2:-good}/ids.json')['$1']"
}

# build_fx <mode prod|sandbox> <section> <dropsDir> [extra env assignments...]
# Serialised by a mkdir lock because every build writes dist/sfdy. Result moved to $FX/<section>/dist.
build_fx() {
  local mode=$1 sec=$2 ddir=$3; shift 3
  local url base lock="$FX/.build.lock" n=0
  if [ "$mode" = prod ]; then url=$PROD_URL; base=/; else url=$SB_URL; base=/WebsiteMocker/$SLUG; fi
  mkdir -p "$FX/$sec"
  while ! mkdir "$lock" 2>/dev/null; do sleep 1; n=$((n+1)); [ $n -gt 600 ] && return 1; done
  rm -rf "dist/${SLUG:?}" "${FX:?}/${sec:?}/dist"
  env DROPS_DIR="$ddir" "$@" SITE_URL=$url SITE_BASE=$base node _scripts/build-single.mjs $SLUG >"$FX/$sec/build.log" 2>&1
  local rc=$?
  [ -d "dist/$SLUG" ] && mv "dist/$SLUG" "$FX/$sec/dist"
  rmdir "$lock" 2>/dev/null
  OUT="$FX/$sec/dist"; export OUT
  return $rc
}
build_prod_fx() { build_fx prod "$@"; }
build_sandbox_fx() { build_fx sandbox "$@"; }

cannot_verify() {
  cat <<'TXT'

== What this harness cannot verify ==
  - HTTP response headers: GitHub Pages cannot set X-Robots-Tag, Referrer-Policy or
    Cache-Control, so only meta tags are asserted.
  - Search-engine and web-archive copies of a drop.
  - CDN edge propagation timing after a publish.
  - Plausible-side event arrival.
  - Token scope correctness (write scope is unverifiable).
  - That git history/objects of gh-pages do not retain withdrawn copies (DROP-09).
TXT
}

run_section() {
  local name=$1 f found=0
  for f in "$REPO"/_scripts/verify-phase-11.d/*-"$name".sh; do
    [ -e "$f" ] || continue
    found=1
    # shellcheck disable=SC1090
    . "$f"
    "sec_$name"
  done
  if [ $found = 0 ]; then echo; echo "== $name =="; echo "  SKIP  (section not implemented yet)"; fi
}

SEL=${1:-all}
case "$SEL" in
  lib|pdf|cli|build|sandbox|track|ci|docs|live) run_section "$SEL" ;;
  all) for s in lib pdf cli build sandbox track ci docs; do run_section "$s"; done ;;
  *) echo "usage: bash _scripts/verify-phase-11.sh [lib|pdf|cli|build|sandbox|track|ci|docs|live|all]"; exit 2 ;;
esac
case "$SEL" in all|live) cannot_verify ;; esac

echo; echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" = 0 ] && exit 0 || exit 1
