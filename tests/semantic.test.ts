import assert from "node:assert/strict";
import test from "node:test";
import { parseClaim } from "../lib/semantic";

test("13 fully restored maps to all relevant services healthy", async () => {
  const result = await parseClaim("Your production workflows are fully restored.");
  assert.equal(result.predicate, "ALL_RELEVANT_SERVICES_HEALTHY");
  assert.equal(result.certainty, "explicit");
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
