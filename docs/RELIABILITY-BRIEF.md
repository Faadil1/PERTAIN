# PERTAIN — System & Reliability Brief

Date: 2026-09-13
Build: Multi-App AI Agent Hackathon
Status: `PBPD_BUILD_IN_PROGRESS__EXTERNAL_PROOF_PENDING`

## 1. Product invariant

> **Missing, stale or contradictory required evidence never becomes `ALLOW`.**

PERTAIN evaluates one outgoing incident statement separately for each intended customer before permitting a bounded outbound action.

## 2. Evidence classes

PERTAIN keeps these classes separate:

1. **Observed external or fixture evidence** — message, customer footprint, incident state.
2. **Mapped semantic evidence** — bounded model or deterministic parser output.
3. **Deterministic policy** — `ALLOW / HOLD / UNKNOWN / REVIEW`.
4. **Human action** — the operator chooses whether to execute the permitted action.
5. **Side effect** — actual or simulated outbound action plus verification result.

The UI exposes this truth boundary explicitly.

## 3. Fail-closed outcomes

### HOLD

Use when required evidence is present and directly contradicts the outgoing statement.

Example: ACME depends on `EU Auth`; `EU Auth = DEGRADED`; statement says `fully restored`.

### UNKNOWN

Use when required authoritative evidence is missing, unavailable or stale.

Examples:

- dependency map missing;
- Jira state missing;
- relevant state older than the configured freshness window.

### REVIEW

Use when semantic mapping is materially ambiguous or the bounded scope cannot be reconciled safely.

### ALLOW

Use only when all required relevant evidence exists, is fresh enough, and supports the exact statement.

## 4. Concurrent evidence workers

After loading the outbound message, PERTAIN runs three independent evidence jobs concurrently:

- `CLAIM`
- `CUSTOMER`
- `INCIDENT`

Each worker emits an inspectable trace:

- source;
- status;
- duration;
- bounded summary.

Worker failures are isolated. They cannot silently become `ALLOW`.

Important claim boundary:

> Concurrency is an implementation advantage for latency and independent failure isolation. PERTAIN does not currently claim that concurrency is semantically necessary for correctness.

## 5. Server-side send integrity

The browser does not authorize the final recipient list.

When the operator triggers the side effect, `/api/send` performs a fresh server-side evaluation and derives the send plan from server-generated policy state.

This prevents a modified browser payload from adding a forbidden recipient to the send set.

## 6. Freshness guard

Incident service evidence may include `updatedAt`.

If a relevant service record is older than `PERTAIN_EVIDENCE_MAX_AGE_MINUTES` (default 30), the customer fails closed to `UNKNOWN`.

A stale green status is therefore not accepted as proof of safe communication.

## 7. Side-effect proof

Every send result records:

- recipient;
- attempted;
- verified;
- proof mode;
- provider message ID when available;
- provider error when available.

`SIMULATED_FIXTURE` is clearly labeled and is not presented as external proof.

`EXTERNAL` send results are only reported verified when the provider read-back succeeds.

## 8. Reliability suite — 20 bounded controls

The current suite covers:

1. degraded relevant dependency -> `HOLD`
2. all relevant dependencies healthy -> `ALLOW`
3. missing customer dependency map -> `UNKNOWN`
4. missing incident state -> `UNKNOWN`
5. ambiguous semantic mapping -> `REVIEW`
6. `DOWN` dependency -> `HOLD`
7. authoritative state `UNKNOWN` -> `UNKNOWN`
8. scoped claim can exclude unrelated degraded dependency
9. scoped degraded dependency -> `HOLD`
10. service-name normalization
11. empty customer service evidence -> `UNKNOWN`
12. unsupported semantic scope must not silently `ALLOW`
13. `fully restored` semantic mapping
14. `no customer impact` semantic mapping
15. vague wording -> ambiguous
16. stale authoritative evidence -> `UNKNOWN`
17. fresh healthy evidence -> `ALLOW`
18. state change flips verdict from `HOLD` to `ALLOW`
19. send plan includes only `ALLOW`
20. duplicate intended recipients are deduped

The suite deliberately includes negative and insufficient-evidence behavior, not only happy paths.

## 9. Real negative event

The project preserves a public first-person SaaS incident account reporting a 14-hour outage discovered through a customer tweet.

Reported observable impact included:

- three enterprise customers losing a day of synchronization;
- one missed compliance deadline;
- two reported churns representing a combined $28K ARR.

Evidence class:

`FIRST_PERSON_ANECDOTE__UNAUDITED`

This is not treated as market-size proof. It is a real failure anchor that informs the design rule:

> Do not assume one global incident statement is safe for every customer.

## 10. Multi-app proof contract

Before terminal readiness, PERTAIN must preserve evidence that:

- the proposed communication comes from a real external app surface;
- customer-specific truth comes from a distinct app surface;
- incident/service truth comes from a distinct app surface;
- the expected partition is produced from those external reads;
- only `ALLOW` receives the permitted external side effect;
- `HOLD / UNKNOWN / REVIEW` receive zero forbidden side effects;
- the permitted side effect is externally verified.

Seeded mode does not satisfy this final proof by itself.

## 11. Known limitations

- customer footprint quality is only as good as the authoritative source;
- arbitrary natural-language SLA interpretation is out of scope;
- semantic model evaluation remains bounded, not universal;
- provider authentication hardening is hackathon-grade, not production-grade;
- current public negative-event anchor is anecdotal;
- external three-app proof is pending until configured credentials/test surfaces are exercised.

## 12. Release strategy

Primary: **Cloudflare Workers** using the OpenNext Cloudflare adapter.

Fallback: Vercel only if Cloudflare release is blocked.

Reason: protect a constrained Vercel daily build quota and keep final release independent of preview-build exhaustion.
