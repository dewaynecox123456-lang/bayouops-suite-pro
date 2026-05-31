# BayouOps Suite Pro

Lightweight local-first operational visibility, readiness, and export tooling for Windows and Linux environments.

BayouOps Suite Pro focuses on practical operational visibility without requiring enterprise-scale infrastructure, cloud dependency, or subscription-heavy monitoring platforms.

BayouOps is visibility and reporting focused. It is not positioned as an RMM, agent-control platform, deployment orchestrator, remediation system, or remote execution tool.

---

# Why BayouOps Exists

Modern operational tooling is often:

- overloaded
- cloud-dependent
- difficult to hand off
- expensive for small teams
- difficult to evaluate quickly

BayouOps Suite Pro was designed to provide:

- local-first workflows
- exportable operational evidence
- lightweight readiness visibility
- software and agent deployment visibility
- operator-readable outputs
- practical operational summaries

---

# Current Developer Preview Features

## Software / Agent Visibility

The product site includes a first-pass Software / Agent Visibility module in the `#software-visibility` section of [`index.html`](index.html).

The module provides read-only operational awareness for questions such as:

- How many systems still have old Dynatrace?
- Which endpoints are stale?
- Which systems have old Cisco Secure Endpoint / AMP?
- Which systems are missing BigFix?
- What version drift exists across endpoint agents?
- Can this data be exported for leadership, CAB, audit, or handoff review?

Supported visibility fields include software name, installed version, current or recommended version, endpoint count, stale endpoint count, missing endpoint count, endpoint hostname, OS, last check-in, deployment notes, install string, uninstall string, and operational status.

Current operational statuses are:

- Current
- Old
- Missing
- Review

The module includes realistic sample data for common enterprise agents such as Dynatrace OneAgent, BigFix Agent, Cisco Secure Endpoint / AMP, FireEye Agent, Entrust, Cisco VPN, CrowdStrike Falcon, SentinelOne, Splunk Universal Forwarder, Zscaler Client Connector, Qualys Cloud Agent, Rapid7 Insight Agent, and Defender for Endpoint.

Export-ready JSON and CSV downloads are available directly from the dashboard for reporting workflows.

Future real endpoint data can come from the read-only Windows Software Inventory
Collector at [`collectors/windows/Get-BayouOpsSoftwareInventory.ps1`](collectors/windows/Get-BayouOpsSoftwareInventory.ps1).
The collector reads Windows uninstall registry metadata and exports JSON or CSV
for BayouOps visibility/reporting workflows. The Software / Agent Visibility
module can import that JSON or CSV, group records by `DisplayName`, show version
drift by `DisplayVersion`, and keep report exports available. It is not a
deployment, uninstall, remediation, remote execution, registry modification, or
agent control tool.

Collector documentation is available at
[`docs/WINDOWS_SOFTWARE_INVENTORY_COLLECTOR.md`](docs/WINDOWS_SOFTWARE_INVENTORY_COLLECTOR.md).

## Patch / KB Visibility

The product site includes a Patch / KB Visibility module for read-only
operational readiness reporting. It supports KB search, missing KB visibility,
pending reboot review, stale endpoint indicators, unsupported OS review, and
CSV/JSON report exports.

Future real patch data can come from the read-only Windows Patch Inventory
Collector at [`collectors/windows/Get-BayouOpsPatchInventory.ps1`](collectors/windows/Get-BayouOpsPatchInventory.ps1).
The collector uses `Get-HotFix` and `Get-CimInstance Win32_QuickFixEngineering`
to export local patch evidence for BayouOps import. It is not a patch deployment,
remediation, reboot, Windows Update trigger, registry modification, or remote
execution tool.

Collector documentation is available at
[`docs/WINDOWS_PATCH_INVENTORY_COLLECTOR.md`](docs/WINDOWS_PATCH_INVENTORY_COLLECTOR.md).

## Windows Operational Readiness Export

Generate a local Windows operational readiness export:

```powershell
pwsh -NoProfile -File .\windows\Export-PatchReadiness.ps1
```

---

# Platform Preview

## BayouOps Brand Banner

![BayouOps Brand Banner](screenshots/brand-clean/01-brand-banner.png)

## Launcher Icon Concept

![Launcher Icon Concept](screenshots/brand-clean/02-launcher.png)

## BayouOps Lockup

![BayouOps Lockup](screenshots/brand-clean/03-operational-summary.png)

## Square Icon

![Square Icon](screenshots/brand-clean/04-dashboard.png)

---

# Demo Materials

Polished demo scripts, walkthrough notes, buyer-story framing, video planning assets, and launch copy are available in [`videos/2026-05-29/`](videos/2026-05-29/). These materials position BayouOps Suite Pro as an operational readiness and visibility layer for patch, compliance, CAB, and executive reporting workflows.
