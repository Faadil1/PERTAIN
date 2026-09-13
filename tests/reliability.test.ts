import assert from "node:assert/strict";
import test from "node:test";
import { buildSendPlan } from "../lib/orchestrator";
import { evaluateRecipient } from "../lib/policy";
import type {
  CustomerFootprint,
  EvaluationReceipt,
  IncidentTruth,
  ParsedClaim,
  RecipientVerdict,
} from "../lib/types";

const claim: ParsedClaim = {
  predicate: "ALL_RELEVANT_SERVICES_HEALTHY",
  services: [],
  regions: ["ALL"],
  certainty: "explicit",
  source: "deterministic_fallback",
};

const acme: CustomerFootprint = {
  accountId: "acme",
  accountName: "ACME",
  email: "ops@acme.example",
  services: ["EU Auth"],
  regions: ["EU"],
  source: "demo",
};

test("16 stale authoritative evidence fails closed to UNKNOWN", () => {
  const now = new Date("2026-09-13T18:00:00Z");
  const incident: IncidentTruth = {
    incidentId: "INC-stale",
    source: "demo",
    services: [
      {
        service: "EU Auth",
        health: "HEALTHY",
        updatedAt: "2026-09-13T16:00:00Z",
      },
    ],
  };

  const result = evaluateRecipient(acme, incident, claim, {
    now,
    maxEvidenceAgeMinutes: 30,
  });
  assert.equal(result.verdict, "UNKNOWN");
});

test("17 fresh healthy evidence is eligible for ALLOW", () => {
  const now = new Date("2026-09-13T18:00:00Z");
  const incident: IncidentTruth = {
    incidentId: "INC-fresh",
    source: "demo",
    services: [
      {
        service: "EU Auth",
        health: "HEALTHY",
        updatedAt: "2026-09-13T17:55:00Z",
      },
    ],
  };

  const result = evaluateRecipient(acme, incident, claim, {
    now,
    maxEvidenceAgeMinutes: 30,
  });
  assert.equal(result.verdict, "ALLOW");
});

test("18 a real state change flips the verdict instead of hard-coding the account", () => {
  const degraded: IncidentTruth = {
    incidentId: "INC-before",
    source: "demo",
    services: [{ service: "EU Auth", health: "DEGRADED" }],
  };
  const recovered: IncidentTruth = {
    incidentId: "INC-after",
    source: "demo",
    services: [{ service: "EU Auth", health: "HEALTHY" }],
  };

  assert.equal(evaluateRecipient(acme, degraded, claim).verdict, "HOLD");
  assert.equal(evaluateRecipient(acme, recovered, claim).verdict, "ALLOW");
});

function verdict(email: string, state: RecipientVerdict["verdict"]): RecipientVerdict {
  return {
    accountName: email.split("@")[0].toUpperCase(),
    email,
    verdict: state,
    reason: state,
    evidence: [],
  };
}

function receipt(recipients: string[], decisions: RecipientVerdict[]): EvaluationReceipt {
  return {
    runId: "run-test",
    mode: "seeded-demo",
    createdAt: "2026-09-13T18:00:00Z",
    draft: {
      id: "draft",
      subject: "Incident",
      body: "Your production workflows are fully restored.",
      recipients,
      source: "demo",
    },
    claim,
    incident: {
      incidentId: "INC",
      source: "demo",
      services: [],
    },
    workers: [],
    recipients: decisions,
    allowedEmails: decisions.filter((item) => item.verdict === "ALLOW").map((item) => item.email),
    blockedEmails: decisions.filter((item) => item.verdict === "HOLD").map((item) => item.email),
    unknownEmails: decisions.filter((item) => item.verdict === "UNKNOWN").map((item) => item.email),
    reviewEmails: decisions.filter((item) => item.verdict === "REVIEW").map((item) => item.email),
    truthBoundary: {
      evidence: "FIXTURE",
      semanticMapping: "DETERMINISTIC_FALLBACK",
      sideEffects: "SIMULATED_FIXTURE",
    },
  };
}

test("19 send planning includes only ALLOW recipients", () => {
  const evaluation = receipt(
    ["allow@example.com", "hold@example.com", "unknown@example.com"],
    [
      verdict("allow@example.com", "ALLOW"),
      verdict("hold@example.com", "HOLD"),
      verdict("unknown@example.com", "UNKNOWN"),
    ],
  );

  const plan = buildSendPlan(evaluation);
  assert.deepEqual(plan.allowedRecipients, ["allow@example.com"]);
  assert.deepEqual(
    plan.notSent.map((item) => item.email).sort(),
    ["hold@example.com", "unknown@example.com"],
  );
});

test("20 duplicate intended recipients are deduped before the side-effect plan", () => {
  const evaluation = receipt(
    ["allow@example.com", "ALLOW@example.com", "hold@example.com"],
    [verdict("allow@example.com", "ALLOW"), verdict("hold@example.com", "HOLD")],
  );

  const plan = buildSendPlan(evaluation);
  assert.deepEqual(plan.allowedRecipients, ["allow@example.com"]);
});
