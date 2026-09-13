import { demoCustomers } from "../demo";
import type { CustomerFootprint } from "../types";

const isDemo = () => process.env.PERTAIN_DEMO_MODE === "1";

function config() {
  return {
    baseUrl: (process.env.SALESFORCE_INSTANCE_URL || "").replace(/\/$/, ""),
    token: process.env.SALESFORCE_ACCESS_TOKEN || "",
    apiVersion: process.env.SALESFORCE_API_VERSION || "v61.0",
  };
}

async function sfFetch(path: string) {
  const cfg = config();
  if (!cfg.baseUrl || !cfg.token) throw new Error("Salesforce environment is not configured");
  return fetch(`${cfg.baseUrl}${path}`, {
    headers: { authorization: `Bearer ${cfg.token}` },
    cache: "no-store",
  });
}

function escapeSoql(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function parseDescription(description: string | null | undefined): {
  services: string[] | null;
  regions: string[];
  obligations: string[];
} {
  if (!description) return { services: null, regions: [], obligations: [] };

  try {
    const parsed = JSON.parse(description) as {
      services?: string[] | null;
      regions?: string[];
      obligations?: string[];
    };
    return {
      services: parsed.services ?? null,
      regions: parsed.regions ?? [],
      obligations: parsed.obligations ?? [],
    };
  } catch {
    const parts = Object.fromEntries(
      description
        .split(";")
        .map((segment) => segment.split("="))
        .filter((entry) => entry.length === 2)
        .map(([key, value]) => [key.trim().toLowerCase(), value.trim()]),
    );
    return {
      services: parts.services ? parts.services.split(",").map((value) => value.trim()).filter(Boolean) : null,
      regions: parts.regions ? parts.regions.split(",").map((value) => value.trim()).filter(Boolean) : [],
      obligations: parts.obligations ? parts.obligations.split(",").map((value) => value.trim()).filter(Boolean) : [],
    };
  }
}

export async function loadCustomers(emails: string[]): Promise<CustomerFootprint[]> {
  if (isDemo()) return demoCustomers.filter((customer) => emails.includes(customer.email));
  if (!emails.length) return [];

  const cfg = config();
  const emailList = emails.map((email) => `'${escapeSoql(email)}'`).join(",");
  const contactSoql = `SELECT Id,Email,AccountId FROM Contact WHERE Email IN (${emailList})`;
  const contactResponse = await sfFetch(`/services/data/${cfg.apiVersion}/query/?q=${encodeURIComponent(contactSoql)}`);
  if (!contactResponse.ok) throw new Error(`Salesforce contact query failed: ${contactResponse.status}`);
  const contacts = ((await contactResponse.json()) as any).records || [];

  const accountIds = Array.from(new Set(contacts.map((contact: any) => contact.AccountId).filter(Boolean))) as string[];
  let accounts: any[] = [];
  if (accountIds.length) {
    const accountList = accountIds.map((id) => `'${escapeSoql(id)}'`).join(",");
    const accountSoql = `SELECT Id,Name,Description FROM Account WHERE Id IN (${accountList})`;
    const accountResponse = await sfFetch(`/services/data/${cfg.apiVersion}/query/?q=${encodeURIComponent(accountSoql)}`);
    if (!accountResponse.ok) throw new Error(`Salesforce account query failed: ${accountResponse.status}`);
    accounts = ((await accountResponse.json()) as any).records || [];
  }

  const byId = new Map(accounts.map((account: any) => [account.Id, account]));
  return emails.map((email) => {
    const contact = contacts.find((item: any) => item.Email?.toLowerCase() === email.toLowerCase());
    const account = contact ? byId.get(contact.AccountId) : undefined;
    const details = parseDescription(account?.Description);
    return {
      accountId: account?.Id || `missing:${email}`,
      accountName: account?.Name || email.split("@")[0].toUpperCase(),
      email,
      services: account ? details.services : null,
      regions: account ? details.regions : [],
      obligations: account ? details.obligations : [],
      source: "salesforce" as const,
    };
  });
}
