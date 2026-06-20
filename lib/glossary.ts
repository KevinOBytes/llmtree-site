// ============================================================================
// Shared Glossary — Single source of truth for AI/ML term definitions
// ============================================================================

/**
 * Comprehensive dictionary of AI/ML technical terms.
 * Keys can be either innovation tag slugs (e.g. "mixture-of-experts") or
 * display-form acronyms/terms (e.g. "MoE", "RLHF").
 */
export const GLOSSARY: Record<string, string> = {
  // ── Innovation tag definitions (keyed by slug) ────────────────────────────
  autoregressive:
    "Generates text one token at a time, each prediction based on all previous tokens. The foundation of modern language models.",
  transformer:
    "Neural network architecture using self-attention to process entire sequences in parallel. Replaced RNNs and enabled massive scaling.",
  "zero-shot":
    "Performing tasks without any examples — the model generalizes from its training alone.",
  "few-shot":
    "Learning from just a handful of examples provided in the prompt, without retraining.",
  "scaling-laws":
    "Mathematical relationships showing how model performance improves predictably with more data, compute, and parameters.",
  "code-generation":
    "Ability to write, debug, and understand programming code across multiple languages.",
  rlhf:
    "Reinforcement Learning from Human Feedback — training models to align with human preferences by having humans rank outputs.",
  "instruction-tuning":
    "Fine-tuning a model on instruction-response pairs so it follows user commands more reliably.",
  multimodal:
    "Processing multiple types of input (text, images, audio, video) in a single model.",
  "mixture-of-experts":
    "Architecture where only a fraction of the model's parameters are active for each input, allowing massive scale with lower compute.",
  "long-context":
    "Ability to process very long inputs (100K+ tokens), enabling analysis of entire codebases or books.",
  "tool-use":
    "Ability to call external tools, APIs, and functions — enabling web browsing, code execution, and real-world actions.",
  distillation:
    "Training a smaller 'student' model to mimic a larger 'teacher' model, preserving capability at lower cost.",
  reasoning:
    "Structured step-by-step problem solving, often using chain-of-thought or tree-of-thought approaches.",
  "chain-of-thought":
    "Prompting technique where the model 'thinks out loud' step by step before giving a final answer.",
  "test-time-compute":
    "Using extra computation during inference (not training) to improve answer quality — thinking longer on harder problems.",
  agentic:
    "Models that can autonomously plan, execute multi-step tasks, use tools, and self-correct without human intervention.",
  "constitutional-ai":
    "Anthropic's approach to AI safety where the model critiques and revises its own outputs against a set of principles.",
  "open-weight":
    "Model weights are publicly released but training data/code may not be. Enables fine-tuning but not full reproduction.",
  "attention-mechanism":
    "The core innovation of Transformers — allowing each token to 'attend to' every other token to capture relationships.",
  abliteration:
    "Removing safety guardrails from a model through targeted fine-tuning or weight manipulation. Controversial but popular in open-source community.",
  diffusion:
    "Generates outputs by gradually denoising random noise into coherent images/audio. The backbone of Stable Diffusion and DALL·E.",
  "text-to-image":
    "Generating images from text descriptions — the technology behind DALL·E, Midjourney, and Stable Diffusion.",
  "text-to-audio":
    "Generating speech, music, or sound effects from text descriptions.",
  "text-to-video":
    "Generating video clips from text descriptions — one of the newest and most compute-intensive AI capabilities.",
  "speech-recognition":
    "Converting spoken audio into text (automatic speech recognition / ASR).",
  "masked-lm":
    "Training by randomly hiding words and having the model predict them — BERT's key innovation for understanding context.",

  // ── Acronyms & display-form terms ─────────────────────────────────────────
  RLHF:
    "Reinforcement Learning from Human Feedback — training models to align with human preferences by having humans rank outputs.",
  MoE:
    "Mixture of Experts — architecture where only a fraction of parameters activate per input, enabling massive scale at lower compute cost.",
  DPO:
    "Direct Preference Optimization — a simpler alternative to RLHF that directly optimizes a model on preference data without a separate reward model.",
  RAG:
    "Retrieval-Augmented Generation — combining a language model with a search/retrieval system to ground responses in external knowledge.",
  LoRA:
    "Low-Rank Adaptation — an efficient fine-tuning technique that adds small trainable matrices to frozen model weights.",
  SSM:
    "State Space Model — a class of sequence models (like Mamba) that process sequences in linear time, as an alternative to quadratic-time attention.",
  MLA:
    "Multi-head Latent Attention — DeepSeek's innovation that compresses key-value caches into a low-rank latent space.",
  GQA:
    "Grouped Query Attention — sharing key-value heads across query heads to reduce memory usage during inference.",
  "KV Cache":
    "Key-Value Cache — storing previously computed attention keys and values to avoid redundant computation during autoregressive generation.",
  SFT:
    "Supervised Fine-Tuning — training a pre-trained model on labeled instruction-response pairs.",
  GPTQ:
    "A post-training quantization method that compresses model weights to 4-bit with minimal quality loss.",
  AWQ:
    "Activation-aware Weight Quantization — quantizes weights based on which ones matter most for activations.",
  Tokenizer:
    "The component that splits text into tokens (subword units) that the model processes. Common types: BPE, SentencePiece.",
  BPE:
    "Byte Pair Encoding — a tokenization algorithm that iteratively merges the most frequent character pairs.",
  "FP16 / BF16":
    "Half-precision floating point formats that halve memory usage vs FP32 with minimal quality loss.",
  RoPE:
    "Rotary Position Embeddings — encodes position information into attention using rotation matrices, enabling length generalization.",
  FLOPS:
    "Floating Point Operations Per Second — a measure of computational throughput used to compare hardware.",
  TOPS:
    "Tera Operations Per Second — a measure of AI accelerator performance, typically for INT8 inference.",
  Perplexity:
    "A metric measuring how well a language model predicts text. Lower is better.",
  MMLU:
    "Massive Multitask Language Understanding — a benchmark testing knowledge across 57 subjects.",
  HumanEval:
    "A benchmark for code generation, measuring functional correctness on Python programming problems.",
  "Chinchilla scaling":
    "Optimal compute allocation showing models should be trained on ~20× more tokens than parameters.",
  "Emergent abilities":
    "Capabilities that appear suddenly as models scale — like in-context learning or chain-of-thought reasoning.",
  Hallucination:
    "When a model generates plausible but factually incorrect information with confidence.",
  "Fine-tuning":
    "Adapting a pre-trained model to a specific task or domain by training on additional data.",
  "Pre-training":
    "The initial large-scale training phase where a model learns from massive text corpora.",
  Inference:
    "Using a trained model to generate predictions or outputs (as opposed to training it).",
  "Encoder-decoder":
    "Architecture where one network encodes input and another decodes it to output (e.g. T5, BART).",
  "Decoder-only":
    "Architecture that generates output autoregressively from left to right (e.g. GPT, LLaMA).",
  "Latent space":
    "A compressed representation space where models encode meaningful features of data.",
  VRAM:
    "Video RAM — GPU memory used to hold model weights, activations, and KV cache during training/inference.",
  "Sparse attention":
    "Attention mechanisms that only attend to a subset of tokens, reducing quadratic complexity.",
  "Flash Attention":
    "An IO-aware exact attention algorithm that's 2-4× faster by minimizing GPU memory reads/writes.",
  "Context window":
    "The maximum number of tokens a model can process in a single input. Ranges from 2K to 10M+.",
  FLOP:
    "A single floating point operation. Models are measured in total FLOPs required to train.",
  // ── Learn Section Term Additions ──────────────────────────────────────────
  integer:
    "A whole number representing a token's index position inside a vocabulary table.",
  Integer:
    "A whole number representing a token's index position inside a vocabulary table.",
  embedding:
    "A high-dimensional vector representing the semantic meaning of a token, grouping similar words close together in vector space.",
  Embedding:
    "A high-dimensional vector representing the semantic meaning of a token, grouping similar words close together in vector space.",
  frontier:
    "The absolute leading edge of AI model capability, representing state-of-the-art parameters, compute, and benchmark performance.",
  Frontier:
    "The absolute leading edge of AI model capability, representing state-of-the-art parameters, compute, and benchmark performance.",
  vector:
    "A list of numerical values representing a coordinate in high-dimensional space, used to encode semantic meanings.",
  Vector:
    "A list of numerical values representing a coordinate in high-dimensional space, used to encode semantic meanings.",
  query:
    "In self-attention, the vector representing the current token seeking context from other parts of the sequence.",
  Query:
    "In self-attention, the vector representing the current token seeking context from other parts of the sequence.",
  key:
    "In self-attention, the vector representing what information a token contains, matched against queries to compute attention weights.",
  Key:
    "In self-attention, the vector representing what information a token contains, matched against queries to compute attention weights.",
  context:
    "The text or prompt preceding a generation that the model uses to understand what it is currently processing.",
  Context:
    "The text or prompt preceding a generation that the model uses to understand what it is currently processing.",
  attention:
    "A mechanism in Transformers that determines how much focus to place on other words in a sequence when processing the current word.",
  Attention:
    "A mechanism in Transformers that determines how much focus to place on other words in a sequence when processing the current word.",
  heads:
    "Independent attention mechanisms running in parallel, allowing the model to capture multiple relationships at once.",
  Heads:
    "Independent attention mechanisms running in parallel, allowing the model to capture multiple relationships at once.",
  token:
    "A basic unit of text (such as a word or subword fragment) processed by a language model.",
  Token:
    "A basic unit of text (such as a word or subword fragment) processed by a language model.",
  softmax:
    "A mathematical function that converts a vector of raw scores (logits) into a probability distribution summing to 1.",
  Softmax:
    "A mathematical function that converts a vector of raw scores (logits) into a probability distribution summing to 1.",
  parameter:
    "A variable or weight inside a neural network that is adjusted during training to store knowledge.",
  Parameter:
    "A variable or weight inside a neural network that is adjusted during training to store knowledge.",
  deterministic:
    "An execution mode or output that is completely predictable, always yielding the identical response for a given input.",
  Deterministic:
    "An execution mode or output that is completely predictable, always yielding the identical response for a given input.",
  truncate:
    "To cut off or discard the tail end of a text sequence or a probability distribution.",
  Truncate:
    "To cut off or discard the tail end of a text sequence or a probability distribution.",
  temperature:
    "A hyperparameter controlling the randomness of outputs; lower values make outputs more deterministic, higher values make them more creative.",
  Temperature:
    "A hyperparameter controlling the randomness of outputs; lower values make outputs more deterministic, higher values make them more creative.",
  LLM:
    "Large Language Model — a deep learning model trained on massive text corpora to understand and generate human language.",
  loops:
    "Iterative processes where a model performs actions, observes the results, and reflects on them repeatedly to solve a task.",
  Loops:
    "Iterative processes where a model performs actions, observes the results, and reflects on them repeatedly to solve a task.",
  "Reason-Act-Observe":
    "The execution cycle of an agent (often using the ReAct framework) where it reasons about a task, calls a tool, and observes the feedback.",
  call:
    "An invocation of a tool or function (like web search or a calculator) by the model to gather external data.",
  Call:
    "An invocation of a tool or function (like web search or a calculator) by the model to gather external data.",
  external:
    "Resources, files, or services outside of the model's static weights, such as APIs or search engines.",
  External:
    "Resources, files, or services outside of the model's static weights, such as APIs or search engines.",
  "reinforcement learning":
    "A machine learning paradigm where models learn to make decisions by performing actions and receiving rewards or penalties.",
  "Reinforcement Learning":
    "A machine learning paradigm where models learn to make decisions by performing actions and receiving rewards or penalties.",
  "direct preference optimization":
    "A stable, simple alignment method that directly trains a model on preference pairs without needing a separate reward model.",
  "Direct Preference Optimization":
    "A stable, simple alignment method that directly trains a model on preference pairs without needing a separate reward model.",
  "human feedback":
    "Evaluations, ratings, or corrections provided by humans to align model behavior with user expectations and safety guidelines.",
  "Human Feedback":
    "Evaluations, ratings, or corrections provided by humans to align model behavior with user expectations and safety guidelines.",
  AI:
    "Artificial Intelligence — the broad field of computer science focused on building systems capable of performing tasks that typically require human intelligence.",
  prompt:
    "The input text or instruction provided to a language model to guide its output.",
  Prompt:
    "The input text or instruction provided to a language model to guide its output.",
  response:
    "The output text generated by a language model in reply to a prompt.",
  Response:
    "The output text generated by a language model in reply to a prompt.",
  "neural network":
    "A computational model inspired by biological brains, consisting of interconnected layers of nodes (neurons) that process data.",
  "Neural Network":
    "A computational model inspired by biological brains, consisting of interconnected layers of nodes (neurons) that process data.",
  "Self-Attention":
    "An attention mechanism relating different positions of a single sequence to compute a representation of the sequence.",
  "self-attention":
    "An attention mechanism relating different positions of a single sequence to compute a representation of the sequence.",
  Transformer:
    "Neural network architecture using self-attention to process entire sequences in parallel. Replaced RNNs and enabled massive scaling.",
  // ── Math Variables ────────────────────────────────────────────────────────
  "Q":
    "Query Matrix — contains vectors representing the tokens searching for context in the sequence.",
  "K":
    "Key Matrix — contains vectors representing the keys that match against queries to compute attention weights.",
  "V":
    "Value Matrix — contains vectors representing the actual semantic content to be retrieved for each token.",
  "d_k":
    "Key Dimension — the size/length of each key/query vector. Used as a scaling factor to keep dot-products stable.",
  "T":
    "Temperature — a hyperparameter dividing the logits to scale next-token selection randomness.",
  "z_i":
    "Logit — the raw, unnormalized prediction score output by the model for a specific token.",
};

