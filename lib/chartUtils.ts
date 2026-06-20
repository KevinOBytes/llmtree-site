// ============================================================================
// Chart Utilities — shared helpers for the /compare charts
// ============================================================================

import type { ModelNode, ModelFamily, ModelOpenness } from "@/lib/types";

/** Human-readable family labels */
export const FAMILY_LABELS: Record<string, string> = {
  "openai-gpt": "OpenAI GPT",
  "openai-o": "OpenAI o-series",
  "anthropic-claude": "Anthropic Claude",
  "google-gemini": "Google Gemini",
  "google-palm": "Google PaLM",
  "google-gemma": "Google Gemma",
  "meta-llama": "Meta LLaMA",
  mistral: "Mistral AI",
  "xai-grok": "xAI Grok",
  "cohere-command": "Cohere Command",
  "microsoft-phi": "Microsoft Phi",
  deepseek: "DeepSeek",
  "alibaba-qwen": "Alibaba Qwen",
  "tii-falcon": "TII Falcon",
  "amazon-nova": "Amazon Nova",
  "nvidia-nemotron": "NVIDIA Nemotron",
  "ibm": "IBM",
  "01ai-yi": "01.AI Yi",
  "apple": "Apple",
  "ai21-jamba": "AI21 Labs",
  "allen-ai": "Allen AI",
  "inflection": "Inflection AI",
  "search-tool": "Search / RAG",
  "music-gen": "Music Generation",
  "speech-ai": "Speech / Voice",
  "stability-ai": "Stability AI",
  "midjourney": "Midjourney",
  "image-gen": "Image Generation",
  "coding-tool": "Coding Tools",
  community: "Community / Uncensored",
  foundational: "Foundational",
  "embedding": "Embedding Models",
  "safety": "Safety / Guardrails",
  "robotics": "Robotics / Embodied",
  "chinese-llm": "Chinese LLMs",
};

/** Parse a parameter count string like "175B", "~1.7T", "671B (37B active)" → number */
export function parseParamCount(raw: string | undefined): number | null {
  if (!raw) return null;
  // Take the first number-like token (handles "671B (37B active)", "~1.7T (est. MoE)")
  const match = raw.match(/~?([\d.]+)\s*(T|B|M|K)?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = (match[2] ?? "").toUpperCase();
  switch (unit) {
    case "T":
      return num * 1e12;
    case "B":
      return num * 1e9;
    case "M":
      return num * 1e6;
    case "K":
      return num * 1e3;
    default:
      return num;
  }
}

/** Parse a context window string like "128K", "2M", "10M", "512" → number of tokens */
export function parseContextWindow(raw: string | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/([\d.]+)\s*(M|K)?/i);
  if (!match) return null;
  const num = parseFloat(match[1]);
  const unit = (match[2] ?? "").toUpperCase();
  switch (unit) {
    case "M":
      return num * 1e6;
    case "K":
      return num * 1e3;
    default:
      return num;
  }
}

/** Parse an ISO date string "2024-03" or "2024-03-14" → Date */
export function parseDate(raw: string): Date {
  // Handle "YYYY-MM" by appending "-01"
  const normalized = raw.length === 7 ? `${raw}-01` : raw;
  return new Date(normalized);
}

/** Get the quarter label from a date: "Q1 2024" */
export function getQuarter(d: Date): string {
  const q = Math.floor(d.getMonth() / 3) + 1;
  return `Q${q} ${d.getFullYear()}`;
}

/** Get year from model */
export function getYear(model: ModelNode): number {
  return parseDate(model.releaseDate).getFullYear();
}

/** Openness category for stacking */
export function getOpennessCategory(
  openness: ModelOpenness
): "closed" | "open-weight" | "open-source" {
  return openness;
}

/** Key models to label on scatter plots */
export const KEY_MODEL_IDS = new Set([
  "model-gpt1",
  "model-gpt3",
  "model-gpt4",
  "model-gpt5",
  "model-claude3",
  "model-claude4",
  "model-llama1",
  "model-llama4",
  "model-gemini-1",
  "model-gemini-2.5",
  "model-deepseek-v3",
  "model-deepseek-r1",
  "model-mixtral",
  "model-mistral-7b",
  "model-palm",
  "model-whisper",
  "model-gpt3.5",
  "model-o1",
]);

/** Type for a chart-ready data point */
export interface ChartPoint {
  model: ModelNode;
  x: number; // timestamp
  y: number; // parsed value (params or context)
  family: ModelFamily;
  color: string;
  label: string;
  isKey: boolean;
}
