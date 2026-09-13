import { demoDraft } from "../demo";
import type { DraftMessage, SendResult } from "../types";

const isDemo = () => process.env.PERTAIN_DEMO_MODE === "1";

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf8");
}

function header(headers: Array<{ name?: string; value?: string }> = [], name: string) {
  return headers.find((item) => item.name?.toLowerCase() === name.toLowerCase())?.value ?? "";
}

function collectText(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) return base64UrlDecode(payload.body.data);
  if (Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      const value = collectText(part);
      if (value) return value;
    }
  }
  if (payload.body?.data) return base64UrlDecode(payload.body.data);
  return "";
}

function parseRecipients(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .map((item) => item.match(/<([^>]+)>/)?.[1] ?? item)
    .filter(Boolean);
}

function config() {
  return {
    baseUrl: (process.env.GMAIL_BASE_URL || "https://gmail.googleapis.com").replace(/\/$/, ""),
    token: process.env.GMAIL_ACCESS_TOKEN || "",
    draftId: process.env.GMAIL_DRAFT_ID || "",
  };
}

async function gmailFetch(path: string, init: RequestInit = {}) {
  const { baseUrl, token } = config();
  if (!token) throw new Error("GMAIL_ACCESS_TOKEN is not configured");
  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
}

export async function loadDraft(): Promise<DraftMessage> {
  if (isDemo()) return demoDraft;

  const cfg = config();
  let draftId = cfg.draftId;
  if (!draftId) {
    const list = await gmailFetch("/gmail/v1/users/me/drafts?maxResults=10");
    if (!list.ok) throw new Error(`Gmail draft list failed: ${list.status}`);
    const data = (await list.json()) as { drafts?: Array<{ id: string }> };
    draftId = data.drafts?.[0]?.id || "";
  }
  if (!draftId) throw new Error("No Gmail draft found");

  const response = await gmailFetch(`/gmail/v1/users/me/drafts/${encodeURIComponent(draftId)}?format=full`);
  if (!response.ok) throw new Error(`Gmail draft read failed: ${response.status}`);
  const draft = (await response.json()) as any;
  const payload = draft.message?.payload;
  const headers = payload?.headers || [];

  return {
    id: draft.id,
    subject: header(headers, "Subject") || "Incident update",
    body: collectText(payload).trim(),
    recipients: parseRecipients(header(headers, "To")),
    source: "gmail",
  };
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function sendMessage(input: {
  email: string;
  subject: string;
  body: string;
}): Promise<SendResult> {
  if (isDemo()) {
    return {
      email: input.email,
      attempted: true,
      verified: true,
      providerMessageId: `demo-sent-${input.email}`,
    };
  }

  try {
    const raw = [`To: ${input.email}`, `Subject: ${input.subject}`, "Content-Type: text/plain; charset=UTF-8", "", input.body].join("\r\n");
    const response = await gmailFetch("/gmail/v1/users/me/messages/send", {
      method: "POST",
      body: JSON.stringify({ raw: base64UrlEncode(raw) }),
    });
    if (!response.ok) {
      return { email: input.email, attempted: true, verified: false, error: `Gmail send failed: ${response.status}` };
    }
    const sent = (await response.json()) as { id?: string };
    if (!sent.id) return { email: input.email, attempted: true, verified: false, error: "Gmail returned no message id" };

    const verify = await gmailFetch(`/gmail/v1/users/me/messages/${encodeURIComponent(sent.id)}?format=minimal`);
    return {
      email: input.email,
      attempted: true,
      verified: verify.ok,
      providerMessageId: sent.id,
      error: verify.ok ? undefined : `Gmail verification failed: ${verify.status}`,
    };
  } catch (error) {
    return {
      email: input.email,
      attempted: true,
      verified: false,
      error: error instanceof Error ? error.message : "Unknown Gmail error",
    };
  }
}
