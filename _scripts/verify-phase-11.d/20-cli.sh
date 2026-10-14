# Section cli: drop.mjs operator CLI (DROP-02, DROP-07, DROP-08). Sourced by verify-phase-11.sh.
# Own fixtures under $FX/cli, DROPS_DIR always explicit, no dist output (no build race).

cli_tree_hash() { find "$1" -type f | sort | xargs shasum 2>/dev/null | shasum | cut -d' ' -f1; }
cli_count() { find "$1/sfdy" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' '; }

sec_cli() {
  echo; echo "== cli =="
  local C="$FX/cli" CA rc out n id h1 h2 i
  CA="$PWD/$C"
  rm -rf "${FX:?}/cli"; mkdir -p "$C"
  local DROP="node _scripts/drop.mjs"
  local NODE_BIN; NODE_BIN=$(command -v node)
  local HIDE="$C/nobin"; mkdir -p "$HIDE"; ln -sf "$NODE_BIN" "$HIDE/node"

  local HAVE_QPDF=0; command -v qpdf >/dev/null 2>&1 && HAVE_QPDF=1
  check "qpdf is installed (DROP-05 requires it)" "$([ $HAVE_QPDF = 1 ] && echo 0 || echo 1)"
  [ $HAVE_QPDF = 1 ] || return

  # fixtures
  node _scripts/fixtures/drops/make-pdf.mjs "$C/raw.pdf" >/dev/null
  node --input-type=module -e 'import {stripPdf} from "./_scripts/lib/pdf-strip.mjs"; stripPdf(process.argv[1], process.argv[2]);' "$C/raw.pdf" "$C/fixture.pdf"
  node _scripts/fixtures/drops/gen.mjs good "$C/good" >/dev/null
  node _scripts/fixtures/drops/gen.mjs bad-expiryless "$C/bad1" >/dev/null
  node _scripts/fixtures/drops/gen.mjs bad-horizon "$C/bad2" >/dev/null
  local ID_ACTIVE ID_SOON ID_EXP ID_FLAG ID_TOMB
  ID_ACTIVE=$(fx_id active cli/good); ID_SOON=$(fx_id soon cli/good); ID_EXP=$(fx_id expired cli/good)
  ID_FLAG=$(fx_id withdrawnFlag cli/good); ID_TOMB=$(fx_id withdrawnTomb cli/good)
  local GOOD="$CA/good"

  # ---- list
  out=$(DROPS_DIR=$GOOD $DROP list --site sfdy 2>&1); rc=$?
  check "list exits 0" "$rc"
  for i in "$ID_ACTIVE" "$ID_SOON" "$ID_EXP"; do
    check "list shows 8-char short id ${i:0:4}" "$([ "$(echo "$out" | grep -c "${i:0:8}")" -ge 1 ] && echo 0 || echo 1)"
    check "list never prints a full id" "$([ "$(echo "$out" | grep -c "$i")" = 0 ] && echo 0 || echo 1)"
  done
  check "list never prints bodies" "$([ "$(echo "$out" | grep -c 'FIXTURE-BODY')" = 0 ] && echo 0 || echo 1)"
  for s in active soon expired withdrawn; do
    check "list reports status $s" "$([ "$(echo "$out" | grep -c " $s\$")" -ge 1 ] && echo 0 || echo 1)"
  done
  out=$(DROPS_DIR=$GOOD $DROP list --site sfdy --json 2>&1)
  check "list --json is valid JSON" "$(echo "$out" | node -e 'JSON.parse(require("fs").readFileSync(0,"utf8"))' >/dev/null 2>&1 && echo 0 || echo 1)"
  DROPS_DIR=$GOOD $DROP list --site "../x" >/dev/null 2>&1; check "list rejects a bad slug" "$([ $? = 1 ] && echo 0 || echo 1)"
  DROPS_DIR=$GOOD $DROP list --site orbint >/dev/null 2>&1; check "list rejects a site without drops.enabled" "$([ $? = 1 ] && echo 0 || echo 1)"

  # ---- new
  local N="$CA/new"; mkdir -p "$N"
  printf 'Body for new drop\n' > "$C/body.md"
  DROPS_DIR=$N $DROP new --site sfdy --title "New T" --label "lbl" --body-file "$C/body.md" --days 45 >"$C/new.out" 2>&1; rc=$?
  check "new --days 45 exits 0" "$rc"
  n=$(find "$N/sfdy" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')
  check "new created exactly one drop folder" "$([ "$n" = 1 ] && echo 0 || echo 1)"
  id=$(basename "$(find "$N/sfdy" -mindepth 1 -maxdepth 1 -type d | head -1)")
  check "new folder name is 32 lowercase hex" "$(echo "$id" | grep -Eq '^[0-9a-f]{32}$' && echo 0 || echo 1)"
  check "new drop.md exists with matching id" "$(grep -q "^id: $id\$" "$N/sfdy/$id/drop.md" && echo 0 || echo 1)"
  check "new created carries an offset" "$(grep -Eq '^created: .*([+-][0-9]{2}:[0-9]{2}|Z)$' "$N/sfdy/$id/drop.md" && echo 0 || echo 1)"
  check "new expires carries an offset" "$(grep -Eq '^expires: .*([+-][0-9]{2}:[0-9]{2}|Z)$' "$N/sfdy/$id/drop.md" && echo 0 || echo 1)"
  check "new prints the local URL path" "$(grep -q "/d/$id/" "$C/new.out" && echo 0 || echo 1)"
  check "new written drop passes check" "$(DROPS_DIR=$N $DROP check sfdy >/dev/null 2>&1; echo $?)"
  rm -rf "${N:?}/sfdy"

  DROPS_DIR=$N $DROP new --site sfdy --title T --body-file "$C/body.md" --days 91 >/dev/null 2>&1; rc=$?
  check "new --days 91 exits 1" "$([ $rc = 1 ] && echo 0 || echo 1)"
  check "new --days 91 wrote nothing" "$([ "$(cli_count "$N")" = 0 ] && echo 0 || echo 1)"
  local FAR; FAR=$(node --input-type=module -e 'import {isoWithOffset} from "./_scripts/lib/drops-core.mjs";console.log(isoWithOffset(new Date(Date.now()+120*864e5)))')
  DROPS_DIR=$N $DROP new --site sfdy --title T --body-file "$C/body.md" --expires "$FAR" >/dev/null 2>&1; rc=$?
  check "new --expires beyond 90 days exits 1" "$([ $rc = 1 ] && echo 0 || echo 1)"
  check "new --expires beyond 90 days wrote nothing" "$([ "$(cli_count "$N")" = 0 ] && echo 0 || echo 1)"
  DROPS_DIR=$N $DROP new --site sfdy --title T --body-file "$C/nope.md" >/dev/null 2>&1; rc=$?
  check "new with a missing body file exits 1" "$([ $rc = 1 ] && echo 0 || echo 1)"
  check "new with a missing body file wrote nothing" "$([ "$(cli_count "$N")" = 0 ] && echo 0 || echo 1)"

  out=$(DROPS_DIR=$N env PATH="$HIDE" "$HIDE/node" _scripts/drop.mjs new --site sfdy --title T --body-file "$C/body.md" --pdf "$C/raw.pdf" 2>&1); rc=$?
  check "new --pdf without qpdf exits 1" "$([ $rc = 1 ] && echo 0 || echo 1)"
  check "new --pdf without qpdf prints the DROP-05 message" "$([ "$(echo "$out" | grep -c 'DROP-05')" -ge 1 ] && echo 0 || echo 1)"
  check "new --pdf without qpdf wrote nothing" "$([ "$(cli_count "$N")" = 0 ] && echo 0 || echo 1)"

  DROPS_DIR=$N $DROP new --site sfdy --title "With pdf" --body-file "$C/body.md" --pdf "$C/raw.pdf" >/dev/null 2>&1; rc=$?
  check "new --pdf exits 0" "$rc"
  id=$(basename "$(find "$N/sfdy" -mindepth 1 -maxdepth 1 -type d | head -1)")
  check "new stored the PDF" "$([ -s "$N/sfdy/$id/raw.pdf" ] && echo 0 || echo 1)"
  check "new lists the PDF in attachments" "$(grep -q '^attachments: \[raw.pdf\]' "$N/sfdy/$id/drop.md" && echo 0 || echo 1)"
  check "new stripped PDF metadata (marker gone)" "$([ "$(grep -a -c 'FIXTURE-AUTHOR' "$N/sfdy/$id/raw.pdf")" = 0 ] && echo 0 || echo 1)"
  rm -rf "${N:?}/sfdy"

  # ---- withdraw
  local W="$CA/wd"; cp -R "$GOOD" "$W"
  h1=$(cli_tree_hash "$W")
  out=$(DROPS_DIR=$W $DROP withdraw "${ID_ACTIVE:0:8}" 2>&1); rc=$?
  h2=$(cli_tree_hash "$W")
  check "withdraw dry run exits 0" "$rc"
  check "withdraw dry run changes nothing" "$([ "$h1" = "$h2" ] && echo 0 || echo 1)"
  check "withdraw dry run mentions --confirm" "$([ "$(echo "$out" | grep -c -- '--confirm')" -ge 1 ] && echo 0 || echo 1)"
  DROPS_DIR=$W $DROP withdraw "${ID_ACTIVE:0:7}" --confirm >/dev/null 2>&1; check "withdraw 7-char prefix exits 1" "$([ $? = 1 ] && echo 0 || echo 1)"
  DROPS_DIR=$W $DROP withdraw 00000000 --confirm >/dev/null 2>&1; check "withdraw unknown prefix exits 1" "$([ $? = 1 ] && echo 0 || echo 1)"
  # ambiguous prefix: two folders sharing 8 chars
  local A="$CA/amb"; mkdir -p "$A/sfdy"
  node --input-type=module -e '
import fs from "node:fs"; import path from "node:path";
import { formatDrop, isoWithOffset } from "./_scripts/lib/drops-core.mjs";
const base = process.argv[1];
for (const tail of ["a","b"]) {
  const id = "deadbeef" + "0".repeat(23) + tail;
  fs.mkdirSync(path.join(base, "sfdy", id), { recursive: true });
  fs.writeFileSync(path.join(base, "sfdy", id, "drop.md"), formatDrop({ id, title: "x", created: isoWithOffset(), expires: isoWithOffset(new Date(Date.now()+30*864e5)) }, "x\n"));
}' "$A"
  DROPS_DIR=$A $DROP withdraw deadbeef --confirm >/dev/null 2>&1; check "withdraw ambiguous prefix exits 1" "$([ $? = 1 ] && echo 0 || echo 1)"
  check "withdraw ambiguous prefix removed nothing" "$([ "$(cli_count "$A")" = 2 ] && echo 0 || echo 1)"
  out=$(DROPS_DIR=$W $DROP withdraw "${ID_ACTIVE:0:8}" --confirm 2>&1); rc=$?
  check "withdraw --confirm exits 0" "$rc"
  check "withdraw --confirm removed the folder" "$([ ! -e "$W/sfdy/$ID_ACTIVE" ] && echo 0 || echo 1)"
  check "withdraw wrote a tombstone with the id" "$([ "$(grep -c "$ID_ACTIVE" "$W/sfdy/withdrawn.json")" -ge 1 ] && echo 0 || echo 1)"
  check "tombstone has reason withdrawn" "$(node -e 'const t=require("./'"$C"'/wd/sfdy/withdrawn.json").find(e=>e.id==="'"$ID_ACTIVE"'");process.exit(t&&t.reason==="withdrawn"&&Object.keys(t).sort().join()==="at,id,reason"?0:1)' && echo 0 || echo 1)"
  check "tombstone file holds no title or label" "$([ "$(grep -c -i 'fixture' "$W/sfdy/withdrawn.json")" = 0 ] && echo 0 || echo 1)"
  check "withdraw prints the unlisting-only notice (DROP-08)" "$([ "$(echo "$out" | grep -c 'unlisting only')" -ge 1 ] && echo 0 || echo 1)"
  check "withdraw prints follow-up steps (/wm-publish, 404)" "$([ "$(echo "$out" | grep -c '/wm-publish')" -ge 1 ] && [ "$(echo "$out" | grep -c '404')" -ge 1 ] && echo 0 || echo 1)"

  # ---- expire
  local E="$CA/exp"; cp -R "$GOOD" "$E"
  h1=$(cli_tree_hash "$E")
  out=$(DROPS_DIR=$E $DROP expire 2>&1); rc=$?
  h2=$(cli_tree_hash "$E")
  check "expire dry run exits 0" "$rc"
  check "expire dry run changes nothing" "$([ "$h1" = "$h2" ] && echo 0 || echo 1)"
  check "expire dry run lists the expired drop" "$([ "$(echo "$out" | grep -c "${ID_EXP:0:8}")" -ge 1 ] && echo 0 || echo 1)"
  out=$(DROPS_DIR=$E $DROP expire --confirm 2>&1); rc=$?
  check "expire --confirm exits 0" "$rc"
  check "expire removed the expired drop" "$([ ! -e "$E/sfdy/$ID_EXP" ] && echo 0 || echo 1)"
  check "expire left the active drop" "$([ -e "$E/sfdy/$ID_ACTIVE/drop.md" ] && echo 0 || echo 1)"
  check "expire left the soon drop" "$([ -e "$E/sfdy/$ID_SOON/drop.md" ] && echo 0 || echo 1)"
  check "expire tombstone reason is expired" "$(node -e 'const t=require("./'"$C"'/exp/sfdy/withdrawn.json").find(e=>e.id==="'"$ID_EXP"'");process.exit(t&&t.reason==="expired"?0:1)' && echo 0 || echo 1)"
  check "expire prints the unlisting-only notice" "$([ "$(echo "$out" | grep -c 'unlisting only')" -ge 1 ] && echo 0 || echo 1)"

  # ---- check
  out=$(DROPS_DIR=$GOOD $DROP check sfdy 2>&1); rc=$?
  check "check on a good set exits 0" "$rc"
  check "check lists the drops about to be published" "$([ "$(echo "$out" | grep -c 'about to be published: 2')" = 1 ] && echo 0 || echo 1)"
  check "check WARNs on expired-in-source" "$([ "$(echo "$out" | grep -c 'WARN.*expired in source')" -ge 1 ] && echo 0 || echo 1)"
  check "check WARNs on soon-expiring" "$([ "$(echo "$out" | grep -c 'WARN.*within 7 days')" -ge 1 ] && echo 0 || echo 1)"
  DROPS_DIR=$CA/bad1 $DROP check sfdy >/dev/null 2>&1; check "check exits 1 for an expiry-less drop" "$([ $? = 1 ] && echo 0 || echo 1)"
  DROPS_DIR=$CA/bad2 $DROP check sfdy >/dev/null 2>&1; check "check exits 1 for an over-horizon drop" "$([ $? = 1 ] && echo 0 || echo 1)"
  local M="$CA/mismatch"; cp -R "$GOOD" "$M"; mv "$M/sfdy/$ID_ACTIVE" "$M/sfdy/$(printf 'f%.0s' $(seq 1 32))"
  DROPS_DIR=$M $DROP check sfdy >/dev/null 2>&1; check "check exits 1 for an id/folder mismatch" "$([ $? = 1 ] && echo 0 || echo 1)"
  out=$(DROPS_DIR=$GOOD env PATH="$HIDE" "$HIDE/node" _scripts/drop.mjs check sfdy 2>&1); rc=$?
  check "check exits 1 when PDFs exist and qpdf is hidden" "$([ $rc = 1 ] && echo 0 || echo 1)"
  check "check names DROP-05 for missing qpdf" "$([ "$(echo "$out" | grep -c 'DROP-05')" -ge 1 ] && echo 0 || echo 1)"
  # secret-looking body
  local S="$CA/secret"; cp -R "$GOOD" "$S"
  printf 'token %s%s\n' AKIA IOSFODNN7EXAMPLE >> "$S/sfdy/$ID_ACTIVE/drop.md"
  out=$(DROPS_DIR=$S $DROP check sfdy 2>&1); rc=$?
  check "check with a secret-looking body still exits 0" "$rc"
  check "check WARNs on a secret-looking body" "$([ "$(echo "$out" | grep -c 'WARN.*secrets')" -ge 1 ] && echo 0 || echo 1)"
  check "check never prints the secret value" "$([ "$(echo "$out" | grep -c 'IOSFODNN7EXAMPLE')" = 0 ] && echo 0 || echo 1)"

  # ---- --ci hygiene
  out=$(DROPS_DIR=$GOOD $DROP check sfdy --ci 2>&1); rc=$?
  check "check --ci exits 0 on a good set" "$rc"
  check "check --ci output has no fixture title" "$([ "$(echo "$out" | grep -c -i 'Fixture')" = 0 ] && echo 0 || echo 1)"
  check "check --ci output has no label marker" "$([ "$(echo "$out" | grep -c 'fixture-')" = 0 ] && echo 0 || echo 1)"
  for i in "$ID_ACTIVE" "$ID_SOON" "$ID_EXP" "$ID_FLAG" "$ID_TOMB"; do
    check "check --ci prints no full id (${i:0:4})" "$([ "$(echo "$out" | grep -c "$i")" = 0 ] && echo 0 || echo 1)"
  done
  check "check --ci shows a 4-char prefix" "$([ "$(echo "$out" | grep -c "${ID_ACTIVE:0:4}")" -ge 1 ] && echo 0 || echo 1)"
  out=$(DROPS_DIR=$GOOD GITHUB_ACTIONS=true $DROP list --site sfdy 2>&1)
  check "list under GITHUB_ACTIONS prints no full id, title or label" "$([ "$(echo "$out" | grep -c -E "$ID_ACTIVE|$ID_SOON|fixture-|Fixture")" = 0 ] && echo 0 || echo 1)"
  DROPS_DIR=$GOOD $DROP check sfdy --emit-masks >/dev/null 2>&1; check "--emit-masks outside GITHUB_ACTIONS exits 1" "$([ $? = 1 ] && echo 0 || echo 1)"
  out=$(DROPS_DIR=$GOOD GITHUB_ACTIONS=true $DROP check sfdy --ci --emit-masks 2>&1); rc=$?
  check "--emit-masks inside GITHUB_ACTIONS exits 0" "$rc"
  check "--emit-masks prints one ::add-mask:: line per publishable id" "$([ "$(echo "$out" | grep -c '^::add-mask::[0-9a-f]\{32\}$')" = 2 ] && echo 0 || echo 1)"
  check "--emit-masks covers the active id" "$([ "$(echo "$out" | grep -c "::add-mask::$ID_ACTIVE")" = 1 ] && echo 0 || echo 1)"
  check "the only full ids in GITHUB_ACTIONS output are mask lines" "$([ "$(echo "$out" | grep -v '^::add-mask::' | grep -c -E '[0-9a-f]{32}')" = 0 ] && echo 0 || echo 1)"

  # ---- --live
  out=$(DROPS_DIR=$GOOD DROPS_LIVE_STATUS=403 $DROP check sfdy --live 2>&1); rc=$?
  check "check --live with a 403 exits 0 without --strict" "$rc"
  check "check --live 403 prints a WARN" "$([ "$(echo "$out" | grep -c 'WARN.*live comparison skipped')" -ge 1 ] && echo 0 || echo 1)"
  DROPS_DIR=$GOOD DROPS_LIVE_STATUS=403 $DROP check sfdy --live --strict >/dev/null 2>&1; check "check --live --strict with a 403 exits 1" "$([ $? = 1 ] && echo 0 || echo 1)"
  # live list: active is live, tombstoned id also live (should disappear), soon not yet live
  printf '["%s","%s"]\n' "$ID_ACTIVE" "$ID_TOMB" > "$C/live1.json"
  out=$(DROPS_DIR=$GOOD DROPS_LIVE_LIST_FILE=$CA/live1.json $DROP check sfdy --live 2>&1); rc=$?
  check "check --live (file) exits 0 without --strict" "$rc"
  check "check --live prints 'will go live 1'" "$([ "$(echo "$out" | grep -c '^will go live 1$')" = 1 ] && echo 0 || echo 1)"
  check "check --live prints 'will disappear 1'" "$([ "$(echo "$out" | grep -c '^will disappear 1$')" = 1 ] && echo 0 || echo 1)"
  DROPS_DIR=$GOOD DROPS_LIVE_LIST_FILE=$CA/live1.json $DROP check sfdy --live --strict >/dev/null 2>&1
  check "check --live --strict exits 1 for a tombstoned drop still live" "$([ $? = 1 ] && echo 0 || echo 1)"
  printf '["%s"]\n' "$ID_EXP" > "$C/live2.json"
  DROPS_DIR=$GOOD DROPS_LIVE_LIST_FILE=$CA/live2.json $DROP check sfdy --live --strict >/dev/null 2>&1
  check "check --live --strict exits 1 for an expired drop still live" "$([ $? = 1 ] && echo 0 || echo 1)"
  printf '["%s"]\n' "$(printf 'c%.0s' $(seq 1 32))" > "$C/live3.json"
  DROPS_DIR=$GOOD DROPS_LIVE_LIST_FILE=$CA/live3.json $DROP check sfdy --live --strict >/dev/null 2>&1
  check "check --live --strict exits 1 for a live id missing from source" "$([ $? = 1 ] && echo 0 || echo 1)"
  printf '["%s","%s"]\n' "$ID_ACTIVE" "$ID_SOON" > "$C/live4.json"
  DROPS_DIR=$GOOD DROPS_LIVE_LIST_FILE=$CA/live4.json $DROP check sfdy --live --strict >/dev/null 2>&1
  check "check --live --strict exits 0 when live equals source" "$?"
  printf '[]\n' > "$C/live5.json"
  DROPS_DIR=$GOOD DROPS_LIVE_LIST_FILE=$CA/live5.json $DROP check sfdy --live --strict >/dev/null 2>&1
  check "check --live --strict exits 0 with nothing live yet" "$?"

  # ---- safety
  check "CLI never runs git commit or push" "$([ "$(grep -c -E "'(commit|push)'" _scripts/drop.mjs)" = 0 ] && echo 0 || echo 1)"
}
