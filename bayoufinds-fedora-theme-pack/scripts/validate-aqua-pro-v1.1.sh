#!/usr/bin/env bash
# Copyright (c) 2026 Wonder Piece Studio.
# All Rights Reserved.

set -euo pipefail

required_files=(
  "assets/icons/BayouFinds-Aqua-Pro/index.theme"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder.svg"
  "assets/icons/BayouFinds-Aqua-Pro/places/scalable/folder-git.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/application-x-powershell.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/text-x-shellscript.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/application-json.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/text-x-yaml.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/text-markdown.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/application-pdf.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/package-x-generic.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/image-x-generic.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/text-html.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/text-css.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/application-javascript.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/application-x-nodejs.svg"
  "assets/icons/BayouFinds-Aqua-Pro/mimetypes/scalable/text-x-bayouops-report.svg"
  "wallpapers/bayoufinds-wallpaper-4k.png"
  "lockscreen/bayoufinds-lockscreen.png"
  "assets/generated/v1.1/preview.html"
  "assets/generated/v1.1/file-type-preview.png"
  "assets/generated/v1.1/home-directory-standard.png"
  "docs/FILE_TYPE_ICONS.md"
)

for file in "${required_files[@]}"; do
  test -f "${file}" || {
    echo "Missing required file: ${file}" >&2
    exit 1
  }
done

for dir in places mimetypes; do
  for size in 256 512 1024 scalable; do
    test -d "assets/icons/BayouFinds-Aqua-Pro/${dir}/${size}" || {
      echo "Missing icon directory: assets/icons/BayouFinds-Aqua-Pro/${dir}/${size}" >&2
      exit 1
    }
  done
done

for html in assets/generated/v1.1/preview.html assets/generated/icon-pack-v1/preview.html assets/generated/folder-mockups/preview.html; do
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

echo "BayouFinds Aqua Pro v1.1 validation passed."
