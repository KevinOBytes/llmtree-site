"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelNode } from "@/lib/types";
import { FAMILY_LABELS } from "@/lib/chartUtils";

// ── Types ──────────────────────────────────────────────────────────────────

interface WizardChoices {
  modality: "text" | "code" | "vision" | "multimodal" | "media";
  access: "closed" | "open-weight" | "open-source";
  size: "local" | "edge" | "frontier";
  focus: "reasoning" | "coding-math" | "speed-efficiency" | "safety-guardrails";
}

// ── Constants & Steps Metadata ─────────────────────────────────────────────

interface Option<T> {
  key: T;
  title: string;
  description: string;
  icon: string;
}

const MODALITY_OPTIONS: Option<WizardChoices["modality"]>[] = [
  {
    key: "text",
    title: "Text-Only",
    description: "Writing, summarization, translation, and structured data generation.",
    icon: "✍️",
  },
  {
    key: "code",
    title: "Code Generation",
    description: "Software engineering, script writing, database queries, and debugging.",
    icon: "💻",
  },
  {
    key: "vision",
    title: "Computer Vision",
    description: "OCR, image understanding, object detection, and visual QA.",
    icon: "👁️",
  },
  {
    key: "multimodal",
    title: "Multimodal Omni",
    description: "Simultaneous processing of text, images, and audio natively.",
    icon: "🧠",
  },
  {
    key: "media",
    title: "Media Generation",
    description: "Creating generative images, sound effects, music, or video.",
    icon: "🎨",
  },
];

const ACCESS_OPTIONS: Option<WizardChoices["access"]>[] = [
  {
    key: "closed",
    title: "Closed API",
    description: "SaaS API access managed by providers (OpenAI, Anthropic, Google). No server overhead.",
    icon: "🔌",
  },
  {
    key: "open-weight",
    title: "Open Weights",
    description: "Deployable models with public weights. Run locally or self-host in your private cloud.",
    icon: "📦",
  },
  {
    key: "open-source",
    title: "Open Source",
    description: "Fully open weights, training code, and architecture with permissive licenses.",
    icon: "🔓",
  },
];

const SIZE_OPTIONS: Option<WizardChoices["size"]>[] = [
  {
    key: "local",
    title: "Local & Mobile (< 10B)",
    description: "Lightweight footprint. Fits on consumer laptops, phones, or edge devices.",
    icon: "📱",
  },
  {
    key: "edge",
    title: "Edge & Server (10B - 100B)",
    description: "Deployable on standard GPUs. High intelligence balanced with hosting cost.",
    icon: "🖥️",
  },
  {
    key: "frontier",
    title: "Frontier Scale (> 100B / Cloud)",
    description: "Enterprise scale. Demands multi-GPU nodes or third-party cloud APIs for maximum power.",
    icon: "🌌",
  },
];

const FOCUS_OPTIONS: Option<WizardChoices["focus"]>[] = [
  {
    key: "reasoning",
    title: "Complex Reasoning",
    description: "Multi-step logic, science problems, and advanced mathematical proofs (e.g. o1, R1).",
    icon: "🧩",
  },
  {
    key: "coding-math",
    title: "Coding & STEM",
    description: "Precision programming, data analysis, and mathematical calculations.",
    icon: "🔢",
  },
  {
    key: "speed-efficiency",
    title: "Speed & Efficiency",
    description: "Sub-second latency, high throughput, and ultra-low cost per token (e.g. flash/mini).",
    icon: "⚡",
  },
  {
    key: "safety-guardrails",
    title: "Safety & Moderation",
    description: "Strictly aligned, low toxicity, or tailored for guardrail/classifier deployments.",
    icon: "🛡️",
  },
];

// ── Scoring & Recommendation Logic ─────────────────────────────────────────

