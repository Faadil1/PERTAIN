import type {
  CustomerFootprint,
  IncidentTruth,
  ParsedClaim,
  RecipientVerdict,
} from "./types";

const normalize = (value: string) => value.trim().toLowerCase().replace(/[_-]+/g, " ");

export interface PolicyOptions {
  now?: Date;
  maxEvidenceAgeMinutes?: number;
}

function isStale(updatedAt: string | undefined, now: Date, maxAgeMinutes: number) {
  if (!updatedAt) return false;
  const timestamp = Date.parse(updatedAt);
  if (!Number.isFinite(timestamp)) return true;
  return now.getTime() - timestamp > maxAgeMinutes * 60_000;
}

export function evaluateRecipient(
  customer: CustomerFootprint,
  incident: IncidentTruth,
  claim: ParsedClaim,
  options: PolicyOptions = {},
): RecipientVerdict {
  const now = options.now ?? new Date();
  const maxEvidenceAgeMinutes = options.maxEvidenceAgeMinutes ?? 30;

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
      obligations: customer.obligations,
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
      obligations: customer.obligations,
      evidence,
    };
  }

  evidence.push({
    kind: "OBSERVED",
    source: customer.source,
    label: "Customer services",
    value: customer.services.join(", "),
  });

  if (customer.obligations?.length) {
    evidence.push({
      kind: "OBSERVED",
      source: customer.source,
      label: "Customer obligations",
      value: customer.obligations.join(" · "),
    });
  }

  const scopedServices = claim.services.length
    ? customer.services.filter((service) =>
        claim.services.some((scope) => normalize(scope) === normalize(service)),
      )
    : customer.services;

  if (claim.services.length > 0 && scopedServices.length === 0) {
    evidence.push({
      kind: "POLICY",
      source: "deterministic evaluator",
      label: "Scope mapping",
      value: "Claim scope does not map to this customer's known footprint.",
    });
    return {
      accountName: customer.accountName,
      email: customer.email,
      verdict: "REVIEW",
      reason: "The claim names a service scope that cannot be mapped to this customer's known dependency footprint.",
      obligations: customer.obligations,
      evidence,
    };
  }

  const servicesToCheck = scopedServices;

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
        obligations: customer.obligations,
        evidence,
      };
    }

    if (isStale(state.updatedAt, now, maxEvidenceAgeMinutes)) {
      evidence.push({
        kind: "OBSERVED",
        source: incident.source,
        label: service,
        value: `STALE${state.updatedAt ? ` · ${state.updatedAt}` : ""}`,
      });
      return {
        accountName: customer.accountName,
        email: customer.email,
        verdict: "UNKNOWN",
        reason: `Incident evidence for ${service} is too stale to establish a safe customer-facing claim.`,
        decisiveService: service,
        obligations: customer.obligations,
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
        obligations: customer.obligations,
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
    obligations: customer.obligations,
    evidence: [
      ...evidence,
      {
        kind: "POLICY",
        source: "deterministic evaluator",
        label: "Rule",
        value: "All relevant dependencies are present, fresh enough, and healthy.",
      },
    ],
  };
}
