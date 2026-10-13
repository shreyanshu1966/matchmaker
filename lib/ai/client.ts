/**
 * Thin wrapper around the OpenAI SDK (v7). The client is created lazily and
 * only when OPENAI_API_KEY is set, so the app works without a key (every
 * caller falls back to deterministic output).
 */
import OpenAI from "openai";
import type { z } from "zod";

export const DEFAULT_TIMEOUT_MS = 20_000;

let cachedClient: OpenAI | null = null;
let cachedKey: string | null = null;

export function isAiEnabled(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function getModel(): string {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/** Returns the OpenAI client, or null if no API key is configured. */
export function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return null;
  if (!cachedClient || cachedKey !== key) {
    cachedClient = new OpenAI({ apiKey: key, timeout: DEFAULT_TIMEOUT_MS, maxRetries: 0 });
    cachedKey = key;
  }
  return cachedClient;
}

export class AiUnavailableError extends Error {
  constructor() {
    super("OPENAI_API_KEY is not set");
    this.name = "AiUnavailableError";
  }
}

export interface ChatJsonOptions {
  timeoutMs?: number;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Sends one chat completion in JSON mode, parses the reply and validates it
 * with the given zod schema. Throws on a missing key, timeout, API error,
 * invalid JSON or schema mismatch; callers are expected to catch and fall back.
 */
export async function chatJson<S extends z.ZodType>(
  system: string,
  user: string,
  schema: S,
  opts: ChatJsonOptions = {},
): Promise<z.infer<S>> {
  const client = getClient();
  if (!client) throw new AiUnavailableError();

  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const model = getModel();
  // Reasoning models (o-series, gpt-5*) reject a custom temperature.
  const supportsTemperature = !/^(o\d|gpt-5)/i.test(model);
  const completion = await client.chat.completions.create(
    {
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
      ...(supportsTemperature ? { temperature: opts.temperature ?? 0.4 } : {}),
      ...(opts.maxTokens ? { max_completion_tokens: opts.maxTokens } : {}),
    },
    { timeout: timeoutMs, maxRetries: 0, signal: AbortSignal.timeout(timeoutMs + 1_000) },
  );

  const choice = completion.choices[0];
  const content = choice?.message?.content;
  if (!content) {
    throw new Error(`empty completion (finish_reason=${choice?.finish_reason ?? "unknown"})`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`model returned invalid JSON: ${content.slice(0, 200)}`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`model JSON failed validation: ${result.error.message.slice(0, 500)}`);
  }
  return result.data;
}

export function errMsg(err: unknown): string {
  return err instanceof Error ? `${err.name}: ${err.message}` : String(err);
}
