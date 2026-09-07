// convex/lib/models.ts
//
// LLM model registry + OpenAI-compatible chat/completion client.
//
// DeepSeek exposes an OpenAI-compatible endpoint and is the default *text*
// model. DeepSeek's public API does not (yet) provide a vision model, so image
// analysis is routed to a separately-configured vision-capable model. This
// registry is what makes "switch model based on capability" possible: each model
// declares `capabilities.text` / `capabilities.vision`, and callers ask for the
// capability they need instead of a hard-coded model id.

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

function textModel(): ModelConfig | null {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return null;
  return {
    id: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
    endpoint: "https://api.deepseek.com/v1/chat/completions",
    apiKey: key,
    capabilities: { text: true, vision: false },
    temperature: 0.7,
    maxTokens: 1200,
  };
}

function visionModel(): ModelConfig | null {
  const key = process.env.VISION_API_KEY;
  const endpoint = process.env.VISION_BASE_URL;
  if (!key || !endpoint) return null;
  return {
    id: process.env.VISION_MODEL ?? "gpt-4o",
    endpoint,
    apiKey: key,
    capabilities: { text: true, vision: true },
    temperature: 0.4,
    maxTokens: 1200,
  };
}

/**
 * Pick a model by required capability. Text requests prefer DeepSeek; vision
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
    choices?: Array<{ message?: { content?: string } }>;
  };
  const text = data.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text.trim()) {
    throw new Error(`LLM "${model.id}" returned an empty response`);
  }
  return text;
}

/** Vision request: one system prompt + one multimodal user message (text + image). */
export async function visionCompletion(
  model: ModelConfig,
  systemPrompt: string,
  imageUrl: string,
  userPrompt: string,
): Promise<string> {
  return chatCompletion(model, [
    { role: "system", content: systemPrompt },
    {
      role: "user",
      content: [
        { type: "text", text: userPrompt },
        { type: "image_url", image_url: { url: imageUrl } },
      ],
    },
  ]);
}
