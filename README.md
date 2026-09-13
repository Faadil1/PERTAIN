# PERTAIN

**The per-customer incident truth gate.**

> Know who this update actually applies to before it goes out.

**One incident. Different customer realities.**

PERTAIN evaluates one proposed incident update against each intended customer's actual service footprint and current incident truth before allowing the message to reach that customer.

Judge shorthand:

> **Same message. Three customers. ALLOW / HOLD / UNKNOWN.**

## Hackathon build

PERTAIN is a clean day-of-event build for the Multi-App AI Agent Hackathon on 2026-09-13.

Core causal apps:

- Gmail — proposed outbound message, recipients, controlled send
- Salesforce — customer-specific footprint/dependency truth
- Jira — incident/service/component operational truth

Preferred reliability harness: Arga Labs twins for Gmail, Salesforce and Jira when event access is available.

## Hero scenario

Message:

> `Your production workflows are fully restored.`

- **ACME → HOLD** — ACME depends on EU Auth and EU Auth is still degraded.
- **GLOBEX → ALLOW** — GLOBEX is US-only and its relevant services are healthy.
- **INITECH → UNKNOWN** — required dependency mapping is missing.

Only `ALLOW` recipients may receive the controlled outbound side effect.

## Product contract

AI is bounded to semantic claim extraction. Structured incident truth, customer footprint, missingness, recipient eligibility and send policy remain deterministic wherever possible.

Truth classes:

- `ALLOW`
- `HOLD`
- `UNKNOWN`
- `REVIEW`

No confidence score may silently override missing or contradictory evidence.

## Repository status

Architecture and implementation plan are being locked through the canonical Faadil Agent System before product code expands.

Canonical planning source:
`Faadil1/faadil-agent-system/projects/multiapp-agent-hackathon/`

## Claim boundary

This hackathon build will claim only what is directly demonstrated. It does not claim production users, production security, measured churn reduction, universal incident coverage, or legal/compliance correctness.
