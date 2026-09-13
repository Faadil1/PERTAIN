export type Verdict = "ALLOW" | "HOLD" | "UNKNOWN" | "REVIEW";
export type ServiceHealth = "HEALTHY" | "DEGRADED" | "DOWN" | "UNKNOWN";

export type ClaimPredicate =
  | "ALL_RELEVANT_SERVICES_HEALTHY"
  | "NO_RELEVANT_CUSTOMER_IMPACT"
  | "SCOPED_SERVICES_HEALTHY";

export interface ParsedClaim {
  predicate: ClaimPredicate;
  services: string[];
  regions: string[];
  certainty: "explicit" | "ambiguous";
  source: "model" | "deterministic_fallback";
}

export interface DraftMessage {
  id: string;
  subject: string;
  body: string;
  recipients: string[];
  source: "gmail" | "demo";
}

export interface CustomerFootprint {
  accountId: string;
  accountName: string;
  email: string;
  services: string[] | null;
  regions: string[];
  obligations?: string[];
  source: "salesforce" | "demo";
}

export interface IncidentServiceState {
  service: string;
  health: ServiceHealth;
  issueKey?: string;
  updatedAt?: string;
}

export interface IncidentTruth {
  incidentId: string;
  services: IncidentServiceState[];
  source: "jira" | "demo";
}

export interface EvidenceFact {
  kind: "OBSERVED" | "MAPPED" | "POLICY" | "HUMAN" | "SIDE_EFFECT";
  source: string;
  label: string;
  value: string;
}

export interface RecipientVerdict {
  accountName: string;
  email: string;
  verdict: Verdict;
  reason: string;
  decisiveService?: string;
  evidence: EvidenceFact[];
}

export interface EvaluationReceipt {
  runId: string;
  mode: "seeded-demo" | "external";
  createdAt: string;
  draft: DraftMessage;
  claim: ParsedClaim;
  incident: IncidentTruth;
  recipients: RecipientVerdict[];
  allowedEmails: string[];
  blockedEmails: string[];
  unknownEmails: string[];
  reviewEmails: string[];
}

export interface SendResult {
  email: string;
  attempted: boolean;
  verified: boolean;
  providerMessageId?: string;
  error?: string;
}

export interface SendReceipt {
  runId: string;
  attemptedAt: string;
  allowed: SendResult[];
  notSent: Array<{ email: string; reason: Verdict }>;
}
