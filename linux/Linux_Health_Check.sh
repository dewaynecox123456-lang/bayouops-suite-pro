#!/usr/bin/env bash

# BayouOps Suite Pro Linux operational health collector.
# Collects local, read-only health signals and exports an operator-readable TXT
# report plus a one-row machine-readable CSV summary.

set -u

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
EXPORT_DIR="${PROJECT_ROOT}/exports"
TXT_REPORT="${EXPORT_DIR}/linux-health-report.txt"
CSV_REPORT="${EXPORT_DIR}/linux-health-summary.csv"

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

operator_log() {
    local level="$1"
    local message="$2"
    printf '[%s] [%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$level" "$message"
}

csv_escape() {
    local value="${1:-}"
    value="${value//$'\n'/; }"
    value="${value//$'\r'/ }"
    value="${value//\"/\"\"}"
    printf '"%s"' "$value"
}

get_os_release() {
    if [[ -r /etc/os-release ]]; then
        # shellcheck disable=SC1091
        . /etc/os-release
        printf '%s\n' "${PRETTY_NAME:-${NAME:-Unknown Linux}}"
    elif command_exists lsb_release; then
        lsb_release -ds 2>/dev/null || printf 'Unknown Linux\n'
    else
        printf 'Unknown Linux\n'
    fi
}

get_uptime() {
    if command_exists uptime; then
        uptime -p 2>/dev/null || uptime 2>/dev/null || printf 'Unavailable'
    else
        printf 'Unavailable'
    fi
}

get_disk_summary() {
    if command_exists df; then
        df -hT -x tmpfs -x devtmpfs -x squashfs 2>/dev/null || printf 'Disk usage unavailable\n'
    else
        printf 'df command unavailable\n'
    fi
}

get_disk_summary_inline() {
    if command_exists df; then
        df -hP -x tmpfs -x devtmpfs -x squashfs 2>/dev/null |
            awk 'NR > 1 { printf "%s %s used %s of %s mounted on %s; ", $1, $5, $3, $2, $6 }' |
            sed 's/; $//'
    else
        printf 'df command unavailable'
    fi
}

get_top_disk_usage_dirs() {
    if ! command_exists du; then
        printf 'du command unavailable\n'
        return
    fi

    # Stay on the root filesystem and suppress permission noise. This can miss
    # restricted paths for unprivileged users, but keeps the collector read-only.
    du -xhd1 / 2>/dev/null | sort -hr 2>/dev/null | head -n 10
}

get_top_disk_usage_inline() {
    local summary
    summary="$(get_top_disk_usage_dirs | awk '{ printf "%s %s; ", $2, $1 }' | sed 's/; $//')"
    printf '%s' "${summary:-Unavailable or permission-limited}"
}

get_failed_systemd_services() {
    if ! command_exists systemctl; then
        printf 'systemctl unavailable\n'
        return
    fi

    if ! systemctl list-units >/dev/null 2>&1; then
        printf 'systemd unavailable or not accessible\n'
        return
    fi

    local failed
    failed="$(systemctl --failed --type=service --no-legend --plain 2>/dev/null |
        awk 'BEGIN { separator = "" } { printf "%s%s", separator, $1; separator = ", " } END { print "" }')"
    printf '%s\n' "${failed:-None detected}"
}

get_reboot_required() {
    if [[ -f /run/reboot-required || -f /var/run/reboot-required ]]; then
        printf 'Yes - reboot-required marker present'
        return
    fi

    if command_exists needs-restarting; then
        needs-restarting -r >/dev/null 2>&1
        case "$?" in
            0) printf 'No - needs-restarting reports current kernel and services' ;;
            1) printf 'Yes - needs-restarting reports reboot required' ;;
            *) printf 'Unknown - needs-restarting check failed' ;;
        esac
        return
    fi

    printf 'Unknown - no reboot detector available'
}

get_current_user() {
    if command_exists id; then
        id -un 2>/dev/null || printf '%s' "${USER:-unknown}"
    else
        printf '%s' "${USER:-unknown}"
    fi
}

write_txt_report() {
    {
        printf 'BayouOps Suite Pro Linux Operational Health Report\n'
        printf '==================================================\n\n'
        printf 'Timestamp: %s\n' "$TIMESTAMP"
        printf 'Hostname: %s\n' "$HOSTNAME_VALUE"
        printf 'Current user: %s\n' "$CURRENT_USER"
        printf 'OS release: %s\n' "$OS_RELEASE"
        printf 'Kernel version: %s\n' "$KERNEL_VERSION"
        printf 'Uptime: %s\n' "$UPTIME_VALUE"
        printf 'Reboot required: %s\n\n' "$REBOOT_REQUIRED"

        printf 'Disk Usage Summary\n'
        printf -- '------------------\n'
        get_disk_summary
        printf '\n'

        printf 'Top Disk Usage Directories\n'
        printf -- '--------------------------\n'
        get_top_disk_usage_dirs
        printf '\n'

        printf 'Failed systemd Services\n'
        printf -- '-----------------------\n'
        get_failed_systemd_services
        printf '\n'

        printf 'Safety\n'
        printf -- '------\n'
        printf 'Read-only local collection. No service changes, package changes, reboots, deletions, or privileged destructive actions were performed.\n'
    } > "$TXT_REPORT"
}

write_csv_report() {
    {
        printf 'Timestamp,Hostname,CurrentUser,OSRelease,KernelVersion,Uptime,RebootRequired,DiskUsageSummary,TopDiskUsageDirectories,FailedSystemdServices\n'
        csv_escape "$TIMESTAMP"; printf ','
        csv_escape "$HOSTNAME_VALUE"; printf ','
        csv_escape "$CURRENT_USER"; printf ','
        csv_escape "$OS_RELEASE"; printf ','
        csv_escape "$KERNEL_VERSION"; printf ','
        csv_escape "$UPTIME_VALUE"; printf ','
        csv_escape "$REBOOT_REQUIRED"; printf ','
        csv_escape "$DISK_SUMMARY_INLINE"; printf ','
        csv_escape "$TOP_DISK_INLINE"; printf ','
        csv_escape "$FAILED_SYSTEMD_SERVICES"; printf '\n'
    } > "$CSV_REPORT"
}

main() {
    operator_log INFO 'Starting Linux operational health export.'

    mkdir -p "$EXPORT_DIR"

    TIMESTAMP="$(date -Iseconds 2>/dev/null || date '+%Y-%m-%dT%H:%M:%S%z')"
    HOSTNAME_VALUE="$(hostname 2>/dev/null || printf 'unknown')"
    OS_RELEASE="$(get_os_release)"
    KERNEL_VERSION="$(uname -r 2>/dev/null || printf 'Unavailable')"
    UPTIME_VALUE="$(get_uptime)"
    CURRENT_USER="$(get_current_user)"
    REBOOT_REQUIRED="$(get_reboot_required)"
    DISK_SUMMARY_INLINE="$(get_disk_summary_inline)"
    TOP_DISK_INLINE="$(get_top_disk_usage_inline)"
    FAILED_SYSTEMD_SERVICES="$(get_failed_systemd_services)"

    write_txt_report
    write_csv_report

    operator_log INFO "TXT report generated: $TXT_REPORT"
    operator_log INFO "CSV summary generated: $CSV_REPORT"
    operator_log INFO "Host: $HOSTNAME_VALUE; Reboot required: $REBOOT_REQUIRED"
}

main "$@"