function parseParamCount(raw: string | undefined): number {
  if (!raw) return 0;
  const match = raw.match(/~?([\d.]+)\s*(T|B|M|K)?/i);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] || "").toUpperCase();
  if (unit === "T") return val * 1000;
  if (unit === "B") return val;
  if (unit === "M") return val / 1000;
  return val;
}

function generateWhyWeRecommend(model: ModelNode, choices: WizardChoices): string {
  const company = model.company;
  const name = model.name;

  let modalityWord = "";
  if (choices.modality === "text") modalityWord = "advanced language comprehension";
  else if (choices.modality === "code") modalityWord = "specialized coding tasks";
  else if (choices.modality === "vision") modalityWord = "visual recognition and OCR";
  else if (choices.modality === "multimodal") modalityWord = "multimodal reasoning across text, audio, and images";
  else if (choices.modality === "media") modalityWord = "generative media synthesis";

  let accessWord = "";
  if (choices.access === "closed") accessWord = "a closed-source provider API";
  else if (choices.access === "open-weight") accessWord = "locally deployable open-weight models";
  else if (choices.access === "open-source") accessWord = "open-source architecture and weights";

  let sizeWord = "";
  if (choices.size === "local") sizeWord = "under a highly lightweight (<10B) footprint, suitable for local/mobile runtimes";
  else if (choices.size === "edge") sizeWord = "a balanced scale (10B-100B), ideal for deployment on accessible GPU nodes";
  else if (choices.size === "frontier") sizeWord = "frontier cloud scales to guarantee maximum logical intelligence";

  let focusWord = "";
  if (choices.focus === "reasoning") focusWord = "solving complex multi-step reasoning puzzles and logical deductions";
  else if (choices.focus === "coding-math") focusWord = "high-accuracy code generation and technical STEM problems";
  else if (choices.focus === "speed-efficiency") focusWord = "sub-second latency and extreme throughput efficiency";
  else if (choices.focus === "safety-guardrails") focusWord = "strict safety alignment, low toxicity, and content filtering";

  return `We recommend ${name} by ${company} because it excels at ${modalityWord} delivered via ${accessWord}. Optimized for ${sizeWord}, it is exceptionally suited for ${focusWord}. With ${model.parameterCount ? `${model.parameterCount} parameters and ` : ""}${model.contextWindow ? `a ${model.contextWindow} context window, ` : ""}it serves as an ideal baseline for your requirements.`;
}

