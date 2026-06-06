#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
BACKUP_DIR="${1:-}"
DCONF_TARGET="/etc/dconf/db/gdm.d/99-bayoufinds-aqua-pro"
BACKGROUND_TARGET="/usr/share/backgrounds/bayoufinds/gdm-background.png"

if [ -z "${BACKUP_DIR}" ]; then
  BACKUP_DIR="$(find "${ROOT_DIR}/backups" -mindepth 1 -maxdepth 1 -type d -name 'gdm-aqua-pro-*' 2>/dev/null | sort | tail -n 1 || true)"
fi

if [ -z "${BACKUP_DIR}" ] || [ ! -d "${BACKUP_DIR}" ]; then
  echo "No GDM backup directory found. Pass a backup path from backup-gdm.sh." >&2
  exit 1
fi

sudo rm -f "${DCONF_TARGET}"
sudo rm -f "${BACKGROUND_TARGET}"

if [ -e "${BACKUP_DIR}/files/99-bayoufinds-aqua-pro" ]; then
  sudo install -D -m 0644 "${BACKUP_DIR}/files/99-bayoufinds-aqua-pro" "${DCONF_TARGET}"
fi

if [ -e "${BACKUP_DIR}/files/gdm-background.png" ]; then
  sudo install -D -m 0644 "${BACKUP_DIR}/files/gdm-background.png" "${BACKGROUND_TARGET}"
fi

sudo dconf update

echo "BayouFinds Aqua Pro GDM rollback completed."
echo "Backup used: ${BACKUP_DIR}"
echo "No Plymouth, GRUB, or bootloader changes were made by this script."
