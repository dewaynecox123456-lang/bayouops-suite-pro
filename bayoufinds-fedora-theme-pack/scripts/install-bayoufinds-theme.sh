#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

PACK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_SCRIPT="${PACK_ROOT}/scripts/backup-current-theme.sh"
WALLPAPER="$HOME/.local/share/backgrounds/bayoufinds/bayoufinds-wallpaper-4k.png"
LOCKSCREEN="$HOME/.local/share/backgrounds/bayoufinds/bayoufinds-lockscreen.png"
GDM_BACKGROUND="$HOME/.local/share/backgrounds/bayoufinds/gdm-background.png"
CURRENT_YEAR="$(date +%Y)"

require_command() {
  local command_name="$1"

  if ! command -v "${command_name}" >/dev/null 2>&1; then
    echo "Required command not found: ${command_name}" >&2
    exit 1
  fi
}

install_file() {
  local source_path="$1"
  local target_path="$2"
  local mode="$3"

  sudo install -D -m "${mode}" "${source_path}" "${target_path}"
}

require_command sudo
require_command gsettings

BACKUP_DIR="$("${BACKUP_SCRIPT}")"
echo "Backup created: ${BACKUP_DIR}"

install_file "${PACK_ROOT}/wallpapers/bayoufinds-wallpaper-4k.png" "${WALLPAPER}" 0644
install_file "${PACK_ROOT}/login/gdm-background.png" "${GDM_BACKGROUND}" 0644
install_file "${PACK_ROOT}/lockscreen/bayoufinds-lockscreen.png" "${LOCKSCREEN}" 0644

sudo install -d -m 0755 /usr/share/themes/BayouFinds/gnome-shell
install_file "${PACK_ROOT}/assets/gnome-shell/bayoufinds-shell.css" "/usr/share/themes/BayouFinds/gnome-shell/gnome-shell.css" 0644

sudo install -d -m 0755 /usr/share/icons/BayouFinds
sudo cp -a "${PACK_ROOT}/assets/icons/BayouFinds/." /usr/share/icons/BayouFinds/
sudo find /usr/share/icons/BayouFinds -type d -exec chmod 0755 {} +
sudo find /usr/share/icons/BayouFinds -type f -exec chmod 0644 {} +

sudo install -d -m 0755 /usr/share/plymouth/themes/bayoufinds
install_file "${PACK_ROOT}/plymouth/bayoufinds/bayoufinds.plymouth" "/usr/share/plymouth/themes/bayoufinds/bayoufinds.plymouth" 0644
install_file "${PACK_ROOT}/plymouth/bayoufinds/bayoufinds.script" "/usr/share/plymouth/themes/bayoufinds/bayoufinds.script" 0644
install_file "${PACK_ROOT}/plymouth/bayoufinds/bayoufinds-emblem.png" "/usr/share/plymouth/themes/bayoufinds/bayoufinds-emblem.png" 0644

install_file "${PACK_ROOT}/assets/terminal/bayouops-profile.sh" "/etc/profile.d/bayouops-profile.sh" 0644
install_file "${PACK_ROOT}/assets/terminal/bayouops-motd" "/etc/motd" 0644

sudo install -d -m 0755 /usr/lib64/firefox/distribution
if [ -f /usr/lib64/firefox/distribution/policies.json ]; then
  sudo cp -a /usr/lib64/firefox/distribution/policies.json "/usr/lib64/firefox/distribution/policies.json.bayoufinds-preinstall-${CURRENT_YEAR}"
fi
sudo install -m 0644 /dev/stdin /usr/lib64/firefox/distribution/policies.json <<'JSON'
{
  "policies": {
    "Homepage": {
      "URL": "https://bayoufinds.com",
      "StartPage": "homepage"
    }
  }
}
JSON

sudo install -D -m 0644 /dev/stdin /etc/dconf/db/gdm.d/00-bayoufinds-background <<EOF
# Copyright (c) ${CURRENT_YEAR} Wonder Piece Studio.
# All Rights Reserved.

[org/gnome/desktop/background]
picture-uri='file://${GDM_BACKGROUND}'
picture-uri-dark='file://${GDM_BACKGROUND}'
primary-color='#0b1117'
secondary-color='#0b1117'

[org/gnome/desktop/interface]
color-scheme='prefer-dark'
EOF

if command -v dconf >/dev/null 2>&1; then
  sudo dconf update
fi

gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
gsettings set org.gnome.desktop.interface icon-theme 'BayouFinds'
gsettings set org.gnome.desktop.background picture-uri "file://${WALLPAPER}"
gsettings set org.gnome.desktop.background picture-uri-dark "file://${WALLPAPER}"
gsettings set org.gnome.desktop.screensaver picture-uri "file://${LOCKSCREEN}"

if gsettings writable org.gnome.shell.extensions.user-theme name >/dev/null 2>&1; then
  gsettings set org.gnome.shell.extensions.user-theme name 'BayouFinds'
fi

if command -v plymouth-set-default-theme >/dev/null 2>&1; then
  sudo plymouth-set-default-theme -R bayoufinds
else
  echo "plymouth-set-default-theme not found; Plymouth files were installed but the boot theme was not activated." >&2
fi

echo "BayouFinds Fedora 42 Enterprise Theme Pack installed."
echo "Rollback backup: ${BACKUP_DIR}"