function scoreModels(choices: WizardChoices): { model: ModelNode; score: number; explanation: string }[] {
  return models
    .map((model) => {
      let score = 0;

      // 1. MODALITY MATCH
      if (choices.modality === "text") {
        if (model.modality === "text") score += 10;
        else if (model.modality === "multimodal") score += 7;
      } else if (choices.modality === "code") {
        if (model.modality === "code") score += 10;
        else if (model.innovations?.includes("code-generation")) score += 9;
        else if (model.modality === "multimodal") score += 6;
      } else if (choices.modality === "vision") {
        if (model.modality === "vision") score += 10;
        else if (model.modality === "multimodal") score += 8;
      } else if (choices.modality === "multimodal") {
        if (model.modality === "multimodal") score += 10;
      } else if (choices.modality === "media") {
        if (["audio", "image", "video"].includes(model.modality ?? "")) score += 10;
      }

      // 2. ACCESS MATCH
      if (choices.access === "closed") {
        if (model.openness === "closed") score += 10;
        else score += 2;
      } else if (choices.access === "open-weight") {
        if (model.openness === "open-weight") score += 10;
        else if (model.openness === "open-source") score += 8;
      } else if (choices.access === "open-source") {
        if (model.openness === "open-source") score += 10;
        else if (model.openness === "open-weight") score += 5;
      }

      // 3. SIZE / DEPLOYMENT TARGET MATCH
      const sizeB = parseParamCount(model.parameterCount);
      const isClosed = model.openness === "closed";

      if (choices.size === "local") {
        if (!isClosed && sizeB > 0 && sizeB < 10) score += 10;
        else if (!isClosed && sizeB >= 10 && sizeB <= 30) score += 4;
        else if (isClosed) score -= 6;
      } else if (choices.size === "edge") {
        if (!isClosed && sizeB >= 10 && sizeB <= 100) score += 10;
        else if (!isClosed && sizeB > 0 && (sizeB < 10 || sizeB > 100)) score += 3;
        else if (isClosed) score += 3;
      } else if (choices.size === "frontier") {
        if (isClosed || sizeB > 100) score += 10;
        else if (sizeB >= 70) score += 7;
        else score += 1;
      }

      // 4. CAPABILITY FOCUS MATCH
      if (choices.focus === "reasoning") {
        if (model.family === "openai-o") score += 12;
        else if (model.innovations?.includes("reasoning") || model.innovations?.includes("chain-of-thought")) score += 10;
        else if (model.benchmarks?.gpqa && model.benchmarks.gpqa > 50) score += 8;
        else if (model.name.includes("DeepSeek-R1") || model.name.toLowerCase().includes("reasoner")) score += 10;
      } else if (choices.focus === "coding-math") {
        if (model.modality === "code" || model.family === "coding-tool") score += 12;
        else if (model.innovations?.includes("code-generation")) score += 10;
        else if (model.benchmarks?.humanEval && model.benchmarks.humanEval > 80) score += 8;
        else if (model.benchmarks?.math && model.benchmarks.math > 70) score += 8;
      } else if (choices.focus === "speed-efficiency") {
        const nameLower = model.name.toLowerCase();
        if (model.innovations?.includes("distillation")) score += 10;
        else if (
          nameLower.includes("mini") ||
          nameLower.includes("haiku") ||
          nameLower.includes("flash") ||
          nameLower.includes("nano") ||
          nameLower.includes("speed")
        ) score += 10;
        else if (!isClosed && sizeB > 0 && sizeB < 15) score += 7;
      } else if (choices.focus === "safety-guardrails") {
        if (model.family === "safety" || model.innovations?.includes("safety-classifier")) score += 12;
        else if (model.company === "Anthropic") score += 6;
        else if (model.innovations?.includes("constitutional-ai")) score += 8;
      }

      // 5. STATUS PENALTY
      const status = model.status ?? "active";
      if (status === "discontinued") score -= 25;
      else if (status === "deprecated") score -= 15;
      else if (status === "legacy") score -= 10;

      return {
        model,
        score,
        explanation: generateWhyWeRecommend(model, choices),
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tie breaker: Newer first
      return b.model.releaseDate.localeCompare(a.model.releaseDate);
    });
}

// ── Component ──────────────────────────────────────────────────────────────

export default function WizardPage() {
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(0);

  // Selections state
  const [modality, setModality] = useState<WizardChoices["modality"] | null>(null);
  const [access, setAccess] = useState<WizardChoices["access"] | null>(null);
  const [size, setSize] = useState<WizardChoices["size"] | null>(null);
  const [focus, setFocus] = useState<WizardChoices["focus"] | null>(null);

  // Compute recommendations
  const recommendations = useMemo(() => {
    if (step < 5 || !modality || !access || !size || !focus) return [];
    return scoreModels({ modality, access, size, focus }).slice(0, 3);
  }, [step, modality, access, size, focus]);

  const handleNext = () => {
    if (step === 1 && !modality) return;
    if (step === 2 && !access) return;
    if (step === 3 && !size) return;
    if (step === 4 && !focus) return;

    setDirection(1);
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  const handleReset = () => {
    setModality(null);
    setAccess(null);
    setSize(null);
    setFocus(null);
    setDirection(-1);
    setStep(1);
  };

  // Stepper labels
  const stepsMetadata = [
    { label: "Modality", done: !!modality },
    { label: "Access Model", done: !!access },
    { label: "Deployment", done: !!size },
    { label: "Focus", done: !!focus },
  ];

  const slideVariants = {
    enter: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 100 : -100,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir < 0 ? 100 : -100,
    }),
  };

  return (
    <div className="flex-1 flex flex-col px-4 sm:px-6 lg:px-8 py-12 max-w-4xl mx-auto w-full relative overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-accent-violet/6 blur-[120px] animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full bg-accent-cyan/6 blur-[100px] animate-pulse-glow [animation-delay:1.5s]" />
      </div>

      <div className="relative z-10 flex flex-col flex-1">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-semibold text-accent-violet mb-4">
            🔮 Recommendation Wizard
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-2">
            Model Recommendation Wizard
          </h1>
          <p className="text-text-secondary text-sm max-w-lg mx-auto">
            Answer a few quick questions to find the optimal LLM tailored to your deployment scale, access policies, and capability priorities.
          </p>
        </div>

        {/* Stepper progress indicator */}
        {step <= 4 && (
          <div className="w-full max-w-xl mx-auto mb-10">
            <div className="flex items-center justify-between">
              {stepsMetadata.map((s, idx) => {
                const stepNum = idx + 1;
                const isActive = step === stepNum;
                const isCompleted = step > stepNum;

                return (
                  <div key={s.label} className="flex items-center flex-1 last:flex-initial">
                    <button
                      onClick={() => {
                        if (isCompleted || s.done) {
                          setDirection(stepNum < step ? -1 : 1);
                          setStep(stepNum);
                        }
                      }}
                      disabled={!isCompleted && !s.done && !isActive}
                      className={`relative flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all cursor-pointer ${
                        isActive
                          ? "border-accent-violet bg-accent-violet/10 text-accent-violet shadow-lg shadow-accent-violet/10"
                          : isCompleted
                          ? "border-accent-emerald bg-accent-emerald/10 text-accent-emerald"
                          : "border-border-default bg-surface-secondary text-text-muted hover:border-border-hover"
                      }`}
                    >
                      {isCompleted ? "✓" : stepNum}
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-wider font-semibold text-text-secondary whitespace-nowrap">
                        {s.label}
                      </span>
                    </button>
                    {idx < stepsMetadata.length - 1 && (
                      <div
                        className={`h-0.5 flex-1 mx-2 rounded-full transition-all duration-300 ${
                          isCompleted ? "bg-accent-emerald/60" : "bg-border-default"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stepper Body Card */}
        <div className="flex-1 flex flex-col justify-between min-h-[380px] sm:min-h-[440px] mt-4">
          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="w-full flex-1 flex flex-col justify-center"
              >
                {/* STEP 1: MODALITY */}
                {step === 1 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-center text-text-primary">
                      1. Select the primary Modality
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {MODALITY_OPTIONS.map((opt) => {
                        const isSelected = modality === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setModality(opt.key)}
                            className={`flex flex-col items-center text-center p-5 rounded-2xl glass border transition-all duration-200 cursor-pointer group text-left ${
                              isSelected
                                ? "border-accent-violet bg-accent-violet/5 ring-1 ring-accent-violet/30 shadow-lg shadow-accent-violet/5"
                                : "border-border-default hover:border-border-hover hover:bg-white/[0.01]"
                            }`}
                          >
                            <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform duration-200">
                              {opt.icon}
                            </span>
                            <h3 className="text-xs font-bold text-text-primary mb-1">
                              {opt.title}
                            </h3>
                            <p className="text-[10px] text-text-secondary leading-normal">
                              {opt.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 2: ACCESS MODEL */}
                {step === 2 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-center text-text-primary">
                      2. Access and License requirements
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
                      {ACCESS_OPTIONS.map((opt) => {
                        const isSelected = access === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setAccess(opt.key)}
                            className={`flex flex-col items-center text-center p-6 rounded-2xl glass border transition-all duration-200 cursor-pointer group text-left ${
                              isSelected
                                ? "border-accent-violet bg-accent-violet/5 ring-1 ring-accent-violet/30 shadow-lg shadow-accent-violet/5"
                                : "border-border-default hover:border-border-hover hover:bg-white/[0.01]"
                            }`}
                          >
                            <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                              {opt.icon}
                            </span>
                            <h3 className="text-sm font-bold text-text-primary mb-1.5">
                              {opt.title}
                            </h3>
                            <p className="text-xs text-text-secondary leading-normal">
                              {opt.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 3: DEPLOYMENT / SIZE */}
                {step === 3 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-center text-text-primary">
                      3. Target Deployment & Hardware constraints
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto w-full">
                      {SIZE_OPTIONS.map((opt) => {
                        const isSelected = size === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setSize(opt.key)}
                            className={`flex flex-col items-center text-center p-6 rounded-2xl glass border transition-all duration-200 cursor-pointer group text-left ${
                              isSelected
                                ? "border-accent-violet bg-accent-violet/5 ring-1 ring-accent-violet/30 shadow-lg shadow-accent-violet/5"
                                : "border-border-default hover:border-border-hover hover:bg-white/[0.01]"
                            }`}
                          >
                            <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">
                              {opt.icon}
                            </span>
                            <h3 className="text-sm font-bold text-text-primary mb-1.5">
                              {opt.title}
                            </h3>
                            <p className="text-xs text-text-secondary leading-normal">
                              {opt.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 4: PRIMARY CAPABILITY */}
                {step === 4 && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-center text-text-primary">
                      4. What is your primary capability focus?
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
                      {FOCUS_OPTIONS.map((opt) => {
                        const isSelected = focus === opt.key;
                        return (
                          <button
                            key={opt.key}
                            onClick={() => setFocus(opt.key)}
                            className={`flex gap-4 p-5 rounded-2xl glass border transition-all duration-200 cursor-pointer group text-left items-start ${
                              isSelected
                                ? "border-accent-violet bg-accent-violet/5 ring-1 ring-accent-violet/30 shadow-lg shadow-accent-violet/5"
                                : "border-border-default hover:border-border-hover hover:bg-white/[0.01]"
                            }`}
                          >
                            <span className="text-3xl shrink-0 group-hover:scale-110 transition-transform block mt-0.5">
                              {opt.icon}
                            </span>
                            <div className="flex flex-col">
                              <h3 className="text-sm font-bold text-text-primary mb-1">
                                {opt.title}
                              </h3>
                              <p className="text-xs text-text-secondary leading-normal">
                                {opt.description}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* STEP 5: RECOMMENDATIONS RESULTS */}
                {step === 5 && (
                  <div className="space-y-8">
                    <div className="text-center">
                      <h2 className="text-2xl font-bold text-text-primary">
                        Top Recommendations
                      </h2>
                      <p className="text-text-secondary text-sm mt-1">
                        Based on your technical profile and requirements.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                      {recommendations.map((rec, index) => {
                        const model = rec.model;
                        const rank = index + 1;
                        const color = FAMILY_COLORS[model.family] || "var(--color-accent-violet)";
                        const familyLabel = FAMILY_LABELS[model.family] || model.family;

                        return (
                          <motion.div
                            key={model.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.15, duration: 0.4 }}
                            className="glass rounded-2xl border border-border-default overflow-hidden relative"
                            style={{
                              borderLeft: `5px solid ${color}`,
                            }}
                          >
                            {/* Rank ribbon */}
                            <div
                              className="absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-[10px] uppercase font-bold tracking-wider text-white"
                              style={{ backgroundColor: color }}
                            >
                              Match #{rank}
                            </div>

                            <div className="p-6">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-[10px] text-text-muted font-bold uppercase tracking-widest leading-none">
                                      {model.company}
                                    </span>
                                    <span
                                      className="inline-block px-2 py-0.5 rounded-md text-[9px] font-bold border capitalize tracking-wide bg-white/5 border-white/10"
                                      style={{ color }}
                                    >
                                      {familyLabel}
                                    </span>
                                  </div>
                                  <h3 className="text-xl font-bold text-text-primary">
                                    {model.name}
                                  </h3>
                                </div>

                                <div className="flex flex-wrap gap-4 text-xs font-mono text-text-secondary">
                                  {model.parameterCount && (
                                    <div className="flex flex-col">
                                      <span className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Params</span>
                                      <span className="text-text-primary font-semibold">{model.parameterCount}</span>
                                    </div>
                                  )}
                                  {model.contextWindow && (
                                    <div className="flex flex-col">
                                      <span className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">Context</span>
                                      <span className="text-text-primary font-semibold">{model.contextWindow}</span>
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span className="text-[9px] uppercase tracking-wider text-text-muted font-semibold">License</span>
                                    <span className="text-text-primary font-semibold capitalize">{model.openness.replace("-", " ")}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Why recommend paragraph */}
                              <div className="p-4 rounded-xl bg-white/[0.02] border border-border-subtle text-sm text-text-secondary leading-relaxed italic mb-4">
                                {rec.explanation}
                              </div>

                              <div className="flex flex-wrap gap-3 justify-between items-center">
                                <div className="flex flex-wrap gap-1.5">
                                  {model.innovations.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="px-2 py-0.5 rounded-md bg-surface-elevated text-[10px] text-text-muted border border-border-subtle capitalize"
                                    >
                                      {tag.replace(/-/g, " ")}
                                    </span>
                                  ))}
                                </div>

                                <div className="flex gap-2">
                                  <Link
                                    href={`/models/${model.id}`}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-elevated/80 border border-border-default hover:border-border-hover text-xs font-semibold text-text-primary transition-all duration-200"
                                  >
                                    View Profile
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  </Link>
                                  <Link
                                    href={`/compare/models?m1=model-gpt4o&m2=${model.id}`}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-violet/15 hover:bg-accent-violet/25 border border-accent-violet/30 hover:border-accent-violet/50 text-xs font-semibold text-accent-violet transition-all duration-200"
                                  >
                                    Compare Model
                                  </Link>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Summary choices */}
                    <div className="p-5 rounded-2xl glass border border-border-default">
                      <h4 className="text-xs uppercase tracking-widest text-text-muted font-bold mb-3">
                        Your Selected Parameters
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-muted font-medium">Modality</span>
                          <span className="text-text-primary font-semibold capitalize">{modality}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-muted font-medium">Access</span>
                          <span className="text-text-primary font-semibold capitalize">{access?.replace("-", " ")}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-muted font-medium">Size Target</span>
                          <span className="text-text-primary font-semibold capitalize">{size}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-text-muted font-medium">Core Focus</span>
                          <span className="text-text-primary font-semibold capitalize">{focus?.replace("-", " ")}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center justify-between border-t border-border-default pt-6 mt-8">
            {step > 1 ? (
              <button
                onClick={step === 5 ? handleReset : handleBack}
                className="px-5 py-2.5 rounded-xl glass border border-border-default text-xs font-semibold text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors cursor-pointer"
              >
                {step === 5 ? "Start Over" : "Back"}
              </button>
            ) : (
              <div />
            )}

            {step <= 4 && (
              <button
                onClick={handleNext}
                disabled={
                  (step === 1 && !modality) ||
                  (step === 2 && !access) ||
                  (step === 3 && !size) ||
                  (step === 4 && !focus)
                }
                className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 cursor-pointer ${
                  ((step === 1 && !modality) ||
                    (step === 2 && !access) ||
                    (step === 3 && !size) ||
                    (step === 4 && !focus))
                    ? "bg-surface-elevated text-text-muted border border-border-subtle cursor-not-allowed"
                    : "bg-accent-violet hover:bg-accent-violet/90 text-white shadow-lg shadow-accent-violet/10 hover:shadow-accent-violet/20"
                }`}
              >
                {step === 4 ? "Show Recommendations" : "Next"}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
