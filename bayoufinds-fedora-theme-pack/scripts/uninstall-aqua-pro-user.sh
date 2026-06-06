#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${1:-}"
ICON_TARGET="${HOME}/.local/share/icons/BayouFinds-Aqua-Pro"
BACKGROUND_TARGET_DIR="${HOME}/.local/share/backgrounds/bayoufinds"

if [ -z "${BACKUP_DIR}" ]; then
  BACKUP_DIR="$(find "${ROOT_DIR}/backups" -mindepth 1 -maxdepth 1 -type d -name 'user-aqua-pro-*' 2>/dev/null | sort | tail -n 1 || true)"
fi

if [ -z "${BACKUP_DIR}" ] || [ ! -d "${BACKUP_DIR}" ]; then
  echo "No backup directory found. Pass a backup path from scripts/backup-user-aqua-pro-settings.sh." >&2
  exit 1
fi

restore_setting() {
  local schema="$1"
  local key="$2"
  local file="$3"

  if [ -s "${file}" ]; then
    gsettings set "${schema}" "${key}" "$(cat "${file}")"
  fi
}

restore_setting org.gnome.desktop.interface icon-theme "${BACKUP_DIR}/settings/icon-theme.txt"
restore_setting org.gnome.desktop.background picture-uri "${BACKUP_DIR}/settings/background-picture-uri.txt"
restore_setting org.gnome.desktop.background picture-uri-dark "${BACKUP_DIR}/settings/background-picture-uri-dark.txt"
restore_setting org.gnome.desktop.screensaver picture-uri "${BACKUP_DIR}/settings/screensaver-picture-uri.txt"

rm -rf "${ICON_TARGET}"
rm -rf "${BACKGROUND_TARGET_DIR}"

if [ -d "${BACKUP_DIR}/files/BayouFinds-Aqua-Pro" ]; then
  mkdir -p "$(dirname "${ICON_TARGET}")"
  cp -a "${BACKUP_DIR}/files/BayouFinds-Aqua-Pro" "${ICON_TARGET}"
fi

echo "BayouFinds Aqua Pro v1.2 user rollback completed."
echo "Backup used: ${BACKUP_DIR}"
echo "Removed only:"
echo "- ${ICON_TARGET}"
echo "- ${BACKGROUND_TARGET_DIR}"
if [ -d "${BACKUP_DIR}/files/BayouFinds-Aqua-Pro" ]; then
  echo "Previous BayouFinds-Aqua-Pro icon theme restored from backup."
fi
