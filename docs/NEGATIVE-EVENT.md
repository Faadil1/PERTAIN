# PERTAIN — Negative Event Record

Status: `PASS_WITH_RESERVATIONS`

## 1. Positive signal / opportunity

Enterprise customers depend on reliable service and timely incident communication. Different customers often depend on different regions, services and contractual support conditions.

## 2. Concrete real negative event

A public first-person SaaS founder account reports a **14-hour outage** that was discovered after a customer tweeted about the problem.

Source:

https://www.reddit.com/r/SaaS/comments/1s6p2xc/server_went_down_for_14_hours_on_a_tuesday_we/

Evidence class:

`FIRST_PERSON_ANECDOTE__UNAUDITED`

## 3. Observable impact

The author reports:

- three enterprise customers losing a day of data synchronization;
- one customer missing a compliance deadline;
- two of the three customers churning within the month;
- combined reported ARR of those two churns: $28K.

These numbers are preserved as **reported anecdotal impact**, not independently audited fact or market-size evidence.

## 4. Design lesson / implication

A globally phrased incident message can be operationally dangerous when the sender does not reconcile the exact statement with:

- each customer’s actual dependencies;
- current incident truth;
- missing or stale evidence.

Absence of evidence must never become evidence of safety.

## 5. PERTAIN response / mitigation

PERTAIN evaluates the exact outgoing claim per recipient.

- contradiction -> `HOLD`
- missing/stale truth -> `UNKNOWN`
- ambiguous semantic mapping -> `REVIEW`
- complete supporting evidence -> `ALLOW`

Only `ALLOW` may enter the bounded send plan.

## Adjacent rule

> **Real failure > fake success.**

Failed evaluations, blocked sends and `UNKNOWN` outcomes are evidence, not defects to hide from the judge.
