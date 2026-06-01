# BayouOps Suite Pro Dev Tester Guide

Thank you for helping test BayouOps Suite Pro.

BayouOps is a lightweight, local-first operational readiness visibility and
reporting toolkit. This Dev Tester build is intended for controlled feedback
from Windows/Linux admins, consultants, small IT teams, and homelab operators.

## What To Test

- Open the Windows portable launcher.
- Review the About, Support, Terms, and documentation links.
- Generate the demo environment.
- Render the executive dashboard.
- Generate the executive export pack.
- Run the Windows read-only health export on a safe test system if applicable.
- Review generated files under `exports/`.

## Safety Scope

BayouOps is designed to stay lightweight and transparent:

- read-only operational visibility
- no endpoint modifications
- no telemetry
- no background services
- no online activation
- local/offline workflow
- operator-triggered actions only

## Important Limitation

Do not rely on this Dev Tester build for production-critical decisions. Validate
all outputs independently before using them for operational, audit, compliance,
security, or customer-facing work.

## License File

Protected workflows may require `config/license.json`. If you need a tester
license file, contact support@bayoufinds.com.

Support Phone: Coming soon

Copyright © 2026 Dewayne Cox and Cheri Cox. All Rights Reserved.
