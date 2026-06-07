#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PACKAGE_DIR="${ROOT_DIR}/release/BayouOps-Suite-Pro"
RELEASE_ZIP="${ROOT_DIR}/release/BayouOps-Suite-Pro-v0.3-Release.zip"

print_section() {
    local title="$1"
    echo ""
    echo "== ${title} =="
}

require_path() {
    local path="$1"
    if [[ ! -e "${ROOT_DIR}/${path}" ]]; then
        echo "Missing required path: ${path}" >&2
        exit 1
    fi
}

copy_required_file() {
    local source="$1"
    local destination="$2"
    require_path "${source}"
    mkdir -p "$(dirname "${destination}")"
    cp "${ROOT_DIR}/${source}" "${destination}"
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
    "${ROOT_DIR}/release/BayouOps-Suite-Pro") ;;
    *)
        echo "Refusing to package outside release/BayouOps-Suite-Pro" >&2
        exit 1
        ;;
esac

if ! command -v zip >/dev/null 2>&1; then
    echo "Missing required command: zip" >&2
    exit 1
fi

require_path "README.md"
require_path "START_HERE.txt"
require_path "config/lines-of-business.json"
require_path "demo-data/generated"
require_path "windows"
require_path "tools"
require_path "scripts/demo/export-executive-demo-pack.mjs"
require_path "scripts/demo/generate-demo-scenario.mjs"
require_path "scripts/demo/lob-config.mjs"
require_path "scripts/demo/render-demo-dashboard.mjs"
require_path "screenshots/demo/executive-dashboard.html"
require_path "brand/icons/launcher-icon-concept.ico"
require_path "release/windows-portable/BayouOps-Launcher.ps1"
require_path "release/windows-portable/BayouOps-Launcher.bat"
require_path "release/windows-portable/README.md"
require_path "release/windows-portable/docs"
require_path "collectors/windows/Invoke-BayouOpsNetworkInventory.ps1"
require_path "samples/windows-network-targets.sample.csv"
require_path "docs/WINDOWS_NETWORK_INVENTORY_COLLECTOR.md"
require_path "scripts/build-network-readiness.mjs"
require_path "scripts/demo/signature-constants.mjs"
require_path "exports/network-readiness-dashboard.html"
require_path "exports/network-readiness-summary.md"
require_path "exports/network-readiness.csv"
require_path "screenshots/demo/network-readiness-dashboard.png"
require_path "screenshots/demo/network-readiness-dashboard.svg"

rm -rf "${PACKAGE_DIR}"
rm -f "${RELEASE_ZIP}"
mkdir -p "${PACKAGE_DIR}"

cp "${ROOT_DIR}/release/windows-portable/BayouOps-Launcher.ps1" "${PACKAGE_DIR}/BayouOps-Launcher.ps1"
cp "${ROOT_DIR}/release/windows-portable/BayouOps-Launcher.bat" "${PACKAGE_DIR}/BayouOps-Launcher.bat"

