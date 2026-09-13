# PERTAIN — System & Reliability Brief

Date: 2026-09-13
Hackathon: Multi-App AI Agent Hackathon
Status: build in progress

## What PERTAIN does

PERTAIN takes one proposed incident update and determines which intended customers the exact statement is actually supported for before any customer-facing side effect is allowed.

Core proof:

> **Same message. Three customers. ALLOW / HOLD / UNKNOWN.**

Hero message:

> `Your production workflows are fully restored.`

Expected hero partition:

- ACME -> `HOLD` because ACME depends on EU Auth and EU Auth is degraded.
- GLOBEX -> `ALLOW` because all relevant GLOBEX dependencies are healthy.
- INITECH -> `UNKNOWN` because its required dependency mapping is missing.

## Causal multi-app architecture

PERTAIN uses three non-duplicative external app roles:

1. **Gmail** — source of the outgoing message and intended recipients; controlled outbound side effect.
2. **Salesforce** — customer-specific service footprint/dependency/region evidence.
3. **Jira** — current service/component incident truth.

Arga Labs twins are the preferred deterministic proof harness for these APIs when hackathon access is available. Twin/simulated evidence must remain labeled as such.

## AI boundary

AI is intentionally not the policy authority.

The semantic layer is bounded to converting free-form outgoing language into a finite predicate vocabulary, for example:

- `ALL_RELEVANT_SERVICES_HEALTHY`
- `NO_RELEVANT_CUSTOMER_IMPACT`
- `SCOPED_SERVICES_HEALTHY`

Structured status, customer dependency membership, missingness, final recipient eligibility, send policy and side-effect verification are deterministic wherever possible.

Malformed or materially ambiguous semantic output must fail closed to `REVIEW` / `UNKNOWN`; it must not become `ALLOW` from model confidence alone.

## Truth classes

### ALLOW
All required evidence is present and the exact outgoing claim is supported for that customer.

### HOLD
Required evidence is present and at least one relevant fact contradicts the outgoing claim.

### UNKNOWN
Required authoritative evidence is missing, unavailable or unusable, so safety cannot be established.

### REVIEW
Evidence exists but is materially contradictory, or the semantic mapping is too ambiguous for deterministic resolution.

## Failure posture

PERTAIN is fail-closed by design:

- missing customer footprint -> `UNKNOWN`;
- missing service state -> `UNKNOWN`;
- degraded/down relevant service -> `HOLD`;
- ambiguous claim -> `REVIEW`;
- provider read failure -> no permitted send derived from that missing evidence;
- provider write failure -> never report `VERIFIED SENT`;
- duplicate recipients -> dedupe before execution;
- `HOLD`, `UNKNOWN` and `REVIEW` recipients -> zero permitted outbound side effects.

## Side-effect proof

The side-effect contract is stricter than `API returned 200`:

- only `ALLOW` recipients are passed to the Gmail send adapter;
- the resulting provider message ID is re-read when supported;
- send is marked `VERIFIED` only when the follow-up provider read succeeds;
- non-ALLOW recipients remain explicitly `NOT SENT` in the same receipt.

## Evaluation strategy

The minimum reliability matrix contains 15 bounded cases across positive, negative and ambiguity/missing-evidence behavior. It includes:

- the three-customer hero split;
- missing dependency mapping;
- missing incident truth;
- degraded/down service;
- unknown service state;
- scoped claim excluding an unrelated degraded service;
- scoped claim including a degraded service;
- service-name normalization;
- ambiguous language;
- malformed/unsupported semantic mapping behavior;
- no silent safety on absent evidence.

Integration evaluation additionally requires:

- actual/twin reads from Gmail, Salesforce and Jira;
- one permitted outbound side effect;
- zero forbidden sends;
- provider write failure not becoming false success.

## Evidence status

### Proven in repository / CI

- deterministic `ALLOW / HOLD / UNKNOWN / REVIEW` policy exists;
- bounded semantic parser exists;
- provider adapters exist for Gmail, Salesforce and Jira;
- controlled send path permits only `ALLOW` recipients;
- side-effect verification path exists;
- proof-first evaluator UI exists;
- automated tests and production build are executed in GitHub Actions.

### Still required before submission lock

- exercise the selected external app environment (preferably Arga twins) end to end;
- preserve evidence/receipts of the three external reads;
- verify one allowed Gmail side effect and zero forbidden side effects;
- deploy a public evaluator URL;
- run the final 15-case suite against the submission candidate;
- Project Finisher claim/evidence reconciliation.

## Claim boundary

PERTAIN does **not** claim:

- production customers;
- production-grade security/reliability;
- measured churn or revenue reduction;
- universal incident-platform compatibility;
- comprehensive SLA interpretation;
- legal/compliance correctness.

It claims only the behavior demonstrated by the hackathon build and its captured evaluation evidence.
