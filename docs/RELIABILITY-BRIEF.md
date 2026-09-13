# PERTAIN — System & Reliability Brief

Date: 2026-09-13
Build: Multi-App AI Agent Hackathon
Status: `EVALUATION_PASS__FINAL_CHANGED_HEAD_VERIFICATION_PENDING`

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

### REVIEW
Use when semantic mapping is materially ambiguous or the bounded scope cannot be reconciled safely.

### ALLOW
Use only when all required relevant evidence exists, is fresh enough, and supports the exact statement.

## 4. Concurrent evidence workers

After loading the outbound message, PERTAIN runs three independent evidence jobs concurrently:
- `CLAIM`
- `CUSTOMER`
- `INCIDENT`

Each emits source, status, duration and bounded summary. Worker failures are isolated and cannot silently become `ALLOW`.

Concurrency is an implementation advantage for latency / failure isolation; PERTAIN does not claim it is semantically necessary for correctness.

## 5. Server-side send integrity

The browser does not authorize the final recipient list.

`/api/send` performs a fresh server-side evaluation immediately before execution and derives the send plan from server-generated policy state.

The final external proof additionally reproduced the exact `HOLD / ALLOW / UNKNOWN` partition immediately before the side effect.

For public safety, external Gmail writes are now disabled by default. An external runtime must explicitly set `PERTAIN_EXTERNAL_SEND_ENABLED=1` on the server before `/api/send` may call the real provider. Seeded demo mode remains clearly simulated.

## 6. Freshness guard

Incident service evidence may include `updatedAt`.

If a relevant service record is older than `PERTAIN_EVIDENCE_MAX_AGE_MINUTES` (default 30), the customer fails closed to `UNKNOWN`.

External run `pertain-1789335872938-1bihxx` demonstrated this: stale Jira evidence caused all three recipients to become `UNKNOWN`, `allowedRecipients=[]`, and no send occurred.

## 7. Model boundary

A real OpenAI-compatible model path was exercised in external read-only run `pertain-1789337300634-uyu47z` with:
- `evidence=EXTERNAL`
- `semanticMapping=MODEL`
- ACME=`HOLD`
- GLOBEX=`ALLOW`
- INITECH=`UNKNOWN`
- no new send.

A direct model probe also exposed a useful failure mode: generic wording could be narrowed into an invented service scope. PERTAIN now canonicalizes only explicit global recovery phrases before deterministic policy. This does not make the model authoritative; it narrows the semantic contract and preserves fail-closed policy ownership.

## 8. Side-effect proof

Every send result records recipient, attempted, verified, proof mode, provider message ID when available, and provider error when available.

`SIMULATED_FIXTURE` is clearly labeled and is not presented as external proof.

The final controlled external proof used:
- fresh pre-send policy run: `pertain-1789336205624-k44jkw`;
- send run: `pertain-1789336206618-68gnuf`;
- sole authorized identity: tagged GLOBEX;
- provider result: `attempted=true`, `verified=true`, `proofMode=EXTERNAL`;
- ACME remained `HOLD` and INITECH remained `UNKNOWN` in `notSent`.

Recipient-side verification in the controlled mailbox found the exact provider message in `INBOX` for tagged GLOBEX. Matching searches for tagged ACME and INITECH returned no messages.

The exact controlled mailbox aliases are intentionally omitted from the public repository because they are not needed to understand or reproduce the policy design.

## 9. Reliability suite — 20 bounded controls

The locked Verification baseline covered:

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

Locked Verification baseline:
- tests: `20`
- pass: `20`
- fail: `0`
- skipped: `0`
- `npm run build`: PASS
- `npm run build:cloudflare`: PASS

The final TRACE / Winning Intelligence pass changed product code after that lock, so the current head must rerun these checks before public deployment. No prior green result is silently transferred to a changed head.

## 10. Real negative event

The project preserves a public first-person SaaS incident account reporting a 14-hour outage discovered through a customer tweet, with reported synchronization loss, a missed compliance deadline and subsequent churn.

Evidence class: `FIRST_PERSON_ANECDOTE__UNAUDITED`.

This is not market-size proof. It informs one design rule:

> Do not assume one global incident statement is safe for every customer.

## 11. Multi-app proof contract

PERTAIN preserves evidence that:
- the proposed communication comes from Gmail;
- customer-specific truth comes from Salesforce;
- incident/service truth comes from Jira;
- a real model path can map the language in the external runtime;
- a fresh combined runtime produces `ACME=HOLD / GLOBEX=ALLOW / INITECH=UNKNOWN`;
- only tagged GLOBEX received the permitted external side effect;
- tagged ACME and INITECH had zero matching controlled deliveries;
- the permitted Gmail side effect was provider-verified and recipient-visible in the controlled mailbox.

The three test identities intentionally routed to one controlled mailbox. This is a controlled integration proof, not production customer-domain deliverability.

## 12. Preserved real failure

The first external GLOBEX target did not exist. Gmail initially accepted the provider-side send and returned a message ID, but later produced `550 5.1.1 No Such User`.

PERTAIN preserves both facts:
- provider acceptance occurred;
- end-to-end recipient delivery did not.

This is why provider acceptance and delivery are separate evidence classes.

## 13. Known limitations

- customer footprint quality is only as good as the authoritative source;
- arbitrary natural-language SLA interpretation is out of scope;
- semantic model evaluation remains bounded, not universal;
- provider authentication is hackathon-grade, not production-grade;
- public negative-event anchor is anecdotal;
- recipient proof uses tagged identities in one controlled mailbox, not independent customer domains;
- there is no production security review, live customer deployment or measured business-outcome study.

## 14. Release strategy

Primary: **Cloudflare Workers** using the OpenNext Cloudflare adapter.

Public release rule:
1. run current-head tests;
2. run current-head Next.js build;
3. run current-head Cloudflare/OpenNext build;
4. keep public external sends disabled;
5. deploy;
6. record URL and final <=2 minute demo link in README.
