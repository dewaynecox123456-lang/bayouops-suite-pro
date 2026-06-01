# Offline License Generation

BayouOps Suite Pro supports a lightweight offline license workflow for protected
customer workflows.

## Customer Request Flow

Customers should email [support@bayoufinds.com](mailto:support@bayoufinds.com)
when they need a license file. Support phone remains `Coming soon` until a
dedicated business or Google Voice number is ready.

BayouFinds generates `license.json` locally and manually sends it to the
customer. No online activation, telemetry, customer tracking, cloud service, or
payment processing is used by this workflow.

## Seller-Side Generation

Run the seller/admin-only generator locally:

```bash
node scripts/license/generate-license.mjs \
  --licensed-to "Customer Name" \
  --email customer@example.com \
  --edition Professional \
  --expires-on 2027-06-01 \
  --notes "Manual offline license"
```

Generated licenses are written under:

```text
private/licenses/
```

The `private/` folder is ignored by git. Do not commit generated customer
licenses.

## Customer Install Location

Send the generated file to the customer as `license.json`. The customer places
it here:

```text
config/license.json
```

`config/license.json` is ignored by git so customer-specific licenses are not
committed accidentally.

## Example File

A safe example is provided at:

```text
config/license.example.json
```

The example is not a real license and should not be used for customer delivery.

## Offline Validation Model

License validation is intended to remain local, transparent, and offline:

- no online activation
- no telemetry
- no customer tracking
- no cloud service
- no background service
- no DRM-heavy behavior

Future signed-license validation can be added later without changing the basic
customer install path.
