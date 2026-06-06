#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

MODULE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

test -f "${MODULE_DIR}/login/gdm-background.png"
test -f "${MODULE_DIR}/login/gdm-background.svg"
test -f "${MODULE_DIR}/README.md"
test -f "${MODULE_DIR}/docs/GDM_SAFETY.md"

mount_is_read_only() {
  local path="$1"
  local options

  if ! command -v findmnt >/dev/null 2>&1; then
    return 1
  fi

  options="$(findmnt -no OPTIONS -T "${path}" 2>/dev/null || true)"
  case ",${options}," in
    *,ro,*) return 0 ;;
    *) return 1 ;;
  esac
}

if mount_is_read_only /usr || mount_is_read_only /usr/share; then
  echo "GDM install unsupported on current filesystem mode."
elif [ -e /usr/share/backgrounds ] && mount_is_read_only /usr/share/backgrounds; then
  echo "GDM install unsupported on current filesystem mode."
fi

if [ -f /etc/fedora-release ]; then
  if grep -q "Fedora release 42" /etc/fedora-release; then
    echo "Fedora 42 detected."
  else
    echo "Fedora 42 not detected. GDM install script will refuse to run."
  fi
else
  echo "/etc/fedora-release not found. GDM install script will refuse to run."
fi

echo "GDM module validation passed. No GDM changes were made."
