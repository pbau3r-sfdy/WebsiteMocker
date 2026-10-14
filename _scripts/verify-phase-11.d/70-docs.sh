# Section docs: documentation, skills and project notes (DROP-02, DROP-07, DROP-08, DROP-10).
# Sourced by verify-phase-11.sh.

sec_docs() {
  echo; echo "== docs =="
  local D=docs/drops.md s f
  check "docs/drops.md exists" "$([ -f "$D" ] && echo 0 || echo 1)"
  for s in "confidential-but-not-secret" "export-controlled" "unlisting only" "Token expiry date:" "gh-pages backup" "14 days" "write scope" "gh-pages-old-2026-08" "WM_PUBLISH_PAT" "Drop Download"; do
    check "docs/drops.md states: $s" "$(grep -qF -- "$s" "$D" && echo 0 || echo 1)"
  done
  check "docs/drops.md has a recorded token expiry line (ISO date, none, or the placeholder)" "$(grep -Eq '^Token expiry date: (20[0-9]{2}-[0-9]{2}-[0-9]{2}|none.*|not yet recorded.*)$' "$D" && echo 0 || echo 1)"

  check "CLAUDE.md lists /wm-drop" "$(grep -qF '/wm-drop' CLAUDE.md && echo 0 || echo 1)"
  check "AGENTS.md lists /wm-drop" "$(grep -qF '/wm-drop' AGENTS.md && echo 0 || echo 1)"
  check "CLAUDE.md links docs/drops.md" "$(grep -qF 'docs/drops.md' CLAUDE.md && echo 0 || echo 1)"
  check "AGENTS.md links docs/drops.md" "$(grep -qF 'docs/drops.md' AGENTS.md && echo 0 || echo 1)"

  check "wm-drop skill exists" "$([ -f .claude/skills/wm-drop.md ] && echo 0 || echo 1)"
  check "wm-drop states export-controlled limit" "$(grep -qi 'export-controlled' .claude/skills/wm-drop.md && echo 0 || echo 1)"
  check "wm-drop states unlisting only" "$(grep -qi 'unlisting only' .claude/skills/wm-drop.md && echo 0 || echo 1)"
  check "wm-preflight runs drop.mjs check" "$(grep -qF 'drop.mjs check' .claude/skills/wm-preflight.md && echo 0 || echo 1)"
  check "wm-publish runs drop.mjs check" "$(grep -qF 'drop.mjs check' .claude/skills/wm-publish.md && echo 0 || echo 1)"
  check "wm-publish forbids a new backup branch" "$(grep -qi 'backup branch' .claude/skills/wm-publish.md && echo 0 || echo 1)"
  check "wm-publish keeps the pre-drops backup" "$(grep -qF 'gh-pages-old-2026-08' .claude/skills/wm-publish.md && echo 0 || echo 1)"
  check "wm-publish has the 404 check" "$(grep -qF '404' .claude/skills/wm-publish.md && echo 0 || echo 1)"
  check "wm-deploy unsets DROPS_PREVIEW" "$(grep -qF 'unset DROPS_PREVIEW' .claude/skills/wm-deploy.md && echo 0 || echo 1)"

  local oldslug; oldslug="sfdy-alt-clean-""reskin-2"
  check "REQUIREMENTS DROP-03 mentions sfdy" "$(grep -F 'DROP-03**' .planning/REQUIREMENTS.md | grep -qF 'sfdy' && echo 0 || echo 1)"
  check "REQUIREMENTS DROP-03 has no old slug" "$(grep -F 'DROP-03**' .planning/REQUIREMENTS.md | grep -qF "$oldslug" && echo 1 || echo 0)"
  check "REQUIREMENTS DROP-06 mentions masked and Drop Download" "$(grep -F 'DROP-06**' .planning/REQUIREMENTS.md | grep -qF 'masked' && grep -F 'DROP-06**' .planning/REQUIREMENTS.md | grep -qF 'Drop Download' && echo 0 || echo 1)"
  check "REQUIREMENTS DROP-02 mentions check" "$(grep -F 'DROP-02**' .planning/REQUIREMENTS.md | grep -qF 'check' && echo 0 || echo 1)"
  check "Phase 12 rollback note exists" "$(grep -qF 'gh-pages-old-2026-08' .planning/phases/12-sfdy-cutover/12-05-SUMMARY.md && grep -qF 'Open Drops' .planning/phases/12-sfdy-cutover/12-05-SUMMARY.md && echo 0 || echo 1)"

  # forbidden source directory literal: only the allow-list may name it (pattern built at runtime)
  local pat; pat="src/content/""drops"
  local hits
  hits=$(grep -rIlF -- "$pat" _scripts docs .claude .github _core CLAUDE.md AGENTS.md _templates 2>/dev/null \
    | grep -v -e '/node_modules/' -e '^_scripts/sync-content.sh$' -e '^docs/drops.md$' -e '^_scripts/verify-phase-11.d/30-build.sh$')
  check "no file outside the allow-list names the forbidden content path" "$([ -z "$hits" ] && echo 0 || echo 1)"

  # no 32-hex strings and no token patterns in the docs and skills of this phase
  local files=(docs/drops.md .claude/skills/wm-drop.md .claude/skills/wm-preflight.md .claude/skills/wm-publish.md .claude/skills/wm-deploy.md CLAUDE.md AGENTS.md)
  check "no 32-hex string in docs, skills or project notes" "$([ -z "$(grep -lE '[0-9a-f]{32}' "${files[@]}")" ] && echo 0 || echo 1)"
  check "no ghp_ or github_pat_ token pattern in docs, skills or project notes" "$([ -z "$(grep -lE '(ghp_|github_pat_)[A-Za-z0-9_]{10,}' "${files[@]}")" ] && echo 0 || echo 1)"
  for f in docs/drops.md .claude/skills/wm-drop.md _scripts/drop.mjs _scripts/verify-phase-11.d/20-cli.sh _scripts/verify-phase-11.d/70-docs.sh; do
    check "$f has no old sandbox slug" "$(grep -qF "$oldslug" "$f" && echo 1 || echo 0)"
  done
}
