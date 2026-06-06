#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${ROOT_DIR}/backups/user-aqua-pro-${STAMP}"
ICON_TARGET="${HOME}/.local/share/icons/BayouFinds-Aqua-Pro"

mkdir -p "${BACKUP_DIR}/settings" "${BACKUP_DIR}/files"

gsettings get org.gnome.desktop.interface icon-theme > "${BACKUP_DIR}/settings/icon-theme.txt"
gsettings get org.gnome.desktop.background picture-uri > "${BACKUP_DIR}/settings/background-picture-uri.txt"
gsettings get org.gnome.desktop.background picture-uri-dark > "${BACKUP_DIR}/settings/background-picture-uri-dark.txt"
gsettings get org.gnome.desktop.screensaver picture-uri > "${BACKUP_DIR}/settings/screensaver-picture-uri.txt"

if [ -d "${ICON_TARGET}" ]; then
  cp -a "${ICON_TARGET}" "${BACKUP_DIR}/files/BayouFinds-Aqua-Pro"
fi

cat > "${BACKUP_DIR}/README.txt" <<EOF
Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

BayouFinds Aqua Pro user settings backup.
Created: ${STAMP}

Rollback command:
./scripts/uninstall-aqua-pro-user.sh "${BACKUP_DIR}"
EOF

echo "${BACKUP_DIR}"
