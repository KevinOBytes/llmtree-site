import type { HardwareNode } from "../types";

// ============================================================================
// Hardware Accelerator Timeline
// GPU, TPU, and custom silicon that enabled AI breakthroughs
// ============================================================================

export const hardware: HardwareNode[] = [
  // ── NVIDIA ────────────────────────────────────────────────────────────────
  {
    id: "hw-nvidia-v100",
    name: "Tesla V100",
    manufacturer: "nvidia",
    releaseDate: "2017-05",
    specs: {
      memory: "16/32 GB HBM2",
      compute: "125 TFLOPS FP16 Tensor",
      transistors: "21.1B",
      process: "12nm",
    },
    description:
      "NVIDIA's first Tensor Core GPU. Introduced mixed-precision training, enabling efficient large-scale model training for the Transformer era.",
    enabledModels: ["model-bert", "model-gpt1"],
    enabledBreakthroughs: "Enabled training of BERT (2018) and the first wave of Transformer-based models via mixed-precision computing.",
  },
  {
    id: "hw-nvidia-a100",
    name: "A100",
    manufacturer: "nvidia",
    releaseDate: "2020-05",
    specs: {
      memory: "40/80 GB HBM2e",
      compute: "312 TFLOPS FP16 Tensor",
      transistors: "54.2B",
      process: "7nm",
    },
    description:
      "Ampere architecture GPU that powered the GPT-3 era. Multi-Instance GPU (MIG) technology enabled efficient cluster utilization.",
    enabledModels: ["model-gpt3", "model-palm"],
    enabledBreakthroughs: "Powered GPT-3 (175B) training and widespread adoption of 100B+ parameter models.",
  },
  {
    id: "hw-nvidia-h100",
    name: "H100",
    manufacturer: "nvidia",
    releaseDate: "2022-09",
    specs: {
      memory: "80/94 GB HBM3",
      compute: "1,979 TFLOPS FP8 Tensor",
      transistors: "80B",
      process: "4nm",
    },
    description:
      "Hopper architecture GPU with Transformer Engine for automatic mixed precision. The workhorse of the GPT-4 and multimodal era.",
    enabledModels: ["model-gpt4", "model-claude3"],
    enabledBreakthroughs: "Drove training of GPT-4, Claude 3, and Gemini. Enabled trillion-parameter models via massive cluster deployments.",
  },
  {
    id: "hw-nvidia-h200",
    name: "H200",
    manufacturer: "nvidia",
    releaseDate: "2023-11",
    specs: {
      memory: "141 GB HBM3e",
      compute: "~1,979 TFLOPS FP8 Tensor",
      transistors: "80B",
      process: "4nm",
    },
    description:
      "Memory-enhanced H100 variant with 76% more HBM capacity, optimized for inference of long-context models.",
    enabledBreakthroughs: "Enhanced inference efficiency for long-context models like Gemini 1.5 (1M tokens).",
  },
  {
    id: "hw-nvidia-b100",
    name: "B100 / B200",
    manufacturer: "nvidia",
    releaseDate: "2024-03",
    specs: {
      memory: "192 GB HBM3e (B100) / 192 GB (B200)",
      compute: "2.5x H100",
      transistors: "208B",
      process: "4nm",
    },
    description:
      "Blackwell architecture GPUs. B200 doubles the Transformer Engine throughput. Designed for multi-trillion parameter training.",
    enabledModels: ["model-gpt5", "model-claude4"],
    enabledBreakthroughs: "Supported agentic AI training and GPT-5/Claude 4 class models in 2025.",
  },
  {
    id: "hw-nvidia-gb200",
    name: "GB200",
    manufacturer: "nvidia",
    releaseDate: "2024-10",
    specs: {
      memory: "Dual B200 + Grace CPU",
      compute: "20 PFLOPS FP8 per GPU pair",
    },
    description:
      "Grace Blackwell Superchip combining two B200 GPUs with a Grace CPU on a single module. Optimized for real-time agentic AI inference.",
    enabledBreakthroughs: "Facilitated real-time agentic systems and large-scale inference deployments.",
  },
  {
    id: "hw-nvidia-blackwell-ultra",
    name: "Blackwell Ultra",
    manufacturer: "nvidia",
    releaseDate: "2026-01",
    specs: {
      memory: "Enhanced HBM3e",
      compute: "Higher than B200",
    },
    description:
      "Next-generation Blackwell with enhanced memory bandwidth. Targets post-2025 efficiency gains for frontier model training.",
    enabledBreakthroughs: "Anticipated for 2026+ frontier model training and inference at scale.",
  },

  // ── Google TPUs ───────────────────────────────────────────────────────────
  {
    id: "hw-tpu-v1",
    name: "TPU v1",
    manufacturer: "google",
    releaseDate: "2016-05",
    specs: {
      memory: "8/16 GB HBM",
      compute: "92 TOPS bfloat16",
    },
    description:
      "Google's first Tensor Processing Unit, an ASIC designed specifically for ML inference. Initially used internally before Cloud availability.",
    enabledBreakthroughs: "Accelerated production ML at Google, enabling TensorFlow's rise and large-scale inference.",
  },
  {
    id: "hw-tpu-v2",
    name: "TPU v2",
    manufacturer: "google",
    releaseDate: "2017-06",
    specs: {
      compute: "180 TOPS bfloat16 per chip",
    },
    description:
      "Second-generation TPU with pod-scale interconnect for distributed training. Made available on Google Cloud.",
    enabledBreakthroughs: "Scaled training for models like BERT-large, popularizing cloud TPUs for research.",
  },
  {
    id: "hw-tpu-v3",
    name: "TPU v3",
    manufacturer: "google",
    releaseDate: "2018-04",
    specs: {
      memory: "32 GB HBM2",
      compute: "420 TOPS bfloat16",
    },
    description:
      "Third-generation TPU with liquid cooling. Supported early large-scale Transformer training.",
    enabledBreakthroughs: "Contributed to NLP advances in the pre-GPT-3 era, supporting T5 and other Google models.",
  },
  {
    id: "hw-tpu-v4",
    name: "TPU v4",
    manufacturer: "google",
    releaseDate: "2021-05",
    specs: {
      compute: "275 TFLOPS bfloat16",
    },
    description:
      "Fourth-generation TPU with 18.6 TB/s interconnect. Powered PaLM and early multimodal models at Google.",
    enabledModels: ["model-palm"],
    enabledBreakthroughs: "Trained PaLM (540B parameters) and enhanced Google's internal AI ecosystem.",
  },
  {
    id: "hw-tpu-v5",
    name: "TPU v5e / v5p",
    manufacturer: "google",
    releaseDate: "2023-08",
    specs: {
      compute: "v5e: 197 TFLOPS FP8 / v5p: 459 TFLOPS bfloat16",
    },
    description:
      "Fifth-generation TPUs optimized for both training (v5p) and inference (v5e). Powered Gemini family training.",
    enabledModels: ["model-gemini-1", "model-gemini-1.5"],
    enabledBreakthroughs: "Enabled Gemini 1.0/1.5 training with up to 1M token context, driving long-context and multimodal advances.",
  },
  {
    id: "hw-tpu-v6",
    name: "TPU v6 (Trillium)",
    manufacturer: "google",
    releaseDate: "2025-06",
    specs: {
      compute: "Higher BF16/FP8 FLOPS",
    },
    description:
      "Sixth-generation TPU with liquid-cooled pods. Powers Gemini 3.x and next-generation agentic models.",
    enabledModels: ["model-gemini-3.1"],
    enabledBreakthroughs: "Powers Gemini 3 series and enables next-gen model training at Google.",
  },

  // ── AMD Instinct ──────────────────────────────────────────────────────────
  {
    id: "hw-amd-mi250",
    name: "MI250",
    manufacturer: "amd",
    releaseDate: "2021-11",
    specs: {
      memory: "128 GB HBM2e",
      compute: "383 TFLOPS FP16",
    },
    description:
      "AMD's first serious AI training competitor to NVIDIA A100. Used in the Frontier supercomputer.",
    enabledBreakthroughs: "Early hyperscale training competitor, used in supercomputers for scientific AI workloads.",
  },
  {
    id: "hw-amd-mi300x",
    name: "MI300X",
    manufacturer: "amd",
    releaseDate: "2023-12",
    specs: {
      memory: "192 GB HBM3",
      compute: "2.6x H100 FP16 inference",
    },
    description:
      "Chiplet-based accelerator with massive memory capacity. Enabled cost-effective training amid GPU shortages.",
    enabledBreakthroughs: "Scaled open models like LLaMA 3 and enabled DeepSeek's efficient training runs.",
  },
  {
    id: "hw-amd-mi325x",
    name: "MI325X",
    manufacturer: "amd",
    releaseDate: "2024-10",
    specs: {
      memory: "256 GB HBM3e",
      compute: "2.6 PFLOPS FP8",
    },
    description:
      "Enhanced MI300X with more memory and compute. Supported 2025 open-weight model disruptions.",
    enabledBreakthroughs: "Supported the DeepSeek disruption and boosted accessible AI development at reduced cost.",
  },
  {
    id: "hw-amd-mi350",
    name: "MI350",
    manufacturer: "amd",
    releaseDate: "2026-06",
    specs: {
      memory: "288 GB HBM3e",
      compute: "35x MI300X inference",
    },
    description:
      "Next-generation AMD accelerator anticipated for post-2025 agentic and edge AI workloads.",
    enabledBreakthroughs: "Anticipated for efficient frontier model inference and edge AI deployments.",
  },

  // ── Other Accelerators ────────────────────────────────────────────────────
  {
    id: "hw-cerebras-cs1",
    name: "CS-1",
    manufacturer: "cerebras",
    releaseDate: "2019-08",
    specs: {
      transistors: "1.2T",
      memory: "18 GB on-chip SRAM",
    },
    description:
      "World's first wafer-scale chip. 400,000 cores on a single wafer for ultra-fast model training.",
    enabledBreakthroughs: "Pioneered wafer-scale training, accelerating research on billion-parameter models.",
  },
  {
    id: "hw-cerebras-cs2",
    name: "CS-2",
    manufacturer: "cerebras",
    releaseDate: "2021-04",
    specs: {
      memory: "40 GB SRAM",
      compute: "850K cores",
    },
    description:
      "Second-generation wafer-scale engine. Trained models 10x faster than comparable GPU clusters.",
    enabledBreakthroughs: "Trained large sparse models dramatically faster than GPU alternatives.",
  },
  {
    id: "hw-cerebras-cs3",
    name: "CS-3",
    manufacturer: "cerebras",
    releaseDate: "2024-03",
    specs: {
      transistors: "4T",
      compute: "125 PFLOPS AI",
    },
    description:
      "Third-generation wafer-scale engine with 4 trillion transistors. Scaled to trillion-parameter training.",
    enabledBreakthroughs: "Contributed to 2025 multimodal and large-scale model training advances.",
  },
  {
    id: "hw-groq-lpu",
    name: "Groq LPU",
    manufacturer: "groq",
    releaseDate: "2023-02",
    specs: {
      compute: "230 TFLOPS FP16",
      memory: "14 GB SRAM per chip",
    },
    description:
      "Language Processing Unit using deterministic tensor streaming for ultra-low-latency inference. Achieved ~1000 tokens/sec.",
    enabledBreakthroughs: "Enabled ultra-fast LLM inference (1000+ words/sec), powering real-time chat agents and viral demos.",
  },
  {
    id: "hw-aws-trainium2",
    name: "AWS Trainium 2",
    manufacturer: "aws",
    releaseDate: "2024-06",
    specs: {
      memory: "512 GB HBM",
      compute: "4 PFLOPS FP8",
    },
    description:
      "Amazon's custom training chip optimized for cloud AI workloads. Integrated into AWS SageMaker ecosystem.",
    enabledBreakthroughs: "Trained Stable Diffusion 3 and custom models, scaling AWS AI services.",
  },
  {
    id: "hw-microsoft-maia100",
    name: "Maia 100",
    manufacturer: "microsoft",
    releaseDate: "2024-01",
    specs: {
      compute: "Custom matrix cores, high FP8 throughput",
    },
    description:
      "Microsoft's in-house AI accelerator for Azure. Designed to optimize OpenAI model inference in the Copilot ecosystem.",
    enabledBreakthroughs: "Powers GPT-4 successors in Azure, enabling efficient hyperscale inference for Copilot.",
  },
  {
    id: "hw-intel-gaudi3",
    name: "Intel Gaudi 3",
    manufacturer: "intel",
    releaseDate: "2024-09",
    specs: {
      memory: "128 GB HBM2e",
      compute: "1.8 PFLOPS FP8",
    },
    description:
      "Intel's latest AI accelerator with Ethernet-based scaling. Competitive with Blackwell in some benchmarks.",
    enabledBreakthroughs: "Matched Blackwell in cost-effective fine-tuning for enterprise 2025 models.",
  },
];

// Quick lookup map
export const hardwareById: Record<string, HardwareNode> = Object.fromEntries(
  hardware.map((h) => [h.id, h])
);
