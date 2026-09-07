// convex/lib/models.ts
//
// LLM model registry + OpenAI-compatible chat/completion client.
//
// DeepSeek exposes an OpenAI-compatible endpoint and serves both our text model
// (deepseek-v4-flash) and our vision model (deepseek-v4-flash-vision-exp).
// This registry is what makes "switch model based on capability" possible: each
// model declares `capabilities.text` / `capabilities.vision`, and callers ask
// for the capability they need instead of a hard-coded model id.
//
// NOTE: the DeepSeek vision model is a *reasoning* model and cannot download
// remote image URLs itself, so we pass images as base64 data URLs and give it a
// generous max_tokens budget (reasoning consumes tokens before `content`).

export interface ModelCapabilities {
  text: boolean;
  vision: boolean;
}

export interface ModelConfig {
  id: string;
  endpoint: string; // full /chat/completions URL
  apiKey: string;
  capabilities: ModelCapabilities;
  temperature: number;
  maxTokens: number;
}

const DEEPSEEK_ENDPOINT = "https://api.deepseek.com/v1/chat/completions";

function textModel(): ModelConfig | null {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  return {
    id: process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash",
    endpoint: DEEPSEEK_ENDPOINT,
    apiKey: key,
    capabilities: { text: true, vision: false },
    temperature: 0.7,
    maxTokens: 1200,
  };
}

function visionModel(): ModelConfig | null {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  return {
    id: process.env.VISION_MODEL ?? "deepseek-v4-flash-vision-exp",
    endpoint: DEEPSEEK_ENDPOINT,
    apiKey: key,
    capabilities: { text: true, vision: true },
    temperature: 0.4,
    maxTokens: 2000,
  };
}

/**
 * Pick a model by required capability. Text requests use the text model; vision
 * requests require a vision-capable model. Returns null when nothing suitable
 * is configured (callers degrade gracefully).
 */
export function routeModel(opts: { vision: boolean }): ModelConfig | null {
  if (opts.vision) return visionModel();
  return textModel() ?? visionModel();
}

export type ChatRole = "system" | "user" | "assistant";

// OpenAI-style message content: plain string for text, or a multimodal array
// (text + image_url parts) for vision models.
export type ChatContent =
  | string
  | Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }>;

export interface ChatMessage {
  role: ChatRole;
  content: ChatContent;
}

export async function chatCompletion(
  model: ModelConfig,
  messages: ChatMessage[],
): Promise<string> {
  const res = await fetch(model.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${model.apiKey}`,
    },
    body: JSON.stringify({
      model: model.id,
      messages,
      temperature: model.temperature,
      max_tokens: model.maxTokens,
      stream: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`LLM "${model.id}" returned ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  };
  const message = data.choices?.[0]?.message;
  const text = message?.content?.trim();
  // Reasoning models can return empty `content` if max_tokens is too low; never
  // surface internal chain-of-thought — treat it as an empty response instead.
  if (!text) {
    throw new Error(`LLM "${model.id}" returned an empty response`);
  }
  return text;
}

/** Vision request: one system prompt + one multimodal user message (text + image). */
export async function visionCompletion(
  model: ModelConfig,
  systemPrompt: string,
  imageDataUrl: string,
  userPrompt: string,
): Promise<string> {
  return chatCompletion(model, [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: imageDataUrl } },
      ],
    },
  ]);
}

const B64_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Base64-encode bytes without relying on btoa/Buffer (portable across runtimes). */
export function bytesToBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64_CHARS[b0 >> 2];
    out += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : "=";
    out += i + 2 < bytes.length ? B64_CHARS[b2 & 63] : "=";
  }
  return out;
}

/** Convert fetched image bytes into a base64 data URL for the vision model. */
export function arrayBufferToDataUrl(contentType: string, buf: ArrayBuffer): string {
  return `data:${contentType};base64,${bytesToBase64(new Uint8Array(buf))}`;
}
