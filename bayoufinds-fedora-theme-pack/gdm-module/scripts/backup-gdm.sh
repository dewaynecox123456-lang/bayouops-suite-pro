#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="${ROOT_DIR}/backups/gdm-aqua-pro-${STAMP}"

mkdir -p "${BACKUP_DIR}/files"

backup_if_exists() {
  local source_path="$1"
  local target_name="$2"

  if [ -e "${source_path}" ]; then
    sudo cp -a "${source_path}" "${BACKUP_DIR}/files/${target_name}"
  fi
}

backup_if_exists "/etc/dconf/db/gdm.d/99-bayoufinds-aqua-pro" "99-bayoufinds-aqua-pro"
backup_if_exists "/usr/share/backgrounds/bayoufinds/gdm-background.png" "gdm-background.png"

cat > "${BACKUP_DIR}/README.txt" <<EOF
Copyright (c) 2026 Wonder Piece Studio.
All Rights Reserved.

BayouFinds Aqua Pro GDM backup.
Created: ${STAMP}

Rollback command:
./gdm-module/scripts/uninstall-gdm.sh "${BACKUP_DIR}"
EOF

echo "${BACKUP_DIR}"
