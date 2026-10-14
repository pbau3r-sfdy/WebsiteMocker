#!/usr/bin/env bash
# verify-phase-09.sh — Fixture-only verification for Phase 9: Claude Design connectivity (DSYNC-13)
# Usage: bash _scripts/verify-phase-09.sh [block|stage|zip|lock|marker|sanitise|tokens|guard|render|all]
# Exit codes: 0 = all selected checks pass, 1 = one or more failures, 2 = invalid argument
#
# Every case copies fixtures from _scripts/fixtures/design/ into a mktemp root and runs the CLIs
# with WM_ROOT pointing at it. No real site is touched, no network, no DesignSync call.

set -euo pipefail
PASS=0
FAIL=0

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FX="$REPO/_scripts/fixtures/design"
SC="$REPO/_scripts"
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
  block|stage|zip|lock|marker|sanitise|tokens|guard|render|all) ;;
  *) echo "Usage: bash _scripts/verify-phase-09.sh [block|stage|zip|lock|marker|sanitise|tokens|guard|render|all]" >&2; exit 2 ;;
esac

# mkroot: new temp root in $T
mkroot() { T=$(mktemp -d); T=$(cd "$T" && pwd -P); TMPS+=("$T"); mkdir -p "$T/sites"; }

# fresh_root: temp root with sites/fixture-design from stage/site and staged files from stage/project
fresh_root() {
  mkroot
  cp -R "$FX/stage/site" "$T/sites/fixture-design"
  mkdir -p "$T/_staging/design/fixture-design"
  cp -R "$FX/stage/project" "$T/_staging/design/fixture-design/files"
}

# set_ds: connect fixture-design as a design-system source
set_ds() {
  WM_ROOT="$T" node "$SC/design-connect.mjs" fixture-design --source design-system \
    --project-id baa6f65c-d546-41fc-b2bd-d81d7c6da089 --name SFDY >/dev/null
}

# run CMD...: run, capture rc in RC and output in OUT
run() {
  if OUT=$("$@" 2>&1); then RC=0; else RC=$?; fi
}
stage() { run env WM_ROOT="$T" node "$SC/design-stage.mjs" fixture-design "$@"; }
rcis() { [ "$RC" = "$1" ] && echo 0 || echo 1; }
has() { printf '%s' "$OUT" | grep -qF -- "$1" && echo 0 || echo 1; }

echo "Phase 9: Claude Design connectivity — Fixture Verification"
echo "=========================================================="

