import assert from "node:assert/strict";
import test from "node:test";
import { evaluateRecipient } from "../lib/policy";
import type { CustomerFootprint, IncidentTruth, ParsedClaim } from "../lib/types";

const claim: ParsedClaim = {
  predicate: "ALL_RELEVANT_SERVICES_HEALTHY",
  services: [],
  regions: ["ALL"],
  certainty: "explicit",
  source: "deterministic_fallback",
};

const incident: IncidentTruth = {
  incidentId: "INC-1",
  source: "demo",
  services: [
    { service: "Production Workflows", health: "HEALTHY" },
    { service: "EU Auth", health: "DEGRADED" },
    { service: "US Auth", health: "HEALTHY" },
  ],
};

function customer(name: string, services: string[] | null): CustomerFootprint {
  return {
    accountId: name,
    accountName: name,
    email: `${name.toLowerCase()}@example.com`,
    services,
    regions: [],
    source: "demo",
  };
}

test("ACME is held when a relevant dependency is degraded", () => {
  const result = evaluateRecipient(customer("ACME", ["Production Workflows", "EU Auth"]), incident, claim);
  assert.equal(result.verdict, "HOLD");
  assert.equal(result.decisiveService, "EU Auth");
});

test("GLOBEX is allowed when all relevant dependencies are healthy", () => {
  const result = evaluateRecipient(customer("GLOBEX", ["Production Workflows", "US Auth"]), incident, claim);
  assert.equal(result.verdict, "ALLOW");
});

test("INITECH is unknown when its dependency map is missing", () => {
  const result = evaluateRecipient(customer("INITECH", null), incident, claim);
  assert.equal(result.verdict, "UNKNOWN");
});

test("missing incident state fails closed to UNKNOWN", () => {
  const result = evaluateRecipient(customer("MISSING", ["Unmapped Service"]), incident, claim);
  assert.equal(result.verdict, "UNKNOWN");
});

test("ambiguous claim goes to REVIEW before deterministic allow", () => {
  const ambiguous: ParsedClaim = { ...claim, certainty: "ambiguous" };
  const result = evaluateRecipient(customer("GLOBEX", ["Production Workflows"]), incident, ambiguous);
  assert.equal(result.verdict, "REVIEW");
});
