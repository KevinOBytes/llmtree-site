// ============================================================================
// LLM Tree of Life — Core Type Definitions
// ============================================================================

/** Model openness classification */
export type ModelOpenness = "closed" | "open-weight" | "open-source";

/** Model lifecycle status */
export type ModelStatus = "active" | "deprecated" | "discontinued" | "legacy";

/** Model architecture type */
export type ArchitectureType =
  | "decoder-only"
  | "encoder-only"
  | "encoder-decoder"
  | "mixture-of-experts"
  | "sparse-moe"
  | "dense-transformer";

/** Model modality */
export type Modality = "text" | "multimodal" | "code" | "vision" | "audio";

/** Innovation / technique tag */
export type InnovationTag =
  | "transformer"
  | "autoregressive"
  | "masked-lm"
  | "rlhf"
  | "constitutional-ai"
  | "chain-of-thought"
  | "mixture-of-experts"
  | "multimodal"
  | "long-context"
  | "instruction-tuning"
  | "few-shot"
  | "zero-shot"
  | "tool-use"
  | "agentic"
  | "reasoning"
  | "code-generation"
  | "open-weight"
  | "distillation"
  | "scaling-laws"
  | "attention-mechanism"
  | "test-time-compute"
  | "abliteration";

/** Model family identifiers */
export type ModelFamily =
  | "openai-gpt"
  | "openai-o"
  | "anthropic-claude"
  | "google-gemini"
  | "google-palm"
  | "google-gemma"
  | "meta-llama"
  | "mistral"
  | "xai-grok"
  | "cohere-command"
  | "microsoft-phi"
  | "deepseek"
  | "alibaba-qwen"
  | "tii-falcon"
  | "amazon-nova"
  | "community"
  | "foundational";

/** Hardware manufacturer */
export type HardwareManufacturer =
  | "nvidia"
  | "google"
  | "amd"
  | "intel"
  | "aws"
  | "microsoft"
  | "cerebras"
  | "groq";

// ============================================================================
// Core Data Entities
// ============================================================================

/** A model in the LLM family tree */
export interface ModelNode {
  id: string;
  name: string;
  family: ModelFamily;
  releaseDate: string; // ISO date string (YYYY-MM-DD or YYYY-MM)
  description: string;
  parentIds: string[]; // IDs of parent models
  influenceIds?: string[]; // IDs of papers/models that influenced this (cross-family)
  parameterCount?: string; // Human-readable (e.g., "175B", "~1.7T")
  contextWindow?: string; // Human-readable (e.g., "128K", "1M")
  architecture?: ArchitectureType;
  modality?: Modality;
  openness: ModelOpenness;
  innovations: InnovationTag[];
  company: string;
  paperUrl?: string;
  announcementUrl?: string;
  apiAvailable?: boolean;
  variants?: string[]; // e.g., ["Opus", "Sonnet", "Haiku"]
  status?: ModelStatus; // Lifecycle status (default: "active")
  discontinuedDate?: string; // When the model was deprecated/killed
  color?: string; // Brand color for visualization
}

/** A foundational research paper */
export interface PaperNode {
  id: string;
  title: string;
  shortTitle?: string; // For display (e.g., "Attention Is All You Need")
  authors: string;
  year: number;
  month?: number;
  institution: string;
  contribution: string;
  arxivUrl?: string;
  parentIds: string[]; // Papers this builds upon
  innovations: InnovationTag[];
  era: "pre-transformer" | "transformer" | "scaling" | "alignment" | "reasoning";
}

/** A hardware accelerator milestone */
export interface HardwareNode {
  id: string;
  name: string;
  manufacturer: HardwareManufacturer;
  releaseDate: string; // ISO date string
  specs: {
    memory?: string; // e.g., "80 GB HBM3"
    compute?: string; // e.g., "1979 TFLOPS FP8"
    transistors?: string; // e.g., "208B"
    process?: string; // e.g., "4nm"
  };
  description: string;
  enabledModels?: string[]; // Model IDs this hardware enabled
  enabledBreakthroughs?: string; // Description of what it enabled
}

// ============================================================================
// Unified Node (for shared rendering)
// ============================================================================

export type TreeNodeType = "model" | "paper" | "hardware";

export interface TreeNode {
  type: TreeNodeType;
  data: ModelNode | PaperNode | HardwareNode;
}

// ============================================================================
// Visualization State
// ============================================================================

export interface ViewState {
  selectedNodeId: string | null;
  highlightedFamily: ModelFamily | null;
  showInfluenceLines: boolean;
  showHardware: boolean;
  showPapers: boolean;
  opennessFilter: ModelOpenness | "all";
  searchQuery: string;
  zoomLevel: number;
  panOffset: { x: number; y: number };
}

// ============================================================================
// Color Scheme
// ============================================================================

export const FAMILY_COLORS: Record<ModelFamily, string> = {
  "openai-gpt": "#10A37F", // OpenAI green
  "openai-o": "#10A37F", // Same brand
  "anthropic-claude": "#D97757", // Anthropic orange/brown
  "google-gemini": "#4285F4", // Google blue
  "google-palm": "#34A853", // Google green
  "google-gemma": "#E8710A", // Gemma orange
  "meta-llama": "#0668E1", // Meta blue
  "mistral": "#FF7000", // Mistral orange
  "xai-grok": "#1DA1F2", // xAI blue
  "cohere-command": "#39594D", // Cohere green
  "microsoft-phi": "#00A4EF", // Microsoft blue
  "deepseek": "#4D6BFE", // DeepSeek blue
  "alibaba-qwen": "#FF6A00", // Alibaba orange
  "tii-falcon": "#C4A35A", // Falcon gold
  "amazon-nova": "#FF9900", // AWS orange
  "community": "#E040FB", // Purple-pink for community derivatives
  "foundational": "#8B5CF6", // Purple for papers
};

export const HARDWARE_COLORS: Record<HardwareManufacturer, string> = {
  nvidia: "#76B900", // NVIDIA green
  google: "#4285F4", // Google blue
  amd: "#ED1C24", // AMD red
  intel: "#0071C5", // Intel blue
  aws: "#FF9900", // AWS orange
  microsoft: "#00A4EF", // Microsoft blue
  cerebras: "#00D4AA", // Cerebras teal
  groq: "#F97316", // Groq orange
};
