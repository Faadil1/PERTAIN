import assert from "node:assert/strict";
import test from "node:test";
import { canonicalizeMappedClaim, parseClaim } from "../lib/semantic";

test("13 fully restored maps to all relevant services healthy", async () => {
  const result = await parseClaim("Your production workflows are fully restored.");
  assert.equal(result.predicate, "ALL_RELEVANT_SERVICES_HEALTHY");
  assert.equal(result.certainty, "explicit");

  // Regression from the live model proof: a model may try to narrow generic
  // words such as "production workflows" into an invented service scope.
  // The bounded product contract must canonicalize that explicit recovery
  // statement without changing the fact that the source was the model.
  const stabilized = canonicalizeMappedClaim("Your production workflows are fully restored.", {
    predicate: "SCOPED_SERVICES_HEALTHY",
    services: ["production workflows"],
    regions: [],
    certainty: "explicit",
    source: "model",
  });
  assert.equal(stabilized.predicate, "ALL_RELEVANT_SERVICES_HEALTHY");
  assert.deepEqual(stabilized.services, []);
  assert.deepEqual(stabilized.regions, ["ALL"]);
  assert.equal(stabilized.source, "model");
});

test("14 no customer impact maps to bounded no-impact predicate", async () => {
  const result = await parseClaim("No customer impact remains.");
  assert.equal(result.predicate, "NO_RELEVANT_CUSTOMER_IMPACT");
  assert.equal(result.certainty, "explicit");
});

test("15 vague unsupported wording fails closed as ambiguous", async () => {
  const result = await parseClaim("Things look much better now.");
  assert.equal(result.certainty, "ambiguous");
});
