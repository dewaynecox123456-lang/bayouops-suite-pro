# Payhip Delivery Prep

This is planning documentation only. Do not integrate Payhip payment processing
in code yet.

## Product Title

BayouOps Suite Pro - Dev Tester / Early Access

## Short Product Description

Lightweight local-first operational readiness visibility and reporting toolkit
for Windows/Linux admins, consultants, small IT teams, and homelab operators.

## Long Product Description

BayouOps Suite Pro helps operators review local readiness evidence, generate
demo/report packs, and prepare customer-readable operational handoff materials.
It is designed to stay lightweight, read-only, local/offline, and
operator-controlled.

The Dev Tester package is intended for early feedback on launcher flow,
packaging, report usefulness, documentation clarity, and operational handoff
value. It is not intended for production-critical reliance yet.

BayouOps does not include telemetry, endpoint modifications, background
services, online activation, cloud sync, or automated remediation.

## Package Contents

Expected customer ZIP contents after approval:

- `BayouOps-Launcher.bat`
- `BayouOps-Launcher.ps1`
- `START_HERE.txt`
- `README.md`
- `docs/`
- `config/lines-of-business.json`
- `config/license.example.json`
- `icons/launcher-icon-concept.ico`
- `windows/`
- `tools/`
- `scripts/demo/`
- `demo-data/generated/`
- `screenshots/demo/executive-dashboard.html`
- empty `exports/`

## Delivery Method

Payhip should deliver the final approved customer ZIP/package.

Do not connect BayouOps to Payhip APIs or payment processing in code yet.

## License File Requirement

Protected workflows require a customer `license.json` file.

Customer install path:

```text
config/license.json
```

License files are generated locally by BayouFinds and manually delivered. No
online activation is used.

## Support

- Email: support@bayoufinds.com
- Support Phone: Coming soon
- Website: https://bayoufinds.com

## Refund / All-Sales Language Placeholder

TODO: Add final refund or all-sales language after reviewing Payhip settings and
the intended early access support policy.

Suggested placeholder:

```text
This early access package is delivered digitally. Refund policy language will be
finalized before public launch.
```

## Early Access / Testing Disclaimer

This Dev Tester / Early Access package is not intended for production-critical
reliance. Customers and testers are responsible for validating outputs before
using them for operational, audit, compliance, security, or customer-facing
decisions.

BayouOps Suite Pro is provided as-is and without warranty. Use requires
acceptance of the included Terms and EULA.

## Customer Setup Steps

1. Download the approved ZIP/package from Payhip.
2. Extract the package to a local folder.
3. Place the issued license file at `config/license.json` if provided.
4. Open `START_HERE.txt`.
5. Run `BayouOps-Launcher.bat`.
6. Review Terms/EULA and accept before protected workflows run.
7. Generate demo/report packs or run local exports as needed.
8. Review output under `exports/`.

## What NOT To Include In Payhip ZIP

- `private/`
- `config/license.json`
- generated customer license files
- `exports/demo/` generated bundles
- `.git/`
- `node_modules/`
- raw video files
- unapproved ZIP/build artifacts
- seller-only notes or private ledgers

## Future Package Update Process

1. Validate launcher and package scripts.
2. Run `scripts/package_windows_portable.sh`.
3. Inspect generated package contents.
4. Confirm no private license files or generated export bundles are included.
5. Create final ZIP only after approval.
6. Upload approved ZIP to Payhip manually.
7. Update Payhip description, screenshots, and support notes.
8. Send update notice to testers/customers if appropriate.

© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved.
