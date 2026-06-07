#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_ZIP="${1:-${ROOT_DIR}/release/BayouOps-Suite-Pro-v0.3-Release.zip}"
PACKAGE_ROOT="BayouOps-Suite-Pro"

print_section() {
    local title="$1"
    echo ""
    echo "== ${title} =="
}

if [[ ! -f "${RELEASE_ZIP}" ]]; then
    echo "Missing release ZIP: ${RELEASE_ZIP}" >&2
    exit 1
fi

if ! command -v unzip >/dev/null 2>&1; then
    echo "Missing required command: unzip" >&2
    exit 1
fi

required_zip_paths=(
    "${PACKAGE_ROOT}/collectors/windows/Invoke-BayouOpsNetworkInventory.ps1"
    "${PACKAGE_ROOT}/samples/windows-network-targets.sample.csv"
    "${PACKAGE_ROOT}/docs/WINDOWS_NETWORK_INVENTORY_COLLECTOR.md"
    "${PACKAGE_ROOT}/scripts/build-network-readiness.mjs"
    "${PACKAGE_ROOT}/exports/network-readiness-dashboard.html"
    "${PACKAGE_ROOT}/exports/network-readiness-summary.md"
    "${PACKAGE_ROOT}/exports/network-readiness.csv"
    "${PACKAGE_ROOT}/screenshots/demo/network-readiness-dashboard.png"
    "${PACKAGE_ROOT}/screenshots/demo/network-readiness-dashboard.svg"
    "${PACKAGE_ROOT}/icons/bayouops-launcher-icon.ico"
)

print_section "Validate v0.3 Release ZIP"
echo "ZIP: ${RELEASE_ZIP}"

for path in "${required_zip_paths[@]}"; do
    if unzip -Z1 "${RELEASE_ZIP}" | grep -Fxq "${path}"; then
        echo "OK ZIP contains: ${path}"
    else
        echo "Missing ZIP entry: ${path}" >&2
        exit 1
    fi
done

print_section "Network Collector ZIP Validation Passed"
