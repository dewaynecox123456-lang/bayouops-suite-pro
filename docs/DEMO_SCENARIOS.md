# BayouOps Demo Scenarios

These scenarios are built for safe enterprise demos using mock data only. They are intended to improve presentation quality for recruiter screens, customer demos, and operational walkthroughs without changing production collection or scoring logic.

## Healthy Environment

Represents a stable operating state with high patch coverage, strong compliance evidence, low reboot age, and only minor SSL exceptions.

For IT admins, this matters because it establishes a clean baseline for weekly patch operations and helps prove that routine maintenance is working. For managers and compliance stakeholders, it shows that exceptions are measurable, limited, and not hidden inside anecdotal status updates.

## Medium Risk Environment

Represents an environment that is still serviceable but showing pressure from stale systems, deferred patches, unsupported OS instances, reboot backlog, and certificate warnings.

For IT admins, this matters because it identifies the systems most likely to become outages or emergency tickets. For managers and compliance stakeholders, it turns scattered technical issues into a prioritized queue that can be staffed, scheduled, and tracked.

## Critical Risk Environment

Represents a high-risk operating state where stale servers, unsupported platforms, public-facing SSL issues, and low operational scores are concentrated in important business services.

For IT admins, this matters because it separates urgent remediation from routine work and helps protect critical workloads first. For managers and compliance stakeholders, it explains why risk acceptance, emergency maintenance windows, lifecycle funding, or vendor escalation may be required.

## Executive Summary

Represents a leadership-ready view that summarizes health, operational score, compliance state, patch coverage, stale systems, reboot age, unsupported OS exposure, and SSL risk.

For IT admins, this matters because it gives operations a concise queue for patching, reboot coordination, lifecycle review, and certificate cleanup. For managers and compliance stakeholders, it presents operational risk in business language that supports decisions and follow-up accountability.

## Export / Reporting View

Represents audit-ready CSV, JSON, Markdown, HTML, SVG, and PNG outputs generated from the same mock dataset used in the visual demo states.

For IT admins, this matters because it makes remediation lists easy to hand off, archive, and compare after maintenance windows. For managers and compliance stakeholders, it supports repeatable reporting for compliance reviews, vendor discussions, and leadership updates.

## Before Remediation

Represents the pre-maintenance baseline where outdated systems, aged reboots, patch backlog, unsupported operating systems, and SSL findings remain active.

For IT admins, this matters because it documents the starting point before corrective maintenance. For managers and compliance stakeholders, it justifies planned change activity with clear evidence of the current risk posture.

## After Remediation

Represents measurable improvement after maintenance activity, including higher operational score, better patch coverage, fewer stale systems, reduced reboot age, and fewer SSL findings.

For IT admins, this matters because it proves remediation progress and leaves a smaller exception list for follow-up ownership. For managers and compliance stakeholders, it demonstrates risk reduction after action and supports audit or executive reporting narratives.

## Regenerating Demo Assets

Run this command from the repository root:

```bash
node scripts/demo/generate-enterprise-demo-pack.mjs
```

The workflow writes reproducible demo assets to:

- `demo-data/generated/enterprise-demo-pack/`
- `screenshots/demo/enterprise-demo-pack/`
- `exports/demo/enterprise-demo-pack/`
- `~/BayouFinds/media/bayouops-demo-pack/`
