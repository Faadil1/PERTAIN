# PERTAIN — Evidence Matrix

Date: 2026-09-13

| Claim | Evidence class | Current support | Terminal status |
|---|---|---|---|
| Same message can produce different customer verdicts | Technical proof | Deterministic policy tests and hero fixture | PROVEN_BOUNDED |
| Contradictory relevant dependency becomes `HOLD` | Technical proof | Policy tests | PROVEN_BOUNDED |
| Missing dependency evidence becomes `UNKNOWN` | Technical proof | Policy tests | PROVEN_BOUNDED |
| Ambiguous language becomes `REVIEW` | Technical proof | Semantic tests | PROVEN_BOUNDED |
| Stale relevant evidence becomes `UNKNOWN` | Technical proof | Freshness control + test | PROVEN_BOUNDED |
| Verdicts depend on state, not account name | Technical proof | state-change test | PROVEN_BOUNDED |
| Only `ALLOW` enters send plan | Technical proof | send-plan tests | PROVEN_BOUNDED |
| Browser cannot forge allow-list | Engineering proof | server-side re-evaluation in `/api/send` | IMPLEMENTED |
| Evidence workers run concurrently | Code/CI proof | `Promise.all` orchestrator | PROVEN_PRESENCE |
| Concurrency is required for correctness | Causal proof | not established | NOT_CLAIMED |
| Gmail + Salesforce + Jira end-to-end | External integration proof | adapters implemented | PENDING |
| External `ALLOW` side effect verified | External action proof | Gmail verification path implemented | PENDING |
| Zero external side effects to `HOLD/UNKNOWN/REVIEW` | External action proof | deterministic send planner implemented | PENDING_EXTERNAL_RUN |
| 20 bounded controls pass | CI proof | tests authored in repository | REQUIRES_GREEN_CI_ON_THIS_COMMIT |
| Cloudflare-compatible production build | Release proof | OpenNext configuration added | REQUIRES_GREEN_CF_BUILD |
| Real-world problem has concrete failure evidence | Reality proof | public first-person outage anecdote | PASS_WITH_RESERVATIONS |
| Measured churn reduction | Outcome proof | no user deployment study | NOT_CLAIMED |
| Production readiness/security | Production proof | no production deployment evidence | NOT_CLAIMED |

## Truth rule

A stronger proof class must never be inferred from a weaker one.

Examples:

- code presence does not prove production reliability;
- a seeded fixture does not prove external integration;
- an anecdote does not prove market frequency;
- concurrent execution does not prove concurrency is necessary for correctness.
