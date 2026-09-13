import type { ParsedClaim } from "./types";

function deterministicFallback(message: string): ParsedClaim {
  const text = message.toLowerCase();

  if (text.includes("fully restored") || text.includes("all services") || text.includes("all workflows")) {
    return {
      predicate: "ALL_RELEVANT_SERVICES_HEALTHY",
      services: [],
      regions: ["ALL"],
      certainty: "explicit",
      source: "deterministic_fallback",
    };
  }

  if (text.includes("no impact") || text.includes("no customer impact")) {
    return {
      predicate: "NO_RELEVANT_CUSTOMER_IMPACT",
      services: [],
      regions: ["ALL"],
      certainty: "explicit",
      source: "deterministic_fallback",
    };
  }

  return {
    predicate: "SCOPED_SERVICES_HEALTHY",
    services: [],
    regions: [],
    certainty: "ambiguous",
    source: "deterministic_fallback",
  };
}

/**
 * Canonicalize only phrases whose bounded meaning is explicit in the product
 * contract. The model still performs semantic mapping, but cannot narrow an
 * unambiguously global recovery statement into an invented service name.
 * This keeps model output as evidence while deterministic code owns the safety
 * boundary.
 */
export function canonicalizeMappedClaim(message: string, claim: ParsedClaim): ParsedClaim {
  const text = message.toLowerCase();

  if (text.includes("fully restored") || text.includes("all services") || text.includes("all workflows")) {
    return {
      ...claim,
      predicate: "ALL_RELEVANT_SERVICES_HEALTHY",
      services: [],
      regions: ["ALL"],
      certainty: "explicit",
    };
  }

  if (text.includes("no customer impact") || text.includes("no impact")) {
    return {
      ...claim,
      predicate: "NO_RELEVANT_CUSTOMER_IMPACT",
      services: [],
      regions: ["ALL"],
      certainty: "explicit",
    };
  }

  return claim;
}

function isParsedClaim(value: unknown): value is Omit<ParsedClaim, "source"> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  const allowedPredicates = new Set([
    "ALL_RELEVANT_SERVICES_HEALTHY",
    "NO_RELEVANT_CUSTOMER_IMPACT",
    "SCOPED_SERVICES_HEALTHY",
  ]);
  return (
    typeof candidate.predicate === "string" &&
    allowedPredicates.has(candidate.predicate) &&
    Array.isArray(candidate.services) &&
    candidate.services.every((item) => typeof item === "string") &&
    Array.isArray(candidate.regions) &&
    candidate.regions.every((item) => typeof item === "string") &&
    (candidate.certainty === "explicit" || candidate.certainty === "ambiguous")
  );
}

export async function parseClaim(message: string): Promise<ParsedClaim> {
  const baseUrl = process.env.LLM_BASE_URL?.replace(/\/$/, "");
  const apiKey = process.env.LLM_API_KEY;
  const model = process.env.LLM_MODEL;

  if (!baseUrl || !apiKey || !model) return deterministicFallback(message);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a bounded semantic mapper. Return JSON only with keys predicate, services, regions, certainty. predicate must be one of ALL_RELEVANT_SERVICES_HEALTHY, NO_RELEVANT_CUSTOMER_IMPACT, SCOPED_SERVICES_HEALTHY. services and regions are arrays of strings. certainty is explicit or ambiguous. Never decide whether a customer is safe; only map the message meaning. Statements that say workflows or services are fully restored are global recovery claims and should map to ALL_RELEVANT_SERVICES_HEALTHY with an empty services array. Do not invent a service name from generic words such as production workflows.",
          },
          { role: "user", content: message },
        ],
      }),
      cache: "no-store",
    });

    if (!response.ok) return deterministicFallback(message);
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return deterministicFallback(message);
    const parsed = JSON.parse(raw) as unknown;
    if (!isParsedClaim(parsed)) return deterministicFallback(message);
    return canonicalizeMappedClaim(message, { ...parsed, source: "model" });
  } catch {
    return deterministicFallback(message);
  }
}
