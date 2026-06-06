#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

PACK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_ROOT="${PACK_ROOT}/backups"
BACKUP_DIR="${1:-}"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [ -z "${BACKUP_DIR}" ]; then
  BACKUP_DIR="$(find "${BACKUP_ROOT}" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | sort | tail -n 1 || true)"
fi

if [ -z "${BACKUP_DIR}" ] || [ ! -d "${BACKUP_DIR}" ]; then
  echo "No backup directory found. Pass a backup path created by backup-current-theme.sh." >&2
  exit 1
fi

restore_file() {
  local backup_name="$1"
  local target_path="$2"

  if [ -e "${BACKUP_DIR}/files/${backup_name}" ]; then
    sudo cp -a "${BACKUP_DIR}/files/${backup_name}" "${target_path}"
  fi
}

move_if_exists() {
  local target_path="$1"

  if [ -e "${target_path}" ]; then
    sudo mv "${target_path}" "${target_path}.bayoufinds-disabled-${STAMP}"
  fi
}

restore_setting() {
  local schema="$1"
  local key="$2"
  local source_file="$3"

  if [ -s "${source_file}" ] && gsettings writable "${schema}" "${key}" >/dev/null 2>&1; then
    gsettings set "${schema}" "${key}" "$(cat "${source_file}")"
  fi
}

move_if_exists "/etc/dconf/db/gdm.d/00-bayoufinds-background"
move_if_exists "/etc/profile.d/bayouops-profile.sh"
move_if_exists "/usr/share/plymouth/themes/bayoufinds"
move_if_exists "/usr/share/themes/BayouFinds"
move_if_exists "/usr/share/icons/BayouFinds"
move_if_exists "/usr/share/backgrounds/bayoufinds"

restore_file "etc-dconf-db-gdm.d-00-bayoufinds-background" "/etc/dconf/db/gdm.d/00-bayoufinds-background"
restore_file "etc-profile.d-bayouops-profile.sh" "/etc/profile.d/bayouops-profile.sh"
restore_file "etc-motd" "/etc/motd"
restore_file "firefox-policies.json" "/usr/lib64/firefox/distribution/policies.json"

if [ ! -e "${BACKUP_DIR}/files/firefox-policies.json" ]; then
  move_if_exists "/usr/lib64/firefox/distribution/policies.json"
fi

restore_setting "org.gnome.desktop.background" "picture-uri" "${BACKUP_DIR}/settings/gnome-background-picture-uri.txt"
restore_setting "org.gnome.desktop.background" "picture-uri-dark" "${BACKUP_DIR}/settings/gnome-background-picture-uri-dark.txt"
restore_setting "org.gnome.desktop.screensaver" "picture-uri" "${BACKUP_DIR}/settings/gnome-screensaver-picture-uri.txt"
restore_setting "org.gnome.desktop.interface" "color-scheme" "${BACKUP_DIR}/settings/gnome-color-scheme.txt"
restore_setting "org.gnome.desktop.interface" "icon-theme" "${BACKUP_DIR}/settings/gnome-icon-theme.txt"

if command -v dconf >/dev/null 2>&1; then
  sudo dconf update
fi

if [ -s "${BACKUP_DIR}/settings/plymouth-default-theme.txt" ] && command -v plymouth-set-default-theme >/dev/null 2>&1; then
  sudo plymouth-set-default-theme -R "$(cat "${BACKUP_DIR}/settings/plymouth-default-theme.txt")"
fi

echo "BayouFinds theme rollback completed from: ${BACKUP_DIR}"
echo "BayouFinds-owned files were moved aside with suffix: .bayoufinds-disabled-${STAMP}"
