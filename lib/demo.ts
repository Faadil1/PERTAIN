import type { CustomerFootprint, DraftMessage, IncidentTruth } from "./types";

const now = () => new Date().toISOString();

export const demoDraft: DraftMessage = {
  id: "draft-hero-001",
  subject: "Incident update — production workflows",
  body: "Your production workflows are fully restored.",
  recipients: ["ops@acme.example", "ops@globex.example", "ops@initech.example"],
  source: "demo",
};

export const demoCustomers: CustomerFootprint[] = [
  {
    accountId: "acct-acme",
    accountName: "ACME",
    email: "ops@acme.example",
    services: ["Production Workflows", "EU Auth"],
    regions: ["EU"],
    obligations: ["Enterprise", "99.99% SLA", "EU production critical"],
    source: "demo",
  },
  {
    accountId: "acct-globex",
    accountName: "GLOBEX",
    email: "ops@globex.example",
    services: ["Production Workflows", "US Auth"],
    regions: ["US"],
    obligations: ["Enterprise", "99.9% SLA", "US production"],
    source: "demo",
  },
  {
    accountId: "acct-initech",
    accountName: "INITECH",
    email: "ops@initech.example",
    services: null,
    regions: ["US"],
    obligations: ["Enterprise", "dependency map incomplete"],
    source: "demo",
  },
];

export function demoIncident(): IncidentTruth {
  const updatedAt = now();
  return {
    incidentId: "INC-1042",
    source: "demo",
    services: [
      { service: "Production Workflows", health: "HEALTHY", issueKey: "INC-1042", updatedAt },
      { service: "EU Auth", health: "DEGRADED", issueKey: "INC-1043", updatedAt },
      { service: "US Auth", health: "HEALTHY", issueKey: "INC-1044", updatedAt },
    ],
  };
}