// ============================================================================
// Innovation tag labels (shared between ModelDetailPanel & PapersView)
// ============================================================================

export const INNOVATION_LABELS: Record<string, string> = {
  transformer: "Transformer",
  autoregressive: "Autoregressive",
  "masked-lm": "Masked LM",
  rlhf: "RLHF",
  "constitutional-ai": "Constitutional AI",
  "chain-of-thought": "Chain-of-Thought",
  "mixture-of-experts": "MoE",
  multimodal: "Multimodal",
  "long-context": "Long Context",
  "instruction-tuning": "Instruction Tuning",
  "few-shot": "Few-Shot",
  "zero-shot": "Zero-Shot",
  "tool-use": "Tool Use",
  agentic: "Agentic",
  reasoning: "Reasoning",
  "code-generation": "Code Gen",
  "open-weight": "Open Weight",
  distillation: "Distillation",
  "scaling-laws": "Scaling Laws",
  "attention-mechanism": "Attention",
  "test-time-compute": "Test-Time Compute",
  abliteration: "Abliteration",
  diffusion: "Diffusion",
  "text-to-image": "Text-to-Image",
  "text-to-audio": "Text-to-Audio",
  "text-to-video": "Text-to-Video",
  "speech-recognition": "Speech Recognition",
};

// ============================================================================
// Glossary lookup utility
// ============================================================================

