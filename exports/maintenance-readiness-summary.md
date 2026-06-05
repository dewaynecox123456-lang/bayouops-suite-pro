# BayouOps Maintenance Readiness Summary

Generated: 2026-06-05T13:50:26.629Z

Operational Advisory Only - Human Approval Required.

This export is read-only. It uses the existing BayouOps patch worklist evidence to organize maintenance readiness, audit review, and exception signals. It does not patch systems, reboot systems, remotely execute commands, modify endpoints, add credentials, add agents, or approve maintenance.

## Readiness Snapshot

- Total systems reviewed: 136
- Overall advisory posture: Elevated patch coordination risk
- Immediate owner review required: 48
- Schedule candidates: 10
- Exception or owner review signals: 50
- Pending reboot signals: 40
- Unsupported OS signals: 4
- Stale systems 45+ days since patch signal: 60

## Evidence Status Counts

- Monitor: 54
- Owner Review Required: 44
- Reboot Coordination Required: 23
- Stale Evidence Review: 11
- Exception Review Required: 4

## Control Area Counts

- Patch Readiness: 46
- Pending Reboot Review: 40
- Patch Evidence Freshness: 38
- Routine Patch Cadence: 8
- Unsupported OS Exception: 4

## Approval State Counts

- Monitor through normal cadence: 58
- Not ready - reboot coordination needed: 40
- Not ready - owner review needed: 27
- Ready for approved scheduling discussion: 7
- Not ready - lifecycle or exception review: 4

## Top Maintenance Readiness Items

| Evidence Status | Hostname | Business Unit | Control Area | Approval State | Review Notes |
| --- | --- | --- | --- | --- | --- |
| Owner Review Required | BAYOU-FILE-115 | Retail | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 12 missing patch signals. Readiness score 36 should be reviewed before approval. |
| Owner Review Required | BAYOU-NOC-003 | Security | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 19 missing patch signals. Readiness score 36 should be reviewed before approval. |
| Owner Review Required | BAYOU-SQL-051 | Operations | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 12 missing patch signals. Readiness score 43 should be reviewed before approval. |
| Owner Review Required | BAYOU-APP-043 | Operations | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 27 missing patch signals. Readiness score 66 should be reviewed before approval. |
| Owner Review Required | BAYOU-DC-041 | Security | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 17 missing patch signals. Readiness score 36 should be reviewed before approval. |
| Owner Review Required | BAYOU-API-096 | Finance | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 13 missing patch signals. Readiness score 69 should be reviewed before approval. |
| Owner Review Required | BAYOU-APP-081 | Operations | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 19 missing patch signals. Readiness score 60 should be reviewed before approval. |
| Owner Review Required | BAYOU-API-014 | Retail | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 17 missing patch signals. Readiness score 51 should be reviewed before approval. |
| Owner Review Required | BAYOU-EDGE-082 | Infrastructure | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 15 missing patch signals. Readiness score 59 should be reviewed before approval. |
| Owner Review Required | BAYOU-API-113 | HR | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 13 missing patch signals. Readiness score 41 should be reviewed before approval. |
| Owner Review Required | BAYOU-APP-100 | Infrastructure | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 30 missing patch signals. Readiness score 41 should be reviewed before approval. |
| Owner Review Required | BAYOU-APP-120 | Retail | Pending Reboot Review | Not ready - reboot coordination needed | Validate reboot state before relying on patch evidence. Review stale patch evidence against current maintenance cadence. Review 27 missing patch signals. Readiness score 41 should be reviewed before approval. |

## Suggested Audit Review Actions

- Review systems marked Exception Review Required with the service owner before normal patch planning.
- Validate pending reboot systems before using patch evidence in leadership, CAB, SOX, or audit reporting.
- Separate unsupported OS items from routine maintenance and track them through lifecycle or exception review.
- Use the CSV export as the working evidence register for operator triage and human approval discussions.

## Source Files

- demo-data/generated/bayouops-demo-1780279545689.json
- ./demo-data/generated/enterprise-demo-pack/enterprise-demo-scenarios.json
- ./samples/patch-inventory.sample.json
- ./samples/patch-inventory.sample.csv
- ./exports/patch-readiness-report.csv

© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved.
