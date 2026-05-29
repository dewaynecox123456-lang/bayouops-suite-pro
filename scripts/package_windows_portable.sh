#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="${ROOT_DIR}/release/windows-portable"

require_path() {
    local path="$1"
    if [[ ! -e "${ROOT_DIR}/${path}" ]]; then
        echo "Missing required path: ${path}" >&2
        exit 1
    fi
}

copy_if_present() {
    local source="$1"
    local destination="$2"
    if [[ -e "${ROOT_DIR}/${source}" ]]; then
        mkdir -p "$(dirname "${destination}")"
        cp -R "${ROOT_DIR}/${source}" "${destination}"
    fi
}

case "${PACKAGE_DIR}" in
    "${ROOT_DIR}/release/windows-portable") ;;
    *)
        echo "Refusing to package outside release/windows-portable" >&2
        exit 1
        ;;
esac

require_path "README.md"
require_path "docs"
require_path "windows"
require_path "tools"
require_path "release/windows-portable/BayouOps-Launcher.ps1"
require_path "release/windows-portable/BayouOps-Launcher.bat"

mkdir -p "${PACKAGE_DIR}"

find "${PACKAGE_DIR}" -mindepth 1 -maxdepth 1 \
    ! -name 'BayouOps-Launcher.ps1' \
    ! -name 'BayouOps-Launcher.bat' \
    -exec rm -rf {} +

cp "${ROOT_DIR}/README.md" "${PACKAGE_DIR}/README.md"
copy_if_present "LICENSE" "${PACKAGE_DIR}/LICENSE"
copy_if_present "LICENSE.txt" "${PACKAGE_DIR}/LICENSE.txt"
cp -R "${ROOT_DIR}/docs" "${PACKAGE_DIR}/docs"
cp -R "${ROOT_DIR}/windows" "${PACKAGE_DIR}/windows"
cp -R "${ROOT_DIR}/tools" "${PACKAGE_DIR}/tools"
copy_if_present "screenshots/demo" "${PACKAGE_DIR}/screenshots/demo"
mkdir -p "${PACKAGE_DIR}/exports"

find "${PACKAGE_DIR}" -type d -name '__pycache__' -prune -exec rm -rf {} +
find "${PACKAGE_DIR}/exports" -mindepth 1 -exec rm -rf {} +

echo "Packaged Windows portable release:"
find "${PACKAGE_DIR}" -maxdepth 3 -type f | sed "s#${ROOT_DIR}/##" | sort
