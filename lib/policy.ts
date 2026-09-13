import type {
  CustomerFootprint,
  IncidentTruth,
  ParsedClaim,
  RecipientVerdict,
} from "./types";

const normalize = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, " ");

export function evaluateRecipient(
  customer: CustomerFootprint,
  incident: IncidentTruth,
  claim: ParsedClaim,
): RecipientVerdict {
  const evidence: RecipientVerdict["evidence"] = [
    {
      kind: "MAPPED",
      source: claim.source,
      label: "Claim predicate",
      value: claim.predicate,
    },
  ];

  if (claim.certainty === "ambiguous") {
    return {
      accountName: customer.accountName,
      email: customer.email,
      verdict: "REVIEW",
      reason: "The outgoing statement could not be mapped to a bounded predicate with enough certainty.",
      evidence,
    };
  }

  if (!customer.services || customer.services.length === 0) {
    evidence.push({
      kind: "OBSERVED",
      source: customer.source,
      label: "Customer dependency map",
      value: "MISSING",
    });
    return {
      accountName: customer.accountName,
      email: customer.email,
      verdict: "UNKNOWN",
      reason: "Required customer dependency evidence is missing, so safety cannot be established.",
      evidence,
    };
  }

  evidence.push({
    kind: "OBSERVED",
    source: customer.source,
    label: "Customer services",
    value: customer.services.join(", "),
  });

  const scopedServices = claim.services.length
    ? customer.services.filter((service) => claim.services.some((scope) => normalize(scope) === normalize(service)))
    : customer.services;

  const servicesToCheck = scopedServices.length ? scopedServices : customer.services;

  for (const service of servicesToCheck) {
    const state = incident.services.find((candidate) => normalize(candidate.service) === normalize(service));
    if (!state || state.health === "UNKNOWN") {
      evidence.push({
        kind: "OBSERVED",
        source: incident.source,
        label: service,
        value: "MISSING / UNKNOWN",
      });
      return {
        accountName: customer.accountName,
        email: customer.email,
        verdict: "UNKNOWN",
        reason: `No authoritative current incident state is available for ${service}.`,
        decisiveService: service,
        evidence,
      };
    }

    evidence.push({
      kind: "OBSERVED",
      source: incident.source,
      label: service,
      value: state.health,
    });

    if (state.health !== "HEALTHY") {
      return {
        accountName: customer.accountName,
        email: customer.email,
        verdict: "HOLD",
        reason: `${service} is ${state.health.toLowerCase()}, which contradicts the outgoing recovery statement for this customer.`,
        decisiveService: service,
        evidence: [
          ...evidence,
          {
            kind: "POLICY",
            source: "deterministic evaluator",
            label: "Rule",
            value: "Any relevant non-healthy dependency blocks a full-restoration claim.",
          },
        ],
      };
    }
  }

  return {
    accountName: customer.accountName,
    email: customer.email,
    verdict: "ALLOW",
    reason: "All required customer-specific dependencies in scope are supported by current incident evidence.",
    evidence: [
      ...evidence,
      {
        kind: "POLICY",
        source: "deterministic evaluator",
        label: "Rule",
        value: "All relevant dependencies are present and healthy.",
      },
    ],
  };
}
