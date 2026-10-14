# Section build: production-like builds with fixture drops (DROP-03, DROP-04, DROP-05). Sourced by verify-phase-11.sh.

sec_build() {
  echo; echo "== build =="
  local B="$FX/build" G="$FX/build/good" a s e w t n f page rc
  rm -rf "${FX:?}/build"; mkdir -p "$B"
  node _scripts/fixtures/drops/make-pdf.mjs "$B/fixture.pdf" >/dev/null
  gen_fx good build/good
  a=$(fx_id active build/good); s=$(fx_id soon build/good); e=$(fx_id expired build/good)
  w=$(fx_id withdrawnFlag build/good); t=$(fx_id withdrawnTomb build/good)

  build_prod_fx build "$PWD/$G"; rc=$?
  check "production build with good fixture exits 0" "$rc"
  [ "$rc" = 0 ] || { tail -20 "$B/build.log"; return; }
  page="$OUT/d/$a/index.html"
  check "active drop page emitted" "$([ -f "$page" ] && echo 0 || echo 1)"
  check "soon drop page emitted" "$([ -f "$OUT/d/$s/index.html" ] && echo 0 || echo 1)"
  for n in "$e" "$w" "$t"; do
    check "expired/withdrawn drop ${n:0:4} has no directory" "$([ -e "$OUT/d/$n" ] && echo 1 || echo 0)"
  done
  for f in 'noindex, nofollow, noarchive' 'name="referrer" content="no-referrer"' '<title>Shared document</title>' 'FIXTURE-BODY-ACTIVE'; do
    check "page contains: $f" "$(grep -qF -- "$f" "$page" && echo 0 || echo 1)"
  done
  for f in 'property="og:' 'name="twitter:' 'rel="canonical"' 'name="description"' 'rel="alternate"' '<nav' '<footer'; do
    check "page lacks: $f" "$([ "$(grep -c -- "$f" "$page")" = 0 ] && echo 0 || echo 1)"
  done
  n=$(grep -o '<a ' "$page" | wc -l | tr -d ' ')
  check "page has exactly one anchor (the attachment)" "$([ "$n" = 1 ] && grep -q 'data-drop-download' "$page" && echo 0 || echo 1)"
  f="$OUT/d/$a/fixture.pdf"
  check "stripped PDF emitted next to the page" "$([ -f "$f" ] && echo 0 || echo 1)"
  check "emitted PDF passes qpdf --check" "$(qpdf --check "$f" >/dev/null 2>&1 && echo 0 || echo 1)"
  for n in FIXTURE-AUTHOR FIXTURE-XMP FIXTURE-PIECEINFO; do
    check "emitted PDF has no $n" "$([ "$(grep -a -c "$n" "$f")" = 0 ] && echo 0 || echo 1)"
  done

  for n in $a $s; do
    check "id ${n:0:4} appears nowhere in dist outside its own folder" \
      "$([ -z "$(grep -rIl -- "$n" "$OUT" 2>/dev/null | grep -v -F "$OUT/d/$n/")" ] && echo 0 || echo 1)"
  done
  check "no sitemap, rss or feed file in dist" "$([ -z "$(find "$OUT" \( -iname 'sitemap*' -o -iname '*.rss' -o -iname 'rss.xml' -o -iname 'feed*' \) | head -1)" ] && echo 0 || echo 1)"
  check "robots.txt has no /d/ line" "$([ ! -f "$OUT/robots.txt" ] || ! grep -q '/d/' "$OUT/robots.txt" && ! grep -q '/d/' public/robots.txt && echo 0 || echo 1)"
  check "public/robots.txt untouched" "$(git diff --quiet -- public/robots.txt && echo 0 || echo 1)"
  check "dashboard source does not reference drops" "$(grep -Eqi 'drops|/d/' src/pages/index.astro && echo 1 || echo 0)"
  check "no src/content drops directory under sites" "$([ -z "$(ls -d sites/*/src/content/""drops 2>/dev/null)" ] && echo 0 || echo 1)"

  # negative builds
  for n in bad-expiryless bad-horizon; do
    gen_fx $n build/$n
    local bid; bid=$(node -p "Object.values(require('./$FX/build/$n/ids.json'))[0]")
    build_prod_fx build "$PWD/$FX/build/$n"; rc=$?
    check "$n build fails" "$([ "$rc" != 0 ] && echo 0 || echo 1)"
    check "$n failure names the 4-char prefix only" "$(grep -q "${bid:0:4}" "$B/build.log" && ! grep -q "$bid" "$B/build.log" && echo 0 || echo 1)"
  done

  # missing qpdf: stub shim that exits 127 shadows the real binary
  mkdir -p "$B/shim"; printf '#!/bin/sh\nexit 127\n' > "$B/shim/qpdf"; chmod +x "$B/shim/qpdf"
  build_prod_fx build "$PWD/$G" "PATH=$PWD/$B/shim:$PATH"; rc=$?
  check "build fails when qpdf is unusable" "$([ "$rc" != 0 ] && echo 0 || echo 1)"
  check "failure shows the DROP-05 message" "$(grep -q 'DROP-05' "$B/build.log" && echo 0 || echo 1)"

  # sync-content deny
  local R="$B/syncroot" C="$B/clone"
  mkdir -p "$R/sites/sfdy/src/content/""drops" "$R/sites/sfdy/src/content/news" "$C/content/drops" "$C/content/news"
  echo x > "$C/content/drops/x.md"; echo y > "$C/content/news/y.md"
  msg=$(bash _scripts/sync-content.sh sfdy "$C" "$R" 2>&1)
  check "sync-content never copies drops" "$([ ! -e "$R/sites/sfdy/src/content/""drops/x.md" ] && echo 0 || echo 1)"
  check "sync-content logs the deny" "$(echo "$msg" | grep -q 'denied (drops are never synced)' && echo 0 || echo 1)"
  check "sync-content still copies news" "$([ -f "$R/sites/sfdy/src/content/news/y.md" ] && echo 0 || echo 1)"

  # source-level rule: the content-drops path appears only in allow-listed files
  local P="src/content/""drops" hits
  hits=$(grep -rIl -- "$P" _scripts sites .github CLAUDE.md AGENTS.md docs 2>/dev/null | grep -v -e '^_scripts/sync-content.sh$' -e '^docs/drops.md$' -e node_modules)
  check "no unexpected reference to the content-drops path" "$([ -z "$hits" ] && echo 0 || { echo "$hits"; echo 1; })"
}
