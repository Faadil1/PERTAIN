# PERTAIN — System & Reliability Brief

Date: 2026-09-13
Build: Multi-App AI Agent Hackathon
Status: `VERIFICATION_EXTERNAL_PROOF_PASS__EVALUATION_LOCK_PENDING`

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

The external guarded-send proof additionally reproduced the exact recipient identities and `HOLD / ALLOW / UNKNOWN` partition immediately before the side effect.

## 6. Freshness guard

Incident service evidence may include `updatedAt`.

If a relevant service record is older than `PERTAIN_EVIDENCE_MAX_AGE_MINUTES` (default 30), the customer fails closed to `UNKNOWN`.

A stale green status is therefore not accepted as proof of safe communication.

This behavior was demonstrated externally in run `pertain-1789335872938-1bihxx`: stale Jira evidence caused all three recipients to become `UNKNOWN`, `allowedRecipients=[]`, and no send occurred.

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

The final controlled external proof used:

- fresh pre-send policy run: `pertain-1789336205624-k44jkw`;
- send run: `pertain-1789336206618-68gnuf`;
- sole authorized recipient: `bfaadil+globex@gmail.com`;
- Gmail provider message ID: `1a09cbf93cdb9997`;
- provider result: `attempted=true`, `verified=true`, `proofMode=EXTERNAL`;
- ACME remained `HOLD` and INITECH remained `UNKNOWN` in `notSent`.

Recipient-side verification in the controlled Gmail mailbox found the exact provider message in `INBOX` addressed to `bfaadil+globex@gmail.com`, with subject `PERTAIN incident recovery update` and body `Your production workflows are fully restored.`. Matching `INBOX` searches for tagged ACME and INITECH returned no messages.

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

GitHub Actions run `34778658716` on head `322016ed95e5fdb8f6649083d7bf7135260e3af1` executed the suite with:

- tests: `20`
- pass: `20`
- fail: `0`
- skipped: `0`

The same run also passed `npm run build` and `npm run build:cloudflare`.

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

## 10. Multi-app proof contract — satisfied under controlled external fixture

PERTAIN now preserves evidence that:

- the proposed communication comes from Gmail;
- customer-specific truth comes from Salesforce;
- incident/service truth comes from Jira;
- a fresh combined runtime produces `ACME=HOLD / GLOBEX=ALLOW / INITECH=UNKNOWN`;
- only tagged GLOBEX receives the permitted external side effect;
- tagged ACME and INITECH receive zero matching controlled-inbox deliveries;
- the permitted Gmail side effect is provider-verified and recipient-visible in the controlled mailbox.

Controlled fixture identities:

- ACME -> `bfaadil+acme@gmail.com`
- GLOBEX -> `bfaadil+globex@gmail.com`
- INITECH -> `bfaadil+initech@gmail.com`

The three plus-address aliases intentionally route to one controlled Gmail mailbox so recipient-side delivery can be inspected without creating fake customer accounts.

## 11. Preserved real failure

The first external GLOBEX target `bfaadilglobex@gmail.com` had never been created. Gmail initially accepted the provider-side send and returned a message ID, but later produced `550 5.1.1 No Such User`.

PERTAIN preserves both facts:

- provider acceptance occurred;
- end-to-end recipient delivery did not.

This failure is part of the evidence record and directly reinforces the rule that provider acceptance alone must not be presented as recipient delivery proof.

## 12. Known limitations

- customer footprint quality is only as good as the authoritative source;
- arbitrary natural-language SLA interpretation is out of scope;
- semantic model evaluation remains bounded, not universal;
- provider authentication hardening is hackathon-grade, not production-grade;
- current public negative-event anchor is anecdotal;
- recipient proof uses a controlled Gmail plus-address fixture, not independent customer domains;
- there is no production security review, live customer deployment or measured business-outcome study.

## 13. Release strategy

Primary: **Cloudflare Workers** using the OpenNext Cloudflare adapter.

Fallback: Vercel only if Cloudflare release is blocked.

The current head has a green OpenNext Cloudflare build in GitHub Actions. Public release remains downstream of Verification / Evaluation Lock.
