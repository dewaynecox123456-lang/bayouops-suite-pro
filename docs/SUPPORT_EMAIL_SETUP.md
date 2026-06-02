# Support Email Setup

BayouOps customer-facing support identity should stay lightweight and
professional.

## Public Support Contact

- Primary support email: [support@bayoufinds.com](mailto:support@bayoufinds.com)
- Support phone: Coming soon
- Website: https://bayoufinds.com

Do not publish a personal cell phone number. Keep support phone as `Coming soon`
until a dedicated business or Google Voice number is ready.

## Forwarding Target

Forward `support@bayoufinds.com` to:

```text
TODO: support-forwarding-target@example.com
```

Replace the placeholder with the final support inbox before public customer
launch.

## DNS And Forwarding Checklist

- Confirm `bayoufinds.com` DNS is managed in the expected domain account.
- Create or verify the `support@bayoufinds.com` mailbox or forwarding alias.
- Set the forwarding target to the final support inbox.
- Verify MX records are present for the email provider or forwarding service.
- Confirm the domain does not have conflicting MX records from an old provider.
- Send a test message from an external address to `support@bayoufinds.com`.
- Confirm the forwarded message arrives in the target inbox.
- Reply from the support workflow and confirm the customer-facing identity is
  professional.

Support email forwarding must be verified before public customer launch.

## Squarespace Domains Notes

For Squarespace Domains or domain-hosted forwarding:

- Open the domain's DNS or email forwarding settings.
- Add `support` as the forwarding address or email alias.
- Point it to the approved support inbox.
- Review any provider-specific MX records required for forwarding.
- Allow DNS changes time to propagate before final testing.
- Re-test from an external mailbox after propagation.

## Future Email Authentication Recommendations

Before larger customer delivery, add or review:

- SPF records for approved outbound mail providers.
- DKIM signing for the provider used to send support replies.
- DMARC policy in monitoring mode first, then tighten after successful testing.

These DNS items improve deliverability and trust, but they should be configured
carefully with the final email provider details.

---

© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved.
