import { demoIncident } from "../demo";
import type { IncidentServiceState, IncidentTruth, ServiceHealth } from "../types";

const isDemo = () => process.env.PERTAIN_DEMO_MODE === "1";

function config() {
  return {
    baseUrl: (process.env.JIRA_BASE_URL || "").replace(/\/$/, ""),
    token: process.env.JIRA_API_TOKEN || "",
    jql: process.env.JIRA_JQL || "labels = pertain",
  };
}

async function jiraFetch(path: string) {
  const cfg = config();
  if (!cfg.baseUrl || !cfg.token) throw new Error("Jira environment is not configured");
  return fetch(`${cfg.baseUrl}${path}`, {
    headers: {
      authorization: `Bearer ${cfg.token}`,
      accept: "application/json",
    },
    cache: "no-store",
  });
}

function normalizeHealth(value: string): ServiceHealth {
  const normalized = value.toUpperCase();
  if (normalized.includes("HEALTHY") || normalized.includes("RESOLVED") || normalized.includes("RECOVERED")) return "HEALTHY";
  if (normalized.includes("DEGRADED") || normalized.includes("IN PROGRESS") || normalized.includes("PARTIAL")) return "DEGRADED";
  if (normalized.includes("DOWN") || normalized.includes("OUTAGE") || normalized.includes("FAILED")) return "DOWN";
  return "UNKNOWN";
}

function parseIssue(issue: any): IncidentServiceState | null {
  const labels: string[] = issue.fields?.labels || [];
  const serviceLabel = labels.find((label) => label.toLowerCase().startsWith("service:"));
  const healthLabel = labels.find((label) => label.toLowerCase().startsWith("health:"));

  const service = serviceLabel
    ? serviceLabel.split(":").slice(1).join(":").replace(/_/g, " ")
    : issue.fields?.summary?.replace(/^\[[^\]]+\]\s*/, "") || null;

  if (!service) return null;

  const health = healthLabel
    ? normalizeHealth(healthLabel.split(":").slice(1).join(":"))
    : normalizeHealth(issue.fields?.status?.name || "");

  return {
    service,
    health,
    issueKey: issue.key,
    updatedAt: issue.fields?.updated,
  };
}

export async function loadIncidentTruth(): Promise<IncidentTruth> {
  if (isDemo()) return demoIncident();

  const cfg = config();
  const response = await jiraFetch(`/rest/api/3/search?jql=${encodeURIComponent(cfg.jql)}&maxResults=100`);
  if (!response.ok) throw new Error(`Jira search failed: ${response.status}`);
  const data = (await response.json()) as any;
  const services = (data.issues || []).map(parseIssue).filter(Boolean) as IncidentServiceState[];

  return {
    incidentId: data.issues?.[0]?.key || "jira-incident-set",
    services,
    source: "jira",
  };
}
