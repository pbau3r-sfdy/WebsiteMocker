#!/usr/bin/env bash
# _scripts/whois-check.sh
# ─────────────────────────────────────────────────────────────────────────────
# WHOIS wrapper — checks one or more domains and prints structured summaries.
#
# Usage:
#   bash _scripts/whois-check.sh mogwai-team.de mogwai.com mogwai.tech
#   bash _scripts/whois-check.sh --json mogwai-team.de mogwai.com
#
# Flags:
#   --json    Output newline-delimited JSON instead of human-readable tables
#   --quiet   Only print AVAILABLE domains (useful for bulk screening)
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── ANSI colours ─────────────────────────────────────────────────────────────
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[0;33m"
CYAN="\033[0;36m"
BOLD="\033[1m"
DIM="\033[2m"
RESET="\033[0m"

# ── Flags ────────────────────────────────────────────────────────────────────
JSON_MODE=false
QUIET_MODE=false
DOMAINS=()

for arg in "$@"; do
  case "$arg" in
    --json)  JSON_MODE=true ;;
    --quiet) QUIET_MODE=true ;;
    *)       DOMAINS+=("$arg") ;;
  esac
done

if [[ ${#DOMAINS[@]} -eq 0 ]]; then
  echo "Usage: $0 [--json] [--quiet] <domain> [domain ...]"
  exit 1
fi

# ── Helper: extract first matching field from whois output ───────────────────
extract() {
  local raw="$1"
  shift
  for pattern in "$@"; do
    local val
    # Strip ANSI escape codes and control chars after extraction
    val=$(echo "$raw" | grep -iE "^${pattern}[[:space:]]*:" | head -1 \
      | sed 's/^[^:]*:[[:space:]]*//' \
      | sed 's/\x1b\[[0-9;]*m//g' \
      | tr -d '\r' \
      | tr -d '\000-\010\013\014\016-\037' \
      | xargs)
    if [[ -n "$val" ]]; then
      echo "$val"
      return
    fi
  done
  echo ""
}

# ── Helper: determine availability from raw WHOIS ────────────────────────────
availability() {
  local raw="$1"
  local domain="$2"

  # DENIC (.de) explicit free/connect status
  if echo "$raw" | grep -qiE "^Status:[[:space:]]*free"; then
    echo "available"
    return
  fi
  if echo "$raw" | grep -qiE "^Status:[[:space:]]*(connect|active|registered)"; then
    echo "taken"
    return
  fi

  # Generic gTLD / ccTLD signals
  if echo "$raw" | grep -qiE "^(Domain Name|domain):[[:space:]]*${domain}" ; then
    echo "taken"
    return
  fi
  if echo "$raw" | grep -qiE "No match for|NOT FOUND|No Data Found|Object does not exist|Status:[[:space:]]*AVAILABLE|is free"; then
    echo "available"
    return
  fi
  if echo "$raw" | grep -qiE "(Registrant|Registrar|Name Server|nserver):"; then
    echo "taken"
    return
  fi

  echo "unknown"
}

# ── Helper: json-escape a string ─────────────────────────────────────────────
json_str() {
  local s="$1"
  # Escape backslashes first, then double-quotes, then strip control chars
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  printf '"%s"' "$s"
}

# ── Main loop ────────────────────────────────────────────────────────────────
if ! $JSON_MODE; then
  printf "\n${BOLD}%-35s %-12s %-28s %-22s %s${RESET}\n" \
    "DOMAIN" "STATUS" "REGISTRANT" "EXPIRES" "REGISTRAR"
  printf '%0.s─' {1..120}; echo
fi

for domain in "${DOMAINS[@]}"; do
  raw=$(whois "$domain" 2>/dev/null || true)
  status=$(availability "$raw" "$domain")

  registrant=$(extract "$raw" \
    "Registrant Organization" "Registrant Name" "registrant" \
    "org-name" "holder" "owner")
  [[ -z "$registrant" ]] && registrant="—"

  expiry=$(extract "$raw" \
    "Registry Expiry Date" "Registrar Registration Expiration Date" \
    "Expiry Date" "Expiration Date" "paid-till" "expire")
  # Trim to date only (drop time component)
  expiry=$(echo "$expiry" | sed 's/T.*//')
  [[ -z "$expiry" ]] && expiry="—"

  registrar=$(extract "$raw" \
    "Registrar" "registrar" "Sponsoring Registrar")
  [[ -z "$registrar" ]] && registrar="—"

  nameservers=$(echo "$raw" | grep -iE "^(Name Server|nserver):" | \
    sed 's/^[^:]*:[[:space:]]*//' | tr '[:upper:]' '[:lower:]' | head -2 | tr '\n' ',' | sed 's/,$//')
  [[ -z "$nameservers" ]] && nameservers="—"

  # Only pull creation date for taken domains — available domains return TLD-level dates
  if [[ "$status" == "taken" ]]; then
    creation=$(extract "$raw" \
      "Creation Date" "Created" "created" "registration date")
    creation=$(echo "$creation" | sed 's/T.*//')
    [[ -z "$creation" ]] && creation="—"
  else
    creation="—"
  fi

  dnssec=$(extract "$raw" "DNSSEC" "dnssec")
  [[ -z "$dnssec" ]] && dnssec="—"

  # ── JSON output ─────────────────────────────────────────────────────────
  if $JSON_MODE; then
    printf '{"domain":%s,"status":%s,"registrant":%s,"created":%s,"expires":%s,"registrar":%s,"nameservers":%s,"dnssec":%s}\n' \
      "$(json_str "$domain")" \
      "$(json_str "$status")" \
      "$(json_str "$registrant")" \
      "$(json_str "$creation")" \
      "$(json_str "$expiry")" \
      "$(json_str "$registrar")" \
      "$(json_str "$nameservers")" \
      "$(json_str "$dnssec")"
    continue
  fi

  # ── Human-readable output ────────────────────────────────────────────────
  if [[ "$status" == "available" ]]; then
    status_fmt="${GREEN}✅ available${RESET}"
    $QUIET_MODE || true
  elif [[ "$status" == "taken" ]]; then
    $QUIET_MODE && continue
    status_fmt="${RED}❌ taken${RESET}"
  else
    $QUIET_MODE && continue
    status_fmt="${YELLOW}⚠️  unknown${RESET}"
  fi

  # Truncate long strings for table alignment
  reg_short="${registrant:0:26}"
  exp_short="${expiry:0:20}"
  rar_short="${registrar:0:22}"

  printf "${CYAN}%-35s${RESET} %-22b %-28s %-22s %s\n" \
    "$domain" "$status_fmt" "$reg_short" "$exp_short" "$rar_short"

  # Detail block (only shown for taken domains to surface useful context)
  if [[ "$status" == "taken" ]]; then
    printf "  ${DIM}Created: %-12s  Nameservers: %s  DNSSEC: %s${RESET}\n" \
      "$creation" "$nameservers" "$dnssec"
  fi
done

if ! $JSON_MODE; then
  printf '%0.s─' {1..120}; echo
  echo ""
fi
