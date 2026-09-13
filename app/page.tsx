'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EvaluationReceipt, RecipientVerdict, SendReceipt } from "@/lib/types";

const statusOrder = ["HOLD", "ALLOW", "UNKNOWN", "REVIEW"] as const;
const workerFallback = [
  { id: "claim", label: "CLAIM", source: "semantic mapper" },
  { id: "customer", label: "CUSTOMER", source: "Salesforce" },
  { id: "incident", label: "INCIDENT", source: "Jira" },
] as const;

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
      const response = await fetch("/api/send", { method: "POST" });
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

  const downloadReceipt = useCallback(() => {
    if (!evaluation) return;
    const payload = {
      product: "PERTAIN",
      exportedAt: new Date().toISOString(),
      evaluation,
      sendReceipt,
      truthBoundaryNote:
        evaluation.mode === "external"
          ? "External provider evidence. Side-effect result is only external when proofMode=EXTERNAL."
          : "Seeded fixture evaluation. Simulated side effects are not external proof.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `pertain-receipt-${evaluation.runId}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  }, [evaluation, sendReceipt]);

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <div className="eyebrow">PER-CUSTOMER INCIDENT TRUTH GATE</div>
          <div className="brand-row">
            <h1>PERTAIN</h1>
            <span className="build-tag">DAY-OF-EVENT BUILD</span>
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
              : "Fixture mode is explicitly labeled. It is useful for repeatable evaluation, not final external proof."}
          </p>
        </div>
      </section>

      <section className="stakes-strip">
        <span>WHY IT MATTERS</span>
        <strong>SLA exposure</strong>
        <strong>support escalation</strong>
        <strong>customer trust</strong>
        <strong>churn risk</strong>
        <strong>operational rework</strong>
      </section>

      <section className="truth-boundary-grid">
        <BoundaryCard
          label="Evidence"
          value={evaluation?.truthBoundary.evidence || "PENDING"}
          detail={evaluation?.truthBoundary.evidence === "EXTERNAL" ? "provider reads" : "fixture state"}
        />
        <BoundaryCard
          label="Semantic mapping"
          value={evaluation?.truthBoundary.semanticMapping || "PENDING"}
          detail="never owns final verdict"
        />
        <BoundaryCard
          label="Side effect"
          value={evaluation?.truthBoundary.sideEffects || "PENDING"}
          detail="only ALLOW enters send plan"
        />
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

      <section className="worker-section">
        <div className="section-heading">
          <span className="step-index">02 / CONCURRENT EVIDENCE WORKERS</span>
          <p>Independent evidence jobs run in parallel, fail separately, then converge into deterministic policy.</p>
        </div>

        <div className="worker-grid">
          {workerFallback.map((fallback) => {
            const worker = evaluation?.workers?.find((item) => item.id === fallback.id);
            const failed = worker?.status === "FAILED_CLOSED";
            return (
              <article
                key={fallback.id}
                className={`worker-card ${failed ? "worker-failed" : worker ? "worker-ok" : "worker-pending"}`}
              >
                <div className="worker-head">
                  <span className="worker-label">{fallback.label}</span>
                  <span className="worker-status">
                    {worker ? (failed ? "FAIL CLOSED" : "VERIFIED") : "RUNNING"}
                  </span>
                </div>
                <strong>{worker?.source || fallback.source}</strong>
                <p>{worker?.summary || "Reading evidence…"}</p>
                <small>{worker ? `${worker.durationMs} ms` : "parallel"}</small>
              </article>
            );
          })}
        </div>

        <div className="adjudicator-strip">
          <span>PARALLEL EVIDENCE READS</span>
          <strong>→ DETERMINISTIC ADJUDICATOR →</strong>
          <span>CUSTOMER-SPECIFIC TRUTH</span>
        </div>
      </section>

      <section className="switchboard-section">
        <div className="section-heading">
          <span className="step-index">03 / CUSTOMER TRUTH ENVELOPES</span>
          <p>Same statement. Evaluated separately against each customer&apos;s real dependency envelope.</p>
        </div>

        <div className="branch-origin" aria-hidden="true">
          <span />
        </div>

        {error ? <div className="error-banner">FAIL CLOSED — {error}</div> : null}

        <div className="truth-grid">
          {orderedRecipients.length
            ? orderedRecipients.map((recipient) => (
                <CustomerPort key={recipient.email} recipient={recipient} sendReceipt={sendReceipt} />
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
          <span className="step-index">04 / CONTROLLED SIDE EFFECT</span>
          <h3>Send only to the audience the evidence supports.</h3>
          <p>
            Browser state cannot authorize a send. The server re-evaluates policy before execution.
          </p>
          <p className="allowed-set">
            Allowed set: <strong>{evaluation?.allowedEmails.join(", ") || "—"}</strong>
          </p>
        </div>
        <div className="action-stack">
          <button
            className="primary-button"
            disabled={!evaluation || sending || evaluation.allowedEmails.length === 0}
            onClick={() => void sendAllowed()}
          >
            {sending ? "Revalidating + sending…" : "Send to allowed audience"}
          </button>
          <button className="receipt-button" disabled={!evaluation} onClick={downloadReceipt}>
            Download evidence receipt
          </button>
        </div>
      </section>

      <section className="assurance-grid">
        <AssuranceCard
          metric="20"
          label="bounded controls"
          detail="positive, negative, stale, ambiguity, state-change and send-policy cases"
        />
        <AssuranceCard
          metric="FAIL CLOSED"
          label="missing evidence"
          detail="UNKNOWN or REVIEW — never manufactured ALLOW"
        />
        <AssuranceCard
          metric="0"
          label="forbidden recipients planned"
          detail="HOLD / UNKNOWN / REVIEW never enter the send plan"
        />
      </section>

      <section className="failure-anchor">
        <div>
          <span className="step-index">REAL FAILURE ANCHOR</span>
          <h3>Real failure &gt; fake success.</h3>
        </div>
        <p>
          PERTAIN is grounded by a public first-person SaaS incident account reporting a 14-hour outage
          discovered through a customer tweet, with reported enterprise synchronization loss, a missed
          compliance deadline and subsequent churn. It is an <strong>unaudited anecdote</strong>, not
          market-size proof.
        </p>
        <a
          href="https://www.reddit.com/r/SaaS/comments/1s6p2xc/server_went_down_for_14_hours_on_a_tuesday_we/"
          target="_blank"
          rel="noreferrer"
        >
          Inspect source ↗
        </a>
      </section>

      <footer className="proof-footer">
        <div>
          <span className="proof-dot" />
          <strong>Observed evidence</strong> stays separate from model mapping, deterministic policy,
          human action and side effects.
        </div>
        <div className="run-id">{evaluation?.runId || "run pending"}</div>
      </footer>
    </main>
  );
}

function BoundaryCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="boundary-card">
      <span>{label}</span>
      <strong>{value.replaceAll("_", " ")}</strong>
      <small>{detail}</small>
    </article>
  );
}

function AssuranceCard({ metric, label, detail }: { metric: string; label: string; detail: string }) {
  return (
    <article className="assurance-card">
      <strong>{metric}</strong>
      <span>{label}</span>
      <p>{detail}</p>
    </article>
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

      {recipient.obligations?.length ? (
        <div className="obligation-row">
          {recipient.obligations.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      ) : null}

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
            {sent.proofMode === "SIMULATED_FIXTURE"
              ? "SIMULATED SEND"
              : sent.verified
                ? "VERIFIED SENT"
                : "FAILED"}
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