cp "${ROOT_DIR}/START_HERE.txt" "${PACKAGE_DIR}/START_HERE.txt"
cp "${ROOT_DIR}/release/windows-portable/README.md" "${PACKAGE_DIR}/README.md"
copy_if_present "LICENSE" "${PACKAGE_DIR}/LICENSE"
copy_if_present "LICENSE.txt" "${PACKAGE_DIR}/LICENSE.txt"
cp -R "${ROOT_DIR}/release/windows-portable/docs" "${PACKAGE_DIR}/docs"
copy_required_file "docs/WINDOWS_NETWORK_INVENTORY_COLLECTOR.md" "${PACKAGE_DIR}/docs/WINDOWS_NETWORK_INVENTORY_COLLECTOR.md"
mkdir -p "${PACKAGE_DIR}/collectors/windows"
copy_required_file "collectors/windows/Invoke-BayouOpsNetworkInventory.ps1" "${PACKAGE_DIR}/collectors/windows/Invoke-BayouOpsNetworkInventory.ps1"
mkdir -p "${PACKAGE_DIR}/samples"
copy_required_file "samples/windows-network-targets.sample.csv" "${PACKAGE_DIR}/samples/windows-network-targets.sample.csv"
cp -R "${ROOT_DIR}/windows" "${PACKAGE_DIR}/windows"
cp -R "${ROOT_DIR}/tools" "${PACKAGE_DIR}/tools"
cp -R "${ROOT_DIR}/config" "${PACKAGE_DIR}/config"
rm -f "${PACKAGE_DIR}/config/license.json"
mkdir -p "${PACKAGE_DIR}/icons"
copy_required_file "brand/icons/launcher-icon-concept.ico" "${PACKAGE_DIR}/icons/launcher-icon-concept.ico"
mkdir -p "${PACKAGE_DIR}/scripts/demo"
copy_required_file "scripts/build-network-readiness.mjs" "${PACKAGE_DIR}/scripts/build-network-readiness.mjs"
copy_required_file "scripts/demo/export-executive-demo-pack.mjs" "${PACKAGE_DIR}/scripts/demo/export-executive-demo-pack.mjs"
copy_required_file "scripts/demo/generate-demo-scenario.mjs" "${PACKAGE_DIR}/scripts/demo/generate-demo-scenario.mjs"
copy_required_file "scripts/demo/lob-config.mjs" "${PACKAGE_DIR}/scripts/demo/lob-config.mjs"
copy_required_file "scripts/demo/render-demo-dashboard.mjs" "${PACKAGE_DIR}/scripts/demo/render-demo-dashboard.mjs"
copy_required_file "scripts/demo/signature-constants.mjs" "${PACKAGE_DIR}/scripts/demo/signature-constants.mjs"
cp -R "${ROOT_DIR}/demo-data" "${PACKAGE_DIR}/demo-data"
mkdir -p "${PACKAGE_DIR}/screenshots/demo"
copy_required_file "screenshots/demo/executive-dashboard.html" "${PACKAGE_DIR}/screenshots/demo/executive-dashboard.html"
copy_required_file "screenshots/demo/network-readiness-dashboard.png" "${PACKAGE_DIR}/screenshots/demo/network-readiness-dashboard.png"
copy_required_file "screenshots/demo/network-readiness-dashboard.svg" "${PACKAGE_DIR}/screenshots/demo/network-readiness-dashboard.svg"
mkdir -p "${PACKAGE_DIR}/exports"
copy_required_file "exports/network-readiness-dashboard.html" "${PACKAGE_DIR}/exports/network-readiness-dashboard.html"
copy_required_file "exports/network-readiness-summary.md" "${PACKAGE_DIR}/exports/network-readiness-summary.md"
copy_required_file "exports/network-readiness.csv" "${PACKAGE_DIR}/exports/network-readiness.csv"

find "${PACKAGE_DIR}" -type d -name '__pycache__' -prune -exec rm -rf {} +

print_section "Release Package Contents"
find "${PACKAGE_DIR}" -maxdepth 3 -type f | sed "s#${ROOT_DIR}/##" | sort

print_section "Package Audit"

required_package_paths=(
    "BayouOps-Launcher.bat"
    "BayouOps-Launcher.ps1"
    "START_HERE.txt"
    "README.md"
    "docs/ABOUT_BAYOUOPS.md"
    "docs/CUSTOMER_DELIVERY_CHECKLIST.md"
    "docs/TERMS_AND_CONDITIONS.md"
    "docs/EULA.md"
    "docs/SUPPORT_EMAIL_SETUP.md"
    "docs/WINDOWS_NETWORK_INVENTORY_COLLECTOR.md"
    "collectors/windows/Invoke-BayouOpsNetworkInventory.ps1"
    "samples/windows-network-targets.sample.csv"
    "config/lines-of-business.json"
    "config/license.example.json"
    "icons/launcher-icon-concept.ico"
    "scripts/build-network-readiness.mjs"
    "scripts/demo/export-executive-demo-pack.mjs"
    "scripts/demo/generate-demo-scenario.mjs"
    "scripts/demo/lob-config.mjs"
    "scripts/demo/render-demo-dashboard.mjs"
    "scripts/demo/signature-constants.mjs"
    "demo-data/generated"
    "screenshots/demo/executive-dashboard.html"
    "screenshots/demo/network-readiness-dashboard.png"
    "screenshots/demo/network-readiness-dashboard.svg"
    "exports/network-readiness-dashboard.html"
    "exports/network-readiness-summary.md"
    "exports/network-readiness.csv"
    "windows/Export-PatchReadiness.ps1"
    "tools/aggregate_operational_reports.py"
    "exports"
)

