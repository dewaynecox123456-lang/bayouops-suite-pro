# BayouOps Patch Worklist Summary

Generated: 2026-06-03T01:05:35.126Z

Operational Advisory Only - Human Approval Required.

This export is read-only. It does not patch systems, reboot systems, remotely execute commands, modify endpoints, add credentials, add agents, or introduce control-plane automation.

## Summary

- Total systems reviewed: 136
- P1 - Review First: 48
- P2 - Schedule Soon: 10
- P3 - Track: 30
- P4 - Monitor: 48
- Unsupported OS signals: 4
- Pending reboot signals: 40
- Stale systems 45+ days since patch signal: 60

## Advisory Patch Groups

- Routine Patch Cadence: 54
- Stale Systems: 38
- Pending Reboot Review: 22
- Reboot + Stale Patch Review: 18
- Unsupported OS Review: 4

## Top 10 Review Items

| Priority | Score | Hostname | Business Unit | Recommended Patch Group | Advisory Factors |
| --- | ---: | --- | --- | --- | --- |
| P1 - Review First | 100 | BAYOU-FILE-115 | Retail | Reboot + Stale Patch Review | Stale patch age 179d; Pending reboot; 12 missing patches; Low readiness 36; Risk state Critical |
| P1 - Review First | 100 | BAYOU-NOC-003 | Security | Reboot + Stale Patch Review | Stale patch age 173d; Pending reboot; 19 missing patches; Low readiness 36; Risk state Critical |
| P1 - Review First | 100 | BAYOU-SQL-051 | Operations | Reboot + Stale Patch Review | Stale patch age 167d; Pending reboot; 12 missing patches; Low readiness 43; Risk state Critical |
| P1 - Review First | 100 | BAYOU-APP-043 | Operations | Reboot + Stale Patch Review | Stale patch age 149d; Pending reboot; 27 missing patches; Low readiness 66; Risk state Critical |
| P1 - Review First | 100 | BAYOU-DC-041 | Security | Reboot + Stale Patch Review | Stale patch age 137d; Pending reboot; 17 missing patches; Low readiness 36; Risk state Critical |
| P1 - Review First | 100 | BAYOU-API-096 | Finance | Reboot + Stale Patch Review | Stale patch age 131d; Pending reboot; 13 missing patches; Low readiness 69; Risk state Critical |
| P1 - Review First | 100 | BAYOU-APP-081 | Operations | Reboot + Stale Patch Review | Stale patch age 127d; Pending reboot; 19 missing patches; Low readiness 60; Risk state Critical |
| P1 - Review First | 100 | BAYOU-API-014 | Retail | Reboot + Stale Patch Review | Stale patch age 119d; Pending reboot; 17 missing patches; Low readiness 51; Risk state Critical |
| P1 - Review First | 100 | BAYOU-EDGE-082 | Infrastructure | Reboot + Stale Patch Review | Stale patch age 114d; Pending reboot; 15 missing patches; Low readiness 59; Risk state Critical |
| P1 - Review First | 100 | BAYOU-API-113 | HR | Reboot + Stale Patch Review | Stale patch age 103d; Pending reboot; 13 missing patches; Low readiness 41; Risk state Critical |

## Source Files

- demo-data/generated/bayouops-demo-1780279545689.json
- ./demo-data/generated/enterprise-demo-pack/enterprise-demo-scenarios.json
- ./samples/patch-inventory.sample.json
- ./samples/patch-inventory.sample.csv
- ./exports/patch-readiness-report.csv

© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved.