# ── block ──────────────────────────────────────────────────────────────────────
if want block; then
  echo ""
  echo "── DSYNC-02: design block validation ──"
  for f in "$FX"/stage/blocks/*.json; do
    n=$(basename "$f")
    got=$(WM_ROOT="$REPO" node --input-type=module -e "
      import { validateDesignBlock } from '$SC/lib/design-block.mjs';
      import { readFileSync } from 'fs';
      const b = JSON.parse(readFileSync('$f','utf8')).design;
      const r = validateDesignBlock(b, { root: '$REPO' });
      process.stdout.write(r.ok ? 'ok' : 'bad');")
    case "$n" in
      valid-*) [ "$got" = "ok" ] && R=0 || R=1 ;;
      *) [ "$got" = "bad" ] && R=0 || R=1 ;;
    esac
    check "block $n -> $got" "$R"
  done

  fresh_root
  run env WM_ROOT="$T" node "$SC/design-connect.mjs" fixture-design --check
  check "--check without a block prints 'no design connection', exit 0" "$([ "$RC" = 0 ] && has 'no design connection' || echo 1)"

  cp "$T/sites/fixture-design/wiring.json" "$T/before.json"
  run env WM_ROOT="$T" node "$SC/design-connect.mjs" fixture-design --source design-system --project-id abc
  check "bad project id exits 1" "$(rcis 1)"
  cmp -s "$T/before.json" "$T/sites/fixture-design/wiring.json" && R=0 || R=1
  check "bad project id leaves wiring.json unchanged" "$R"
fi

# ── stage ──────────────────────────────────────────────────────────────────────
if want stage; then
  echo ""
  echo "── DSYNC-04/05: staging verifier ──"
  fresh_root; set_ds
  stage
  check "clean stage exits 0" "$(rcis 0)"

  fresh_root; set_ds
  mkdir -p "$T/_staging/design/fixture-design/files/uploads"
  cp "$FX/stage/bad/uploads/secret.pdf" "$T/_staging/design/fixture-design/files/uploads/"
  stage
  check "uploads/secret.pdf refused (exit 1)" "$(rcis 1)"

  fresh_root; set_ds
  head -c 261120 /dev/zero | tr '\0' 'a' > "$T/_staging/design/fixture-design/files/tokens/big.css"
  stage
  check "261120-byte file refused" "$(rcis 1)"

  fresh_root; set_ds
  head -c 261119 /dev/zero | tr '\0' ' ' > "$T/_staging/design/fixture-design/files/tokens/ok.css"
  SZ=$(wc -c < "$T/_staging/design/fixture-design/files/tokens/ok.css" | tr -d ' ')
  stage
  check "$SZ-byte file passes the size rule" "$([ "$SZ" = 261119 ] && rcis 0 || echo 1)"

  for bad in bad.css bad.jsx truncated.html; do
    fresh_root; set_ds
    d="tokens"; case "$bad" in *.jsx) d="components/core" ;; *.html) d="templates/website" ;; esac
    cp "$FX/stage/bad/$bad" "$T/_staging/design/fixture-design/files/$d/$bad"
    stage
    check "$bad refused" "$(rcis 1)"
  done

  fresh_root; set_ds
  ln -s /etc/hosts "$T/_staging/design/fixture-design/files/tokens/link.css"
  stage
  check "symlink refused" "$(rcis 1)"

  fresh_root; set_ds
  printf '[{"path":"tokens/colors.css","size":1}]' > "$T/_staging/design/fixture-design/listing.json"
  stage
  check "listing.json size mismatch refused" "$(rcis 1)"

  fresh_root; set_ds
  printf 'stray' > "$T/_staging/design/fixture-design/files/notes.txt"
  stage
  R=1; [ "$RC" = 0 ] && ! grep -q 'notes.txt' "$T/sites/fixture-design/design.lock.json" && R=0
  check "file outside default globs is not in the lock" "$R"

  if (cd "$REPO" && git check-ignore -q _staging/x); then R=0; else R=1; fi
  check "_staging/ is gitignored in the real repo" "$R"
fi

# ── zip ────────────────────────────────────────────────────────────────────────
if want zip; then
  echo ""
  echo "── DSYNC-05 / SD-05: zip inbox ──"
  mkroot
  cp -R "$FX/stage/site" "$T/sites/fixture-design"
  WM_ROOT="$T" node "$SC/design-connect.mjs" fixture-design --source local --path . >/dev/null
  INBOX="$T/_staging/design/inbox"
  mkdir -p "$INBOX"

  stage
  check "empty inbox exits 1" "$(rcis 1)"

  cp "$FX/stage/export/one-pager.zip" "$INBOX/one-pager.zip"
  stage
  check "inbox zip staged without --from, exit 0" "$(rcis 0)"
  R=1; grep -q '"index.html"' "$T/sites/fixture-design/design.lock.json" && grep -q '"styles.css"' "$T/sites/fixture-design/design.lock.json" && R=0
  check "lock has index.html and styles.css" "$R"

  cp "$FX/stage/export/one-pager.zip" "$INBOX/newer.zip"
  touch -t 203001010000 "$INBOX/newer.zip"
  touch -t 202001010000 "$INBOX/one-pager.zip"
  stage
  check "newer zip picked by name" "$([ "$RC" = 0 ] && has 'newer.zip' || echo 1)"

  stage --from "$INBOX/one-pager.zip"
  check "--from overrides the inbox choice" "$([ "$RC" = 0 ] && { printf '%s' "$OUT" | grep -q 'using inbox zip' && echo 1 || echo 0; } || echo 1)"

  for z in zipslip symlink; do
    mkroot
    cp -R "$FX/stage/site" "$T/sites/fixture-design"
    WM_ROOT="$T" node "$SC/design-connect.mjs" fixture-design --source local --path . >/dev/null
    mkdir -p "$T/_staging/design/inbox"
    cp "$FX/stage/bad/$z.zip" "$T/_staging/design/inbox/"
    stage
    R=$(rcis 1)
    [ -n "$(find "$T" "$(dirname "$T")" -maxdepth 4 -name escape.txt 2>/dev/null | head -1)" ] && R=1
    check "$z.zip refused, nothing extracted" "$R"
  done

  mkroot
  cp -R "$FX/stage/site" "$T/sites/fixture-design"
  WM_ROOT="$T" node "$SC/design-connect.mjs" fixture-design --source local --path . >/dev/null
  mkdir -p "$T/_staging/design/inbox"
  node -e "
    const AdmZip = require('$REPO/node_modules/adm-zip');
    const z = new AdmZip(); z.addFile('big.css', Buffer.alloc(261120, 97)); z.writeZip('$T/_staging/design/inbox/big.zip');"
  stage
  check "zip with a 261120-byte entry refused" "$([ -e "$T/_staging/design/fixture-design/files/big.css" ] && echo 1 || rcis 1)"
fi

# ── marker ─────────────────────────────────────────────────────────────────────
if want marker; then
  echo ""
  echo "── SD-11: design markers ──"
  mkroot
  for s in ds-site local-site plain-site; do cp -R "$FX/marker/$s" "$T/sites/$s"; done
  run env WM_ROOT="$T" node "$SC/design-marker.mjs" --all
  check "design-marker --all exits 0" "$(rcis 0)"
  D="$T/sites/ds-site/DESIGN.md"
  grep -q 'Fixture Design System' "$D" && R=0 || R=1
  check "DESIGN.md has the project name" "$R"
  grep -qF '_staging/design/inbox/' "$D" && R=0 || R=1
  check "DESIGN.md names the inbox" "$R"
  grep -q 'Hero' "$D" && R=0 || R=1
  check "DESIGN.md lists hand-edited Hero" "$R"
  grep -qE '[0-9a-f]{8}-[0-9a-f]{4}-' "$D" && R=1 || R=0
  check "DESIGN.md has no UUID" "$R"
  grep -q 'secret' "$T/sites/local-site/DESIGN.md" && R=1 || R=0
  check "local DESIGN.md has no path fragment" "$R"
  grep -q 'ds-site' "$T/DESIGNER.md" && grep -q 'local-site' "$T/DESIGNER.md" && ! grep -q 'plain-site' "$T/DESIGNER.md" && R=0 || R=1
  check "DESIGNER.md lists linked slugs, not plain-site" "$R"
  cp "$D" "$T/d1.md"; cp "$T/DESIGNER.md" "$T/r1.md"
  WM_ROOT="$T" node "$SC/design-marker.mjs" --all >/dev/null
  cmp -s "$T/d1.md" "$D" && cmp -s "$T/r1.md" "$T/DESIGNER.md" && R=0 || R=1
  check "second run is byte-identical" "$R"
  WM_ROOT="$T" node "$SC/design-connect.mjs" ds-site --remove >/dev/null
  [ ! -e "$D" ] && ! grep -q 'ds-site' "$T/DESIGNER.md" && R=0 || R=1
  check "--remove deletes DESIGN.md and drops it from DESIGNER.md" "$R"
fi

# ── lock ───────────────────────────────────────────────────────────────────────
if want lock; then
  echo ""
  echo "── DSYNC-04/05: lock and diff ──"
  fresh_root; set_ds
  stage
  L="$T/sites/fixture-design/design.lock.json"
  grep -q 'uploads/' "$L" && R=1 || R=0
  check "lock has no uploads/ key" "$R"
  grep -qE '"(content|html|css)"[[:space:]]*:' "$L" && R=1 || R=0
  check "lock holds no content/html/css keys" "$R"
  cp "$L" "$T/lock1"
  stage
  check "second identical run reports added 0, changed 0, removed 0" "$([ "$RC" = 0 ] && has 'added 0, changed 0, removed 0' || echo 1)"
  cmp -s "$T/lock1" "$L" && R=0 || R=1
  check "lock byte-identical after identical run" "$R"

  S="$T/_staging/design/fixture-design/files"
  printf '/* changed */\n:root{--x:1}\n' > "$S/tokens/colors.css"
  printf '<p>new</p>\n' > "$S/templates/website/new.html"
  rm "$S/components/core/Button.jsx"
  cp "$L" "$T/lock2"
  stage --dry-run
  C=$(printf '%s\n' "$OUT" | grep -c '^  + tokens/\|^  + templates/' || true)
  [ "$(printf '%s\n' "$OUT" | grep -c '^  + templates/website/new.html')" = 1 ] \
    && [ "$(printf '%s\n' "$OUT" | grep -c '^  ~ tokens/colors.css')" = 1 ] \
    && [ "$(printf '%s\n' "$OUT" | grep -c '^  - components/core/Button.jsx')" = 1 ] && R=0 || R=1
  check "report shows one +, one ~, one -" "$R"
  cmp -s "$T/lock2" "$L" && R=0 || R=1
  check "--dry-run leaves the lock byte-identical" "$R"
