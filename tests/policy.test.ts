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
    { service: "Payments", health: "DOWN" },
    { service: "Search", health: "UNKNOWN" },
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

test("01 ACME is held when a relevant dependency is degraded", () => {
  const result = evaluateRecipient(customer("ACME", ["Production Workflows", "EU Auth"]), incident, claim);
  assert.equal(result.verdict, "HOLD");
  assert.equal(result.decisiveService, "EU Auth");
});

test("02 GLOBEX is allowed when all relevant dependencies are healthy", () => {
  const result = evaluateRecipient(customer("GLOBEX", ["Production Workflows", "US Auth"]), incident, claim);
  assert.equal(result.verdict, "ALLOW");
});

test("03 INITECH is unknown when its dependency map is missing", () => {
  const result = evaluateRecipient(customer("INITECH", null), incident, claim);
  assert.equal(result.verdict, "UNKNOWN");
});

test("04 missing incident state fails closed to UNKNOWN", () => {
  const result = evaluateRecipient(customer("MISSING", ["Unmapped Service"]), incident, claim);
  assert.equal(result.verdict, "UNKNOWN");
});

test("05 ambiguous claim goes to REVIEW before deterministic allow", () => {
  const ambiguous: ParsedClaim = { ...claim, certainty: "ambiguous" };
  const result = evaluateRecipient(customer("GLOBEX", ["Production Workflows"]), incident, ambiguous);
  assert.equal(result.verdict, "REVIEW");
});

test("06 a DOWN dependency produces HOLD", () => {
  const result = evaluateRecipient(customer("PAYCO", ["Payments"]), incident, claim);
  assert.equal(result.verdict, "HOLD");
  assert.equal(result.decisiveService, "Payments");
});

test("07 an UNKNOWN authoritative service state produces UNKNOWN", () => {
  const result = evaluateRecipient(customer("SEARCHCO", ["Search"]), incident, claim);
  assert.equal(result.verdict, "UNKNOWN");
});

test("08 an explicit scoped claim can exclude an unrelated degraded dependency", () => {
  const scoped: ParsedClaim = {
    ...claim,
    predicate: "SCOPED_SERVICES_HEALTHY",
    services: ["Production Workflows"],
  };
  const result = evaluateRecipient(customer("ACME", ["Production Workflows", "EU Auth"]), incident, scoped);
  assert.equal(result.verdict, "ALLOW");
});

test("09 a scoped claim still holds when its scoped dependency is degraded", () => {
  const scoped: ParsedClaim = {
    ...claim,
    predicate: "SCOPED_SERVICES_HEALTHY",
    services: ["EU Auth"],
  };
  const result = evaluateRecipient(customer("ACME", ["Production Workflows", "EU Auth"]), incident, scoped);
  assert.equal(result.verdict, "HOLD");
});

test("10 service names normalize underscores, hyphens and case", () => {
  const scoped: ParsedClaim = {
    ...claim,
    predicate: "SCOPED_SERVICES_HEALTHY",
    services: ["us_auth"],
  };
  const result = evaluateRecipient(customer("GLOBEX", ["US-Auth"]), incident, scoped);
  assert.equal(result.verdict, "ALLOW");
});

test("11 empty customer service evidence fails closed to UNKNOWN", () => {
  const result = evaluateRecipient(customer("EMPTY", []), incident, claim);
  assert.equal(result.verdict, "UNKNOWN");
});

test("12 unsupported scope does not silently become safe", () => {
  const scoped: ParsedClaim = {
    ...claim,
    predicate: "SCOPED_SERVICES_HEALTHY",
    services: ["Never Seen Service"],
  };
  const result = evaluateRecipient(customer("ACME", ["Production Workflows", "EU Auth"]), incident, scoped);
  assert.notEqual(result.verdict, "ALLOW");
});
