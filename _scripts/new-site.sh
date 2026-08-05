#!/usr/bin/env bash
# new-site.sh — scaffold a new site from _core/
# Called by Claude Code's /wm-new-site skill.
# Usage: bash _scripts/new-site.sh <slug> <"Site Name"> <accent-hex> <contact-email>

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SLUG="${1:?Usage: new-site.sh <slug> <Site Name> <accent-hex> <contact-email>}"
NAME="${2:-$SLUG}"
ACCENT="${3:-#3dffa0}"
EMAIL="${4:-hello@example.com}"

DEST="$ROOT/sites/$SLUG"

if [[ -d "$DEST" ]]; then
  echo "❌  sites/$SLUG already exists. Choose a different slug." >&2
  exit 1
fi

echo "▶ Creating sites/$SLUG …"
cp -r "$ROOT/_core" "$DEST"

# Remove any .gitkeep placeholders
find "$DEST" -name '.gitkeep' -delete 2>/dev/null || true

TODAY=$(date +%Y-%m-%d)
DEV_PORT=$((4322 + RANDOM % 100))

# ── Accent-derived tokens ─────────────────────────────────────
# (approximations — refine in Layout.astro after creation)
ACCENT_DIM="rgba($(printf '%d,%d,%d' 0x${ACCENT:1:2} 0x${ACCENT:3:2} 0x${ACCENT:5:2}),.12)"
ACCENT_DARK="$ACCENT"  # placeholder; designer adjusts

# ── Replacements ──────────────────────────────────────────────
replace() {
  local file="$1"
  sed -i '' \
    -e "s|{{SITE_SLUG}}|$SLUG|g" \
    -e "s|{{SITE_NAME}}|$NAME|g" \
    -e "s|{{ACCENT_COLOR}}|$ACCENT|g" \
    -e "s|{{ACCENT_DARK_COLOR}}|$ACCENT_DARK|g" \
    -e "s|{{ACCENT_DIM_COLOR}}|$ACCENT_DIM|g" \
    -e "s|{{CONTACT_EMAIL}}|$EMAIL|g" \
    -e "s|{{TODAY}}|$TODAY|g" \
    -e "s|{{DEV_PORT}}|$DEV_PORT|g" \
    -e "s|{{BG_COLOR}}|#0d0f1c|g" \
    -e "s|{{CARD_COLOR}}|#131620|g" \
    -e "s|{{NAV_COLOR}}|rgba(13,15,28,0.90)|g" \
    -e "s|{{BORDER_COLOR}}|#1e2235|g" \
    -e "s|{{TEXT_COLOR}}|#e8ecff|g" \
    -e "s|{{TEXT_MUTED_COLOR}}|#6b7496|g" \
    -e "s|{{FONT_HEAD}}|'Inter'|g" \
    -e "s|{{FONT_BODY}}|'Inter'|g" \
    -e "s|{{SITE_TAGLINE}}|$NAME — placeholder tagline. Update via /wm-update-hero.|g" \
    -e "s|{{HERO_EYEBROW}}|New Site|g" \
    -e "s|{{HERO_HEADLINE}}|Your headline goes here|g" \
    -e "s|{{HERO_SUB}}|Update this text via /wm-update-hero|g" \
    -e "s|{{CTA_PRIMARY}}|Get in touch|g" \
    -e "s|{{MISSION_TEXT}}|Your mission statement goes here. Use /wm-update-hero to fill this in.|g" \
    -e "s|{{NEWSLETTER_ENDPOINT}}|https://formspree.io/f/placeholder|g" \
    -e "s|{{TWITTER_HANDLE}}||g" \
    -e "s|{{LINKEDIN_SLUG}}||g" \
    -e "s|{{INSTAGRAM_HANDLE}}||g" \
    -e "s|{{LEGAL_NAME}}|$NAME GmbH|g" \
    -e "s|{{LEGAL_ADDRESS}}|Street Address|g" \
    -e "s|{{LEGAL_CITY}}|City|g" \
    -e "s|{{REGISTER_COURT}}|Amtsgericht — (update)|g" \
    -e "s|{{REGISTER_NUMBER}}|HRB — (update)|g" \
    -e "s|{{VAT_ID}}|DE — (update)|g" \
    -e "s|{{RESPONSIBLE_PERSON}}|— (update with name and address)|g" \
    -e "s|{{PRIVACY_DATE}}|$TODAY|g" \
    "$file"
}

# Replace in all text files
find "$DEST" -type f \( -name "*.astro" -o -name "*.json" -o -name "*.mjs" -o -name "*.ts" -o -name "*.md" \) | while read -r f; do
  replace "$f"
done

echo "✓ Created sites/$SLUG"
echo ""
echo "Next steps:"
echo "  1. cd sites/$SLUG && npm install"
echo "  2. npm run dev  →  localhost:$DEV_PORT"
echo "  3. Run /wm-update-hero to fill in brand content"
echo "  4. Run /wm-init-keywords to build the keyword dictionary"
echo "  5. Run /wm-wire to connect services"
