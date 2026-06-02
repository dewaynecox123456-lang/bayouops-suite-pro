# Codex Guardrails

This document is intended to keep future Codex sessions and agent work aligned with BayouOps Suite Pro's product direction.

## 1. Project Mission

- BayouOps Suite Pro is a read-only operational visibility and advisory platform.
- It helps IT operators identify risk, readiness gaps, stale systems, patch exposure, SSL/certificate exposure, and reporting gaps.
- It supports human decision-making; it does not replace operators.

## 2. Non-Negotiable Principles

- Operational visibility first.
- Human approval required.
- Advisory intelligence over autonomous action.
- Read-only client-side behavior.
- No unattended remediation.
- No autonomous patching.
- No remote execution.

## 3. In Scope

- Dashboards
- Reports
- HTML/PDF/CSV exports
- Demo data
- Patch worklists
- Risk scoring
- Recommended patch groups
- Operational coordination recommendations
- Documentation
- Release packaging
- Customer-facing polish

## 4. Out of Scope

- RMM replacement
- Remote execution
- Autonomous remediation
- Credential harvesting/storage
- Agent-based control systems
- Silent endpoint changes
- Unattended patch deployment
- Anything destructive on a client endpoint

## 5. Future Ideas Parking Lot

- Saved operational views
- SQL/failover advisory awareness
- Maintenance window coordination
- Patch sequence recommendations
- BigFix-style query/relevance ideas, parked for later only
- Dependency-aware grouping

## 6. Required Behavior for Codex

- Inspect repo before changes.
- Explain files before editing.
- Prefer additive changes.
- Keep changes reviewable.
- Use feature branches for meaningful changes.
- Run validation before recommending commit.
- Never touch private/license/security-sensitive files unless explicitly instructed.
- Ask before expanding scope.

## 7. Preferred Commit Discipline

- Small commits.
- Clear commit messages.
- No mixed unrelated work.
- No broad rewrites unless explicitly approved.

## 8. Brand Language

- Built by operations people for operations people.
- These are the tools we wished we had.
- Operational Advisory Only — Human Approval Required.

## 9. Copyright

Use:

© 2026 BayouFinds.com — Dewayne Cox & Cheri Cox. All Rights Reserved.
