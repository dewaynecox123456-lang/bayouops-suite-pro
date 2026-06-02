# BayouOps Suite Pro

Lightweight local-first operational readiness and export tooling for Windows and Linux environments.

BayouOps Suite Pro focuses on practical operational visibility without requiring enterprise-scale infrastructure, cloud dependency, or subscription-heavy monitoring platforms.

BayouOps is read-only, operator-controlled, and on demand. It does not modify
endpoints, deploy agents, collect telemetry, phone home, or run hidden
background services.

Support:

- Email: support@bayoufinds.com
- Phone: Coming soon
- Website: https://bayoufinds.com

Support email forwarding must be verified before public customer launch.

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
- operator-readable outputs
- practical operational summaries

---

# Current Developer Preview Features

## Windows Operational Readiness Export

Generate a local Windows operational readiness export:

```powershell
pwsh -NoProfile -File .\windows\Export-PatchReadiness.ps1
```

Or use the portable launcher:

```powershell
.\BayouOps-Launcher.ps1
```

The launcher shows product metadata, support contact information, license
status, local preflight checks, and operator-triggered actions. Generated
reports are written to `exports/` inside the portable folder.

Use of BayouOps Suite Pro requires acceptance of the license terms and
conditions before protected workflows run. Review `docs/TERMS_AND_CONDITIONS.md`
and `docs/EULA.md`.

---

# Executive Demo Pack

When Node.js is available, the bundled local demo scripts can refresh and package
the executive demo without external services:

```powershell
node .\scripts\demo\render-demo-dashboard.mjs
node .\scripts\demo\export-executive-demo-pack.mjs
```

The generated pack is written under `exports/demo/`. Optional screenshot gallery
PNGs are intentionally excluded from the portable customer package to keep it
lightweight.

Launcher workflow:

1. Generate Demo Environment
2. Render Executive Dashboard
3. Generate Executive Export Pack
4. Open Documentation, About, Support, or Terms information as needed

---

© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved.
