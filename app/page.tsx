'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import type { EvaluationReceipt, RecipientVerdict, SendReceipt } from "@/lib/types";

const customerOrder = ["ACME", "GLOBEX", "INITECH"];
const workerFallback = [
  { id: "claim", label: "CLAIM", source: "semantic mapper" },
  { id: "customer", label: "CUSTOMER", source: "Salesforce" },
  { id: "incident", label: "INCIDENT", source: "Jira" },
] as const;

function verdictClass(verdict: RecipientVerdict["verdict"]) {
  return `verdict verdict-${verdict.toLowerCase()}`;
}

function decisiveLabel(recipient: RecipientVerdict) {
  if (recipient.verdict === "UNKNOWN" && !recipient.decisiveService) return "DEPENDENCY MAP MISSING";
  if (recipient.decisiveService) {
    const observed = recipient.evidence.find(
      (fact) => fact.kind === "OBSERVED" && fact.label === recipient.decisiveService,
    );
    return observed ? `${recipient.decisiveService} · ${observed.value}` : recipient.decisiveService;
  }
  const observed = recipient.evidence
    .filter((fact) => fact.kind === "OBSERVED")
    .filter((fact) => /HEALTHY|DEGRADED|DOWN|UNKNOWN/i.test(fact.value))
    .map((fact) => `${fact.label} · ${fact.value}`);
  return observed.length ? observed.join(" + ") : "EVIDENCE RECONCILED";
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
      (a, b) => customerOrder.indexOf(a.accountName) - customerOrder.indexOf(b.accountName),
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
        <div className="top-meta" aria-label="External applications">
          <span>Gmail</span><span>Salesforce</span><span>Jira</span>
        </div>
      </header>

      <section className="intro-grid">
        <div className="intro-copy">
          <p className="kicker">ONE STATEMENT → THREE CUSTOMER TRUTHS</p>
          <h2>Know who this update actually applies to before it goes out.</h2>
        </div>
        <div className="mode-card">
          <span className="mode-label">CURRENT RUN</span>
          <strong>{evaluation?.mode === "external" ? "EXTERNAL APP EVIDENCE" : "SEEDED / SAFE REPLAY"}</strong>
          <p>
            {evaluation?.mode === "external"
              ? "Live provider reads are active. External writes still require an explicit server-side release switch."
              : "Repeatable judge mode. Simulated actions stay visibly separate from locked external proof."}
          </p>
        </div>
      </section>

      <section className="truth-boundary-grid" aria-label="Truth boundary">
        <BoundaryCard
          label="Evidence"
          value={evaluation?.truthBoundary.evidence || "PENDING"}
          detail={evaluation?.truthBoundary.evidence === "EXTERNAL" ? "provider reads" : "fixture state"}
        />
        <BoundaryCard
          label="Semantic mapping"
          value={evaluation?.truthBoundary.semanticMapping || "PENDING"}
          detail="bounded mapper · never authorizes"
        />
        <BoundaryCard
          label="Policy"
          value="DETERMINISTIC"
          detail="verdict + recipient set"
        />
      </section>

      <section className="dispatch-card">
        <div className="dispatch-topline">
          <span className="step-index">01 / ONE MESSAGE UNDER TEST</span>
          <button className="secondary-button" onClick={() => void evaluate()} disabled={loading}>
            {loading ? "Evaluating…" : "Re-evaluate"}
          </button>
        </div>
        <div className="message-body">
          <div className="gmail-mark">GMAIL DRAFT · SAME COPY FOR EVERY RECIPIENT</div>
          <blockquote>{evaluation?.draft.body || "Your production workflows are fully restored."}</blockquote>
          <div className="message-meta">
            <span>{evaluation?.draft.subject || "PERTAIN incident recovery update"}</span>
            <span>{evaluation?.draft.recipients.length ?? 3} intended recipients</span>
          </div>
        </div>
      </section>

      <section className="switchboard-section">
        <div className="switchboard-titleline">
          <span className="step-index">02 / AUDIENCE PARTITION</span>
          <strong>ONE STATEMENT → THREE CUSTOMER TRUTHS</strong>
          <span className="allowed-count">
            {evaluation ? `${evaluation.allowedEmails.length} / ${evaluation.recipients.length} ALLOWED` : "RESOLVING"}
          </span>
        </div>

        <div className="branch-origin" aria-hidden="true"><span /></div>
        {error ? <div className="error-banner">FAIL CLOSED — {error}</div> : null}

        <div className="truth-grid">
          {orderedRecipients.length
            ? orderedRecipients.map((recipient) => (
                <CustomerPort key={recipient.email} recipient={recipient} sendReceipt={sendReceipt} />
              ))
            : customerOrder.map((name) => (
                <div key={name} className="customer-port loading-port">
                  <span className="customer-name">{name}</span>
                  <strong className="loading-verdict">CHECKING</strong>
                </div>
              ))}
        </div>
      </section>

      <section className="proof-receipt" aria-label="Locked external proof">
        <span className="receipt-label">LOCKED EXTERNAL PROOF</span>
        <strong>MODEL PATH PROVEN</strong>
        <strong>20 / 20 CONTROLS</strong>
        <strong>STALE EVIDENCE → 0 SENDS</strong>
        <strong>GLOBEX DELIVERY VERIFIED</strong>
        <span className="receipt-note">Evidence package, not a claim about this replay.</span>
      </section>

      <section className="worker-section">
        <div className="section-heading">
          <span className="step-index">03 / EVIDENCE BUS</span>
          <p>Three independent reads converge into policy. Worker failure cannot silently become ALLOW.</p>
        </div>
        <div className="worker-grid">
          {workerFallback.map((fallback) => {
            const worker = evaluation?.workers?.find((item) => item.id === fallback.id);
            const failed = worker?.status === "FAILED_CLOSED";
            return (
              <article key={fallback.id} className={`worker-card ${failed ? "worker-failed" : worker ? "worker-ok" : "worker-pending"}`}>
                <div className="worker-head">
                  <span className="worker-label">{fallback.label}</span>
                  <span className="worker-status">{worker ? (failed ? "FAIL CLOSED" : "VERIFIED") : "RUNNING"}</span>
                </div>
                <strong>{worker?.source || fallback.source}</strong>
                <p>{worker?.summary || "Reading evidence…"}</p>
                <small>{worker ? `${worker.durationMs} ms` : "parallel"}</small>
              </article>
            );
          })}
        </div>
        <div className="adjudicator-strip">
          <span>OBSERVED + MAPPED</span>
          <strong>DETERMINISTIC ADJUDICATOR</strong>
          <span>ALLOW / HOLD / UNKNOWN / REVIEW</span>
        </div>
      </section>

      <section className="dispatch-control">
        <div>
          <span className="step-index">04 / CONTROLLED SIDE EFFECT</span>
          <h3>Only evidence-supported recipients can move.</h3>
          <p>The server re-evaluates before execution. Public external writes are disabled unless the server is explicitly released for them.</p>
          <p className="allowed-set">Allowed set: <strong>{evaluation?.allowedEmails.join(", ") || "—"}</strong></p>
        </div>
        <div className="action-stack">
          <button
            className="primary-button"
            disabled={!evaluation || sending || evaluation.allowedEmails.length === 0}
            onClick={() => void sendAllowed()}
          >
            {sending
              ? "Revalidating…"
              : evaluation?.mode === "external"
                ? "Execute allowed action"
                : "Simulate allowed action"}
          </button>
          <button className="receipt-button" disabled={!evaluation} onClick={downloadReceipt}>Download evidence receipt</button>
        </div>
      </section>

      <section className="failure-anchor">
        <div>
          <span className="step-index">FAILURE EVIDENCE</span>
          <h3>Real failure &gt; fake success.</h3>
        </div>
        <p>
          The proof record preserves both an invalid-recipient bounce and a stale-Jira run that collapsed the allowed set to zero.
          PERTAIN treats provider acceptance, current evidence and recipient delivery as different proof classes.
        </p>
      </section>

      <footer className="proof-footer">
        <div><span className="proof-dot" /><strong>Observed evidence</strong> stays separate from model mapping, deterministic policy, human action and side effects.</div>
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

function CustomerPort({ recipient, sendReceipt }: { recipient: RecipientVerdict; sendReceipt: SendReceipt | null }) {
  const sent = sendReceipt?.allowed.find((item) => item.email === recipient.email);
  const notSent = sendReceipt?.notSent.find((item) => item.email === recipient.email);

  return (
    <article className={`customer-port port-${recipient.verdict.toLowerCase()}`}>
      <div className="port-head">
        <div>
          <span className="customer-name">{recipient.accountName}</span>
          <span className="customer-email">{recipient.email}</span>
        </div>
        <span className="lane-index">CUSTOMER TRUTH</span>
      </div>

      <strong className={verdictClass(recipient.verdict)}>{recipient.verdict}</strong>

      <div className="decisive-fact">
        <span>DECISIVE EVIDENCE</span>
        <strong>{decisiveLabel(recipient)}</strong>
      </div>

      <p className="reason">{recipient.reason}</p>

      <details className="evidence-drawer">
        <summary>Inspect evidence trail</summary>
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
            {sent.proofMode === "SIMULATED_FIXTURE" ? "SIMULATED" : sent.verified ? "VERIFIED SENT" : "FAILED"}
          </strong>
        ) : notSent ? (
          <strong className="side-none">NOT SENT</strong>
        ) : recipient.verdict === "ALLOW" ? (
          <strong className="side-ready">ONLY LANE ELIGIBLE</strong>
        ) : (
          <strong className="side-none">NOT ELIGIBLE</strong>
        )}
      </div>
    </article>
  );
}