interface GlossaryMatch {
  term: string;
  definition: string;
  start: number;
  end: number;
}

// Cache: sorted terms for matching (longest first to prefer "Flash Attention" over "Attention")
let _sortedTerms: { term: string; definition: string; isAcronym: boolean }[] | null = null;

function getSortedTerms() {
  if (_sortedTerms) return _sortedTerms;

  // Dedupe by collecting only display-form / acronym terms
  // (skip slug-form duplicates like "rlhf" when "RLHF" exists)
  const seen = new Set<string>();
  const entries: { term: string; definition: string; isAcronym: boolean }[] = [];

  for (const [term, definition] of Object.entries(GLOSSARY)) {
    const lower = term.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);

    // An acronym is 2-5 uppercase letters (possibly with digits)
    const isAcronym = /^[A-Z][A-Z0-9]{1,4}$/.test(term);
    entries.push({ term, definition, isAcronym });
  }

  // Sort longest first so "Flash Attention" matches before "Attention"
  entries.sort((a, b) => b.term.length - a.term.length);
  _sortedTerms = entries;
  return entries;
}

/**
 * Scans text and finds glossary terms, returning their positions.
 * - Multi-word terms & lowercase terms: case-insensitive whole-word match
 * - Acronyms (all-caps): case-sensitive whole-word match
 */
export function glossaryLookup(text: string): GlossaryMatch[] {
  const terms = getSortedTerms();
  const matches: GlossaryMatch[] = [];
  // Track occupied ranges to avoid overlapping matches
  const occupied: [number, number][] = [];

  for (const { term, definition, isAcronym } of terms) {
    // Build regex: whole word boundary, case-sensitive for acronyms
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Use word boundaries for clean matching
    const flags = isAcronym ? "g" : "gi";
    const re = new RegExp(`\\b${escaped}\\b`, flags);

    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      const start = match.index;
      const end = start + match[0].length;

      // Check this range isn't already covered by a longer match
      const overlaps = occupied.some(
        ([os, oe]) => start < oe && end > os
      );
      if (overlaps) continue;

      occupied.push([start, end]);
      matches.push({ term, definition, start, end });
    }
  }

  // Sort by position for sequential rendering
  matches.sort((a, b) => a.start - b.start);
  return matches;
}
