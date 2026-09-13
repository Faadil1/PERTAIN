import { loadDraft, sendMessage } from "./providers/gmail";
import { loadCustomers } from "./providers/salesforce";
import { loadIncidentTruth } from "./providers/jira";
import { parseClaim } from "./semantic";
import { evaluateRecipient } from "./policy";
import type { EvaluationReceipt, SendReceipt, Verdict } from "./types";

function makeRunId() {
  return `pertain-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function evaluateMessage(): Promise<EvaluationReceipt> {
  const draft = await loadDraft();
  const [claim, customers, incident] = await Promise.all([
    parseClaim(draft.body),
    loadCustomers(draft.recipients),
    loadIncidentTruth(),
  ]);

  const recipients = customers.map((customer) => evaluateRecipient(customer, incident, claim));
  const byVerdict = (verdict: Verdict) => recipients.filter((item) => item.verdict === verdict).map((item) => item.email);

  return {
    runId: makeRunId(),
    mode: process.env.PERTAIN_DEMO_MODE === "1" ? "seeded-demo" : "external",
    createdAt: new Date().toISOString(),
    draft,
    claim,
    incident,
    recipients,
    allowedEmails: byVerdict("ALLOW"),
    blockedEmails: byVerdict("HOLD"),
    unknownEmails: byVerdict("UNKNOWN"),
    reviewEmails: byVerdict("REVIEW"),
  };
}

export async function executeAllowedSend(receipt: EvaluationReceipt): Promise<SendReceipt> {
  const allowedSet = new Set(receipt.allowedEmails.map((email) => email.toLowerCase()));
  const uniqueAllowed = Array.from(new Set(receipt.draft.recipients.filter((email) => allowedSet.has(email.toLowerCase()))));
  const notSent = receipt.recipients
    .filter((recipient) => recipient.verdict !== "ALLOW")
    .map((recipient) => ({ email: recipient.email, reason: recipient.verdict }));

  const allowed = [];
  for (const email of uniqueAllowed) {
    allowed.push(
      await sendMessage({
        email,
        subject: receipt.draft.subject,
        body: receipt.draft.body,
      }),
    );
  }

  return {
    runId: receipt.runId,
    attemptedAt: new Date().toISOString(),
    allowed,
    notSent,
  };
}
