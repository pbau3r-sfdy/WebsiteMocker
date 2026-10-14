#!/usr/bin/env bash
# sync-content.sh <slug> <prod-clone-dir> [wm-root]
# Additive sync of contributor Markdown from a production repo clone into
# sites/<slug>/src/content/. Only copies into collections that already exist as
# directories (e.g. no jobs collection yet: jobs/*.md is skipped with a log line).
# Collection 'drops' is always denied: a contributor push must never become a publish path for drops.
# Never deletes. Regular .md files only (symlinks excluded). Used by content-sync.yml.
set -euo pipefail

SLUG="${1:-}"; CLONE="${2:-}"
ROOT="${3:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"

if [[ ! "$SLUG" =~ ^[a-z0-9-]+$ ]]; then
  echo "Error: slug must match ^[a-z0-9-]+$" >&2; exit 1
fi
if [ -z "$CLONE" ] || [ ! -d "$CLONE/content" ]; then
  echo "No content/ directory in $CLONE - nothing to sync"; exit 0
fi

DEST_BASE="$ROOT/sites/$SLUG/src/content"
while IFS= read -r -d '' src; do
  rel="${src#"$CLONE"/content/}"
  collection="${rel%%/*}"
  if [ "$collection" = "drops" ]; then
    echo "  denied (drops are never synced): $rel"
    continue
  fi
  if [ "$collection" = "$rel" ] || [ ! -d "$DEST_BASE/$collection" ]; then
    echo "  skipped (no $collection collection in $SLUG): $rel"
    continue
  fi
  dest="$DEST_BASE/$rel"
  mkdir -p "$(dirname "$dest")"
  cp "$src" "$dest"
  echo "  synced: $rel"
done < <(find "$CLONE/content" -type f -name '*.md' -print0)
