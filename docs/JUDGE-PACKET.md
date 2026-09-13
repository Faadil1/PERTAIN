# PERTAIN — Judge Packet

## Judge memory sentence

> **PERTAIN takes one incident update and proves which customers it is actually true for before anyone sends it.**

Shorthand:

> **Same message. Three customers. ALLOW / HOLD / UNKNOWN.**

## Two-minute demo

### 0–10s — Problem

“One recovery update is about to go to three enterprise customers. The dangerous assumption is that one incident creates one customer truth.”

### 10–25s — Input

Show the exact message:

`Your production workflows are fully restored.`

Show the three intended recipients.

### 25–45s — Multi-app execution

PERTAIN runs three evidence workers:

- CLAIM — what exactly is this sentence asserting?
- CUSTOMER — what does each customer actually depend on?
- INCIDENT — what is actually healthy right now?

Explain that the semantic worker maps language, but deterministic policy owns the verdict.

### 45–70s — Signature moment

Reveal all three together:

- ACME -> `HOLD` — EU Auth still degraded.
- GLOBEX -> `ALLOW` — relevant US dependencies healthy.
- INITECH -> `UNKNOWN` — dependency map missing.

Say:

> “Same sentence. Three different truths.”

### 70–90s — Proof

Open one evidence drawer.

Show observed customer footprint, observed incident state, deterministic rule and truth boundary.

Mention the 20-case reliability suite and the stale-evidence fail-closed control.

### 90–105s — Controlled action

Click **Send to allowed audience**.

Important truth boundary:

- fixture mode -> explicitly say the send is simulated;
- external mode -> show the externally verified provider receipt.

Point out that the browser cannot forge the allow-list because the server re-evaluates before the send plan.

### 105–115s — Real-world stakes

“A real SaaS founder described a 14-hour outage discovered through a customer tweet, with reported enterprise sync loss, a missed compliance deadline and churn. That is an anecdote, not market-size proof — but it is a concrete failure pattern.”

### 115–120s — Close

> **One incident. Different customer realities. PERTAIN proves who the message actually pertains to before it goes out.**

## Rubric mapping

### Technical execution — 30%

- three non-duplicative app roles;
- concurrent evidence reads;
- bounded semantic mapping;
- deterministic adjudicator;
- freshness control;
- server-side side-effect authorization;
- inspectable receipts.

### Reliability & evaluation — 25%

- 20 bounded controls;
- `HOLD / UNKNOWN / REVIEW` are first-class;
- stale evidence fails closed;
- state change flips verdict;
- forbidden recipient policy tested;
- fixture vs external proof separated.

### Usefulness — 20%

Prevents a globally phrased incident update from going to a customer for whom it is false or unprovable.

### Originality — 15%

Not a status-update writer, SLA timer or affected-customer list. The product evaluates the **truth envelope of the exact outgoing sentence** per recipient.

### Demo clarity — 10%

One sentence. Three customers. Three verdicts. One permitted action.

## Hard Q&A

**Why not incident.io / Rootly / Statuspage?**

They already cover incident coordination, customer targeting and status communication. PERTAIN’s narrower wedge is the truth test for the exact outgoing statement against each customer’s dependency envelope before action.

**Why AI?**

Only the semantic residue needs AI: mapping free-form customer language to bounded predicates. Structured truth and final policy remain deterministic.

**Why not a simple rule engine?**

If the outgoing claim and all service names are already perfectly structured, a rule engine is enough. PERTAIN’s AI advantage is reducing the cost of mapping natural customer-facing language into that deterministic policy boundary.

**What happens when evidence is missing?**

`UNKNOWN`. No confident send.

**What if the incident record is stale but green?**

`UNKNOWN` once it exceeds the configured freshness window.

**Can the browser modify `allowedEmails` and force a send?**

No. The send endpoint does not trust the client receipt; it re-evaluates server-side and rebuilds the permitted set.

**Is concurrency necessary?**

Not claimed. It is real and useful for latency/failure isolation, but correctness comes from the reconciliation invariant and deterministic policy.

**What is real vs simulated?**

The UI labels fixture evidence and fixture side effects explicitly. External provider proof is a separate gate.

**What is the biggest limitation?**

The product cannot create authoritative customer dependency truth if the organization does not maintain it. In that case PERTAIN correctly returns `UNKNOWN` rather than pretending certainty.