for path in "${required_package_paths[@]}"; do
    if [[ -e "${PACKAGE_DIR}/${path}" ]]; then
        echo "OK required: ${path}"
    else
        echo "Missing package path: ${path}" >&2
        exit 1
    fi
done

forbidden_matches="$(
    find "${PACKAGE_DIR}" \( \
        -name '.git' -o \
        -name 'node_modules' -o \
        -path "${PACKAGE_DIR}/private*" -o \
        -path "${PACKAGE_DIR}/config/license.json" -o \
        -path "${PACKAGE_DIR}/exports/demo" -o \
        -name '*.tmp' -o \
        -name '*.bak' -o \
        -name '*.backup-*' -o \
        \( -name '*.png' ! -path "${PACKAGE_DIR}/screenshots/demo/network-readiness-dashboard.png" \) \
    \) -print
)"

if [[ -n "${forbidden_matches}" ]]; then
    echo "Forbidden package content found:" >&2
    echo "${forbidden_matches}" >&2
    exit 1
fi

if grep -R "support@bayoufinds.com" "${PACKAGE_DIR}/README.md" "${PACKAGE_DIR}/START_HERE.txt" "${PACKAGE_DIR}/docs" >/dev/null; then
    echo "OK support contact messaging present"
else
    echo "Missing support contact messaging" >&2
    exit 1
fi

if grep -R "© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved." "${PACKAGE_DIR}/README.md" "${PACKAGE_DIR}/START_HERE.txt" "${PACKAGE_DIR}/docs" >/dev/null; then
    echo "OK copyright messaging present"
else
    echo "Missing copyright messaging" >&2
    exit 1
fi

if grep -R "provided as-is\|no warranty\|independent validation" "${PACKAGE_DIR}/docs/TERMS_AND_CONDITIONS.md" "${PACKAGE_DIR}/docs/EULA.md" >/dev/null; then
    echo "OK legal terms messaging present"
else
    echo "Missing legal terms messaging" >&2
    exit 1
fi

if grep -R "telemetry\|background services\|operator-triggered\|No endpoint changes" "${PACKAGE_DIR}/README.md" "${PACKAGE_DIR}/START_HERE.txt" "${PACKAGE_DIR}/docs" "${PACKAGE_DIR}/BayouOps-Launcher.ps1" >/dev/null; then
    echo "OK lightweight safety messaging present"
else
    echo "Missing lightweight safety messaging" >&2
    exit 1
fi

if grep -R "This collector is read-only and intended only for systems you own or are authorized to manage." "${PACKAGE_DIR}/README.md" "${PACKAGE_DIR}/START_HERE.txt" "${PACKAGE_DIR}/docs/WINDOWS_NETWORK_INVENTORY_COLLECTOR.md" >/dev/null; then
    echo "OK network collector authorization disclaimer present"
else
    echo "Missing network collector authorization disclaimer" >&2
    exit 1
fi

print_section "Create Release ZIP"
(
    cd "${ROOT_DIR}/release"
    zip -qr "$(basename "${RELEASE_ZIP}")" "BayouOps-Suite-Pro"
)
echo "Release ZIP created at: ${RELEASE_ZIP}"

print_section "Package Ready"
echo "Release package staged at: ${PACKAGE_DIR}"
echo "Release ZIP ready: ${RELEASE_ZIP}"
