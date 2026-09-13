# PERTAIN

**The per-customer incident truth gate.**

> **Know who this update actually applies to before it goes out.**

**One incident. Different customer realities.**

PERTAIN evaluates one proposed incident update against each intended customer’s actual service footprint and current incident truth before allowing the message to reach that customer.

Judge shorthand:

> **Same message. Three customers. ALLOW / HOLD / UNKNOWN.**

## Why this exists

A globally phrased incident update can be true for one customer, false for another, and impossible to prove for a third because customers depend on different services, regions and operational evidence.

PERTAIN exists to answer one bounded question:

> **For which intended recipients is this exact statement supported by current evidence?**

## Day-of-event hackathon build

PERTAIN is a clean build for the Multi-App AI Agent Hackathon on 2026-09-13.

Current causal app roles:

- **Gmail** — proposed outbound message, recipients, controlled send
- **Salesforce** — customer-specific footprint / dependency / obligation truth
- **Jira** — incident / service / component operational truth

Provider adapters are deliberately narrow and swappable. Sponsor-native technology is optional.

## Hero scenario

Proposed message:

> `Your production workflows are fully restored.`

The same sentence produces three different outcomes:

- **ACME → HOLD** — ACME depends on `EU Auth`; current incident evidence says `EU Auth = DEGRADED`.
- **GLOBEX → ALLOW** — GLOBEX’s relevant US dependencies are healthy.
- **INITECH → UNKNOWN** — required customer dependency mapping is missing.

Only `ALLOW` recipients may enter the controlled outbound side-effect plan.

## Architecture

```text
Gmail message
   │
   ├── CLAIM worker ───────┐
   ├── CUSTOMER worker ────┼──> deterministic adjudicator
   └── INCIDENT worker ────┘          │
                                      ├── ALLOW
                                      ├── HOLD
                                      ├── UNKNOWN
                                      └── REVIEW
                                               │
                                      human-controlled action
                                               │
                                      bounded side effect
                                               │
                                         verification receipt
```

The workers execute concurrently for latency and independent failure isolation. PERTAIN does **not** claim that concurrency is semantically necessary for correctness; a sequential equivalent should produce the same verdict under stable inputs.

## AI boundary

AI is bounded to semantic mapping of free-form customer-facing language into a finite predicate vocabulary.

AI does **not** directly decide the final customer verdict.

Deterministic policy owns:

- customer dependency membership;
- incident/service health;
- stale or missing evidence;
- `ALLOW / HOLD / UNKNOWN / REVIEW`;
- the permitted recipient set;
- side-effect gating;
- side-effect verification.

Malformed or ambiguous semantic mapping fails closed to `REVIEW`.

## Reliability contract

- contradiction → `HOLD`
- missing or stale required evidence → `UNKNOWN`
- ambiguous semantic mapping → `REVIEW`
- only complete, fresh, supporting evidence → `ALLOW`
- browser/client state cannot forge the send set; `/api/send` re-evaluates server-side
- provider write failure never becomes verified success
- duplicate recipients are deduped before the send plan
- fixture sends are labeled `SIMULATED_FIXTURE`
- external sends are verified against the provider response

The current CI suite contains **20 bounded controls** spanning positive, negative, ambiguity, stale-evidence, state-change and side-effect-policy cases.

## Real failure anchor

The build preserves a public first-person SaaS incident account reporting a 14-hour outage discovered through a customer tweet, with reported enterprise synchronization loss, one missed compliance deadline and subsequent churn.

That evidence is treated honestly as **an unaudited anecdote**, not as market-size or causal proof.

Source: https://www.reddit.com/r/SaaS/comments/1s6p2xc/server_went_down_for_14_hours_on_a_tuesday_we/

Rule:

> **Real failure > fake success.**

## Truth boundary

The UI explicitly distinguishes:

- `FIXTURE` vs `EXTERNAL` evidence;
- `MODEL` vs deterministic semantic mapping;
- `SIMULATED_FIXTURE` vs external side effects.

A seeded demo is repeatable evaluation evidence. It is **not** presented as final three-app external proof.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

For the clearly labeled fixture mode:

```bash
PERTAIN_DEMO_MODE=1 npm run dev
```

## Tests

```bash
npm test
npm run build
```

## Cloudflare-first release

Cloudflare Workers is the primary deployment target to protect the user’s Vercel build quota.

```bash
npm run build:cloudflare
npm run preview:cloudflare
npm run deploy:cloudflare
```

The project uses the Cloudflare OpenNext adapter because this repository is already an existing Next.js 15 application. Vercel remains fallback only.

## Evidence package

See:

- `docs/RELIABILITY-BRIEF.md`
- `docs/EVIDENCE-MATRIX.md`
- `docs/NEGATIVE-EVENT.md`
- `docs/JUDGE-PACKET.md`

## Claim boundary

This hackathon build claims only what it directly demonstrates.

It does **not** claim:

- production customer adoption;
- production security or universal reliability;
- measured churn or revenue reduction;
- legal/compliance correctness;
- universal CRM/incident-platform coverage;
- that concurrency itself is necessary for correct verdicts.

External three-app proof and external side-effect verification remain mandatory before terminal submission readiness.
