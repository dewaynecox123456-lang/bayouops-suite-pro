# Operational Aggregation Engine

BayouOps Suite Pro includes a lightweight Python aggregation script that combines local Windows and Linux export data into centralized operational summaries.

## Inputs

The script reads these local files when present:

```text
exports/patch-readiness-report.csv
exports/linux-health-summary.csv
```

Missing or empty inputs are handled gracefully. The engine still writes output files and records warnings in the TXT summary.

## Outputs

```text
exports/executive-operational-summary.csv
exports/operational-risk-summary.txt
```

The CSV output is intended for spreadsheets or downstream review. The TXT output is executive-friendly and highlights total host counts, status counts, highest-risk systems, and scoring notes.

## Normalized Fields

- Hostname
- Platform
- Owner
- RebootPending
- DiskRisk
- PatchReadiness
- FailedServices
- OperationalStatus
- RiskScore

## Usage

Run from the project root:

```bash
python3 tools/aggregate_operational_reports.py
```

## Safety Notes

- Local-only aggregation
- Read-only input handling
- No service changes
- No package changes
- No reboot actions
- No network dependency
- No destructive actions

## Risk Scoring

RiskScore is a simple 0-100 operational triage score. Reboot pending state, disk pressure, failed services, unknown collection state, and weak patch readiness signals add risk. The score is intended to help prioritize review and is not a compliance score.
