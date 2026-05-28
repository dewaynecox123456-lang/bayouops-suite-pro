# BayouOps Suite Pro Developer Preview v0.2 Release Notes

Release date: 2026-05-28

## Overview

Developer Preview v0.2 packages the current Windows and Linux operational
collectors into a clean customer-facing archive for early access evaluation.

## Included Collectors

- Windows operational readiness CSV export
- Linux operational health TXT report
- Linux operational health CSV summary

## Included Outputs

- `exports/patch-readiness-report.csv`
- `exports/linux-health-report.txt`
- `exports/linux-health-summary.csv`

The included exports are sample/current generated outputs intended to show the
expected report structure.

## Safety Profile

- Local-only
- Read-only
- No destructive actions
- No service changes
- No package changes
- No reboot actions

## Known Preview Limitations

- Output varies by host permissions and installed tools.
- Reboot-required detection depends on operating system markers or available
  local utilities.
- Linux systemd service status may be unavailable in restricted or non-systemd
  sessions.

## Package

Package name:

```text
BayouOps_Suite_Pro_Developer_Preview_v0.2.zip
```
