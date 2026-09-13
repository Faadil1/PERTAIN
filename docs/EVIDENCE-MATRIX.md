# PERTAIN — Evidence Matrix

Date: 2026-09-13
Verification head before this docs lock: `322016ed95e5fdb8f6649083d7bf7135260e3af1`

| Claim | Evidence class | Current support | Terminal status |
|---|---|---|---|
| Same message can produce different customer verdicts | Technical + external proof | 20-control suite + fresh external tagged hero run `pertain-1789336070614-lirmfb` | PROVEN_BOUNDED |
| Contradictory relevant dependency becomes `HOLD` | Technical + external proof | Policy tests + ACME / EU Auth `DEGRADED` external run | PROVEN_BOUNDED |
| Missing dependency evidence becomes `UNKNOWN` | Technical + external proof | Policy tests + INITECH missing dependency map external run | PROVEN_BOUNDED |
| Ambiguous language becomes `REVIEW` | Technical proof | Semantic tests | PROVEN_BOUNDED |
| Stale relevant evidence becomes `UNKNOWN` | Technical + external proof | Freshness control + test + external stale-Jira run `pertain-1789335872938-1bihxx` with zero allowed recipients | PROVEN_BOUNDED |
| Verdicts depend on state, not account name | Technical proof | state-change test | PROVEN_BOUNDED |
| Only `ALLOW` enters send plan | Technical + external proof | send-plan tests + fresh tagged send plan with only GLOBEX | PROVEN_BOUNDED |
| Browser cannot forge allow-list | Engineering proof | `/api/send` ignores browser allow-list and performs fresh server-side `evaluateMessage()` before `executeAllowedSend()` | IMPLEMENTED_AND_INSPECTED |
| Evidence workers run concurrently | Code/CI proof | `Promise.all` orchestrator | PROVEN_PRESENCE |
| Concurrency is required for correctness | Causal proof | not established | NOT_CLAIMED |
| Gmail + Salesforce + Jira participate in one external runtime | External integration proof | Gmail tagged draft + Salesforce tagged Contacts + Jira service truth in combined external runs | PROVEN_CONTROLLED_EXTERNAL |
| Fresh external hero partition is `ACME=HOLD / GLOBEX=ALLOW / INITECH=UNKNOWN` | External integration proof | run `pertain-1789336070614-lirmfb` | PROVEN_CONTROLLED_EXTERNAL |
| External `ALLOW` side effect verified | External action proof | guarded run `pertain-1789336205624-k44jkw`; Gmail provider message `1a09cbf93cdb9997`; controlled inbox contains exact message addressed to `bfaadil+globex@gmail.com` | PROVEN_CONTROLLED_EXTERNAL |
| Zero external deliveries to `HOLD/UNKNOWN` in the guarded run | External action proof | send receipt excludes tagged ACME/INITECH; recipient-filtered controlled `INBOX` searches return no matching messages for either tag | PROVEN_CONTROLLED_EXTERNAL |
| Fresh pre-send re-evaluation is binding | External action proof | guarded send aborted unless exact tagged identity map and `HOLD / ALLOW / UNKNOWN` partition were reproduced immediately before send | PROVEN_CONTROLLED_EXTERNAL |
| Provider acceptance alone is not delivery proof | Negative external proof | first original GLOBEX send returned provider id but later bounced `550 5.1.1 No Such User`; failure preserved | PROVEN_NEGATIVE_PATH |
| 20 bounded controls pass | CI proof | GitHub Actions run `34778658716` on head `322016ed95e5fdb8f6649083d7bf7135260e3af1`: 20 pass, 0 fail | PROVEN_CI |
| Next.js production build passes | CI proof | GitHub Actions run `34778658716` | PROVEN_CI |
| Cloudflare-compatible production build passes | Release proof | `npm run build:cloudflare` succeeded in GitHub Actions run `34778658716` | PROVEN_CI |
| Real-world problem has concrete failure evidence | Reality proof | public first-person outage anecdote | PASS_WITH_RESERVATIONS |
| Measured churn reduction | Outcome proof | no user deployment study | NOT_CLAIMED |
| Production readiness/security | Production proof | hackathon-grade auth/integration proof, no production security review or real customer deployment | NOT_CLAIMED |

## Controlled external proof boundary

The terminal external proof uses real Gmail, Salesforce and Jira provider surfaces with a controlled Gmail plus-address fixture:

- ACME -> `bfaadil+acme@gmail.com`
- GLOBEX -> `bfaadil+globex@gmail.com`
- INITECH -> `bfaadil+initech@gmail.com`

All three tags route to one controlled Gmail mailbox so recipient-side delivery can be inspected without creating synthetic external accounts. This proves the bounded side-effect policy and provider integration under a controlled external fixture. It does **not** prove production deliverability across arbitrary customer domains, production auth hardening or business outcome lift.

## Truth rule

A stronger proof class must never be inferred from a weaker one.

Examples:

- code presence does not prove production reliability;
- a seeded fixture does not prove external integration;
- provider acceptance does not prove recipient delivery;
- an anecdote does not prove market frequency;
- concurrent execution does not prove concurrency is necessary for correctness.
