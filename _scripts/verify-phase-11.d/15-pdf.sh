# Section pdf: qpdf strip/verify wrapper (DROP-05). Sourced by verify-phase-11.sh.

PDF_MARKERS="FIXTURE-AUTHOR FIXTURE-CREATOR FIXTURE-PRODUCER FIXTURE-KEYWORDS FIXTURE-XMP FIXTURE-ATTACH FIXTURE-PIECEINFO"

# run a JS snippet as an ES module in the repo; args are available as process.argv.slice(1)
pdf_node() { node --input-type=module -e "$1" "${@:2}" 2>&1; }

sec_pdf() {
  echo; echo "== pdf =="
  if ! command -v qpdf >/dev/null 2>&1; then
    check "qpdf is installed (DROP-05 requires it)" 1
    return
  fi
  local P="$FX/pdf" m n rc msg
  rm -rf "${FX:?}/pdf"; mkdir -p "$P"
  node _scripts/fixtures/drops/make-pdf.mjs "$P/raw.pdf"
  check "fixture PDF generated" "$([ -s "$P/raw.pdf" ] && echo 0 || echo 1)"
  for m in $PDF_MARKERS; do
    check "marker $m present in raw fixture (check is not vacuous)" "$([ "$(grep -a -c "$m" "$P/raw.pdf")" -ge 1 ] && echo 0 || echo 1)"
  done

  local STRIP_JS='
import { pathToFileURL } from "node:url"; import path from "node:path";
const [src, dest, markers] = process.argv.slice(1);
const m = await import(pathToFileURL(path.resolve("_scripts/lib/pdf-strip.mjs")).href);
m.stripPdf(src, dest);
m.verifyPdf(dest, { markers: markers.split(" ") });
console.log("ok");'
  msg=$(pdf_node "$STRIP_JS" "$P/raw.pdf" "$P/fixture.pdf" "$PDF_MARKERS"); rc=$?
  check "stripPdf + verifyPdf pass on fixture ($msg)" "$([ $rc = 0 ] && [ "$msg" = ok ] && echo 0 || echo 1)"

  for m in $PDF_MARKERS; do
    check "marker $m gone from stripped output (independent grep)" "$([ "$(grep -a -c "$m" "$P/fixture.pdf")" = 0 ] && echo 0 || echo 1)"
  done
  for m in /Info /Metadata /PieceInfo /EmbeddedFiles /AF /JavaScript /OpenAction /Producer /Author /Creator x:xmpmeta; do
    check "deny token $m absent from stripped output" "$([ "$(grep -a -c -- "$m" "$P/fixture.pdf")" = 0 ] && echo 0 || echo 1)"
  done
  check "stripped output has 1 page" "$([ "$(qpdf --show-npages "$P/fixture.pdf")" = 1 ] && echo 0 || echo 1)"
  check "qpdf --check clean on stripped output" "$(qpdf --check "$P/fixture.pdf" 2>&1 | grep -qi warning && echo 1 || echo 0)"
  n=$(qpdf --qdf --object-streams=disable "$P/fixture.pdf" - 2>/dev/null | grep -a -c FIXTURE-VISIBLE-TEXT)
  check "visible text survives" "$([ "$n" -ge 1 ] && echo 0 || echo 1)"

  local NEG_JS='
import { pathToFileURL } from "node:url"; import path from "node:path";
const m = await import(pathToFileURL(path.resolve("_scripts/lib/pdf-strip.mjs")).href);
try { m.verifyPdf(process.argv[1]); console.log("passed"); } catch (e) { console.log("failed: " + e.message); }'
  msg=$(pdf_node "$NEG_JS" "$P/raw.pdf")
  check "negative control: verifyPdf fails on the unstripped fixture" "$(echo "$msg" | grep -q '^failed: .*DROP-05' && echo 0 || echo 1)"
  check "verify error names a token, not content" "$(echo "$msg" | grep -q 'FIXTURE-' && echo 1 || echo 0)"

  # encrypted input
  qpdf --encrypt "" owner 256 -- "$P/raw.pdf" "$P/enc.pdf" >/dev/null 2>&1
  local ENC_JS='
import { pathToFileURL } from "node:url"; import path from "node:path";
const m = await import(pathToFileURL(path.resolve("_scripts/lib/pdf-strip.mjs")).href);
try { m.stripPdf(process.argv[1], process.argv[2]); console.log("accepted"); } catch (e) { console.log("rejected: " + e.message); }'
  msg=$(pdf_node "$ENC_JS" "$P/enc.pdf" "$P/enc-out.pdf")
  check "encrypted PDF rejected with a clear message" "$(echo "$msg" | grep -q '^rejected: .*encrypted' && echo 0 || echo 1)"

  # missing qpdf and old qpdf
  local NODE_BIN; NODE_BIN=$(command -v node)
  local REQ_JS='
import { pathToFileURL } from "node:url"; import path from "node:path";
const m = await import(pathToFileURL(path.resolve("_scripts/lib/pdf-strip.mjs")).href);
try { m.requireQpdf(); console.log("ok"); } catch (e) { console.log(e.message); }'
  mkdir -p "$P/nopath" "$P/oldpath"
  ln -sf "$NODE_BIN" "$P/nopath/node"
  msg=$(env PATH="$P/nopath" "$NODE_BIN" --input-type=module -e "$REQ_JS" 2>&1)
  check "requireQpdf without qpdf throws the exact DROP-05 message" "$([ "$msg" = "[drops] DROP-05: qpdf not found (brew install qpdf / apt install qpdf)" ] && echo 0 || echo 1)"
  printf '#!/bin/sh\necho "qpdf version 10.6.3"\n' > "$P/oldpath/qpdf"; chmod +x "$P/oldpath/qpdf"
  msg=$(env PATH="$P/oldpath:$PATH" "$NODE_BIN" --input-type=module -e "$REQ_JS" 2>&1)
  check "qpdf major version 10 is rejected" "$(echo "$msg" | grep -q 'DROP-05.*too old' && echo 0 || echo 1)"
  msg=$(pdf_node "$REQ_JS")
  check "requireQpdf passes with the real qpdf ($(qpdf --version | head -1))" "$([ "$msg" = ok ] && echo 0 || echo 1)"

  # gen.mjs copies the stripped fixture into the active drop when fixture.pdf sits beside the output dir
  gen_fx good pdf/drop
  local aid; aid=$(node -p "require('./$P/drop/ids.json').active")
  check "gen good copies the stripped fixture into the active drop" "$([ -f "$P/drop/sfdy/$aid/fixture.pdf" ] && grep -q 'attachments: \[fixture.pdf\]' "$P/drop/sfdy/$aid/drop.md" && echo 0 || echo 1)"
}
