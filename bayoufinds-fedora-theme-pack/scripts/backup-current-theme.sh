#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

PACK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="${PACK_ROOT}/backups"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${BACKUP_ROOT}/${STAMP}"
CURRENT_YEAR="$(date +%Y)"

mkdir -p "${BACKUP_DIR}/files" "${BACKUP_DIR}/settings"

copy_if_exists() {
  local source_path="$1"
  local target_name="$2"

  if [ -e "${source_path}" ]; then
    sudo cp -a "${source_path}" "${BACKUP_DIR}/files/${target_name}"
  fi
}

setting_or_empty() {
  local schema="$1"
  local key="$2"
  local output="$3"

  if gsettings writable "${schema}" "${key}" >/dev/null 2>&1; then
    gsettings get "${schema}" "${key}" > "${output}" || true
  else
    : > "${output}"
  fi
}

copy_if_exists "/etc/dconf/db/gdm.d/00-bayoufinds-background" "etc-dconf-db-gdm.d-00-bayoufinds-background"
copy_if_exists "/etc/profile.d/bayouops-profile.sh" "etc-profile.d-bayouops-profile.sh"
copy_if_exists "/etc/motd" "etc-motd"
copy_if_exists "/usr/lib64/firefox/distribution/policies.json" "firefox-policies.json"
copy_if_exists "/usr/share/plymouth/themes/bayoufinds" "plymouth-theme-bayoufinds"
copy_if_exists "/usr/share/themes/BayouFinds" "usr-share-themes-BayouFinds"
copy_if_exists "/usr/share/icons/BayouFinds" "usr-share-icons-BayouFinds"
copy_if_exists "/usr/share/backgrounds/bayoufinds" "usr-share-backgrounds-bayoufinds"

if command -v plymouth-set-default-theme >/dev/null 2>&1; then
  plymouth-set-default-theme > "${BACKUP_DIR}/settings/plymouth-default-theme.txt" 2>/dev/null || true
fi

setting_or_empty "org.gnome.desktop.background" "picture-uri" "${BACKUP_DIR}/settings/gnome-background-picture-uri.txt"
setting_or_empty "org.gnome.desktop.background" "picture-uri-dark" "${BACKUP_DIR}/settings/gnome-background-picture-uri-dark.txt"
setting_or_empty "org.gnome.desktop.screensaver" "picture-uri" "${BACKUP_DIR}/settings/gnome-screensaver-picture-uri.txt"
setting_or_empty "org.gnome.desktop.interface" "color-scheme" "${BACKUP_DIR}/settings/gnome-color-scheme.txt"
setting_or_empty "org.gnome.desktop.interface" "icon-theme" "${BACKUP_DIR}/settings/gnome-icon-theme.txt"

cat > "${BACKUP_DIR}/README.txt" <<EOF
Copyright (c) ${CURRENT_YEAR} Wonder Piece Studio.
All Rights Reserved.

BayouFinds Fedora theme backup
Created: ${STAMP}

This backup was created before applying the BayouFinds Fedora 42 Enterprise Theme Pack.
Use scripts/uninstall-bayoufinds-theme.sh "${BACKUP_DIR}" to restore recorded settings and move BayouFinds-owned installed files aside.
EOF

echo "${BACKUP_DIR}"