fi

# ── sanitise ───────────────────────────────────────────────────────────────────
if want sanitise; then
  echo ""
  echo "── DSYNC-08: sanitiser ──"
  OUTJ=$(node --input-type=module -e "
    import { sanitiseHtml } from '$SC/lib/design-sanitise.mjs';
    import { readFileSync } from 'fs';
    const m = sanitiseHtml(readFileSync('$FX/sanitise/malicious.html','utf8'));
    const c = sanitiseHtml(readFileSync('$FX/sanitise/clean.html','utf8'));
    console.log(JSON.stringify({ m, c }));")
  chk() { printf '%s' "$OUTJ" | node -e "
    const { m, c } = JSON.parse(require('fs').readFileSync(0,'utf8'));
    const r = (function(){ $1 })();
    process.exit(r ? 0 : 1);" && echo 0 || echo 1; }
  for bad in '<script' '<iframe' 'onerror' 'javascript:' 'evil.example' '<!--'; do
    check "output has no '$bad'" "$(chk "return !m.html.toLowerCase().includes('$bad');")"
  done
  for k in removed-element removed-attribute removed-url removed-comment instruction-like-text external-link-kept; do
    check "report has kind $k" "$(chk "return m.report.some(x => x.kind === '$k');")"
  done
  check "injection reported and still present as text" "$(chk "return m.report.some(x => x.kind === 'instruction-like-text' && /ignore previous/i.test(x.detail)) && /ignore previous instructions/i.test(m.html);")"
  check "clean.html report only has external-link-kept" "$(chk "return c.report.length > 0 && c.report.every(x => x.kind === 'external-link-kept');")"
fi

# ── tokens ─────────────────────────────────────────────────────────────────────
if want tokens; then
  echo ""
  echo "── DSYNC-07: token mapping ──"
  mkroot
  cp -R "$FX/tokens/site" "$T/sites/fixture-design"
  mkdir -p "$T/_staging/design/fixture-design/files/tokens"
  cp "$FX/tokens/colors.css" "$T/_staging/design/fixture-design/files/tokens/"
  W="$T/sites/fixture-design/wiring.json"
  LAY="$T/sites/fixture-design/src/layouts/Layout.astro"
  cp "$LAY" "$T/layout.orig"
  cp "$W" "$T/wiring.orig"
  tok() { run env WM_ROOT="$T" WM_TOKEN_MAP="$FX/tokens/map.json" node "$SC/design-tokens.mjs" fixture-design "$@"; }
  tok --dry-run
  cmp -s "$T/wiring.orig" "$W" && R=0 || R=1
  check "--dry-run leaves wiring.json byte-identical" "$([ "$RC" = 0 ] && echo $R || echo 1)"
  tok
  check "token run exits 0" "$(rcis 0)"
  jq -e '.brand.doc_tokens["--accent"]=="#00FB92" and .brand.doc_tokens["--surface-1"]=="#000" and .brand.doc_tokens["--gutter"]=="4px"' "$W" >/dev/null && R=0 || R=1
  check "mapped values land in doc_tokens" "$R"
  jq -e '.brand.doc_tokens | has("--unknown-x") | not' "$W" >/dev/null && R=0 || R=1
  check "unmapped name absent from doc_tokens" "$R"
  RP="$T/_staging/design/fixture-design/tokens-report.json"
  jq -e '[.unmapped[]? | (.name // .)] | length >= 0' "$RP" >/dev/null && R=0 || R=1
  check "tokens-report.json is valid JSON" "$R"
  jq -e '.mapped | any(.before != null)' "$RP" >/dev/null && R=0 || R=1
  check "report shows a non-null before for a pre-existing key" "$R"
  cmp -s "$T/layout.orig" "$LAY" && R=0 || R=1
  check "Layout.astro byte-identical" "$R"
  [ -f "$T/_staging/design/fixture-design/layout-tokens.proposal.diff" ] && R=0 || R=1
  check "layout proposal diff exists" "$R"
  cp "$W" "$T/wiring.after1"
  tok
  cmp -s "$T/wiring.after1" "$W" && R=0 || R=1
  check "second run leaves wiring.json byte-identical" "$([ "$RC" = 0 ] && echo $R || echo 1)"
  tok --input "$FX/tokens/bad.css"
  check "bad.css exits 1" "$(rcis 1)"
  run node "$SC/validate-brand.mjs"
  check "validate-brand.mjs exits 0" "$(rcis 0)"
  grep -q '/Users/pbau3r' "$SC/validate-brand.mjs" && R=1 || R=0
  check "validate-brand.mjs has no hardcoded home path" "$R"
fi

# ── guard ──────────────────────────────────────────────────────────────────────
if want guard; then
  echo ""
  echo "── DSYNC-06/09: divergence guard and orchestrator ──"
  mkroot
  cp -R "$FX/ingest/site" "$T/sites/fixture-design"
  C="$T/sites/fixture-design/src/components"
  ING() { run env WM_ROOT="$T" node "$SC/ingest-artifact.mjs" fixture-design --mode section --input "$FX/ingest/page.html" "$@"; }
  LK="$T/sites/fixture-design/design.lock.json"

  ING --section hero
  check "first section ingest exits 0" "$(rcis 0)"
  [ -f "$C/Hero.astro" ] && R=0 || R=1
  check "Hero.astro written" "$R"
  jq -e '.components.Hero.sha256 | length > 10' "$LK" >/dev/null 2>&1 && R=0 || R=1
  check "lock records the Hero hash" "$R"
  ING --section hero
  check "unchanged re-run exits 0" "$(rcis 0)"

  printf '\n<!-- hand edit -->\n' >> "$C/Hero.astro"
  cp "$C/Hero.astro" "$T/hero.edited"
  ING --section hero
  check "hand-edited Hero exits 3" "$(rcis 3)"
  cmp -s "$T/hero.edited" "$C/Hero.astro" && R=0 || R=1
  check "hand-edited file byte-identical" "$R"
  [ -f "$C/Hero.incoming.astro" ] && R=0 || R=1
  check "Hero.incoming.astro written" "$R"

  ING --section hero --accept Hero
  check "--accept Hero exits 0" "$(rcis 0)"
  grep -q 'hand edit' "$C/Hero.astro" && R=1 || R=0
  check "--accept overwrites the hand edit" "$R"
  [ ! -f "$C/Hero.incoming.astro" ] && R=0 || R=1
  check "--accept removes the stale incoming file" "$R"

  printf '<section>mine</section>\n' > "$C/Features.astro"
  ING --section features
  check "untracked pre-existing component exits 3" "$(rcis 3)"

  rm -f "$C/Features.astro" "$C/Features.incoming.astro" "$C/Hero.astro" "$C/Hero.incoming.astro"
  rm -f "$LK"
  ING --section hero --dry-run
  [ ! -e "$C/Hero.astro" ] && [ ! -e "$LK" ] && R=0 || R=1
  check "--dry-run writes nothing" "$([ "$RC" = 0 ] && echo $R || echo 1)"

  mkroot
  cp -R "$FX/ingest/site" "$T/sites/fixture-design"
  mkdir -p "$T/_staging/design/fixture-design"
  cp -R "$FX/ingest/project" "$T/_staging/design/fixture-design/files"
  WM_ROOT="$T" node "$SC/design-connect.mjs" fixture-design --source local --path . >/dev/null
  run env WM_ROOT="$T" node "$SC/design-ingest.mjs" fixture-design
  check "design-ingest on ingest/project exits 0" "$(rcis 0)"
  N=$(find "$T/sites/fixture-design/src/components" -name '*.astro' | wc -l | tr -d ' ')
  [ "$N" -ge 1 ] && R=0 || R=1
  check "design-ingest produced components ($N)" "$R"
  grep -rlE '<script|onclick' "$T/sites/fixture-design/src/components" >/dev/null 2>&1 && R=1 || R=0
  check "components have no <script or onclick" "$R"
  [ ! -e "$T/sites/fixture-design/src/pages" ] || [ -z "$(find "$T/sites/fixture-design/src/pages" -type f 2>/dev/null)" ] && R=0 || R=1
  check "nothing written under src/pages" "$R"
fi

# ── render ─────────────────────────────────────────────────────────────────────
if want render; then
  echo ""
  echo "── DSYNC-09: JSX render ──"
  mkroot
  RD=$(mktemp -d); RD=$(cd "$RD" && pwd -P); TMPS+=("$RD")
  cp "$FX"/render/*.jsx "$RD/"
  run node --input-type=module -e "
    import { renderComponent } from '$SC/lib/design-render.mjs';
    const r = await renderComponent('$RD/Card.jsx', { stagingRoot: '$RD', outDir: '$T/out', fallback: false });
    console.log(r.html);"
  check "Card.jsx renders 'Fixture Card'" "$([ "$RC" = 0 ] && has 'Fixture Card' || echo 1)"
  run node --input-type=module -e "
    import { renderComponent } from '$SC/lib/design-render.mjs';
    await renderComponent('$RD/Evil.jsx', { stagingRoot: '$RD', outDir: '$T/out2', fallback: false });"
  check "Evil.jsx refused" "$(rcis 1)"
  run node --input-type=module -e "
    import { renderComponent } from '$SC/lib/design-render.mjs';
    await renderComponent('$RD/Empty.jsx', { stagingRoot: '$RD', outDir: '$T/out3', fallback: false });"
  check "Empty.jsx throws" "$(rcis 1)"
fi

echo ""
echo "=========================================================="
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
exit 0
