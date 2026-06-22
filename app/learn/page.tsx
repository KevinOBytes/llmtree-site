"use client";

import { useState, useMemo } from "react";
import { TechTerm, AutoGlossary } from "@/components/ui/TechTerm";
import { AttentionFormula, SoftmaxFormula, MathVar } from "@/components/ui/InteractiveFormula";

// ============================================================================
// Types & Data Structures
// ============================================================================

interface Token {
  text: string;
  id: number;
  colorClass: string;
}

interface TokenProb {
  token: string;
  logit: number;
  prob: number;
  filtered: boolean;
}

// Word sequence for Self-Attention map
const ATTENTION_WORDS = [
  "The",
  "llm",
  "read",
  "the",
  "prompt",
  "because",
  "it",
  "was",
  "relevant",
];

// Helper to generate local window attention weights (fallback)
function getLocalWeights(hoveredIdx: number, size: number): number[] {
  const weights = Array(size).fill(0.02);
  weights[hoveredIdx] = 0.6;
  if (hoveredIdx > 0) weights[hoveredIdx - 1] = 0.18;
  if (hoveredIdx < size - 1) weights[hoveredIdx + 1] = 0.18;
  // Normalize
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
}

// Predefined Attention Heads
const ATTENTION_HEADS = [
  {
    name: "Head 1: Pronoun Resolution",
    description:
      "Resolves coreferences. Hover over 'it' to see how the model connects the pronoun back to 'prompt' and 'llm'.",
    matrix: ATTENTION_WORDS.map((_, i) => {
      // "it" is at index 6
      if (i === 6) {
        const row = Array(ATTENTION_WORDS.length).fill(0.01);
        row[1] = 0.35; // llm
        row[4] = 0.5; // prompt
        row[6] = 0.12; // it
        row[8] = 0.02; // relevant
        return row;
      }
      // "relevant" is at index 8
      if (i === 8) {
        const row = Array(ATTENTION_WORDS.length).fill(0.01);
        row[4] = 0.55; // prompt
        row[6] = 0.35; // it
        return row;
      }
      return getLocalWeights(i, ATTENTION_WORDS.length);
    }),
  },
  {
    name: "Head 2: Syntactic Actions",
    description:
      "Links verbs to subjects and objects. Hover over 'read' to see connection to 'llm' (subject) and 'prompt' (object).",
    matrix: ATTENTION_WORDS.map((_, i) => {
      // "read" is at index 2
      if (i === 2) {
        const row = Array(ATTENTION_WORDS.length).fill(0.01);
        row[1] = 0.45; // llm (who read)
        row[4] = 0.45; // prompt (what was read)
        row[2] = 0.09;
        return row;
      }
      // "was" is at index 7
      if (i === 7) {
        const row = Array(ATTENTION_WORDS.length).fill(0.01);
        row[6] = 0.4; // it
        row[8] = 0.5; // relevant
        return row;
      }
      return getLocalWeights(i, ATTENTION_WORDS.length);
    }),
  },
  {
    name: "Head 3: Positional History",
    description:
      "Looks at immediate predecessors. Highlights sequence order and local grammar context.",
    matrix: ATTENTION_WORDS.map((_, i) => {
      const row = Array(ATTENTION_WORDS.length).fill(0.01);
      if (i > 0) {
        row[i - 1] = 0.85; // previous word
        row[i] = 0.14; // current word
      } else {
        row[i] = 0.99;
      }
      return row;
    }),
  },
];

// ============================================================================
// Page Component
// ============================================================================

