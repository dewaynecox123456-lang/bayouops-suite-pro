#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

required_files=(
  "assets/icons/BayouFinds-Aqua-Pro/index.theme"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-bayoufinds.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-bayouops.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-projects.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-infrastructure.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-archives.svg"
  "wallpapers/bayoufinds-wallpaper-4k.png"
  "lockscreen/bayoufinds-lockscreen.png"
  "login/gdm-background.png"
  "plymouth/bayoufinds/bayoufinds.plymouth"
  "assets/generated/v1.0/home-mockup/home-directory-standard.png"
  "assets/generated/v1.0/product-screenshots/01-icon-system-overview.png"
  "assets/generated/v1.0/product-screenshots/02-desktop-standard-overview.png"
  "assets/generated/v1.0/product-screenshots/03-staging-inventory.png"
  "docs/standards/BayouFinds-Aqua-Pro-Standards-Guide.md"
  "RELEASE_NOTES.md"
)

for file in "${required_files[@]}"; do
  test -f "${file}" || {
    echo "Missing required file: ${file}" >&2
    exit 1
  }
done

for size in 256 512 1024; do
  for icon in folder folder-default-cypress folder-bayoufinds folder-bayouops folder-projects folder-infrastructure folder-archives; do
    test -f "assets/icons/BayouFinds-Aqua-Pro/places/${size}/${icon}.png" || {
      echo "Missing ${size}px icon: ${icon}" >&2
      exit 1
    }
  done
done

if command -v identify >/dev/null 2>&1; then
  identify -quiet assets/icons/BayouFinds-Aqua-Pro/places/1024/*.png >/dev/null
fi

echo "BayouFinds Aqua Pro v1.0 validation passed."
