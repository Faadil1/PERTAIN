'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EvaluationReceipt, RecipientVerdict, SendReceipt } from "@/lib/types";

const statusOrder = ["HOLD", "ALLOW", "UNKNOWN", "REVIEW"] as const;

function verdictClass(verdict: RecipientVerdict["verdict"]) {
  return `verdict verdict-${verdict.toLowerCase()}`;
}

export default function HomePage() {
  const [evaluation, setEvaluation] = useState<EvaluationReceipt | null>(null);
  const [sendReceipt, setSendReceipt] = useState<SendReceipt | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluate = useCallback(async () => {
    setLoading(true);
    setSendReceipt(null);
    setError(null);
    try {
      const response = await fetch("/api/evaluate", { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || "Evaluation failed");
      setEvaluation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void evaluate();
  }, [evaluate]);

  const sendAllowed = useCallback(async () => {
    if (!evaluation) return;
    setSending(true);
    setError(null);
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(evaluation),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || "Send failed");
      setSendReceipt(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed");
    } finally {
      setSending(false);
    }
  }, [evaluation]);

  const orderedRecipients = useMemo(() => {
    if (!evaluation) return [];
    return [...evaluation.recipients].sort(
      (a, b) => statusOrder.indexOf(a.verdict) - statusOrder.indexOf(b.verdict),
    );
  }, [evaluation]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">PER-CUSTOMER INCIDENT TRUTH GATE</div>
          <div className="brand-row">
            <h1>PERTAIN</h1>
            <span className="build-tag">HACKATHON BUILD</span>
          </div>
        </div>
        <div className="top-meta">
          <span>Gmail</span>
          <span>Salesforce</span>
          <span>Jira</span>
        </div>
      </header>

      <section className="intro-grid">
        <div className="intro-copy">
          <p className="kicker">One incident. Different customer realities.</p>
          <h2>Know who this update actually applies to before it goes out.</h2>
        </div>
        <div className="mode-card">
          <span className="mode-label">RUN MODE</span>
          <strong>{evaluation?.mode === "external" ? "EXTERNAL APP PROOF" : "SEEDED EVALUATION"}</strong>
          <p>
            {evaluation?.mode === "external"
              ? "Live provider reads are active."
              : "Clearly labeled fixture mode. External proof is required before submission lock."}
          </p>
        </div>
      </section>

      <section className="dispatch-card">
        <div className="dispatch-topline">
          <span className="step-index">01 / MESSAGE UNDER TEST</span>
          <button className="secondary-button" onClick={() => void evaluate()} disabled={loading}>
            {loading ? "Evaluating…" : "Re-evaluate"}
          </button>
        </div>
        <div className="message-body">
          <div className="gmail-mark">GMAIL DRAFT</div>
          <blockquote>
            {evaluation?.draft.body || "Your production workflows are fully restored."}
          </blockquote>
          <div className="message-meta">
            <span>{evaluation?.draft.subject || "Incident update — production workflows"}</span>
            <span>{evaluation?.draft.recipients.length ?? 3} intended recipients</span>
          </div>
        </div>
      </section>

      <section className="switchboard-section">
        <div className="section-heading">
          <span className="step-index">02 / CUSTOMER TRUTH ENVELOPES</span>
          <p>Same statement. Evaluated separately against each customer&apos;s actual dependencies.</p>
        </div>

        <div className="branch-origin" aria-hidden="true">
          <span />
        </div>

        {error ? <div className="error-banner">FAIL CLOSED — {error}</div> : null}

        <div className="truth-grid">
          {orderedRecipients.length
            ? orderedRecipients.map((recipient) => (
                <CustomerPort
                  key={recipient.email}
                  recipient={recipient}
                  sendReceipt={sendReceipt}
                />
              ))
            : ["ACME", "GLOBEX", "INITECH"].map((name) => (
                <div key={name} className="customer-port loading-port">
                  <div className="port-head">
                    <span>{name}</span>
                    <span className="skeleton-pill">CHECKING</span>
                  </div>
                </div>
              ))}
        </div>
      </section>

      <section className="dispatch-control">
        <div>
          <span className="step-index">03 / CONTROLLED SIDE EFFECT</span>
          <h3>
            Send only to the audience the evidence supports.
          </h3>
          <p>
            Allowed set: <strong>{evaluation?.allowedEmails.join(", ") || "—"}</strong>
          </p>
        </div>
        <button
          className="primary-button"
          disabled={!evaluation || sending || evaluation.allowedEmails.length === 0}
          onClick={() => void sendAllowed()}
        >
          {sending ? "Verifying send…" : "Send to allowed audience"}
        </button>
      </section>

      <footer className="proof-footer">
        <div>
          <span className="proof-dot" />
          <strong>Observed evidence</strong> stays separate from model mapping, policy, human action and side effects.
        </div>
        <div className="run-id">{evaluation?.runId || "run pending"}</div>
      </footer>
    </main>
  );
}

function CustomerPort({
  recipient,
  sendReceipt,
}: {
  recipient: RecipientVerdict;
  sendReceipt: SendReceipt | null;
}) {
  const sent = sendReceipt?.allowed.find((item) => item.email === recipient.email);
  const notSent = sendReceipt?.notSent.find((item) => item.email === recipient.email);

  return (
    <article className={`customer-port port-${recipient.verdict.toLowerCase()}`}>
      <div className="port-head">
        <div>
          <span className="customer-name">{recipient.accountName}</span>
          <span className="customer-email">{recipient.email}</span>
        </div>
        <span className={verdictClass(recipient.verdict)}>{recipient.verdict}</span>
      </div>

      <p className="reason">{recipient.reason}</p>

      {recipient.decisiveService ? (
        <div className="decisive-fact">
          <span>DECISIVE FACT</span>
          <strong>{recipient.decisiveService}</strong>
        </div>
      ) : null}

      <details className="evidence-drawer">
        <summary>Inspect evidence</summary>
        <div className="evidence-list">
          {recipient.evidence.map((fact, index) => (
            <div className="evidence-row" key={`${fact.kind}-${index}`}>
              <span className={`fact-kind fact-${fact.kind.toLowerCase()}`}>{fact.kind}</span>
              <div>
                <strong>{fact.label}</strong>
                <span>{fact.value}</span>
                <small>{fact.source}</small>
              </div>
            </div>
          ))}
        </div>
      </details>

      <div className="side-effect-row">
        <span>SIDE EFFECT</span>
        {sent ? (
          <strong className={sent.verified ? "side-verified" : "side-failed"}>
            {sent.verified ? "VERIFIED SENT" : "FAILED"}
          </strong>
        ) : notSent ? (
          <strong className="side-none">NOT SENT</strong>
        ) : (
          <strong className="side-pending">PENDING HUMAN ACTION</strong>
        )}
      </div>
    </article>
  );
}
