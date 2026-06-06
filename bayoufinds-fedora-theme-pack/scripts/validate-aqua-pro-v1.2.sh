#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

required_files=(
  "assets/icons/BayouFinds-Aqua-Pro/index.theme"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/user-desktop.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-documents.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-download.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-music.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-pictures.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-videos.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-templates.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-publicshare.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-archives.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-infrastructure.svg"
  "assets/generated/v1.2/preview.html"
  "assets/generated/v1.2/home-directory-standard.png"
  "wallpapers/bayoufinds-wallpaper-4k.png"
  "lockscreen/bayoufinds-lockscreen.png"
)

for file in "${required_files[@]}"; do
  test -f "${file}" || {
    echo "Missing required file: ${file}" >&2
    exit 1
  }
done

for size in 256 512 1024; do
  for icon in folder user-desktop folder-documents folder-download folder-music folder-pictures folder-videos folder-templates folder-publicshare folder-archives folder-infrastructure; do
    test -f "assets/icons/BayouFinds-Aqua-Pro/places/${size}/${icon}.png" || {
      echo "Missing ${size}px place icon: ${icon}" >&2
      exit 1
    }
  done
done

for html in assets/generated/v1.2/preview.html assets/generated/v1.1/preview.html assets/generated/icon-pack-v1/preview.html; do
  dir="$(dirname "${html}")"
  while IFS= read -r image; do
    image="${image#src=\"./}"
    image="${image%\"}"
    test -f "${dir}/${image}" || {
      echo "Missing preview reference: ${html} -> ${image}" >&2
      exit 1
    }
  done < <(grep -o 'src="\\./[^"]*"' "${html}" || true)
done

if command -v magick >/dev/null 2>&1; then
  for png in assets/icons/BayouFinds-Aqua-Pro/places/1024/*.png assets/icons/BayouFinds-Aqua-Pro/mimetypes/1024/*.png; do
    corner="$(magick "${png}" -format '%[pixel:p{0,0}]' info:)"
    test "${corner}" = "srgba(0,0,0,0)" || {
      echo "PNG corner is not transparent: ${png} -> ${corner}" >&2
      exit 1
    }
  done
fi

echo "BayouFinds Aqua Pro v1.2 validation passed."