export default function LearnPage() {
  // ── Audience Level State ──────────────────────────────────────────────────
  const [activeLevel, setActiveLevel] = useState<"casual" | "developer" | "researcher" | "systems">("developer");
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // ── Tokens Sandbox State ──────────────────────────────────────────────────
  const [inputText, setInputText] = useState(
    "Attention is all you need for learning artificial intelligence."
  );

  const tokens = useMemo(() => {
    if (!inputText) return [];
    const words = inputText.match(/\w+|[^\w\s]|\s+/g) || [];
    const colorClasses = [
      "bg-accent-violet/10 hover:bg-accent-violet/20 border-accent-violet/20 text-accent-violet-light",
      "bg-accent-cyan/10 hover:bg-accent-cyan/20 border-accent-cyan/20 text-accent-cyan-light",
      "bg-accent-emerald/10 hover:bg-accent-emerald/20 border-accent-emerald/20 text-accent-emerald-light",
      "bg-accent-amber/10 hover:bg-accent-amber/20 border-accent-amber/20 text-accent-amber-light",
      "bg-accent-rose/10 hover:bg-accent-rose/20 border-accent-rose/20 text-accent-rose-light",
    ];

    const getHashId = (str: string): number => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash % 45000) + 5000;
    };

    const tokenList: Token[] = [];
    words.forEach((part) => {
      if (/^\s+$/.test(part)) {
        tokenList.push({
          text: "Ġ".repeat(part.length),
          id: 220,
          colorClass:
            "bg-surface-tertiary/40 border-border-default/50 text-text-muted/70",
        });
        return;
      }

      const subwords: string[] = [];
      if (part.length > 6) {
        if (part.endsWith("ing")) {
          subwords.push(part.slice(0, -3), "##ing");
        } else if (part.endsWith("tion")) {
          subwords.push(part.slice(0, -4), "##tion");
        } else if (part.endsWith("ment")) {
          subwords.push(part.slice(0, -4), "##ment");
        } else {
          const mid = Math.floor(part.length / 2);
          subwords.push(part.slice(0, mid), "##" + part.slice(mid));
        }
      } else {
        subwords.push(part);
      }

      subwords.forEach((sub) => {
        const id = getHashId(sub);
        tokenList.push({
          text: sub,
          id,
          colorClass: colorClasses[tokenList.length % colorClasses.length],
        });
      });
    });

    return tokenList;
  }, [inputText]);

  // ── Attention Map State ───────────────────────────────────────────────────
  const [activeHeadIdx, setActiveHeadIdx] = useState(0);
  const [hoveredWordIdx, setHoveredWordIdx] = useState<number | null>(null);

  const activeHead = ATTENTION_HEADS[activeHeadIdx];

  // ── Training Stepper State ────────────────────────────────────────────────
  const [activeTrainStep, setActiveTrainStep] = useState(0);
  const trainSteps = useMemo(() => {
    switch (activeLevel) {
      case "casual":
        return [
          {
            title: "1. Basic Reading",
            subtitle: "Word Guessing Game",
            description:
              "The AI reads massive amounts of text from books, articles, and websites. It plays a game where it tries to guess the very next word in a sentence. By doing this billions of times, it learns vocabulary, how humans write, and general facts about the world.",
            datasetExample: {
              input: "The sky is...",
              output: "blue and clear on a sunny day.",
            },
            tag: "Reading Stage",
            color: "border-accent-violet text-accent-violet",
          },
          {
            title: "2. Teaching Manners",
            subtitle: "Following Directions",
            description:
              "A brand new AI only knows how to complete sentences. In this stage, we feed it examples of high-quality questions and direct answers. This teaches the AI how to act like an assistant and reply directly to you instead of just rambling on.",
            datasetExample: {
              input: "User: What is the capital of France?\nAI:",
              output: "The capital of France is Paris.",
            },
            tag: "Conversation Stage",
            color: "border-accent-cyan text-accent-cyan",
          },
          {
            title: "3. Friendly Rating",
            subtitle: "Safety & Polite Rules",
            description:
              "Finally, humans check different AI responses and rate them. The AI is rewarded for being polite, honest, and helpful, and learns to refuse bad or dangerous requests (like how to break a lock).",
            datasetExample: {
              input: "Prompt: Tell me how to steal a car.",
              output: "I cannot help with illegal actions.",
            },
            tag: "Politeness Stage",
            color: "border-accent-emerald text-accent-emerald",
          },
        ];
      case "developer":
        return [
          {
            title: "1. Pre-Training",
            subtitle: "Causal Language Modeling",
            description:
              "The model is fed trillions of tokens of raw web text. It optimizes cross-entropy loss to predict the next token given a context window. This creates a base model with extensive world knowledge and autocomplete capabilities.",
            datasetExample: {
              input: "The capital of France is...",
              output: "Paris. Located on the Seine River, it is the center of...",
            },
            tag: "Self-Supervised Learning",
            color: "border-accent-violet text-accent-violet",
          },
          {
            title: "2. Supervised Fine-Tuning (SFT)",
            subtitle: "Instruction Following",
            description:
              "The base model is trained on curated prompt-response datasets. It learns conversation structural templates (like ChatML tags: <|im_start|>user) and shifts from simple word completion to structured dialog.",
            datasetExample: {
              input: "User: What is the capital of France?\nAssistant:",
              output: "The capital of France is Paris.",
            },
            tag: "Instruction Alignment",
            color: "border-accent-cyan text-accent-cyan",
          },
          {
            title: "3. Alignment (RLHF / DPO)",
            subtitle: "Safety & Utility Preference",
            description:
              "Models undergo Reinforcement Learning from Human Feedback (RLHF) or Direct Preference Optimization (DPO). Using datasets of preferred and dispreferred response pairs, the model is steered to choose safe, helpful outputs.",
            datasetExample: {
              input: "Prompt: Write a code snippet to access local files.",
              output: "Prefer Output A (Contains secure API usage with proper error handlers) over Output B (Uses deprecated, vulnerable methods).",
            },
            tag: "Preference Optimization",
            color: "border-accent-emerald text-accent-emerald",
          },
        ];
      case "researcher":
        return [
          {
            title: "1. Pre-Training",
            subtitle: "Autoregressive Likelihood Maximization",
            description:
              "Given a text sequence X = (x_1, ..., x_n), we optimize the network parameter set θ by maximizing the causal language modeling objective: L_LM = ∑ log P(x_i | x_<i; θ). Training uses massive scale to compress world knowledge into latent weights.",
            datasetExample: {
              input: "X = [token_1, token_2, token_3, ..., token_{n-1}]",
              output: "P(x_n | x_{<n}; θ) computed via softmax over raw logits",
            },
            tag: "Unconstrained Policy Optimization",
            color: "border-accent-violet text-accent-violet",
          },
          {
            title: "2. Supervised Fine-Tuning (SFT)",
            subtitle: "Target Behavioral Adaption",
            description:
              "We fine-tune the parameter set on a conditioned sequence dataset D = {(x^i, y^i)} containing instructions x and target outputs y. The model maximizes conditional log-likelihood: L_SFT = ∑ log P(y | x; θ) using standard teacher-forcing loss.",
            datasetExample: {
              input: "x = instruction context sequence",
              output: "y = target token sequence (cross-entropy evaluated only on output y)",
            },
            tag: "Conditional Log-Likelihood",
            color: "border-accent-cyan text-accent-cyan",
          },
          {
            title: "3. Preference Alignment",
            subtitle: "DPO Policy Optimization",
            description:
              "Direct Preference Optimization (DPO) optimizes policy π_θ relative to reference policy π_ref on pairs (x, y_w, y_l) of winning/losing outputs. It optimizes: L_DPO = -E [log σ(β log (π_θ(y_w|x)/π_ref(y_w|x)) - β log (π_θ(y_l|x)/π_ref(y_l|x)))], bypassing active reinforcement learning loops.",
            datasetExample: {
              input: "Preference pair: (prompt x, winner y_w, loser y_l)",
              output: "Optimized parameters θ that maximize policy margin ratios",
            },
            tag: "DPO Objective Minimization",
            color: "border-accent-emerald text-accent-emerald",
          },
        ];
      case "systems":
        return [
          {
            title: "1. Distributed Pre-Training",
            subtitle: "3D Parallelism & Mixed Precision",
            description:
              "Training models with 100B+ parameters requires 3D Parallelism: Tensor Parallelism (splitting layer matrices), Pipeline Parallelism (splitting blocks across nodes), and Data Parallelism (ZeRO-3 optimizer sharding). Model weights are trained using FP8 or BF16 precision to maximize FLOPS/watt.",
            datasetExample: {
              input: "Dataset sharded across GPU ranks. Global batch size: 4M tokens.",
              output: "FP8/BF16 mixed precision execution, achieving ~90% hardware FLOPs utilization.",
            },
            tag: "GPU Cluster Orchestration",
            color: "border-accent-violet text-accent-violet",
          },
          {
            title: "2. Fine-Tuning Optimization",
            subtitle: "Parameter-Efficient Tuning (LoRA)",
            description:
              "Updating all weights W during SFT requires substantial GPU optimizer memory (up to 16 bytes per parameter for AdamW). Instead, Low-Rank Adaptation (LoRA) freezes the base parameters and optimizes low-rank decomposition matrices A and B (rank r << d), saving 90% of optimizer memory.",
            datasetExample: {
              input: "Base weights frozen (FP8/FP16). Auxiliary matrices A and B loaded in FP32.",
              output: "Weights merged: W_new = W + (A × B) * (α / r). Hot-swappable client adapters.",
            },
            tag: "Optimizer Memory Slicing",
            color: "border-accent-cyan text-accent-cyan",
          },
          {
            title: "3. Alignment Infrastructure",
            subtitle: "PPO vs. DPO Memory Overhead",
            description:
              "Reinforcement learning via PPO requires hosting four models in memory: Actor, Critic, Reward, and Reference, making it highly memory-intensive. Direct Preference Optimization (DPO) eliminates the active Reward/Critic networks, reducing serving overhead to just two models: Policy and Reference.",
            datasetExample: {
              input: "Reference model frozen in VRAM. Policy model actively trained.",
              output: "50% VRAM saving over PPO, accelerating alignment runs.",
            },
            tag: "Serving Memory Compression",
            color: "border-accent-emerald text-accent-emerald",
          },
        ];
    }
  }, [activeLevel]);

  // ── Decoding Simulator State ──────────────────────────────────────────────
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);

  const candidateTokens = useMemo(() => {
    const baseCandidates = [
      { token: "sunny", logit: 4.0 },
      { token: "cold", logit: 3.2 },
      { token: "rainy", logit: 2.8 },
      { token: "beautiful", logit: 2.5 },
      { token: "hot", logit: 1.8 },
      { token: "potato", logit: -0.8 },
    ];

    // 1. Temperature scaling (T must be > 0.05 to avoid division overflow)
    const t = Math.max(temperature, 0.05);
    const expLogits = baseCandidates.map((c) => Math.exp(c.logit / t));
    const sumExp = expLogits.reduce((a, b) => a + b, 0);

    // 2. Probabilities calculation
    let results: TokenProb[] = baseCandidates.map((c, i) => ({
      token: c.token,
      logit: c.logit,
      prob: expLogits[i] / sumExp,
      filtered: false,
    }));

    // 3. Sort descending for cumulative probability cutoff (Top-P)
    results.sort((a, b) => b.prob - a.prob);

    // 4. Apply Top-P Nucleus threshold
    let cumulativeSum = 0;
    results = results.map((c) => {
      // Include token if the cumulative probability before adding this token was less than Top-P.
      // E.g., if Top-P is 0.9, and the preceding tokens sum to 0.88, we include the next token too.
      const isFiltered = cumulativeSum >= topP;
      cumulativeSum += c.prob;

      return {
        ...c,
        filtered: isFiltered,
      };
    });

    return results;
  }, [temperature, topP]);

  // ── RAG & Agent Loops State ───────────────────────────────────────────────
  const [activeRagStep, setActiveRagStep] = useState(0);
  const [activeAgentStep, setActiveAgentStep] = useState(0);

  const ragSteps = useMemo(() => {
    switch (activeLevel) {
      case "casual":
        return [
          {
            title: "1. Search Query",
            detail: "You ask the AI a question about something new or private.",
            visualText: 'Query: "What is the size of GPT-4?"',
          },
          {
            title: "2. Book Search",
            detail: "The computer searches a digital filing cabinet to find articles containing matching terms.",
            visualText: "Retrieved Article: 'GPT-4 is estimated at 1.7T parameters.'",
          },
          {
            title: "3. Copy & Paste",
            detail: "It automatically copies the article text and pastes it right into your question prompt.",
            visualText: "Context: [GPT-4 size is 1.7T] + Question: 'What is...'",
          },
          {
            title: "4. Informed Reply",
            detail: "The AI reads the pasted text and writes a highly accurate response using the facts.",
            visualText: "Reply: 'GPT-4 has approximately 1.7 trillion parameters.'",
          },
        ];
      case "developer":
        return [
          {
            title: "1. Query Embedding",
            detail: "The user query is processed by an embedding model, yielding a high-dimensional vector representing semantic intent.",
            visualText: 'Query: "What is GPT-4\'s size?" ➔ Vector: [0.15, -0.42, 0.87, ...]',
          },
          {
            title: "2. Vector Database Retrieval",
            detail: "We perform cosine-similarity search against document vectors stored in a Vector DB. This returns relevant document snippets.",
            visualText: "Retrieved Doc: 'GPT-4 is estimated at 1.7T parameters total across 16 experts.'",
          },
          {
            title: "3. Context Injection",
            detail: "We augment the prompt with the retrieved text. The LLM now has facts right inside its context window, eliminating hallucinations.",
            visualText: "System: Use the context to answer. Context: 'GPT-4...' Prompt: 'What is...'",
          },
          {
            title: "4. LLM Answer Generation",
            detail: "The model synthesizes the answer using its in-context memory, ensuring accurate and up-to-date facts.",
            visualText: "Answer: 'GPT-4 is a Mixture-of-Experts model totalizing roughly 1.7T parameters.'",
          },
        ];
      case "researcher":
        return [
          {
            title: "1. Dense Retrieval Projection",
            detail: "The input query q is encoded using a bi-encoder framework: e_q = f_phi(q). This maps text into a shared semantic latent space.",
            visualText: "e_q = f_phi(\"What is GPT-4's size?\") ∈ ℝ^d",
          },
          {
            title: "2. Maximum Inner Product Search (MIPS)",
            detail: "We evaluate similarity over indexed documents: argmax^k cos(e_q, e_d). This returns top-k documents representing semantic proximity.",
            visualText: "Retrieving D_k = {d | cos(e_q, e_d) >= threshold_k}",
          },
          {
            title: "3. Probability Conditioning",
            detail: "The retrieved context D_k is appended to prompt q, updating the probability model to estimate target sequence Y: P(Y | q, D_k).",
            visualText: "Conditional distribution updated to P(y_t | y_<t, q, D_k)",
          },
          {
            title: "4. Posterior Generation",
            detail: "Autoregressive generation maximizes candidate sequence log-likelihood, resolving missing information by in-context retrieval groundings.",
            visualText: "Y* = argmax ∑ log P(y_t | y_<t, q, D_k)",
          },
        ];
      case "systems":
        return [
          {
            title: "1. Bi-Encoder Serving",
            detail: "Query is embedded using a lightweight CPU-optimized model (e.g. BGE-M3). Embeddings are cached to bypass GPU inference overhead.",
            visualText: "Query embed latency: ~12ms on CPU. Vector cache size: 768 float32 values.",
          },
          {
            title: "2. HNSW In-Memory Lookup",
            detail: "We query a vector database (e.g. Milvus or Qdrant) using HNSW (Hierarchical Navigable Small World) index stored entirely in RAM.",
            visualText: "Milvus HNSW lookup time: 4.8ms. Retrieved 3 chunks (total 1.2k tokens).",
          },
          {
            title: "3. Context Expansion & KV Cache Growth",
            detail: "Prepend chunks to user prompt. This adds 1.2k tokens to the context window, causing a sudden spike in KV Cache memory usage in GPU VRAM.",
            visualText: "VRAM delta: 1200 tokens × 32 layers × 32 heads × 128 dim × 2 bytes * 2 (K+V) ≈ 6.29 MB per user.",
          },
          {
            title: "4. High-Throughput Token Generation",
            detail: "The LLM decodes the grounded response. Attention mechanisms execute over both prompt tokens (prefill) and retrieved context.",
            visualText: "Token Generation speed: 65 tokens/sec. Total execution latency: 450ms.",
          },
        ];
    }
  }, [activeLevel]);

  const agentSteps = useMemo(() => {
    switch (activeLevel) {
      case "casual":
        return [
          {
            phase: "Thought",
            detail: "The AI plans how to answer. It realizes it needs to search the web for Gemini 1.5 first.",
            text: "Thought: I need to compare the release dates. I will search for Gemini 1.5's release date first.",
          },
          {
            phase: "Action",
            detail: "The AI calls a search tool with the query.",
            text: "Action: Search for 'Gemini 1.5 release date'",
          },
          {
            phase: "Observation",
            detail: "The search tool returns the information.",
            text: "Observation: Google announced Gemini 1.5 on February 15, 2024.",
          },
          {
            phase: "Thought (Loop)",
            detail: "The AI thinks about what's next. Now it needs to search for GPT-4o.",
            text: "Thought: I have Gemini (Feb 15, 2024). Now I need to search for GPT-4o's release date.",
          },
          {
            phase: "Action (Loop)",
            detail: "The AI calls the search tool again.",
            text: "Action: Search for 'GPT-4o release date'",
          },
          {
            phase: "Observation (Loop)",
            detail: "The tool returns the second date.",
            text: "Observation: OpenAI announced GPT-4o on May 13, 2024.",
          },
          {
            phase: "Thought (Final)",
            detail: "The AI reviews both dates and prepares the final comparison.",
            text: "Thought: I have both dates. Gemini 1.5 is Feb 15, and GPT-4o is May 13. I can now write the answer.",
          },
          {
            phase: "Final Answer",
            detail: "The AI writes the output and finishes.",
            text: "Answer: Gemini 1.5 was announced first on Feb 15, 2024, which is about 3 months before GPT-4o (May 13, 2024).",
          },
        ];
      case "developer":
        return [
          {
            phase: "Thought",
            detail: "The agent analyzes the task and reasons about what to do next. It decides it needs external web information.",
            text: "Thought: I need to compare the release dates of Gemini 1.5 and GPT-4o. I will search for Gemini 1.5 first.",
          },
          {
            phase: "Action",
            detail: "The agent executes a tool call (API invocation, code interpreter, web search, database query).",
            text: "Action: call tool 'google_search' with arg { query: 'Gemini 1.5 release date' }",
          },
          {
            phase: "Observation",
            detail: "The agent observes the result returned from the tool call, updating its context buffer.",
            text: "Observation: 'Gemini 1.5 Pro was announced by Google on February 15, 2024.'",
          },
          {
            phase: "Thought (Loop)",
            detail: "The agent reviews the observations and plans the next action (to find GPT-4o's release date).",
            text: "Thought: I have Gemini 1.5 (Feb 15, 2024). Now I will search for GPT-4o's announcement date.",
          },
          {
            phase: "Action (Loop)",
            detail: "The agent makes a second tool call to fetch the missing details.",
            text: "Action: call tool 'google_search' with arg { query: 'GPT-4o release date' }",
          },
          {
            phase: "Observation (Loop)",
            detail: "The tool returns the answer to the second query.",
            text: "Observation: 'OpenAI announced its new flagship model, GPT-4o, on May 13, 2024.'",
          },
          {
            phase: "Thought (Finalize)",
            detail: "The agent gathers all facts, evaluates if the goal has been achieved, and prepares the final response.",
            text: "Thought: I have both dates: Gemini 1.5 (Feb 15, 2024) and GPT-4o (May 13, 2024). I can now compare them.",
          },
          {
            phase: "Final Answer",
            detail: "The agent writes back the user's answer, exiting the autonomous reasoning loop.",
            text: "Answer: Gemini 1.5 was released on Feb 15, 2024, approximately three months before GPT-4o (May 13, 2024).",
          },
        ];
      case "researcher":
        return [
          {
            phase: "Thought",
            detail: "Evaluate task goal: Compare release epochs of Gemini 1.5 and GPT-4o. State: S_0. Action: Retrieve Gemini epoch via search operator.",
            text: "Thought: Goal: compare release epochs. Current state: S_0 = {}. Plan: invoke search tool for Gemini 1.5 announcement.",
          },
          {
            phase: "Action",
            detail: "Execute tool call targeting search API to transition to state S_1.",
            text: "Action: call_tool(google_search, { query: 'Gemini 1.5 announcement epoch' })",
          },
          {
            phase: "Observation",
            detail: "Environment returns observations, updating target state context.",
            text: "Observation: 'Google announced Gemini 1.5 Pro on Feb 15, 2024.'",
          },
          {
            phase: "Thought (Loop)",
            detail: "Evaluate state: S_1 = {Gemini: 2024-02-15}. Subgoal: Retrieve GPT-4o epoch to satisfy delta evaluation.",
            text: "Thought: State updated: S_1 = {Gemini: '2024-02-15'}. Next subgoal: find GPT-4o release date.",
          },
          {
            phase: "Action (Loop)",
            detail: "Execute second search call to transition to state S_2.",
            text: "Action: call_tool(google_search, { query: 'GPT-4o announcement epoch' })",
          },
          {
            phase: "Observation (Loop)",
            detail: "Environment returns GPT-4o announcement epoch.",
            text: "Observation: 'OpenAI announced GPT-4o on May 13, 2024.'",
          },
          {
            phase: "Thought (Finalize)",
            detail: "Evaluate state: S_2 = S_1 ∪ {GPT4o: 2024-05-13}. Goal condition met. Compute epoch delta.",
            text: "Thought: State complete: S_2 = {Gemini: '2024-02-15', GPT4o: '2024-05-13'}. Delta: 88 days. Finalizing answer.",
          },
          {
            phase: "Final Answer",
            detail: "Emit target response sequence. Exit ReAct policy trajectory.",
            text: "Answer: Let t_1 = Feb 15, 2024, t_2 = May 13, 2024. t_2 - t_1 ≈ 88 days (Gemini 1.5 lead).",
          },
        ];
      case "systems":
        return [
          {
            phase: "Thought",
            detail: "Initialize ReAct agent loop. VRAM utilization: 1.2k tokens in active KV cache. Budget: 5 HTTP roundtrips maximum.",
            text: "Thought: Goal: date comparison. Current execution context: 1.2k tokens. Initiating search network request.",
          },
          {
            phase: "Action",
            detail: "Execute REST API query to search tool. System records network roundtrip latency.",
            text: "Action: call_tool('search', { q: 'Gemini 1.5 release date' }) // REST HTTP POST, Latency ~125ms",
          },
          {
            phase: "Observation",
            detail: "Tool returns response. KV cache increases by 220 tokens. State memory grows.",
            text: "Observation: 'Google released Gemini 1.5 on Feb 15, 2024.' // +220 input tokens, VRAM +1.15 MB",
          },
          {
            phase: "Thought (Loop)",
            detail: "Context window utilized: 15%. Initiating second parallelized network query to retrieve remaining date dependency.",
            text: "Thought: Gemini date resolved. VRAM stable. Dispatching query for GPT-4o release date.",
          },
          {
            phase: "Action (Loop)",
            detail: "Dispatch HTTP request for GPT-4o date. Latency recorded.",
            text: "Action: call_tool('search', { q: 'GPT-4o release date' }) // REST HTTP POST, Latency ~118ms",
          },
          {
            phase: "Observation (Loop)",
            detail: "Tool returns response. KV Cache increases by 190 tokens.",
            text: "Observation: 'OpenAI released GPT-4o on May 13, 2024.' // +190 input tokens, VRAM +0.99 MB",
          },
          {
            phase: "Thought (Finalize)",
            detail: "Dependencies satisfied. Initializing response generation loop. Speculative decoding active.",
            text: "Thought: Both dates cached. Sequence generation triggered. Budget: 80 output tokens.",
          },
          {
            phase: "Final Answer",
            detail: "Emit output stream. System logs final loop latency, total VRAM consumed, and generated token count.",
            text: "Answer: Gemini 1.5 (Feb 15, 2024) predates GPT-4o (May 13, 2024). Latency: 2.1s (total loops), 540 tokens.",
          },
        ];
    }
  }, [activeLevel]);

  return (
    <div className="flex flex-col min-h-dvh relative overflow-hidden">
      {/* ── Background Glow ──────────────────────────────────────────────── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-10 left-10 w-96 h-96 rounded-full bg-accent-violet/5 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-accent-cyan/5 blur-[150px] animate-pulse-glow [animation-delay:2s]" />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <section className="text-center mb-16 stagger">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-medium text-accent-violet mb-5">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <path d="M12 2v20" />
              <path d="M2 12h20" />
            </svg>
            Inside the Black Box
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-text-primary">
            How Large Language Models Work
          </h1>
          <p className="mt-4 text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            <TechTerm term="LLM">LLMs</TechTerm> are often referred to as black boxes. In this guide, we break down
            the core mechanics — from <TechTerm term="Token">tokens</TechTerm> to <TechTerm term="Self-Attention">self-attention</TechTerm>, and decoding to agentic <TechTerm term="loops">loops</TechTerm>.
          </p>
        </section>

        {/* ── Audience Level Selector ─────────────────────────────────────── */}
        <div className="flex justify-center mb-12 relative z-20">
          <div className="inline-flex p-1.5 rounded-2xl glass border border-border-default/60 shadow-lg">
            {(["casual", "developer", "researcher", "systems"] as const).map((level) => {
              const label =
                level === "casual"
                  ? "🐣 Casual (ELI5)"
                  : level === "developer"
                  ? "💻 Developer"
                  : level === "researcher"
                  ? "🔬 Researcher (Math)"
                  : "⚙️ Systems & MLOps";
              const isActive = activeLevel === level;
              return (
                <button
                  key={level}
                  onClick={() => setActiveLevel(level)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-r from-accent-cyan/15 to-accent-violet/15 text-text-primary border border-accent-cyan/35 shadow-inner"
                      : "text-text-muted hover:text-text-primary border border-transparent"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glow-line mb-16" />

        {/* ── SECTION 0: The Roots (Classical & Biological AI) ──────────────── */}
        <section className="glass rounded-2xl p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center font-bold text-sm">
              S0
            </span>
            <h2 className="text-2xl font-bold text-text-primary">The Roots: How We Got Here</h2>
          </div>
          
          <p className="text-text-secondary text-sm sm:text-base leading-relaxed mb-6">
            {activeLevel === "casual" && (
              "Before we dive into modern large language models, it helps to understand where AI came from. Modern AI is built on ideas from human biology, rules of logic, and older sequential reading networks. Click any card below to explore."
            )}
            {activeLevel === "developer" && (
              "Modern Transformer architectures didn't emerge in a vacuum. They are the evolutionary culmination of biological brain modeling, classical symbolic logic, and sequential neural architectures. Click a card to explore their core mechanics and bottlenecks."
            )}
            {activeLevel === "researcher" && (
              "Prior to the transduction bottleneck resolution by self-attention, sequence modeling relied on recurrent hidden-state mappings and symbolic logical induction. Click a card to examine the mathematical foundations and limitations of these pre-Transformer paradigms."
            )}
            {activeLevel === "systems" && (
              "The design of deep learning hardware is intrinsically tied to algorithmic history. The shift from sparse neuromorphic modeling and pointer-chasing symbolic logic to regular, dense tensor operations defined the modern GPU accelerator era. Click a card to examine their hardware footprints."
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Biological Neural Networks */}
            <div 
              onClick={() => setExpandedCard(expandedCard === 0 ? null : 0)}
              className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                expandedCard === 0 
                  ? "bg-white/[0.02] border-accent-cyan shadow-lg md:col-span-3" 
                  : "bg-surface-secondary/40 border-border-default/60 hover:bg-surface-tertiary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🧠</span>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm sm:text-base">Biological Neural Networks</h3>
                    <span className="text-[10px] uppercase font-semibold tracking-wide text-text-muted">Brain-inspired computes</span>
                  </div>
                </div>
                <span className="text-xs text-accent-cyan font-semibold">
                  {expandedCard === 0 ? "Collapse ▲" : "Expand ▼"}
                </span>
              </div>
              
              {expandedCard === 0 && (
                <div className="mt-4 pt-4 border-t border-border-default/40 text-xs sm:text-sm text-text-secondary leading-relaxed space-y-3 animate-fade-in">
                  <p>
                    {activeLevel === "casual" && (
                      "Think of your brain like billions of friendly people (neurons) standing in a huge crowd. When someone taps you on the shoulder with a note, you read it, think about it, and if it's exciting enough, you tap the next person. In AI, weights act like how hard someone taps you, and activation functions decide if you'll pass the message along!"
                    )}
                    {activeLevel === "developer" && (
                      "Artificial Neural Networks are modeled after the biological brain. Dendrites receive input signals, the cell body sums them, and the axon fires a spike if the threshold is met. In code, we represent this as inputs multiplied by weights, summed with a bias, and passed through an activation function like ReLU to introduce non-linearity."
                    )}
                    {activeLevel === "researcher" && (
                      <span>
                        Biological neural transmission is modeled via the artificial neuron:{" "}
                        <code className="text-accent-cyan-light font-mono px-1 py-0.5 bg-surface-secondary rounded">
                          a_j = σ(∑ w_jk a_k + b_j)
                        </code>
                        , where w represents synaptic weights, b represents activation thresholds (bias), and σ represents a non-linear activation function (such as ReLU or Sigmoid). Weights are optimized iteratively using backpropagation to minimize a defined cost function.
                      </span>
                    )}
                    {activeLevel === "systems" && (
                      "Biological systems leverage asynchronous, sparse, spike-based communication. Silicon accelerators (GPUs/TPUs), by contrast, are optimized for high-density, synchronous matrix multiplication. Emulating biology via sparse neuromorphic architectures (e.g. Intel Loihi) suffers from scheduling overhead, directing industry research toward dense tensor computes."
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Card 2: Symbolic & Rule-Based AI */}
            <div 
              onClick={() => setExpandedCard(expandedCard === 1 ? null : 1)}
              className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                expandedCard === 1 
                  ? "bg-white/[0.02] border-accent-cyan shadow-lg md:col-span-3" 
                  : "bg-surface-secondary/40 border-border-default/60 hover:bg-surface-tertiary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">💾</span>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm sm:text-base">Symbolic &amp; Rule-Based AI</h3>
                    <span className="text-[10px] uppercase font-semibold tracking-wide text-text-muted">Logical &quot;If-Else&quot; Engines</span>
                  </div>
                </div>
                <span className="text-xs text-accent-cyan font-semibold">
                  {expandedCard === 1 ? "Collapse ▲" : "Expand ▼"}
                </span>
              </div>
              
              {expandedCard === 1 && (
                <div className="mt-4 pt-4 border-t border-border-default/40 text-xs sm:text-sm text-text-secondary leading-relaxed space-y-3 animate-fade-in">
                  <p>
                    {activeLevel === "casual" && (
                      "Imagine a giant instruction book filled with 'If-Else' rules. 'If it is raining, take an umbrella.' This is symbolic AI. It works perfectly for simple directions, but if you ask it a question not in the book (like translating a poem), it gets stuck because it can't learn or adapt on its own."
                    )}
                    {activeLevel === "developer" && (
                      "Before deep learning, AI was dominated by Symbolic AI (Expert Systems). Developers manually programmed massive decision trees and knowledge representations. While excellent for deterministic, rule-bound tasks (like tax software), it failed at fuzzy pattern recognition (like speech or vision) due to the combinatorial explosion of rules."
                    )}
                    {activeLevel === "researcher" && (
                      <span>
                        Symbolic AI leverages formal logic, ontologies, and heuristic search space traversal. It operates on discrete symbols rather than continuous vector spaces. The computational complexity typically scales factorially{" "}
                        <code className="text-accent-cyan-light font-mono px-1 py-0.5 bg-surface-secondary rounded">
                          O(n!)
                        </code>{" "}
                        with problem depth, leading to search-space bottlenecks that require neural approximations to resolve.
                      </span>
                    )}
                    {activeLevel === "systems" && (
                      "Logical rule engines rely on dynamic graph traversal and recursive lookup tables. In hardware, this results in non-sequential memory layouts (pointer chasing) and severe cache miss penalties. Silicon architectures favor regular, contiguous data arrays (GEMM operations) over tree searches, rendering symbolic approaches inefficient for parallel scale."
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Card 3: Recurrent & Sequential AI */}
            <div 
              onClick={() => setExpandedCard(expandedCard === 2 ? null : 2)}
              className={`p-5 rounded-xl border transition-all duration-300 cursor-pointer ${
                expandedCard === 2 
                  ? "bg-white/[0.02] border-accent-cyan shadow-lg md:col-span-3" 
                  : "bg-surface-secondary/40 border-border-default/60 hover:bg-surface-tertiary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔄</span>
                  <div>
                    <h3 className="font-bold text-text-primary text-sm sm:text-base">Recurrent &amp; Sequential AI</h3>
                    <span className="text-[10px] uppercase font-semibold tracking-wide text-text-muted">Early NLP (RNNs &amp; LSTMs)</span>
                  </div>
                </div>
                <span className="text-xs text-accent-cyan font-semibold">
                  {expandedCard === 2 ? "Collapse ▲" : "Expand ▼"}
                </span>
              </div>
              
              {expandedCard === 2 && (
                <div className="mt-4 pt-4 border-t border-border-default/40 text-xs sm:text-sm text-text-secondary leading-relaxed space-y-3 animate-fade-in">
                  <p>
                    {activeLevel === "casual" && (
                      "Imagine reading a long book, but you can only see one word at a time, and you have to forget the beginning of the sentence by the time you reach the end. This is how early language models worked. They read text step-by-step and frequently forgot context if the sentence was too long!"
                    )}
                    {activeLevel === "developer" && (
                      "Recurrent Neural Networks (RNNs) and LSTMs process sequences sequentially, maintaining a hidden state vector that updates at each step. Because they process tokens one-by-one, they cannot parallelize training easily, and they suffer from vanishing gradients, limiting their effective context memory."
                    )}
                    {activeLevel === "researcher" && (
                      <span>
                        For a sequence, a recurrent network computes hidden states{" "}
                        <code className="text-accent-cyan-light font-mono px-1 py-0.5 bg-surface-secondary rounded">
                          h_t = tanh(W_hh h_t-1 + W_xh x_t)
                        </code>
                        . Backpropagating gradients through time (BPTT) requires multiplying weight matrices repeatedly, which leads to exponential decay (vanishing gradient) or explosion, mathematically limiting long-range dependency modeling.
                      </span>
                    )}
                    {activeLevel === "systems" && (
                      <span>
                        Recurrent layers execute sequentially with step complexity{" "}
                        <code className="text-accent-cyan-light font-mono px-1 py-0.5 bg-surface-secondary rounded">
                          O(T)
                        </code>
                        . In parallel computing, this serial step dependency causes GPU tensor cores to idle (ALU starvation) because threads cannot begin execution for step t until t-1 finishes. This serial execution profile is memory-bandwidth bound and fails to utilize large hardware clusters.
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── SECTION 1: Tokens & Embeddings ──────────────────────────────── */}
        <section className="glass rounded-2xl p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-accent-violet/10 text-accent-violet flex items-center justify-center font-bold text-sm">
              S1
            </span>
            <h2 className="text-2xl font-bold text-text-primary">Tokens &amp; Embeddings</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-6">
            <div className="text-text-secondary text-sm sm:text-base leading-relaxed space-y-4">
              {activeLevel === "casual" && (
                <>
                  <p>
                    AI models don&apos;t read words like humans do. First, a <TechTerm term="Tokenizer"><strong>tokenizer</strong></TechTerm> cuts words into smaller, byte-sized puzzle pieces called <TechTerm term="Token"><strong>tokens</strong></TechTerm> (similar to slicing a long word like &quot;running&quot; into &quot;run&quot; and &quot;##ning&quot;). This helps the model recognize grammatical roots easily.
                  </p>
                  <p>
                    Each token is turned into a unique <TechTerm term="Integer">integer</TechTerm> ID. Then, the AI uses a lookup table to translate these IDs into <TechTerm term="Embedding"><strong>embeddings</strong></TechTerm>. Think of embeddings as coordinates on a giant &quot;meaning map&quot; (<TechTerm term="Vector">vectors</TechTerm>). In this map, words with similar meanings (like &quot;apple&quot; and &quot;banana&quot;) are positioned right next to each other, while &quot;car&quot; is far away.
                  </p>
                </>
              )}
              {activeLevel === "developer" && (
                <>
                  <p>
                    Models cannot read text directly. First, a <TechTerm term="Tokenizer"><strong>tokenizer</strong></TechTerm> splits text into
                    subword fragments called <TechTerm term="Token"><strong>tokens</strong></TechTerm>. Common prefixes or suffixes
                    (like <code>##ing</code> or BPE space markers <code>Ġ</code>) are isolated
                    to allow the model to recognize grammatical roots <span className="text-text-muted">[Radford et al. 2018]</span>.
                  </p>
                  <p>
                    Each <TechTerm term="Token">token</TechTerm> is mapped to a unique <TechTerm term="Integer">integer</TechTerm> ID. Then, a lookup table translates
                    these IDs into <TechTerm term="Embedding"><strong>embeddings</strong></TechTerm>: dense <TechTerm term="Vector">vectors</TechTerm> (often 4096+ dimensions) that position
                    words in a semantic space. In this space, words with similar meanings (like &quot;king&quot;
                    and &quot;queen&quot;) are grouped close together.
                  </p>
                </>
              )}
              {activeLevel === "researcher" && (
                <>
                  <p>
                    Text sequences are ingested by first parsing them via a subword <TechTerm term="Tokenizer"><strong>tokenizer</strong></TechTerm> (e.g. Byte-Pair Encoding or WordPiece) into discrete <TechTerm term="Token"><strong>tokens</strong></TechTerm>. This maps raw strings to a vocabulary set <span className="font-serif italic">V</span> while retaining morphological and semantic subword cues.
                  </p>
                  <p>
                    Each token index <span className="font-serif italic">t ∈ V</span> is represented as a one-hot vector and projected into a continuous space using a learnable embedding weight matrix <code className="text-accent-cyan-light font-mono px-1 py-0.5 bg-surface-secondary/50 rounded">{"W_e ∈ ℝ^(d × |V|)"}</code>, yielding dense <TechTerm term="Embedding"><strong>embeddings</strong></TechTerm> (high-dimensional <TechTerm term="Vector">vectors</TechTerm> of dimension <span className="font-serif italic font-bold">d</span>). These project tokens into a latent space where semantic proximity is optimized via cosine similarity.
                  </p>
                </>
              )}
              {activeLevel === "systems" && (
                <>
                  <p>
                    In high-throughput serving systems, tokenization is offloaded to CPU-bound asynchronous threads to prevent GPU starvation. The raw token stream indexes into an <TechTerm term="Embedding">embedding</TechTerm> lookup table.
                  </p>
                  <p>
                    Because embedding retrieval is a sparse index gather operation over a matrix of size <MathVar symbol="|V|" glossaryKey="|V|" /> &times; <MathVar symbol="d_model" glossaryKey="d_model" />, it requires minimal ALU logic but saturates memory-bus bandwidth. This makes the embedding phase highly memory-bandwidth bound during serving.
                  </p>
                </>
              )}
            </div>

            {/* Sandbox Container */}
            <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
              <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">
                Interactive Tokenizer Sandbox
              </h3>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your sentence here..."
                className="w-full h-24 p-3 rounded-lg bg-surface-primary/80 border border-border-default text-sm text-text-primary focus:outline-none focus:border-accent-violet transition-colors resize-none mb-4"
              />

              <div className="flex flex-wrap gap-1.5 p-3 rounded-lg bg-surface-secondary/40 border border-border-default/60 min-h-[60px]">
                {tokens.length === 0 ? (
                  <span className="text-xs text-text-muted italic">
                    Tokens will be displayed here...
                  </span>
                ) : (
                  tokens.map((token, i) => (
                    <div
                      key={i}
                      className={`group relative text-xs px-2 py-1 rounded border font-mono flex flex-col items-center transition-all ${token.colorClass}`}
                    >
                      <span className="font-semibold">{token.text}</span>
                      <span className="text-[9px] opacity-60 mt-0.5">#{token.id}</span>
                    </div>
                  ))
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border-default/40 space-y-2.5">
                <p className="text-[10px] text-text-muted">
                  💡 Space characters are replaced with BPE visualizers (<code>Ġ</code>) and long words are split into subword fragments (e.g. <code>##ing</code>).
                </p>
                <div className="grid grid-cols-2 gap-2 text-[10px] font-mono p-2.5 rounded bg-surface-secondary/30 border border-border-default/30">
                  <div>
                    <span className="text-text-muted">Sequence:</span>{" "}
                    <span className="text-accent-cyan-light font-bold">{tokens.length} tokens</span>
                  </div>
                  {activeLevel === "casual" && (
                    <div>
                      <span className="text-text-muted">Analogy:</span>{" "}
                      <span className="text-accent-violet-light font-bold">Puzzle Pieces</span>
                    </div>
                  )}
                  {activeLevel === "developer" && (
                    <>
                      <div>
                        <span className="text-text-muted">Vocab Size (|V|):</span>{" "}
                        <span className="text-accent-violet-light font-bold">50,257</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-text-muted">Embedding Dim (d):</span>{" "}
                        <span className="text-accent-emerald-light font-bold">4,096 dimensions</span>
                      </div>
                    </>
                  )}
                  {activeLevel === "researcher" && (
                    <>
                      <div>
                        <span className="text-text-muted">Projection Matrix:</span>{" "}
                        <span className="text-accent-violet-light font-bold">W_e ∈ ℝ^(4096 × 50257)</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-text-muted">Latent Space:</span>{" "}
                        <span className="text-accent-emerald-light font-bold">ℝ^(d_model) where d_model = 4096</span>
                      </div>
                    </>
                  )}
                  {activeLevel === "systems" && (
                    <>
                      <div>
                        <span className="text-text-muted">Table Size:</span>{" "}
                        <span className="text-accent-violet-light font-bold">50,257 × 4,096</span>
                      </div>
                      <div>
                        <span className="text-text-muted">Operation:</span>{" "}
                        <span className="text-accent-emerald-light font-bold">Sparse Index Gather</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-text-muted">VRAM Footprint (BF16):</span>{" "}
                        <span className="text-accent-rose-light font-bold">411.75 MB</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2: Self-Attention ───────────────────────────────────── */}
        <section className="glass rounded-2xl p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center font-bold text-sm">
              S2
            </span>
            <h2 className="text-2xl font-bold text-text-primary">Self-Attention &amp; Transformers</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-6">
            <div className="text-text-secondary text-sm sm:text-base leading-relaxed space-y-4">
              {activeLevel === "casual" && (
                <>
                  <p>
                    The core magic of the <TechTerm term="Transformer">Transformer</TechTerm> is called <TechTerm term="Self-Attention"><strong>Self-Attention</strong></TechTerm>. In a sentence, words depend on their surrounding <TechTerm term="Context">context</TechTerm>. For example, in &quot;The <TechTerm term="LLM">llm</TechTerm> read the <TechTerm term="Prompt">prompt</TechTerm> because it was relevant,&quot; we know &quot;it&quot; refers to the prompt. Self-Attention is how the model figures this out!
                  </p>
                  <p>
                    It does this by making words &quot;talk&quot; to each other. Every word sends a <TechTerm term="Query">query</TechTerm> (&quot;What am I looking for?&quot;), matches it against others&apos; <TechTerm term="Key">keys</TechTerm> (&quot;What information do I have?&quot;), and retrieves a weighted average of <TechTerm term="Vector">vectors</TechTerm>. This calculates how much &quot;<TechTerm term="Attention">attention</TechTerm>&quot; words should pay to one another.
                  </p>
                  <p>
                    By running multiple <TechTerm term="Heads"><strong>Attention Heads</strong></TechTerm> in parallel, the model behaves like a group of readers reading the same page, each focusing on different clues (like matching pronouns in one head, tracking verbs in another).
                  </p>
                </>
              )}
              {activeLevel === "developer" && (
                <>
                  <p>
                    The core engine of the <TechTerm term="Transformer">Transformer</TechTerm> is <TechTerm term="Self-Attention"><strong>Self-Attention</strong></TechTerm> <span className="text-text-muted">[Vaswani et al. 2017]</span>.
                    In a sentence, words depend on <TechTerm term="Context">context</TechTerm>. For example, in &quot;The <TechTerm term="LLM">llm</TechTerm> read the <TechTerm term="Prompt">prompt</TechTerm> because &quot;<strong>it</strong>&quot; was relevant&quot;, what does &quot;it&quot; refer to?
                  </p>
                  <p>
                    Self-Attention calculates a set of <TechTerm term="Query">query</TechTerm>, <TechTerm term="Key">key</TechTerm>, and value <TechTerm term="Vector">vectors</TechTerm>. The query for &quot;it&quot; is compared with <TechTerm term="Key">keys</TechTerm> for all other words. The model computes weights representing how much &quot;<TechTerm term="Attention">attention</TechTerm>&quot; to pay to each word.
                  </p>
                  <p>
                    <TechTerm term="Transformer">Transformers</TechTerm> run multiple <TechTerm term="Heads"><strong>Attention Heads</strong></TechTerm> in parallel. This allows the model to capture different relations simultaneously (e.g. tracking pronouns in one head, verbs in another).
                  </p>
                </>
              )}
              {activeLevel === "researcher" && (
                <>
                  <p>
                    The primary mechanism of transduction in the <TechTerm term="Transformer">Transformer</TechTerm> is <TechTerm term="Self-Attention"><strong>Self-Attention</strong></TechTerm>. For input representations, the model projects states into query, key, and value matrices to capture directional dependencies across the sequence <TechTerm term="Context">context</TechTerm>.
                  </p>
                  <p>
                    Given an input sequence representation <span className="font-serif italic font-semibold">X</span>, we compute projections <MathVar symbol="Q" /> = <span className="font-serif italic font-semibold">X</span>W_Q, <MathVar symbol="K" /> = <span className="font-serif italic font-semibold">X</span>W_K, and <MathVar symbol="V" /> = <span className="font-serif italic font-semibold">X</span>W_V. Dot-product similarity scores are computed between queries and keys, normalized using softmax to prevent gradient vanishing, and used to weight the value vectors.
                  </p>
                  <p>
                    Multi-Head Attention divides this operation across independent <TechTerm term="Heads"><strong>Attention Heads</strong></TechTerm>, projecting <MathVar symbol="Q" />, <MathVar symbol="K" />, and <MathVar symbol="V" /> into <span className="font-serif italic">h</span> subspaces. This allows the network to jointly attend to information from different representation subspaces at different positions.
                  </p>
                  <AttentionFormula />
                </>
              )}
              {activeLevel === "systems" && (
                <>
                  <p>
                    Self-Attention execution divides its execution profile into two stages. The prefill phase computes multi-head queries, keys, and values, parallelized as compute-bound dense matrix multiplication.
                  </p>
                  <p>
                    The decode phase, however, retrieves the KV cache values for every generated token. This is memory-bandwidth bound, meaning performance is capped by GPU High-Bandwidth Memory (HBM) throughput rather than FLOP capacity. Memory tiling techniques like FlashAttention keep intermediate values in fast GPU SRAM to bypass HBM read/write bottlenecks.
                  </p>
                  <div className="mt-4 p-4 rounded-xl border border-accent-cyan/35 bg-accent-cyan/5 font-mono text-[10px] sm:text-xs text-text-primary space-y-2">
                    <div className="font-bold text-accent-cyan-light uppercase tracking-wider mb-2 text-center">
                      Attention Execution Mechanics
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <span className="text-text-secondary block">Prefill Complexity (Compute-bound):</span>
                        <code className="text-accent-violet-light font-bold block">O(N² · d) FLOPs</code>
                        <span className="text-[10px] text-text-muted leading-tight block">High GPU ALU core utilization. Parallel sequence processing.</span>
                      </div>
                      <div>
                        <span className="text-text-secondary block">Decoding Complexity (Memory-bound):</span>
                        <code className="text-accent-rose-light font-bold block">O(N · d) HBM Read/Write</code>
                        <span className="text-[10px] text-text-muted leading-tight block">Stalled by GPU memory transfer rates. Requires loading full KV Cache.</span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-border-default/40">
                        <span className="text-text-secondary block">SRAM Cache Tiling (FlashAttention):</span>
                        <span className="text-accent-emerald-light font-bold block">SRAM Tiling avoids O(N²) HBM reads/writes</span>
                        <span className="text-[10px] text-text-muted leading-tight block font-sans">
                          Tiles key-value blocks directly in on-chip SRAM to evaluate softmax partitions locally without writing intermediate attention matrix back to HBM.
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Visual Attention Map */}
            <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
              <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-3">
                Interactive Attention Map
              </h3>

              {/* Head selection */}
              <div className="flex gap-2 mb-4">
                {ATTENTION_HEADS.map((head, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveHeadIdx(idx);
                      setHoveredWordIdx(null);
                    }}
                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${
                      activeHeadIdx === idx
                        ? "bg-accent-cyan/10 border-accent-cyan text-accent-cyan"
                        : "bg-surface-secondary border-border-default text-text-secondary hover:text-text-primary"
                    }`}
                  >
                    Head {idx + 1}
                  </button>
                ))}
              </div>

              <p className="text-xs text-text-muted mb-4 italic">
                {activeHead.description}
              </p>

              {/* Attention Visualization Box */}
              <div className="relative flex justify-between p-4 rounded-xl bg-surface-primary/70 border border-border-default/60 select-none">
                {/* Left Column - Query Words */}
                <div className="flex flex-col gap-2 z-10 w-24">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                    Query Word
                  </span>
                  {ATTENTION_WORDS.map((word, idx) => (
                    <div
                      key={idx}
                      onMouseEnter={() => setHoveredWordIdx(idx)}
                      onMouseLeave={() => setHoveredWordIdx(null)}
                      className={`text-xs h-[28px] flex items-center px-2 rounded cursor-pointer transition-all border ${
                        hoveredWordIdx === idx
                          ? "bg-accent-cyan/15 border-accent-cyan text-text-primary font-semibold"
                          : "bg-surface-secondary border-border-default/50 text-text-secondary"
                      }`}
                    >
                      {word}
                    </div>
                  ))}
                </div>

                {/* SVG Connections Container */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  style={{ zIndex: 5 }}
                >
                  {hoveredWordIdx !== null &&
                    ATTENTION_WORDS.map((_, targetIdx) => {
                      const weight = activeHead.matrix[hoveredWordIdx][targetIdx];
                      // Normalize visibility threshold
                      if (weight < 0.02) return null;

                      // Calculate SVG line paths. Offset top margin and compute positions.
                      const startY = 48 + hoveredWordIdx * 36 + 14;
                      const endY = 48 + targetIdx * 36 + 14;
                      // Middle control points for bezier curves
                      const x1 = 110;
                      const x2 = 280;

                      return (
                        <path
                          key={targetIdx}
                          d={`M ${x1} ${startY} C ${(x1 + x2) / 2} ${startY}, ${(x1 + x2) / 2} ${endY}, ${x2} ${endY}`}
                          fill="none"
                          stroke="var(--color-accent-cyan)"
                          strokeWidth={Math.max(weight * 8, 1)}
                          strokeOpacity={Math.max(weight, 0.08)}
                          className="transition-all duration-200"
                        />
                      );
                    })}
                </svg>

                {/* Right Column - Key Words */}
                <div className="flex flex-col gap-2 z-10 w-24 text-right">
                  <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold mb-1">
                    Key Word
                  </span>
                  {ATTENTION_WORDS.map((word, idx) => {
                    const weight =
                      hoveredWordIdx !== null
                        ? activeHead.matrix[hoveredWordIdx][idx]
                        : null;
                    return (
                      <div
                        key={idx}
                        className={`text-xs h-[28px] flex items-center justify-end px-2 rounded border transition-all ${
                          weight !== null && weight > 0.1
                            ? "bg-white/[0.03] border-accent-cyan/35 text-text-primary font-medium"
                            : "bg-surface-secondary/50 border-border-default/20 text-text-muted"
                        }`}
                      >
                        {word}
                        {weight !== null && weight > 0.05 && (
                          <span className="text-[9px] text-accent-cyan font-mono ml-1.5 opacity-80">
                            {Math.round(weight * 100)}%
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="text-[10px] text-text-muted mt-2">
                💡 Hover over words in the left column. Highlighted lines show key coordinates influencing that token&apos;s contextual state.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 3: Pre-Training to Alignment ────────────────────────── */}
        <section className="glass rounded-2xl p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-accent-amber/10 text-accent-amber flex items-center justify-center font-bold text-sm">
              S3
            </span>
            <h2 className="text-2xl font-bold text-text-primary">Pre-Training to Alignment</h2>
          </div>

          <div className="text-text-secondary text-sm sm:text-base leading-relaxed space-y-4 mb-8">
            <p>
              {activeLevel === "casual" && (
                "To turn a raw AI model into a friendly, helpful chatbot assistant, it must go through three major learning phases. Click through the phases below to see how AI goes from a raw autocomplete engine to a safe, aligned assistant."
              )}
              {activeLevel === "developer" && (
                <><TechTerm term="Frontier">Frontier</TechTerm> models go through three major training phases to become reliable and safe assistants <span className="text-text-muted">[Ouyang et al. 2022]</span>. Click through the phases below to see how datasets and model behaviors change.</>
              )}
              {activeLevel === "researcher" && (
                "Aligning neural representations to human intent requires transitioning from unconstrained next-token prediction to preference-guided policy optimization. Click through the stages below to analyze dataset schemas and training paradigms across the alignment stack."
              )}
              {activeLevel === "systems" && (
                "Optimizing parameter models at scale requires sharded training frameworks and low-rank parameter adapters. Click through the phases below to see GPU execution profiles, parallelism strategies, and alignment serving memory configurations."
              )}
            </p>
          </div>

          {/* Steps selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {trainSteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTrainStep(idx)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  activeTrainStep === idx
                    ? "bg-white/[0.02] border-text-primary shadow-lg"
                    : "bg-surface-secondary/40 border-border-default/60 hover:bg-surface-tertiary/40"
                }`}
              >
                <span className="text-xs text-text-muted block mb-1">Phase {idx + 1}</span>
                <span className="font-semibold text-text-primary block text-sm sm:text-base">
                  {step.title.split(". ")[1]}
                </span>
                <span className="text-[10px] uppercase font-semibold text-text-muted mt-2 block">
                  {step.subtitle}
                </span>
              </button>
            ))}
          </div>

          {/* Step Detail Container */}
          <div className="p-6 rounded-xl bg-white/[0.01] border border-border-default transition-all duration-300">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="font-bold text-lg text-text-primary">
                {trainSteps[activeTrainStep].title}
              </h3>
              <span
                className={`text-[10px] uppercase font-semibold tracking-wider px-2.5 py-1 rounded-full border ${trainSteps[activeTrainStep].color}`}
              >
                {trainSteps[activeTrainStep].tag}
              </span>
            </div>
            <p className="text-sm sm:text-base text-text-secondary leading-relaxed mb-6">
              <AutoGlossary text={trainSteps[activeTrainStep].description} />
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-surface-primary/80 border border-border-default/50">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-2">
                  Training Input Sample
                </span>
                <pre className="text-xs text-text-secondary whitespace-pre-wrap font-mono leading-relaxed">
                  {trainSteps[activeTrainStep].datasetExample.input}
                </pre>
              </div>
              <div className="p-4 rounded-lg bg-surface-primary/80 border border-border-default/50">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-2">
                  Expected Output / Behavior
                </span>
                <pre className="text-xs text-text-primary whitespace-pre-wrap font-mono leading-relaxed">
                  {trainSteps[activeTrainStep].datasetExample.output}
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4: Decoding Simulator ───────────────────────────────── */}
        <section className="glass rounded-2xl p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-accent-emerald/10 text-accent-emerald flex items-center justify-center font-bold text-sm">
              S4
            </span>
            <h2 className="text-2xl font-bold text-text-primary">
              Decoding (Temperature &amp; Top-P)
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-6">
            <div className="text-text-secondary text-sm sm:text-base leading-relaxed space-y-4">
              {activeLevel === "casual" && (
                <>
                  <p>
                    When generating a reply, the <TechTerm term="LLM">LLM</TechTerm> predicts scores for all words in its vocabulary. We convert these scores into percentages using a formula called <TechTerm term="Softmax"><strong>Softmax</strong></TechTerm>. We control how the model picks the next word using two controls:
                  </p>
                  <ul className="space-y-3 pl-2 text-xs sm:text-sm">
                    <li>
                      <strong>🌡️ <TechTerm term="Temperature">Temperature</TechTerm>:</strong> Controls the model&apos;s creativity. Low temperature
                      makes the model pick only the highest-scoring words, leading to safe, <TechTerm term="Deterministic">deterministic</TechTerm> replies. High temperature spreads the scores out, making the output creative and unexpected.
                    </li>
                    <li>
                      <strong>🎯 Top-P (Nucleus Sampling):</strong> <TechTerm term="Truncate">Truncates</TechTerm> or cuts off the list of choices, keeping only the top candidates whose sum is under <span className="font-serif italic font-semibold">P</span>. This discards unlikely words in the tail of the distribution.
                    </li>
                  </ul>
                </>
              )}
              {activeLevel === "developer" && (
                <>
                  <p>
                    At <TechTerm term="Inference">inference</TechTerm>, an <TechTerm term="LLM">LLM</TechTerm> outputs logits (raw scores) for every <TechTerm term="Token">token</TechTerm> in its vocabulary.
                    These are turned into probabilities using <TechTerm term="Softmax"><strong>Softmax</strong></TechTerm>. We control the
                    randomness and diversity of outputs using two <TechTerm term="Parameter">parameters</TechTerm>:
                  </p>
                  <ul className="space-y-3 pl-2 text-xs sm:text-sm">
                    <li>
                      <strong>🌡️ <TechTerm term="Temperature">Temperature</TechTerm>:</strong> Controls distribution scale. Low temperature
                      (&lt; 0.5) compresses values, sharpening the peaks so the model repeatedly picks the
                      absolute highest score (factual/<TechTerm term="Deterministic">deterministic</TechTerm>). High temperature (&gt; 1.0) flattens
                      the curves, increasing diversity (creative/unpredictable).
                    </li>
                    <li>
                      <strong>🎯 Top-P (Nucleus Sampling):</strong> <TechTerm term="Truncate">Truncates</TechTerm> the probability distribution
                      to include only a subset whose cumulative sum is under <span className="font-serif italic font-semibold">P</span>. <TechTerm term="Token">Tokens</TechTerm> in the tail whose sum exceeds
                      <span className="font-serif italic font-semibold">P</span> are completely discarded.
                    </li>
                  </ul>
                </>
              )}
              {activeLevel === "researcher" && (
                <>
                  <p>
                    At each step of autoregressive <TechTerm term="Inference">inference</TechTerm>, the model projects hidden states to output logits <MathVar symbol="z_i" /> for all tokens in the vocabulary. These are mapped to a probability distribution using <TechTerm term="Softmax"><strong>Softmax</strong></TechTerm> scaling. We modify the entropy of this distribution using two hyperparameters:
                  </p>
                  <ul className="space-y-3 pl-2 text-xs sm:text-sm">
                    <li>
                      <strong>🌡️ <TechTerm term="Temperature">Temperature</TechTerm> (<MathVar symbol="T" />):</strong> Scaling logits by dividing them by <MathVar symbol="T" /> prior to exponentiation. When <MathVar symbol="T" /> approaches 0, the distribution converges to a one-hot argmax vector (<TechTerm term="Deterministic">deterministic</TechTerm> greedy decoding). When <MathVar symbol="T" /> increases, the entropy increases, flattening the probability density function.
                    </li>
                    <li>
                      <strong>🎯 Top-P (Nucleus Sampling):</strong> <TechTerm term="Truncate">Truncates</TechTerm> the vocabulary to include only the minimal subset of tokens whose cumulative probability exceeds threshold <span className="font-serif italic font-semibold">P</span>. This dynamically clips the probability tail based on prediction confidence.
                    </li>
                  </ul>
                  <SoftmaxFormula />
                </>
              )}
              {activeLevel === "systems" && (
                <>
                  <p>
                    Autoregressive generation consists of two phases: <strong>Prefill</strong> and <strong>Decode</strong>. Prefill processes input tokens in parallel, which is compute-bound. Decode runs sequentially (token-by-token) and is memory-bandwidth bound, loading the model parameters and the KV cache from HBM for every token generated.
                  </p>
                  <p>
                    To speed up generation, we use **Speculative Decoding**. A tiny, fast draft model guesses several tokens, which the large target model verifies in parallel in a single GPU pass. This increases arithmetic intensity and reduces average latency.
                  </p>
                </>
              )}
            </div>

            {/* Interactive Simulator */}
            <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default">
              <h3 className="text-xs uppercase tracking-wider text-text-muted font-semibold mb-4">
                Decoding Parameter Simulator
              </h3>

              <div className="space-y-4 mb-6">
                {/* Temperature slider */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-text-secondary font-medium">
                      Temperature: <code className="text-accent-emerald font-bold">{temperature}</code>
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {temperature <= 0.3 ? "Deterministic" : temperature >= 1.2 ? "Highly Creative" : "Balanced"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="2.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-surface-tertiary appearance-none cursor-pointer accent-accent-emerald"
                  />
                </div>

                {/* Top-P slider */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-text-secondary font-medium">
                      Top-P (Nucleus): <code className="text-accent-cyan font-bold">{topP}</code>
                    </span>
                    <span className="text-[10px] text-text-muted">
                      {topP <= 0.4 ? "Narrow Cutoff" : topP >= 0.9 ? "Broad Selection" : "Nucleus"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(parseFloat(e.target.value))}
                    className="w-full h-1.5 rounded-lg bg-surface-tertiary appearance-none cursor-pointer accent-accent-cyan"
                  />
                </div>
              </div>

              {/* Dynamic Probabilities Bar Chart */}
              <div className="space-y-2.5 p-4 rounded-xl bg-surface-primary/70 border border-border-default/60">
                <span className="text-[10px] uppercase tracking-wider text-text-muted font-bold block mb-2">
                  Next Token Probabilities (Prompt: &quot;The weather is very...&quot;)
                </span>
                {candidateTokens.map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span
                        className={`font-semibold font-mono ${
                          item.filtered ? "text-text-muted/40 line-through" : "text-text-primary"
                        }`}
                      >
                        &quot;{item.token}&quot;
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-muted font-mono text-[10px]">
                          logit: {item.logit}
                        </span>
                        <span
                          className={`font-bold font-mono text-[11px] ${
                            item.filtered ? "text-text-muted/40" : "text-accent-emerald"
                          }`}
                        >
                          {(item.prob * 100).toFixed(1)}%
                        </span>
                        {item.filtered && (
                          <span className="text-[8px] bg-red-500/15 border border-red-500/20 text-red-400 px-1 py-0.5 rounded font-mono font-bold uppercase scale-90">
                            Cutoff
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Bar background */}
                    <div className="w-full h-2 rounded-full bg-surface-tertiary overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          item.filtered
                            ? "bg-text-muted/10"
                            : "bg-gradient-to-r from-accent-emerald/80 to-accent-cyan/80"
                        }`}
                        style={{ width: `${item.prob * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                {activeLevel === "systems" && (
                  <div className="mt-4 pt-3 border-t border-border-default/40 grid grid-cols-2 gap-2 text-[9px] font-mono text-text-muted">
                    <div>
                      <span className="font-bold text-accent-cyan-light">Decoding Phase:</span> Memory-Bandwidth Bound
                    </div>
                    <div>
                      <span className="font-bold text-accent-rose-light">KV Cache Lookup:</span> O(1) Memory Fetch
                    </div>
                    <div className="col-span-2">
                      <span className="font-bold text-accent-emerald-light">Speculative Decoding Speedup:</span> ~1.8x to 2.4x latency reduction
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 5: RAG & Agentic Loops ──────────────────────────────── */}
        <section className="glass rounded-2xl p-6 sm:p-8 mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-8 h-8 rounded-lg bg-accent-rose/10 text-accent-rose flex items-center justify-center font-bold text-sm">
              S5
            </span>
            <h2 className="text-2xl font-bold text-text-primary">RAG &amp; Agentic Loops</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* RAG Visualizer */}
            <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default flex flex-col h-full justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1.5">
                  Retrieval-Augmented Generation (RAG)
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {activeLevel === "casual" && (
                    "AI models have a memory limit and don't know about recent news. RAG fixes this. When you ask a question, the system searches an external library (like a database) for relevant articles, then copies and pastes that info directly into the AI's question context so it can write an accurate answer without guessing."
                  )}
                  {activeLevel === "developer" && (
                    <><TechTerm term="LLM">LLMs</TechTerm> have knowledge cutoff limits. <TechTerm term="RAG">RAG</TechTerm> resolves this by fetching <TechTerm term="external">external</TechTerm> sources dynamically from a <TechTerm term="vector">vector</TechTerm> store, then feeding the data to the <TechTerm term="LLM">LLM</TechTerm> <TechTerm term="Context">context</TechTerm> <span className="text-text-muted">[Lewis et al. 2020]</span>.</>
                  )}
                  {activeLevel === "researcher" && (
                    <>Parametric knowledge in <TechTerm term="LLM">LLMs</TechTerm> is static. <TechTerm term="RAG">RAG</TechTerm> bypasses this constraint by projecting user queries into a joint embedding space, performing similarity search over <TechTerm term="external">external</TechTerm> document collections, and prepending retrieved tokens into the model&apos;s active <TechTerm term="Context">context</TechTerm> window.</>
                  )}
                  {activeLevel === "systems" && (
                    <>Serving dynamic external content requires decoupling parametric weights from fast-evolving dynamic datasets. <TechTerm term="RAG">RAG</TechTerm> executes MIPS queries against a vector indexing service (e.g., Pinecone/Milvus), streaming the output tokens into the active attention context window, shifting memory consumption to the dynamic <TechTerm term="KV Cache">KV Cache</TechTerm>.</>
                  )}
                </p>

                {/* Steps container */}
                <div className="space-y-2 mb-6">
                  {ragSteps.map((step, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveRagStep(idx)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                        activeRagStep === idx
                          ? "bg-accent-cyan/5 border-accent-cyan"
                          : "bg-surface-secondary/40 border-border-default/40 hover:bg-surface-tertiary/40"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                            activeRagStep === idx
                              ? "bg-accent-cyan text-surface-primary"
                              : "bg-surface-tertiary text-text-muted"
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold text-text-primary">
                          {step.title}
                        </span>
                      </div>
                      {activeRagStep === idx && (
                        <p className="text-[11px] text-text-secondary leading-relaxed mt-1">
                          <AutoGlossary text={step.detail} />
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic visual box */}
              <div className="p-4 rounded-lg bg-surface-primary/80 border border-border-default/50 font-mono text-[11px] text-text-muted leading-relaxed">
                <span className="text-[9px] uppercase tracking-wider text-text-muted font-bold block mb-1.5">
                  Process Output
                </span>
                <p className="text-accent-cyan-light">
                  {ragSteps[activeRagStep].visualText}
                </p>
              </div>
            </div>

            {/* Agentic Loops Visualizer */}
            <div className="p-5 rounded-xl bg-white/[0.01] border border-border-default flex flex-col h-full justify-between">
              <div>
                <h3 className="text-sm font-bold text-text-primary mb-1.5">
                  Autonomous Agentic Loops (ReAct)
                </h3>
                <p className="text-xs text-text-secondary leading-relaxed mb-4">
                  {activeLevel === "casual" && (
                    "Instead of just writing the first answer that comes to mind, AI agents can run loops (Reason-Act-Observe). They think about a plan, call tools like calculators or web search to get facts, see the result, and repeat the loop until they are sure they have the right answer."
                  )}
                  {activeLevel === "developer" && (
                    <>Rather than single-step execution, agents run <TechTerm term="loops">loops</TechTerm> (<TechTerm term="Reason-Act-Observe">Reason-Act-Observe</TechTerm>). They review their thoughts and <TechTerm term="call">call</TechTerm> <TechTerm term="external">external</TechTerm> tools iteratively <span className="text-text-muted">[Yao et al. 2022]</span>.</>
                  )}
                  {activeLevel === "researcher" && (
                    <>Rather than single-step feedforward generation, agentic architectures instantiate iterative execution <TechTerm term="loops">loops</TechTerm> (typically following ReAct paradigms: <TechTerm term="Reason-Act-Observe">Reason-Act-Observe</TechTerm>). The model generates trace reasoning steps, executes discrete tool <TechTerm term="call">calls</TechTerm> targeting <TechTerm term="external">external</TechTerm> environments, and parses feedback observations to update its policy state.</>
                  )}
                  {activeLevel === "systems" && (
                    <>Autonomous agent architectures instantiate multi-turn execution <TechTerm term="loops">loops</TechTerm> (e.g. <TechTerm term="Reason-Act-Observe">Reason-Act-Observe</TechTerm>). Each iteration triggers asynchronous tool execution (network/DB calls), introducing latency barriers and expanding active context size, which requires dynamic <TechTerm term="KV Cache">KV Cache</TechTerm> management.</>
                  )}
                </p>

                {/* Step controls */}
                <div className="flex justify-between items-center gap-2 mb-4">
                  <span className="text-xs text-text-secondary font-medium">
                    Iteration Step:{" "}
                    <code className="text-accent-rose font-bold">
                      {activeAgentStep + 1} / {agentSteps.length}
                    </code>
                  </span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setActiveAgentStep((p) => Math.max(p - 1, 0))}
                      className="px-2 py-1 rounded bg-surface-secondary border border-border-default text-[10px] text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:pointer-events-none"
                      disabled={activeAgentStep === 0}
                    >
                      Prev
                    </button>
                    <button
                      onClick={() =>
                        setActiveAgentStep((p) => Math.min(p + 1, agentSteps.length - 1))
                      }
                      className="px-2 py-1 rounded bg-surface-secondary border border-border-default text-[10px] text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:pointer-events-none"
                      disabled={activeAgentStep === agentSteps.length - 1}
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setActiveAgentStep(0)}
                      className="px-2 py-1 rounded bg-accent-rose/10 border border-accent-rose/20 text-[10px] text-accent-rose hover:bg-accent-rose/15"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>

              {/* Loop card output */}
              <div className="flex-1 flex flex-col justify-center min-h-[140px] mb-4">
                <div className="p-4 rounded-lg bg-surface-primary/70 border border-border-default/60 border-l-4 border-l-accent-rose transition-all">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-accent-rose/15 text-accent-rose uppercase tracking-wider mb-2">
                    {agentSteps[activeAgentStep].phase}
                  </span>
                  <p className="text-xs text-text-secondary leading-relaxed font-semibold mb-2">
                    <AutoGlossary text={agentSteps[activeAgentStep].detail} />
                  </p>
                  <pre className="text-[11px] text-text-primary font-mono whitespace-pre-wrap bg-surface-secondary/40 p-2.5 rounded border border-border-default/30">
                    {agentSteps[activeAgentStep].text}
                  </pre>
                </div>
              </div>

              <p className="text-[10px] text-text-muted">
                💡 Click &quot;Next&quot; to step through the agent&apos;s reasoning logs.
              </p>
            </div>
          </div>
        </section>

        {/* ── SECTION 6: References & Citations ───────────────────────────── */}
        <section className="glass rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h10" />
            </svg>
            Bibliography &amp; Research Citations
          </h2>

          <div className="space-y-4 text-xs sm:text-sm text-text-secondary">
            {/* Citation 1 */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-border-default flex gap-3 items-start">
              <span className="font-mono font-bold text-accent-violet flex-shrink-0">
                [Vaswani et al. 2017]
              </span>
              <div>
                <p className="font-semibold text-text-primary">Attention Is All You Need</p>
                <p className="text-text-muted mt-0.5">
                  Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones,
                  Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin.
                </p>
                <a
                  href="https://arxiv.org/abs/1706.03762"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-cyan hover:underline mt-2"
                >
                  View Paper on arXiv
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Citation 2 */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-border-default flex gap-3 items-start">
              <span className="font-mono font-bold text-accent-violet flex-shrink-0">
                [Radford et al. 2018]
              </span>
              <div>
                <p className="font-semibold text-text-primary">
                  Improving Language Understanding by Generative Pre-Training (GPT-1)
                </p>
                <p className="text-text-muted mt-0.5">
                  Alec Radford, Karthik Narasimhan, Tim Salimans, Ilya Sutskever.
                </p>
                <a
                  href="https://openaipublic.blob.core.windows.net/gpt-1/language_understanding_paper.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-cyan hover:underline mt-2"
                >
                  View Paper PDF
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Citation 3 */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-border-default flex gap-3 items-start">
              <span className="font-mono font-bold text-accent-violet flex-shrink-0">
                [Ouyang et al. 2022]
              </span>
              <div>
                <p className="font-semibold text-text-primary">
                  Training language models to follow instructions with human feedback (InstructGPT)
                </p>
                <p className="text-text-muted mt-0.5">
                  Long Ouyang, Jeffrey Wu, Xu Jiang, Diogo Almeida, Carroll Wainwright,
                  Pamela Mishkin, Chong Zhang, Sandhini Agarwal, Katarina Slama, Alex Ray,
                  John Schulman, Jacob Hilton, Fraser Kelton, Luke Miller, Maddie Simens,
                  Amanda Askell, Peter Welinder, Paul F. Christiano, Jan Leike, Ryan Lowe.
                </p>
                <a
                  href="https://arxiv.org/abs/2203.02155"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-cyan hover:underline mt-2"
                >
                  View Paper on arXiv
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Citation 4 */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-border-default flex gap-3 items-start">
              <span className="font-mono font-bold text-accent-violet flex-shrink-0">
                [Lewis et al. 2020]
              </span>
              <div>
                <p className="font-semibold text-text-primary">
                  Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks (RAG)
                </p>
                <p className="text-text-muted mt-0.5">
                  Patrick Lewis, Ethan Perez, Aleksandara Piktus, Fabio Petroni, Vladimir Karpukhin,
                  Naman Goyal, Heinrich Küttler, Mike Lewis, Wen-tau Yih, Tim Rocktäschel, Sebastian Riedel, Douwe Kiela.
                </p>
                <a
                  href="https://arxiv.org/abs/2005.11401"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-cyan hover:underline mt-2"
                >
                  View Paper on arXiv
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Citation 5 */}
            <div className="p-4 rounded-xl bg-white/[0.01] border border-border-default flex gap-3 items-start">
              <span className="font-mono font-bold text-accent-violet flex-shrink-0">
                [Yao et al. 2022]
              </span>
              <div>
                <p className="font-semibold text-text-primary">
                  ReAct: Synergizing Reasoning and Acting in Language Models
                </p>
                <p className="text-text-muted mt-0.5">
                  Shunyu Yao, Jeffrey Zhao, Dian Yu, Nan Du, Izhak Shafran, Karthik Narasimhan, Yuan Cao.
                </p>
                <a
                  href="https://arxiv.org/abs/2210.03629"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent-cyan hover:underline mt-2"
                >
                  View Paper on arXiv
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
