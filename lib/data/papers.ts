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
    relatedModelIds: ["model-bert", "model-gpt1", "model-gpt2", "model-gpt3", "model-llama1", "model-palm"],
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
    relatedModelIds: ["model-gpt1"],
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
    relatedModelIds: ["model-bert"],
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
    relatedModelIds: ["model-gpt2"],
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
    relatedModelIds: [],
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
    relatedModelIds: ["model-gpt3", "model-codex", "model-instructgpt"],
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
    relatedModelIds: ["model-gpt3", "model-gpt4", "model-llama1", "model-llama2"],
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
    relatedModelIds: ["model-chinchilla", "model-llama1", "model-llama2", "model-mistral-7b"],
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
    relatedModelIds: ["model-instructgpt", "model-gpt3.5", "model-claude1"],
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
    relatedModelIds: ["model-instructgpt", "model-gpt3.5"],
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
    relatedModelIds: ["model-claude1", "model-claude2", "model-claude3", "model-claude3.5-sonnet"],
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
    relatedModelIds: ["model-mixtral", "model-gpt4"],
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
    relatedModelIds: ["model-mixtral", "model-gpt4", "model-deepseek-v2"],
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
    relatedModelIds: ["model-palm", "model-palm2", "model-o1", "model-o3"],
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
    relatedModelIds: ["model-gpt4", "model-claude3", "model-gemini-1"],
    innovations: ["chain-of-thought", "tool-use", "agentic"],
    era: "reasoning",
  },

  // ── Generative Models & Diffusion ──────────────────────────────────────────
  {
    id: "paper-gan",
    title: "Generative Adversarial Networks",
    shortTitle: "GANs",
    authors: "Ian Goodfellow et al.",
    year: 2014,
    month: 6,
    institution: "University of Montreal",
    contribution:
      "Introduced generative adversarial networks — two neural networks competing against each other (a generator creates fake data, a discriminator tries to detect fakes) which produces increasingly realistic outputs.",
    significance:
      "Invented the generative adversarial framework that powered the first wave of AI image generation and inspired all subsequent generative models.",
    arxivUrl: "https://arxiv.org/abs/1406.2661",
    parentIds: [],
    relatedModelIds: [],
    innovations: ["autoregressive"],
    era: "pre-transformer",
  },
  {
    id: "paper-ddpm",
    title: "Denoising Diffusion Probabilistic Models",
    shortTitle: "DDPM / Diffusion",
    authors: "Jonathan Ho, Ajay Jain, Pieter Abbeel",
    year: 2020,
    month: 6,
    institution: "UC Berkeley",
    contribution:
      "Showed that gradually adding noise to data and then learning to reverse the process could generate images rivaling GANs, with more stable training and better diversity.",
    significance:
      "Foundation of Stable Diffusion, DALL·E 2, and Imagen — replaced GANs as the dominant image generation paradigm.",
    arxivUrl: "https://arxiv.org/abs/2006.11239",
    parentIds: ["paper-gan"],
    relatedModelIds: ["model-sd15", "model-sdxl", "model-sd3"],
    innovations: ["diffusion"],
    era: "diffusion",
  },
  {
    id: "paper-dalle",
    title: "Zero-Shot Text-to-Image Generation",
    shortTitle: "DALL·E",
    authors: "Aditya Ramesh et al.",
    year: 2021,
    month: 1,
    institution: "OpenAI",
    contribution:
      "Demonstrated that a single model could generate diverse, creative images from arbitrary text descriptions, combining language understanding with image generation.",
    significance:
      "First major text-to-image model — proved AI could be genuinely creative, not just analytical.",
    arxivUrl: "https://arxiv.org/abs/2102.12092",
    parentIds: ["paper-gpt3"],
    relatedModelIds: ["model-dalle", "model-dalle2", "model-dalle3"],
    innovations: ["text-to-image", "zero-shot"],
    era: "diffusion",
  },

  // ── Vision & Multimodal ────────────────────────────────────────────────────
  {
    id: "paper-vit",
    title: "An Image is Worth 16x16 Words: Transformers for Image Recognition at Scale",
    shortTitle: "Vision Transformer (ViT)",
    authors: "Alexey Dosovitskiy et al.",
    year: 2020,
    month: 10,
    institution: "Google Brain",
    contribution:
      "Applied the Transformer architecture directly to images by splitting them into patches (16x16 pixel squares) and treating each patch like a word token, eliminating the need for convolutional neural networks.",
    significance:
      "Brought Transformers to computer vision. Every modern multimodal model (GPT-4V, Gemini, Claude Vision) descends from this insight.",
    arxivUrl: "https://arxiv.org/abs/2010.11929",
    parentIds: ["paper-transformer"],
    relatedModelIds: [],
    innovations: ["multimodal", "attention-mechanism"],
    era: "transformer",
  },
  {
    id: "paper-clip",
    title: "Learning Transferable Visual Models From Natural Language Supervision",
    shortTitle: "CLIP",
    authors: "Alec Radford et al.",
    year: 2021,
    month: 1,
    institution: "OpenAI",
    contribution:
      "Trained a model to understand both images and text by learning which image-text pairs go together from 400 million internet examples. This created a shared 'embedding space' where images and text can be directly compared.",
    significance:
      "Connected the world of images and text. Powers image search, DALL·E's text understanding, Stable Diffusion's guidance, and most multimodal AI systems.",
    arxivUrl: "https://arxiv.org/abs/2103.00020",
    parentIds: ["paper-vit", "paper-gpt2"],
    relatedModelIds: ["model-dalle", "model-sd15"],
    innovations: ["multimodal", "zero-shot"],
    era: "transformer",
  },
  {
    id: "paper-whisper",
    title: "Robust Speech Recognition via Large-Scale Weak Supervision",
    shortTitle: "Whisper",
    authors: "Alec Radford et al.",
    year: 2022,
    month: 9,
    institution: "OpenAI",
    contribution:
      "Trained a speech recognition model on 680,000 hours of multilingual audio from the internet, achieving near-human accuracy across 97 languages without any task-specific fine-tuning.",
    significance:
      "Made accurate speech-to-text accessible to everyone as an open model. Used in podcasting, accessibility, real-time translation, and meeting transcription worldwide.",
    arxivUrl: "https://arxiv.org/abs/2212.04356",
    parentIds: ["paper-transformer"],
    relatedModelIds: ["model-whisper"],
    innovations: ["speech-recognition"],
    era: "transformer",
  },

  // ── Retrieval-Augmented Generation ─────────────────────────────────────────
  {
    id: "paper-rag",
    title: "Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks",
    shortTitle: "RAG",
    authors: "Patrick Lewis et al.",
    year: 2020,
    month: 5,
    institution: "Facebook AI Research / UCL",
    contribution:
      "Combined a neural retriever (that searches a knowledge base) with a sequence-to-sequence generator, allowing the model to 'look up' relevant documents before answering — reducing hallucinations and enabling knowledge updates without retraining.",
    significance:
      "Invented the RAG pattern now used by Perplexity, enterprise search, and virtually every production LLM system that needs accurate, up-to-date information.",
    arxivUrl: "https://arxiv.org/abs/2005.11401",
    parentIds: ["paper-gpt3"],
    relatedModelIds: ["model-perplexity", "model-searchgpt"],
    innovations: ["tool-use"],
    era: "reasoning",
  },

  // ── Efficient Training & Adaptation ────────────────────────────────────────
  {
    id: "paper-lora",
    title: "LoRA: Low-Rank Adaptation of Large Language Models",
    shortTitle: "LoRA",
    authors: "Edward J. Hu et al.",
    year: 2021,
    month: 6,
    institution: "Microsoft Research",
    contribution:
      "Proposed freezing the original model weights and injecting small trainable low-rank matrices, reducing fine-tuning memory by 10,000x while maintaining quality.",
    significance:
      "Democratized AI fine-tuning — made it possible to customize billion-parameter models on consumer GPUs. Used in virtually every open-source model adaptation today.",
    arxivUrl: "https://arxiv.org/abs/2106.09685",
    parentIds: ["paper-scaling-laws"],
    relatedModelIds: [],
    innovations: ["distillation"],
    era: "scaling",
  },

  // ── Architecture Innovations ───────────────────────────────────────────────
  {
    id: "paper-flash-attention",
    title:
      "FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness",
    shortTitle: "Flash Attention",
    authors: "Tri Dao et al.",
    year: 2022,
    month: 5,
    institution: "Stanford University",
    contribution:
      "Restructured how attention computation accesses GPU memory (tiling and recomputation), achieving 2-4x speedup and enabling much longer context windows without approximation.",
    significance:
      "Made million-token context windows practical. Used in virtually every modern LLM — without Flash Attention, models like GPT-4 and Claude would be dramatically slower.",
    arxivUrl: "https://arxiv.org/abs/2205.14135",
    parentIds: ["paper-transformer"],
    relatedModelIds: [],
    innovations: ["attention-mechanism", "long-context"],
    era: "architecture",
  },
  {
    id: "paper-gshard",
    title:
      "GShard: Scaling Giant Models with Conditional Computation and Automatic Sharding",
    shortTitle: "GShard",
    authors: "Dmitry Lepikhin et al.",
    year: 2020,
    month: 6,
    institution: "Google",
    contribution:
      "Scaled Mixture-of-Experts to 600 billion parameters with automatic model parallelism across thousands of TPUs, showing how to train models far beyond single-device memory limits.",
    significance:
      "Blueprint for scaling MoE to production. Directly influenced Mixtral, DeepSeek V2/V3, and all modern MoE models.",
    arxivUrl: "https://arxiv.org/abs/2006.16668",
    parentIds: ["paper-moe-shazeer"],
    relatedModelIds: ["model-mixtral", "model-deepseek-v2"],
    innovations: ["mixture-of-experts"],
    era: "architecture",
  },
  {
    id: "paper-mamba",
    title:
      "Mamba: Linear-Time Sequence Modeling with Selective State Spaces",
    shortTitle: "Mamba",
    authors: "Albert Gu, Tri Dao",
    year: 2023,
    month: 12,
    institution: "Carnegie Mellon University / Princeton",
    contribution:
      "Introduced selective state space models that process sequences in linear time (vs. quadratic for Transformers), with a data-dependent selection mechanism that lets the model focus on relevant parts of the input.",
    significance:
      "First serious architectural challenger to the Transformer. Inspired hybrid Mamba-Transformer models like Jamba and NVIDIA Nemotron 3.",
    arxivUrl: "https://arxiv.org/abs/2312.00752",
    parentIds: ["paper-transformer"],
    relatedModelIds: [
      "model-jamba",
      "model-jamba-1.5",
      "model-nemotron3-nano",
      "model-nemotron3-super",
      "model-nemotron3-ultra",
    ],
    innovations: ["attention-mechanism"],
    era: "architecture",
  },
  {
    id: "paper-deepseek-v2",
    title:
      "DeepSeek-V2: A Strong, Economical, and Efficient Mixture-of-Experts Language Model",
    shortTitle: "DeepSeek-V2 / MLA",
    authors: "DeepSeek-AI",
    year: 2024,
    month: 5,
    institution: "DeepSeek",
    contribution:
      "Introduced Multi-head Latent Attention (MLA), which compresses the key-value cache into a low-rank latent space, dramatically reducing the memory needed to serve long-context models.",
    significance:
      "MLA became the most important attention efficiency innovation since Flash Attention. Adopted by DeepSeek-V3/R1 and influenced the entire industry's approach to efficient inference.",
    arxivUrl: "https://arxiv.org/abs/2405.04434",
    parentIds: ["paper-moe-shazeer", "paper-flash-attention"],
    relatedModelIds: [
      "model-deepseek-v2",
      "model-deepseek-v3",
      "model-deepseek-r1",
    ],
    innovations: ["mixture-of-experts", "attention-mechanism"],
    era: "architecture",
  },

  // ── Alignment Advances ─────────────────────────────────────────────────────
  {
    id: "paper-dpo",
    title:
      "Direct Preference Optimization: Your Language Model is Secretly a Reward Model",
    shortTitle: "DPO",
    authors: "Rafael Rafailov et al.",
    year: 2023,
    month: 5,
    institution: "Stanford University",
    contribution:
      "Showed that preference learning could be formulated as a simple classification problem on pairs of outputs, eliminating the need for a separate reward model and the instabilities of PPO training.",
    significance:
      "Simplified RLHF from a complex multi-stage pipeline to a single training step. Adopted by LLaMA 3, Mixtral, Tülu, and most modern open models.",
    arxivUrl: "https://arxiv.org/abs/2305.18290",
    parentIds: ["paper-rlhf-christiano", "paper-instructgpt"],
    relatedModelIds: ["model-tulu3"],
    innovations: ["rlhf"],
    era: "alignment",
  },

  // ── Open-Source LLMs ───────────────────────────────────────────────────────
  {
    id: "paper-llama",
    title: "LLaMA: Open and Efficient Foundation Language Models",
    shortTitle: "LLaMA",
    authors: "Hugo Touvron et al.",
    year: 2023,
    month: 2,
    institution: "Meta AI",
    contribution:
      "Showed that smaller models trained on significantly more data (following Chinchilla scaling laws) could match or exceed the performance of much larger models, and released the weights openly.",
    significance:
      "Kicked off the open-source LLM revolution. LLaMA's leak and subsequent open release spawned Alpaca, Vicuna, and hundreds of community models — democratizing access to frontier AI.",
    arxivUrl: "https://arxiv.org/abs/2302.13971",
    parentIds: ["paper-chinchilla", "paper-gpt3"],
    relatedModelIds: ["model-llama1", "model-llama2", "model-llama3"],
    innovations: ["open-weight", "scaling-laws"],
    era: "scaling",
  },
  {
    id: "paper-llama2",
    title: "Llama 2: Open Foundation and Fine-Tuned Chat Models",
    shortTitle: "LLaMA 2",
    authors: "Hugo Touvron et al.",
    year: 2023,
    month: 7,
    institution: "Meta AI",
    contribution:
      "Provided the most detailed public documentation of how to train, fine-tune, and safety-align a large language model, including their full RLHF methodology.",
    significance:
      "The 'recipe book' for the open-source LLM community. Its detailed training methodology was copied by virtually every open model that followed.",
    arxivUrl: "https://arxiv.org/abs/2307.09288",
    parentIds: ["paper-llama", "paper-instructgpt"],
    relatedModelIds: ["model-llama2", "model-codellama"],
    innovations: ["open-weight", "rlhf", "instruction-tuning"],
    era: "scaling",
  },
];

// Quick lookup map
export const papersById: Record<string, PaperNode> = Object.fromEntries(
  papers.map((p) => [p.id, p])
);
