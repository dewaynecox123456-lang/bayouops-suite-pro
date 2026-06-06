#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${ROOT_DIR}/scripts/backup-user-aqua-pro-settings.sh"
ICON_SOURCE="${ROOT_DIR}/assets/icons/BayouFinds-Aqua-Pro"
ICON_TARGET="${HOME}/.local/share/icons/BayouFinds-Aqua-Pro"
BACKGROUND_TARGET_DIR="${HOME}/.local/share/backgrounds/bayoufinds"
WALLPAPER_SOURCE="${ROOT_DIR}/wallpapers/bayoufinds-wallpaper-4k.png"
LOCK_SOURCE="${ROOT_DIR}/lockscreen/bayoufinds-lockscreen.png"
WALLPAPER_TARGET="${BACKGROUND_TARGET_DIR}/bayoufinds-wallpaper-4k.png"
LOCK_TARGET="${BACKGROUND_TARGET_DIR}/bayoufinds-lockscreen.png"

BACKUP_DIR="$("${BACKUP_SCRIPT}")"

mkdir -p "${ICON_TARGET}" "${BACKGROUND_TARGET_DIR}"
cp -a "${ICON_SOURCE}/." "${ICON_TARGET}/"
cp -a "${WALLPAPER_SOURCE}" "${WALLPAPER_TARGET}"
cp -a "${LOCK_SOURCE}" "${LOCK_TARGET}"

WALLPAPER_URI="file://${WALLPAPER_TARGET}"
LOCK_URI="file://${LOCK_TARGET}"

gsettings set org.gnome.desktop.interface icon-theme 'BayouFinds-Aqua-Pro'
gsettings set org.gnome.desktop.background picture-uri "${WALLPAPER_URI}"
gsettings set org.gnome.desktop.background picture-uri-dark "${WALLPAPER_URI}"

if gsettings writable org.gnome.desktop.screensaver picture-uri >/dev/null 2>&1; then
  gsettings set org.gnome.desktop.screensaver picture-uri "${LOCK_URI}"
fi

if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache "${ICON_TARGET}"
fi

if command -v nautilus >/dev/null 2>&1; then
  nautilus -q
fi

echo "BayouFinds Aqua Pro v1.2 user install completed."
echo "Changes made:"
echo "- Backup created: ${BACKUP_DIR}"
echo "- Icon theme copied to: ${ICON_TARGET}"
echo "- Wallpaper copied to: ${WALLPAPER_TARGET}"
echo "- Lock screen copied to: ${LOCK_TARGET}"
echo "- GNOME icon theme set to: BayouFinds-Aqua-Pro"
echo "- Wallpaper URI set to: ${WALLPAPER_URI}"
echo "- Lock screen URI set to: ${LOCK_URI}"
echo "- Nautilus restarted with: nautilus -q"
echo "Rollback command:"
echo "./scripts/uninstall-aqua-pro-user.sh \"${BACKUP_DIR}\""
