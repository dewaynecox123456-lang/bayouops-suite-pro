#!/usr/bin/env python3
"""Aggregate local BayouOps Windows and Linux operational exports."""

from __future__ import annotations

import csv
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[1]
EXPORTS_DIR = ROOT / "exports"
WINDOWS_INPUT = EXPORTS_DIR / "patch-readiness-report.csv"
LINUX_INPUT = EXPORTS_DIR / "linux-health-summary.csv"
CSV_OUTPUT = EXPORTS_DIR / "executive-operational-summary.csv"
TXT_OUTPUT = EXPORTS_DIR / "operational-risk-summary.txt"

OUTPUT_FIELDS = [
    "Hostname",
    "Platform",
    "Owner",
    "RebootPending",
    "DiskRisk",
    "PatchReadiness",
    "FailedServices",
    "OperationalStatus",
    "RiskScore",
]


@dataclass
class OperationalRecord:
    hostname: str
    platform: str
    owner: str
    reboot_pending: str
    disk_risk: str
    patch_readiness: str
    failed_services: str
    operational_status: str
    risk_score: int

    def as_row(self) -> dict[str, str | int]:
        return {
            "Hostname": self.hostname,
            "Platform": self.platform,
            "Owner": self.owner,
            "RebootPending": self.reboot_pending,
            "DiskRisk": self.disk_risk,
            "PatchReadiness": self.patch_readiness,
            "FailedServices": self.failed_services,
            "OperationalStatus": self.operational_status,
            "RiskScore": self.risk_score,
        }


def clean(value: object, default: str = "Unknown") -> str:
    text = "" if value is None else str(value).strip()
    return text if text else default


def read_csv(path: Path) -> tuple[list[dict[str, str]], list[str]]:
    warnings: list[str] = []
    if not path.exists():
        return [], [f"Missing input file: {path.relative_to(ROOT)}"]

    try:
        with path.open("r", newline="", encoding="utf-8-sig") as handle:
            rows = list(csv.DictReader(handle))
    except csv.Error as exc:
        return [], [f"Could not parse {path.relative_to(ROOT)}: {exc}"]
    except OSError as exc:
        return [], [f"Could not read {path.relative_to(ROOT)}: {exc}"]

    if not rows:
        warnings.append(f"No records found in {path.relative_to(ROOT)}")
    return rows, warnings


def truthy(value: str) -> bool:
    return clean(value, "").lower() in {"true", "yes", "y", "1", "required", "pending"}


def unknownish(value: str) -> bool:
    return clean(value, "").lower().startswith(("unknown", "not available", "n/a"))


def highest_percent(pattern: str, text: str) -> float | None:
    values = [float(match) for match in re.findall(pattern, text, flags=re.IGNORECASE)]
    return max(values) if values else None


def windows_disk_risk(disk_free_space: str) -> tuple[str, int]:
    free_percent = highest_percent(r"\((\d+(?:\.\d+)?)%\s*free\)", disk_free_space)
    if free_percent is None:
        return "Unknown", 10
    if free_percent < 10:
        return "Critical", 35
    if free_percent < 20:
        return "High", 25
    if free_percent < 30:
        return "Moderate", 15
    return "Low", 0


def linux_disk_risk(disk_usage_summary: str) -> tuple[str, int]:
    ignored_prefixes = ("composefs ", "devtmpfs ", "efivarfs ", "tmpfs ")
    checked_segments = [
        segment
        for segment in disk_usage_summary.split(";")
        if not segment.strip().lower().startswith(ignored_prefixes)
    ]
    used_percent = highest_percent(r"(\d+(?:\.\d+)?)%\s*used", "; ".join(checked_segments))
    if used_percent is None:
        return "Unknown", 10
    if used_percent >= 95:
        return "Critical", 35
    if used_percent >= 85:
        return "High", 25
    if used_percent >= 75:
        return "Moderate", 15
    return "Low", 0


def patch_readiness_for_windows(row: dict[str, str]) -> tuple[str, int]:
    hotfix_count = clean(row.get("InstalledHotfixCount"), "")
    notes = clean(row.get("Notes"), "")
    if truthy(clean(row.get("RebootPending"), "")):
        return "Action required - reboot pending", 20
    if hotfix_count.isdigit() and int(hotfix_count) > 0:
        return "Ready", 0
    if unknownish(notes):
        return "Unknown", 10
    return "Review recommended", 10


def reboot_status(value: str) -> tuple[str, int]:
    if truthy(value):
        return "Yes", 20
    if unknownish(value):
        return "Unknown", 10
    return "No", 0


def failed_services_status(value: str) -> tuple[str, int]:
    text = clean(value, "None")
    lowered = text.lower()
    if lowered in {"none", "0"} or "0 loaded units" in lowered:
        return "None", 0
    if "unavailable" in lowered or "not accessible" in lowered or unknownish(text):
        return text, 10
    return text, 25


