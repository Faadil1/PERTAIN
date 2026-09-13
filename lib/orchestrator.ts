import { loadDraft, sendMessage } from "./providers/gmail";
import { loadCustomers } from "./providers/salesforce";
import { loadIncidentTruth } from "./providers/jira";
import { parseClaim } from "./semantic";
import { evaluateRecipient } from "./policy";
import type {
  CustomerFootprint,
  EvaluationReceipt,
  EvidenceWorkerId,
  EvidenceWorkerTrace,
  IncidentTruth,
  ParsedClaim,
  SendReceipt,
  Verdict,
} from "./types";

function makeRunId() {
  return `pertain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function runEvidenceWorker<T>({
  id,
  label,
  source,
  work,
  summarize,
  failureSummary,
}: {
  id: EvidenceWorkerId;
  label: string;
  source: string;
  work: () => Promise<T>;
  summarize: (value: T) => string;
  failureSummary: string;
}): Promise<{ value?: T; trace: EvidenceWorkerTrace }> {
  const startedAt = new Date().toISOString();
  const started = Date.now();

  try {
    const value = await work();
    return {
      value,
      trace: {
        id,
        label,
        source,
        status: "OK",
        startedAt,
        durationMs: Date.now() - started,
        summary: summarize(value),
      },
    };
  } catch {
    return {
      trace: {
        id,
        label,
        source,
        status: "FAILED_CLOSED",
        startedAt,
        durationMs: Date.now() - started,
        summary: failureSummary,
      },
    };
  }
}

function unavailableCustomers(recipients: string[]): CustomerFootprint[] {
  return recipients.map((email) => ({
    accountId: `unresolved-${email}`,
    accountName: email.split("@")[0]?.toUpperCase() || "UNRESOLVED",
    email,
    services: null,
    regions: [],
    source: "unavailable",
  }));
}

const ambiguousClaimFallback: ParsedClaim = {
  predicate: "ALL_RELEVANT_SERVICES_HEALTHY",
  services: [],
  regions: ["ALL"],
  certainty: "ambiguous",
  source: "deterministic_fallback",
};

const unavailableIncident: IncidentTruth = {
  incidentId: "unavailable",
  services: [],
  source: "unavailable",
};

function configuredMaxEvidenceAgeMinutes() {
  const raw = Number(process.env.PERTAIN_EVIDENCE_MAX_AGE_MINUTES ?? "30");
  return Number.isFinite(raw) && raw > 0 ? raw : 30;
}

export async function evaluateMessage(): Promise<EvaluationReceipt> {
  const draft = await loadDraft();

  const [claimWorker, customerWorker, incidentWorker] = await Promise.all([
    runEvidenceWorker({
      id: "claim",
      label: "CLAIM",
      source: "semantic mapper",
      work: () => parseClaim(draft.body),
      summarize: (claim) => `${claim.predicate} · ${claim.certainty}`,
      failureSummary: "Semantic mapping failed; customer verdicts fail closed to REVIEW.",
    }),
    runEvidenceWorker({
      id: "customer",
      label: "CUSTOMER",
      source: "Salesforce",
      work: () => loadCustomers(draft.recipients),
      summarize: (customers) => `${customers.length} recipient footprints resolved`,
      failureSummary: "Customer truth unavailable; affected recipients fail closed to UNKNOWN.",
    }),
    runEvidenceWorker({
      id: "incident",
      label: "INCIDENT",
      source: "Jira",
      work: () => loadIncidentTruth(),
      summarize: (incident) => `${incident.services.length} service states · ${incident.incidentId}`,
      failureSummary: "Incident truth unavailable; affected recipients fail closed to UNKNOWN.",
    }),
  ]);

  const claim = claimWorker.value ?? ambiguousClaimFallback;
  const customers = customerWorker.value ?? unavailableCustomers(draft.recipients);
  const incident = incidentWorker.value ?? unavailableIncident;
  const workers = [claimWorker.trace, customerWorker.trace, incidentWorker.trace];

  const recipients = customers.map((customer) =>
    evaluateRecipient(customer, incident, claim, {
      maxEvidenceAgeMinutes: configuredMaxEvidenceAgeMinutes(),
    }),
  );
  const byVerdict = (verdict: Verdict) =>
    recipients.filter((item) => item.verdict === verdict).map((item) => item.email);

  const mode = process.env.PERTAIN_DEMO_MODE === "1" ? "seeded-demo" : "external";

  return {
    runId: makeRunId(),
    mode,
    createdAt: new Date().toISOString(),
    draft,
    claim,
    incident,
    workers,
    recipients,
    allowedEmails: byVerdict("ALLOW"),
    blockedEmails: byVerdict("HOLD"),
    unknownEmails: byVerdict("UNKNOWN"),
    reviewEmails: byVerdict("REVIEW"),
    truthBoundary: {
      evidence: mode === "external" ? "EXTERNAL" : "FIXTURE",
      semanticMapping: claim.source === "model" ? "MODEL" : "DETERMINISTIC_FALLBACK",
      sideEffects: mode === "external" ? "EXTERNAL" : "SIMULATED_FIXTURE",
    },
  };
}

export function buildSendPlan(receipt: EvaluationReceipt) {
  const allowedSet = new Set(receipt.allowedEmails.map((email) => email.toLowerCase()));
  const allowedRecipients = Array.from(
    new Set(
      receipt.draft.recipients
        .filter((email) => allowedSet.has(email.toLowerCase()))
        .map((email) => email.toLowerCase()),
    ),
  );

  const notSent = receipt.recipients
    .filter((recipient) => recipient.verdict !== "ALLOW")
    .map((recipient) => ({ email: recipient.email, reason: recipient.verdict }));

  return { allowedRecipients, notSent };
}

export async function executeAllowedSend(receipt: EvaluationReceipt): Promise<SendReceipt> {
  const { allowedRecipients, notSent } = buildSendPlan(receipt);
  const allowed = [];

  for (const email of allowedRecipients) {
    allowed.push(
      await sendMessage({
        email,
        subject: receipt.draft.subject,
        body: receipt.draft.body,
      }),
    );
  }

  return {
    runId: makeRunId(),
    policyRunId: receipt.runId,
    attemptedAt: new Date().toISOString(),
    proofMode: receipt.truthBoundary.sideEffects,
    allowed,
    notSent,
  };
}
