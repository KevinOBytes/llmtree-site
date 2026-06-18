import type { PaperNode } from "../types";

// ============================================================================
// Foundational Research Papers
// Traced from pre-Transformer era through modern alignment and reasoning
// ============================================================================

export const papers: PaperNode[] = [
  // ── Pre-Transformer Era ───────────────────────────────────────────────────
  {
    id: "paper-backprop-rnn",
    title: "Learning representations by back-propagating errors",
    shortTitle: "Backpropagation",
    authors: "Rumelhart, Hinton, Williams",
    year: 1986,
    institution: "Various (UC San Diego, CMU)",
    contribution:
      "Introduced backpropagation through time for training recurrent neural networks, enabling sequential data processing.",
    parentIds: [],
    innovations: [],
    era: "pre-transformer",
  },
  {
    id: "paper-lstm",
    title: "Long Short-Term Memory",
    shortTitle: "LSTM",
    authors: "Hochreiter, Schmidhuber",
    year: 1997,
    institution: "TU Munich / IDSIA",
    contribution:
      "Proposed gating mechanisms (input, forget, output gates) to solve the vanishing gradient problem in RNNs, enabling learning over long sequences.",
    parentIds: ["paper-backprop-rnn"],
    innovations: [],
    era: "pre-transformer",
  },
  {
    id: "paper-word2vec",
    title: "Efficient Estimation of Word Representations in Vector Space",
    shortTitle: "Word2Vec",
    authors: "Mikolov et al.",
    year: 2013,
    institution: "Google",
    contribution:
      "Developed efficient word embeddings via skip-gram and CBOW architectures, capturing semantic relationships in dense vector representations.",
    arxivUrl: "https://arxiv.org/abs/1301.3781",
    parentIds: [],
    innovations: [],
    era: "pre-transformer",
  },
  {
    id: "paper-seq2seq",
    title: "Sequence to Sequence Learning with Neural Networks",
    shortTitle: "Seq2Seq",
    authors: "Sutskever, Vinyals, Le",
    year: 2014,
    institution: "Google",
    contribution:
      "Introduced encoder-decoder RNN architectures for machine translation, establishing the pattern for generative sequence-to-sequence tasks.",
    arxivUrl: "https://arxiv.org/abs/1409.3215",
    parentIds: ["paper-lstm"],
    innovations: [],
    era: "pre-transformer",
  },
  {
    id: "paper-attention-bahdanau",
    title: "Neural Machine Translation by Jointly Learning to Align and Translate",
    shortTitle: "Attention Mechanism",
    authors: "Bahdanau, Cho, Bengio",
    year: 2014,
    institution: "University of Montreal",
    contribution:
      "Added attention to seq2seq models, allowing dynamic focus on relevant input parts rather than compressing everything into a fixed vector.",
    arxivUrl: "https://arxiv.org/abs/1409.0473",
    parentIds: ["paper-seq2seq"],
    innovations: ["attention-mechanism"],
    era: "pre-transformer",
  },

  // ── Transformer Era ───────────────────────────────────────────────────────
  {
    id: "paper-transformer",
    title: "Attention Is All You Need",
    shortTitle: "Transformer",
    authors: "Vaswani et al.",
    year: 2017,
    month: 6,
    institution: "Google Brain",
    contribution:
      "Introduced the Transformer architecture using self-attention mechanisms, replacing RNNs entirely. Enabled parallel training and superior long-range dependency modeling.",
    arxivUrl: "https://arxiv.org/abs/1706.03762",
    parentIds: ["paper-attention-bahdanau", "paper-seq2seq"],
    innovations: ["transformer", "attention-mechanism"],
    era: "transformer",
  },
  {
    id: "paper-gpt1",
    title: "Improving Language Understanding by Generative Pre-Training",
    shortTitle: "GPT-1",
    authors: "Radford et al.",
    year: 2018,
    month: 6,
    institution: "OpenAI",
    contribution:
      "First decoder-only Transformer pretrained generatively on BooksCorpus. Demonstrated zero-shot transfer learning via fine-tuning.",
    parentIds: ["paper-transformer"],
    innovations: ["autoregressive", "transformer"],
    era: "transformer",
  },
  {
    id: "paper-bert",
    title: "BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding",
    shortTitle: "BERT",
    authors: "Devlin et al.",
    year: 2018,
    month: 10,
    institution: "Google",
    contribution:
      "Encoder-only bidirectional pretraining with masked language modeling (MLM) and next-sentence prediction. Set SOTA on GLUE benchmarks.",
    arxivUrl: "https://arxiv.org/abs/1810.04805",
    parentIds: ["paper-transformer"],
    innovations: ["masked-lm", "transformer"],
    era: "transformer",
  },
  {
    id: "paper-gpt2",
    title: "Language Models are Unsupervised Multitask Learners",
    shortTitle: "GPT-2",
    authors: "Radford et al.",
    year: 2019,
    month: 2,
    institution: "OpenAI",
    contribution:
      "Scaled GPT to 1.5B parameters on WebText. Demonstrated emergent unsupervised multitask learning without task-specific fine-tuning.",
    parentIds: ["paper-gpt1"],
    innovations: ["autoregressive", "zero-shot"],
    era: "transformer",
  },
  {
    id: "paper-t5",
    title: "Exploring the Limits of Transfer Learning with a Unified Text-to-Text Transformer",
    shortTitle: "T5",
    authors: "Raffel et al.",
    year: 2019,
    institution: "Google",
    contribution:
      "Framed all NLP tasks as text-to-text problems. Scaled pretraining and fine-tuning systematically across tasks.",
    arxivUrl: "https://arxiv.org/abs/1910.10683",
    parentIds: ["paper-transformer", "paper-bert"],
    innovations: ["transformer"],
    era: "transformer",
  },
  {
    id: "paper-gpt3",
    title: "Language Models are Few-Shot Learners",
    shortTitle: "GPT-3",
    authors: "Brown et al.",
    year: 2020,
    month: 5,
    institution: "OpenAI",
    contribution:
      "175B-parameter GPT. Pioneered few-shot and in-context learning, dramatically reducing the need for fine-tuning.",
    arxivUrl: "https://arxiv.org/abs/2005.14165",
    parentIds: ["paper-gpt2"],
    innovations: ["few-shot", "autoregressive", "scaling-laws"],
    era: "transformer",
  },

  // ── Scaling Laws ──────────────────────────────────────────────────────────
  {
    id: "paper-scaling-laws",
    title: "Scaling Laws for Neural Language Models",
    shortTitle: "Scaling Laws (Kaplan)",
    authors: "Kaplan et al.",
    year: 2020,
    institution: "OpenAI",
    contribution:
      "Found that model performance follows power laws in compute, parameters, and data. Provided the mathematical framework for scaling decisions.",
    arxivUrl: "https://arxiv.org/abs/2001.08361",
    parentIds: ["paper-gpt3"],
    innovations: ["scaling-laws"],
    era: "scaling",
  },
  {
    id: "paper-chinchilla",
    title: "Training Compute-Optimal Large Language Models",
    shortTitle: "Chinchilla",
    authors: "Hoffmann et al.",
    year: 2022,
    institution: "DeepMind",
    contribution:
      "Challenged Kaplan's scaling laws by showing data should scale equally to parameters. 70B Chinchilla outperformed 280B Gopher.",
    arxivUrl: "https://arxiv.org/abs/2203.15556",
    parentIds: ["paper-scaling-laws"],
    innovations: ["scaling-laws"],
    era: "scaling",
  },

  // ── Alignment & RLHF ─────────────────────────────────────────────────────
  {
    id: "paper-rlhf-christiano",
    title: "Deep Reinforcement Learning from Human Preferences",
    shortTitle: "RLHF (Christiano)",
    authors: "Christiano et al.",
    year: 2017,
    institution: "OpenAI / DeepMind",
    contribution:
      "Pioneered the RLHF paradigm — training a reward model from human preferences, then using it to fine-tune policies via reinforcement learning.",
    arxivUrl: "https://arxiv.org/abs/1706.03741",
    parentIds: [],
    innovations: ["rlhf"],
    era: "alignment",
  },
  {
    id: "paper-instructgpt",
    title: "Training Language Models to Follow Instructions with Human Feedback",
    shortTitle: "InstructGPT",
    authors: "Ouyang et al.",
    year: 2022,
    month: 1,
    institution: "OpenAI",
    contribution:
      "Applied RLHF to GPT-3: supervised fine-tuning → reward modeling → PPO optimization. Made models safer, more helpful, and more aligned.",
    arxivUrl: "https://arxiv.org/abs/2203.02155",
    parentIds: ["paper-rlhf-christiano", "paper-gpt3"],
    innovations: ["rlhf", "instruction-tuning"],
    era: "alignment",
  },
  {
    id: "paper-constitutional-ai",
    title: "Constitutional AI: Harmlessness from AI Feedback",
    shortTitle: "Constitutional AI",
    authors: "Bai et al.",
    year: 2022,
    institution: "Anthropic",
    contribution:
      'Introduced RL from AI Feedback using "constitutions" (rule sets) for self-supervision, reducing reliance on human labels for harmlessness training.',
    arxivUrl: "https://arxiv.org/abs/2212.08073",
    parentIds: ["paper-rlhf-christiano"],
    innovations: ["constitutional-ai", "rlhf"],
    era: "alignment",
  },

  // ── Mixture of Experts ────────────────────────────────────────────────────
  {
    id: "paper-moe-shazeer",
    title: "Outrageously Large Neural Networks: The Sparsely-Gated Mixture-of-Experts Layer",
    shortTitle: "Sparse MoE",
    authors: "Shazeer et al.",
    year: 2017,
    institution: "Google",
    contribution:
      "Introduced sparsely-gated Mixture-of-Experts layers for scaling model capacity without proportional compute increase.",
    arxivUrl: "https://arxiv.org/abs/1701.06538",
    parentIds: ["paper-transformer"],
    innovations: ["mixture-of-experts"],
    era: "scaling",
  },
  {
    id: "paper-switch-transformers",
    title: "Switch Transformers: Scaling to Trillion Parameter Models with Simple and Efficient Sparsity",
    shortTitle: "Switch Transformers",
    authors: "Fedus et al.",
    year: 2021,
    institution: "Google",
    contribution:
      "Simplified MoE routing to scale to trillions of parameters efficiently. Influenced Mixtral and GPT-4/5 MoE architectures.",
    arxivUrl: "https://arxiv.org/abs/2101.03961",
    parentIds: ["paper-moe-shazeer"],
    innovations: ["mixture-of-experts"],
    era: "scaling",
  },

  // ── Chain-of-Thought & Reasoning ──────────────────────────────────────────
  {
    id: "paper-chain-of-thought",
    title: "Chain-of-Thought Prompting Elicits Reasoning in Large Language Models",
    shortTitle: "Chain-of-Thought",
    authors: "Wei et al.",
    year: 2022,
    institution: "Google",
    contribution:
      'Showed that prompting models to "think step-by-step" unlocks arithmetic, logic, and commonsense reasoning in large models like PaLM.',
    arxivUrl: "https://arxiv.org/abs/2201.11903",
    parentIds: ["paper-gpt3"],
    innovations: ["chain-of-thought", "reasoning"],
    era: "reasoning",
  },
  {
    id: "paper-react",
    title: "ReAct: Synergizing Reasoning and Acting in Language Models",
    shortTitle: "ReAct",
    authors: "Yao et al.",
    year: 2023,
    institution: "Princeton / Google",
    contribution:
      "Combined chain-of-thought reasoning with external tool use (APIs, search), improving QA and decision-making through interleaved reasoning and action.",
    arxivUrl: "https://arxiv.org/abs/2210.03629",
    parentIds: ["paper-chain-of-thought"],
    innovations: ["chain-of-thought", "tool-use", "agentic"],
    era: "reasoning",
  },
];

// Quick lookup map
export const papersById: Record<string, PaperNode> = Object.fromEntries(
  papers.map((p) => [p.id, p])
);
