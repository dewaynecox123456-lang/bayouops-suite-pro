#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
MODULE_DIR="${ROOT_DIR}/gdm-module"
BACKGROUND_SOURCE="${MODULE_DIR}/login/gdm-background.png"
BACKGROUND_SVG_SOURCE="${MODULE_DIR}/login/gdm-background.svg"
BACKGROUND_TARGET="/usr/share/backgrounds/bayoufinds/gdm-background.png"
DCONF_TARGET="/etc/dconf/db/gdm.d/99-bayoufinds-aqua-pro"
STAGING_DIR="${HOME}/.local/share/backgrounds/bayoufinds-gdm-staged"
UNSUPPORTED_MESSAGE="GDM module cannot be installed on this system because /usr/share is not writable. User theme remains installed. No GDM changes were applied."

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

usr_share_install_supported() {
  if mount_is_read_only /usr || mount_is_read_only /usr/share; then
    return 1
  fi

  if [ -e /usr/share/backgrounds ] && mount_is_read_only /usr/share/backgrounds; then
    return 1
  fi

  return 0
}

stage_preview_only() {
  install -d -m 0755 "${STAGING_DIR}"
  install -m 0644 "${BACKGROUND_SOURCE}" "${STAGING_DIR}/gdm-background.png"

  if [ -f "${BACKGROUND_SVG_SOURCE}" ]; then
    install -m 0644 "${BACKGROUND_SVG_SOURCE}" "${STAGING_DIR}/gdm-background.svg"
  fi

  cat > "${STAGING_DIR}/README.txt" <<EOF
BayouFinds Aqua Pro GDM preview staging

This directory is preview-only.
It is not active GDM configuration.
No files here are read by GDM unless an operator manually performs a separate system-level install.

Staged from:
${MODULE_DIR}
EOF
}

unsupported_exit() {
  echo "${UNSUPPORTED_MESSAGE}"
  if stage_preview_only; then
    echo "Preview-only assets staged at: ${STAGING_DIR}"
  else
    echo "Preview-only staging was not available at: ${STAGING_DIR}" >&2
  fi
  exit 0
}

if [ "${1:-}" = "--stage-preview" ]; then
  stage_preview_only
  echo "Preview-only GDM assets staged at: ${STAGING_DIR}"
  echo "This does not activate GDM or write system configuration."
  exit 0
fi

if ! grep -q "Fedora release 42" /etc/fedora-release 2>/dev/null; then
  echo "This GDM module is intended for Fedora 42 only." >&2
  exit 1
fi

if ! usr_share_install_supported; then
  unsupported_exit
fi

cat <<'WARNING'
WARNING: This manually installs the BayouFinds Aqua Pro GDM module.

It will modify GDM-related system files and requires sudo.
It will not modify Plymouth, GRUB, or bootloader configuration.
Do not run this unless you have approved a GDM change window.
WARNING

printf "Type INSTALL_GDM to continue: "
read -r confirmation
if [ "${confirmation}" != "INSTALL_GDM" ]; then
  echo "GDM install cancelled."
  exit 1
fi

BACKUP_DIR="$("${MODULE_DIR}/scripts/backup-gdm.sh")"

rollback_after_failure() {
  echo "GDM install failed. Restoring prior GDM state from backup." >&2
  "${MODULE_DIR}/scripts/uninstall-gdm.sh" "${BACKUP_DIR}" >/dev/null || true
}

trap rollback_after_failure ERR

if ! sudo install -d -m 0755 /usr/share/backgrounds/bayoufinds; then
  trap - ERR
  unsupported_exit
fi

sudo install -m 0644 "${BACKGROUND_SOURCE}" "${BACKGROUND_TARGET}"
sudo install -D -m 0644 /dev/stdin "${DCONF_TARGET}" <<EOF
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

[org/gnome/desktop/background]
picture-uri='file://${BACKGROUND_TARGET}'
picture-uri-dark='file://${BACKGROUND_TARGET}'
primary-color='#0b1117'
secondary-color='#0b1117'
EOF

sudo dconf update
trap - ERR

echo "BayouFinds Aqua Pro GDM module installed."
echo "Backup created: ${BACKUP_DIR}"
echo "Rollback command:"
echo "./gdm-module/scripts/uninstall-gdm.sh \"${BACKUP_DIR}\""