def operational_status(score: int) -> str:
    if score >= 70:
        return "Critical"
    if score >= 40:
        return "At Risk"
    if score >= 15:
        return "Monitor"
    return "Healthy"


def clamp_score(score: int) -> int:
    return max(0, min(score, 100))


def normalize_windows(rows: Iterable[dict[str, str]]) -> list[OperationalRecord]:
    records: list[OperationalRecord] = []
    for row in rows:
        disk_risk, disk_points = windows_disk_risk(clean(row.get("DiskFreeSpace"), ""))
        reboot_pending, reboot_points = reboot_status(clean(row.get("RebootPending"), ""))
        patch_readiness, patch_points = patch_readiness_for_windows(row)
        score = clamp_score(disk_points + reboot_points + patch_points)
        records.append(
            OperationalRecord(
                hostname=clean(row.get("Hostname")),
                platform="Windows",
                owner="Unknown",
                reboot_pending=reboot_pending,
                disk_risk=disk_risk,
                patch_readiness=patch_readiness,
                failed_services="Not collected",
                operational_status=operational_status(score),
                risk_score=score,
            )
        )
    return records


def normalize_linux(rows: Iterable[dict[str, str]]) -> list[OperationalRecord]:
    records: list[OperationalRecord] = []
    for row in rows:
        disk_risk, disk_points = linux_disk_risk(clean(row.get("DiskUsageSummary"), ""))
        reboot_pending, reboot_points = reboot_status(clean(row.get("RebootRequired"), ""))
        failed_services, service_points = failed_services_status(clean(row.get("FailedSystemdServices"), ""))
        patch_points = 0 if reboot_pending == "No" else 10
        patch_readiness = "Review recommended" if reboot_pending != "No" else "No reboot detected"
        score = clamp_score(disk_points + reboot_points + service_points + patch_points)
        records.append(
            OperationalRecord(
                hostname=clean(row.get("Hostname")),
                platform="Linux",
                owner=clean(row.get("CurrentUser")),
                reboot_pending=reboot_pending,
                disk_risk=disk_risk,
                patch_readiness=patch_readiness,
                failed_services=failed_services,
                operational_status=operational_status(score),
                risk_score=score,
            )
        )
    return records


def write_csv(records: list[OperationalRecord], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        for record in sorted(records, key=lambda item: (-item.risk_score, item.platform, item.hostname.lower())):
            writer.writerow(record.as_row())


def write_txt(records: list[OperationalRecord], warnings: list[str], path: Path) -> None:
    counts: dict[str, int] = {}
    for record in records:
        counts[record.operational_status] = counts.get(record.operational_status, 0) + 1

    lines = [
        "BayouOps Executive Operational Risk Summary",
        "===========================================",
        "",
        f"Total hosts reviewed: {len(records)}",
        f"Critical: {counts.get('Critical', 0)}",
        f"At Risk: {counts.get('At Risk', 0)}",
        f"Monitor: {counts.get('Monitor', 0)}",
        f"Healthy: {counts.get('Healthy', 0)}",
        "",
    ]

    if records:
        lines.extend(["Highest risk hosts:", ""])
        for record in sorted(records, key=lambda item: item.risk_score, reverse=True)[:10]:
            lines.append(
                f"- {record.hostname} ({record.platform}) | "
                f"Status: {record.operational_status} | "
                f"RiskScore: {record.risk_score} | "
                f"RebootPending: {record.reboot_pending} | "
                f"DiskRisk: {record.disk_risk} | "
                f"FailedServices: {record.failed_services}"
            )
        lines.append("")
    else:
        lines.extend(["No operational records were available for aggregation.", ""])

    lines.extend(
        [
            "Scoring notes:",
            "- Reboot pending, disk pressure, failed services, unknown collection state, and weak patch readiness add risk.",
            "- RiskScore is a simple 0-100 operational triage value, not a compliance score.",
            "- All aggregation is local-only and read-only.",
            "",
        ]
    )

    if warnings:
        lines.extend(["Warnings:", ""])
        lines.extend(f"- {warning}" for warning in warnings)
        lines.append("")

    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    windows_rows, windows_warnings = read_csv(WINDOWS_INPUT)
    linux_rows, linux_warnings = read_csv(LINUX_INPUT)
    records = normalize_windows(windows_rows) + normalize_linux(linux_rows)
    warnings = windows_warnings + linux_warnings

    write_csv(records, CSV_OUTPUT)
    write_txt(records, warnings, TXT_OUTPUT)

    print(f"Wrote {CSV_OUTPUT.relative_to(ROOT)} ({len(records)} records)")
    print(f"Wrote {TXT_OUTPUT.relative_to(ROOT)}")
    if warnings:
        for warning in warnings:
            print(f"Warning: {warning}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
