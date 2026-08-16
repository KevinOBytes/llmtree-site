/* eslint-disable react-hooks/immutability */
"use client";

import { useMemo, useEffect, useRef, useState, useCallback, type ReactNode } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { papers } from "@/lib/data/papers";
import { hardware } from "@/lib/data/hardware";
import { parseContextWindow, parseDate } from "@/lib/chartUtils";
import { AutoGlossary } from "@/components/ui/TechTerm";

// ============================================================================
// Types
// ============================================================================

interface InsightAnalysis {
  year: string | number;
  text: string;
}

interface InsightSection {
  id: string;
  number: number;
  title: string;
  stat: string;
  statGradient: string;
  accentColor: string;
  analysis: string | InsightAnalysis[];
  chart: ReactNode;
}

// ============================================================================
// Intersection Observer fade-in hook
// ============================================================================

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.unobserve(el);
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ============================================================================
// Parallax scroll hook — returns a value in [-1, 1] based on element position
// ============================================================================

function useParallax() {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const statEl = el.querySelector(".parallax-stat") as HTMLElement | null;
    const watermarkEl = el.querySelector(".parallax-watermark") as HTMLElement | null;

    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        
        // Only run if visible in viewport
        if (rect.bottom < 0 || rect.top > vh) return;

        const center = rect.top + rect.height / 2;
        const normalized = (center - vh / 2) / (vh / 2);
        const offset = Math.max(-1, Math.min(1, normalized));

        if (statEl) {
          statEl.style.transform = `translateY(${offset * 15}px)`;
        }
        if (watermarkEl) {
          watermarkEl.style.transform = `translateY(${offset * -25}px)`;
        }
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { ref };
}

// ============================================================================
// Animated counter — animates a stat string when visible
// ============================================================================

function AnimatedStat({ text, visible }: { text: string; visible: boolean }) {
  const [displayLen, setDisplayLen] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible) return;
    // Reveal characters progressively
    let current = 0;
    intervalRef.current = setInterval(() => {
      current += 1;
      if (current >= text.length) {
        setDisplayLen(text.length);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return;
      }
      setDisplayLen(current);
    }, 18);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [visible, text]);

  if (!visible) return <span className="opacity-0">{text}</span>;
  return (
    <>
      <span>{text.slice(0, displayLen)}</span>
      <span className="opacity-0">{text.slice(displayLen)}</span>
    </>
  );
}

// ============================================================================
// Scroll Progress Indicator
// ============================================================================

function ScrollProgress({ insightIds }: { insightIds: string[] }) {
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    function onScroll() {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        const els = insightIds.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
        if (els.length === 0) return;

        const firstTop = els[0].getBoundingClientRect().top + window.scrollY;
        const lastBottom = els[els.length - 1].getBoundingClientRect().bottom + window.scrollY;
        const totalHeight = lastBottom - firstTop;
        const scrolled = window.scrollY + window.innerHeight / 2 - firstTop;
        setProgress(Math.max(0, Math.min(1, scrolled / totalHeight)));

        // Determine active card
        const vh = window.innerHeight;
        let active = -1;
        for (let i = els.length - 1; i >= 0; i--) {
          const rect = els[i].getBoundingClientRect();
          if (rect.top < vh * 0.6) {
            active = i;
            break;
          }
        }
        setActiveIndex(active);
      });
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [insightIds]);

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-center gap-0">
      {/* Track line */}
      <div className="relative w-0.5 bg-border-default rounded-full" style={{ height: `${insightIds.length * 28 + 20}px` }}>
        {/* Progress fill */}
        <div
          className="absolute top-0 left-0 w-full rounded-full transition-[height] duration-300"
          style={{
            height: `${progress * 100}%`,
            background: "linear-gradient(to bottom, #8b5cf6, #06b6d4)",
          }}
        />
      </div>
      {/* Dots for each insight */}
      {insightIds.map((id, i) => (
        <a
          key={id}
          href={`#${id}`}
          className="absolute flex items-center justify-center"
          style={{
            top: `${((i + 0.5) / insightIds.length) * 100}%`,
            transform: "translateY(-50%)",
          }}
          aria-label={`Go to insight ${i + 1}`}
        >
          <div
            className={`
              w-2.5 h-2.5 rounded-full border-2 transition-all duration-300
              ${i <= activeIndex
                ? "bg-accent-violet border-accent-violet scale-110"
                : "bg-surface-primary border-border-hover scale-100"
              }
            `}
          />
        </a>
      ))}
    </div>
  );
}

// ============================================================================
// Mini-chart wrapper (consistent sizing)
// ============================================================================

function MiniChart({ children, height = 200 }: { children: (w: number, h: number) => ReactNode; height?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full mt-4">
      {width > 0 && children(width, height)}
    </div>
  );
}

// ============================================================================
// Insight Card component — with parallax, slide-in, animated stat & watermark
// ============================================================================

function InsightCard({ insight, index }: { insight: InsightSection; index: number }) {
  const { ref: inViewRef, visible } = useInView(0.1);
  const { ref: parallaxRef } = useParallax();
  const accentBarRef = useRef<HTMLDivElement>(null);

  // Merge refs
  const mergedRef = useCallback(
    (node: HTMLDivElement | null) => {
      (inViewRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      (parallaxRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    },
    [inViewRef, parallaxRef]
  );

  // Slide direction: odd from left, even from right
  const slideFrom = index % 2 === 0 ? "-translate-x-8" : "translate-x-8";

  return (
    <div
      ref={mergedRef}
      id={insight.id}
      className={`
        relative rounded-2xl glass overflow-visible transition-all duration-700
        ${visible ? "opacity-100 translate-x-0 translate-y-0" : `opacity-0 ${slideFrom} translate-y-8`}
      `}
      style={{
        transitionDelay: `${index * 50}ms`,
        willChange: "transform, opacity",
      }}
    >
      {/* Left accent border — animates height */}
      <div
        ref={accentBarRef}
        className="absolute left-0 top-0 w-1 rounded-l-2xl transition-all duration-1000 ease-out"
        style={{
          background: insight.accentColor,
          height: visible ? "100%" : "0%",
          transitionDelay: `${index * 50 + 300}ms`,
        }}
      />

      {/* Section number watermark — large, parallax, behind content */}
      <div
        className="parallax-watermark absolute right-4 top-4 text-[80px] sm:text-[120px] font-black leading-none pointer-events-none select-none"
        style={{
          color: insight.accentColor,
          opacity: 0.04,
          willChange: "transform",
        }}
      >
        #{insight.number}
      </div>

      <div className="relative z-10 p-6 sm:p-8 pl-7 sm:pl-10">
        {/* Section number */}
        <div className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-3">
          Insight #{insight.number}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
          {insight.title}
        </h2>

        {/* Big stat — parallax Y-translation + counter animation */}
        <div
          className="parallax-stat text-3xl sm:text-4xl lg:text-5xl font-black bg-clip-text text-transparent mb-6 leading-tight"
          style={{
            backgroundImage: insight.statGradient,
            willChange: "transform",
          }}
        >
          <AnimatedStat text={insight.stat} visible={visible} />
        </div>

        {/* Chart */}
        <div className="mb-6">{insight.chart}</div>

        {/* Analysis */}
        {typeof insight.analysis === "string" ? (
          <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
            <AutoGlossary text={insight.analysis} />
          </p>
        ) : (
          <div 
            className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar gap-4 pb-2 -mx-2 px-2"
            ref={(el) => {
              if (el && !el.dataset.scrolled) {
                el.scrollLeft = el.scrollWidth;
                el.dataset.scrolled = "true";
              }
            }}
          >
            {insight.analysis.map((item) => (
              <div 
                key={item.year} 
                className="shrink-0 w-full sm:w-[85%] snap-center bg-surface-base/40 rounded-xl p-5 border border-border-default/50"
              >
                <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: insight.accentColor }}>
                  Our Take ({item.year})
                </div>
                <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
                  <AutoGlossary text={item.text} />
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Main View
// ============================================================================

export function InsightsView() {
  // ── Compute all data ────────────────────────────────────────────────────

  const computedData = useMemo(() => {
    // --- Models per year ---
    const modelsByYear: Record<number, number> = {};
    const YEARS = [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026];
    YEARS.forEach((y) => (modelsByYear[y] = 0));
    models.forEach((m) => {
      const y = parseDate(m.releaseDate).getFullYear();
      if (y >= 2018 && y <= 2026) modelsByYear[y]++;
    });

    // --- Openness per year ---
    const opennessByYear: Record<number, { closed: number; open: number }> = {};
    YEARS.forEach((y) => (opennessByYear[y] = { closed: 0, open: 0 }));
    models.forEach((m) => {
      const y = parseDate(m.releaseDate).getFullYear();
      if (y >= 2018 && y <= 2026) {
        if (m.openness === "closed") opennessByYear[y].closed++;
        else opennessByYear[y].open++;
      }
    });

    // --- Lineage depth ---
    const modelMap = new Map(models.map((m) => [m.id, m]));
    function getDepth(id: string, visited = new Set<string>()): number {
      if (visited.has(id)) return 0;
      visited.add(id);
      const m = modelMap.get(id);
      if (!m || m.parentIds.length === 0) return 1;
      return 1 + Math.max(...m.parentIds.map((p) => getDepth(p, new Set(visited))));
    }
    const familyDepths: Record<string, { name: string; depth: number }> = {};
    models.forEach((m) => {
      const depth = getDepth(m.id);
      const familyKey = m.family;
      if (!familyDepths[familyKey] || depth > familyDepths[familyKey].depth) {
        familyDepths[familyKey] = { name: m.name, depth };
      }
    });
    const topLineages = Object.entries(familyDepths)
      .map(([family, v]) => ({ family, name: v.name, depth: v.depth }))
      .sort((a, b) => b.depth - a.depth)
      .slice(0, 8);

    // --- MoE cumulative ---
    const moeCumulative: { year: number; count: number }[] = [];
    let cumMoE = 0;
    YEARS.forEach((y) => {
      const count = models.filter((m) => {
        const my = parseDate(m.releaseDate).getFullYear();
        return (
          my === y &&
          (m.architecture === "mixture-of-experts" ||
            m.architecture === "sparse-moe" ||
            m.innovations.includes("mixture-of-experts"))
        );
      }).length;
      cumMoE += count;
      moeCumulative.push({ year: y, count: cumMoE });
    });

    // --- Context windows ---
    const contextData = models
      .filter((m) => m.contextWindow)
      .map((m) => {
        const ctx = parseContextWindow(m.contextWindow);
        const date = parseDate(m.releaseDate);
        return { name: m.name, date, ctx: ctx ?? 0, year: date.getFullYear() };
      })
      .filter((c) => c.ctx > 0 && c.year >= 2018)
      .sort((a, b) => a.date.getTime() - b.date.getTime());

    // --- Companies ---
    const companyMap: Record<string, number> = {};
    models.forEach((m) => {
      companyMap[m.company] = (companyMap[m.company] || 0) + 1;
    });
    const topCompanies = Object.entries(companyMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    const totalCompanies = Object.keys(companyMap).length;

    // --- Paper-to-product pipeline ---
    const pipeline: { paper: string; paperYear: number; model: string; modelYear: number; gap: string }[] = [
      { paper: "Attention Is All You Need", paperYear: 2017, model: "GPT-1", modelYear: 2018, gap: "1 year" },
      { paper: "RLHF", paperYear: 2017, model: "InstructGPT", modelYear: 2022, gap: "5 years" },
      { paper: "Chain-of-Thought", paperYear: 2022, model: "o1", modelYear: 2024, gap: "2 years" },
      { paper: "MoE (Shazeer et al.)", paperYear: 2017, model: "Mixtral 8x7B", modelYear: 2023, gap: "6 years" },
      { paper: "LoRA", paperYear: 2021, model: "Widespread use", modelYear: 2023, gap: "2 years" },
      { paper: "Flash Attention", paperYear: 2022, model: "Default everywhere", modelYear: 2023, gap: "1 year" },
      { paper: "RoPE", paperYear: 2021, model: "Default everywhere", modelYear: 2023, gap: "~2 years" },
      { paper: "GQA", paperYear: 2023, model: "LLaMA 2", modelYear: 2023, gap: "<1 year" },
      { paper: "Mamba (SSM)", paperYear: 2023, model: "Jamba", modelYear: 2024, gap: "~4 months" },
    ];

    // --- Modality distribution ---
    const modalityByYear: Record<number, Record<string, number>> = {};
    YEARS.forEach((y) => (modalityByYear[y] = {}));
    models.forEach((m) => {
      const y = parseDate(m.releaseDate).getFullYear();
      if (y >= 2018 && y <= 2026) {
        const mod = m.modality || "text";
        modalityByYear[y][mod] = (modalityByYear[y][mod] || 0) + 1;
      }
    });

    // --- Reasoning cumulative ---
    const reasoningCum: { year: number; count: number }[] = [];
    let cumReasoning = 0;
    YEARS.forEach((y) => {
      const count = models.filter((m) => {
        const my = parseDate(m.releaseDate).getFullYear();
        return my === y && m.innovations.includes("reasoning");
      }).length;
      cumReasoning += count;
      reasoningCum.push({ year: y, count: cumReasoning });
    });

    // --- Agentic count ---
    const agenticCount = models.filter((m) => m.innovations.includes("agentic")).length;

    // --- Open percentage by year ---
    const openPctByYear = YEARS.map((y) => {
      const total = modelsByYear[y];
      if (total === 0) return { year: y, pct: 0 };
      return { year: y, pct: Math.round((opennessByYear[y].open / total) * 100) };
    });

    // --- China vs US model counts by year ---
    const CHINESE_COMPANIES = new Set(["Zhipu AI", "Baidu", "Alibaba", "ByteDance", "Baichuan Inc", "Moonshot AI", "MiniMax", "DeepSeek", "01.AI"]);
    const US_COMPANIES = new Set(["OpenAI", "Google", "Google DeepMind", "Meta", "Microsoft", "Anthropic", "xAI", "Amazon", "Apple", "NVIDIA", "Cohere", "Inflection AI"]);
    const chinaByYear: Record<number, number> = {};
    const usByYear: Record<number, number> = {};
    YEARS.forEach((y) => { chinaByYear[y] = 0; usByYear[y] = 0; });
    models.forEach((m) => {
      const y = parseDate(m.releaseDate).getFullYear();
      if (y >= 2018 && y <= 2026) {
        if (CHINESE_COMPANIES.has(m.company)) chinaByYear[y]++;
        if (US_COMPANIES.has(m.company)) usByYear[y]++;
      }
    });
    const chinaCount = models.filter((m) => CHINESE_COMPANIES.has(m.company)).length;

    // --- Efficiency trend (distillation + parameter-sharing + MoE/sparse-moe) ---
    const EFFICIENCY_TAGS = new Set(["distillation", "parameter-sharing", "mixture-of-experts"]);
    const efficiencyCum: { year: number; count: number }[] = [];
    let cumEfficiency = 0;
    YEARS.forEach((y) => {
      const count = models.filter((m) => {
        const my = parseDate(m.releaseDate).getFullYear();
        return my === y && (m.innovations.some((inn) => EFFICIENCY_TAGS.has(inn)) || m.architecture === "mixture-of-experts" || m.architecture === "sparse-moe");
      }).length;
      cumEfficiency += count;
      efficiencyCum.push({ year: y, count: cumEfficiency });
    });
    const totalEfficiency = efficiencyCum[efficiencyCum.length - 1]?.count ?? 0;

    // --- Architecture evolution by year ---
    const ARCH_TYPES = ["decoder-only", "encoder-only", "encoder-decoder", "mixture-of-experts", "sparse-moe", "diffusion"] as const;
    const archByYear: Record<number, Record<string, number>> = {};
    YEARS.forEach((y) => {
      archByYear[y] = {};
      ARCH_TYPES.forEach((a) => { archByYear[y][a] = 0; });
    });
    models.forEach((m) => {
      const y = parseDate(m.releaseDate).getFullYear();
      if (y >= 2018 && y <= 2026 && m.architecture) {
        const arch = m.architecture as string;
        archByYear[y][arch] = (archByYear[y][arch] || 0) + 1;
      }
    });

    // --- Innovation density per year ---
    const innovationDensity: { year: number; count: number }[] = [];
    YEARS.forEach((y) => {
      const uniqueInnovations = new Set<string>();
      models.forEach((m) => {
        const my = parseDate(m.releaseDate).getFullYear();
        if (my === y) m.innovations.forEach((inn) => uniqueInnovations.add(inn));
      });
      innovationDensity.push({ year: y, count: uniqueInnovations.size });
    });

    // --- Safety & RLHF counts ---
    const safetyFamilyCount = models.filter((m) => m.family === "safety").length;
    const rlhfCount = models.filter((m) => m.innovations.includes("rlhf")).length;

    // --- Specialization counts ---
    const SPECIALIZED_FAMILIES = new Set(["embedding", "robotics", "speech-ai", "music-gen", "image-gen", "coding-tool", "safety", "search-tool"]);
    const specializedCounts: Record<string, number> = {};
    models.forEach((m) => {
      if (SPECIALIZED_FAMILIES.has(m.family)) {
        specializedCounts[m.family] = (specializedCounts[m.family] || 0) + 1;
      }
    });
    const totalSpecialized = Object.values(specializedCounts).reduce((a, b) => a + b, 0);
    const uniqueModalities = new Set(models.map((m) => m.modality).filter(Boolean));

    return {
      modelsByYear,
      opennessByYear,
      openPctByYear,
      topLineages,
      moeCumulative,
      contextData,
      topCompanies,
      totalCompanies,
      pipeline,
      modalityByYear,
      reasoningCum,
      agenticCount,
      chinaByYear,
      usByYear,
      chinaCount,
      efficiencyCum,
      totalEfficiency,
      archByYear,
      innovationDensity,
      safetyFamilyCount,
      rlhfCount,
      specializedCounts,
      totalSpecialized,
      uniqueModalities,
      YEARS,
    };
  }, []);

  // ── Build insight sections ──────────────────────────────────────────────

  const {
    modelsByYear,
    opennessByYear,
    openPctByYear,
    topLineages,
    moeCumulative,
    contextData,
    topCompanies,
    totalCompanies,
    pipeline,
    modalityByYear,
    reasoningCum,
    agenticCount,
    chinaByYear,
    usByYear,
    chinaCount,
    efficiencyCum,
    totalEfficiency,
    safetyFamilyCount,
    rlhfCount,
    specializedCounts,
    totalSpecialized,
    uniqueModalities,
    YEARS,
  } = computedData;

  const totalMoE = moeCumulative[moeCumulative.length - 1]?.count ?? 0;
  const totalReasoning = reasoningCum[reasoningCum.length - 1]?.count ?? 0;

  const FAMILY_LABELS_SHORT: Record<string, string> = {
    "openai-gpt": "GPT",
    "openai-o": "o-series",
    "anthropic-claude": "Claude",
    "google-gemini": "Gemini",
    "google-palm": "PaLM",
    "google-gemma": "Gemma",
    "meta-llama": "LLaMA",
    mistral: "Mistral",
    "xai-grok": "Grok",
    "cohere-command": "Command",
    "microsoft-phi": "Phi",
    deepseek: "DeepSeek",
    "alibaba-qwen": "Qwen",
    "tii-falcon": "Falcon",
    "amazon-nova": "Nova",
    "stability-ai": "Stability",
    midjourney: "Midjourney",
    "image-gen": "Image Gen",
    community: "Community",
    foundational: "Foundational",
    "nvidia-nemotron": "Nemotron",
    ibm: "IBM",
    "coding-tool": "Coding",
    "01ai-yi": "Yi",
    apple: "Apple",
    "ai21-jamba": "AI21",
    "allen-ai": "Allen AI",
    inflection: "Inflection",
    "search-tool": "Search",
    "music-gen": "Music",
    "speech-ai": "Speech",
    "embedding": "Embedding",
    "safety": "Safety",
    "robotics": "Robotics",
    "chinese-llm": "Chinese",
  };

  const insights: InsightSection[] = [
    // 1. Cambrian Explosion
    {
      id: "cambrian",
      number: 1,
      title: "The Cambrian Explosion",
      stat: `From ${modelsByYear[2018]} models in 2018 to ${modelsByYear[2024]} in 2024 — a ${Math.round(modelsByYear[2024] / modelsByYear[2018])}× increase`,
      statGradient: "linear-gradient(135deg, #8b5cf6, #6366f1, #4f46e5)",
      accentColor: "#8b5cf6",
      analysis:
        `With ${models.length} models now tracked, the AI landscape went from a handful of research projects to an industry producing ${modelsByYear[2024]} new models per year. 2023 was the inflection point — the year ChatGPT's success triggered an industry-wide arms race. Every major tech company, from Apple to Amazon, scrambled to release their own models. ${totalCompanies} organizations across 10+ countries are now competing.`,
      chart: (
        <MiniChart>
          {(w, h) => {
            const M = { top: 12, right: 8, bottom: 28, left: 32 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            const maxVal = Math.max(...YEARS.map((y) => modelsByYear[y]));
            const x = d3.scaleBand<number>().domain(YEARS).range([0, iW]).padding(0.25);
            const y = d3.scaleLinear().domain([0, maxVal + 5]).range([iH, 0]);
            return (
              <svg width={w} height={h}>
                <defs>
                  <linearGradient id="g-cambrian" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#4c1d95" />
                  </linearGradient>
                </defs>
                <g transform={`translate(${M.left},${M.top})`}>
                  {y.ticks(4).map((t) => (
                    <line key={t} x1={0} x2={iW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}
                  {YEARS.map((yr) => {
                    const bx = x(yr)!;
                    const bw = x.bandwidth();
                    const val = modelsByYear[yr];
                    return (
                      <g key={yr}>
                        <rect x={bx} y={y(val)} width={bw} height={iH - y(val)} rx={3} fill="url(#g-cambrian)" opacity={0.85} />
                        <text x={bx + bw / 2} y={y(val) - 4} textAnchor="middle" className="fill-text-secondary text-[9px] font-medium">
                          {val}
                        </text>
                      </g>
                    );
                  })}
                  <g transform={`translate(0,${iH})`}>
                    {YEARS.map((yr) => (
                      <text key={yr} x={(x(yr)!) + x.bandwidth() / 2} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                        {String(yr).slice(2)}
                      </text>
                    ))}
                  </g>
                  {y.ticks(4).map((t) => (
                    <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                      {t}
                    </text>
                  ))}
                </g>
              </svg>
            );
          }}
        </MiniChart>
      ),
    },

    // 2. Open Source Revolution
    {
      id: "open-source",
      number: 2,
      title: "The Open Source Revolution",
      stat: `Open models went from 0% in 2021 to ${openPctByYear.find((y) => y.year === 2024)?.pct ?? 62}% in 2024`,
      statGradient: "linear-gradient(135deg, #10b981, #06b6d4)",
      accentColor: "#10b981",
      analysis:
        "In 2021, every major model was closed and proprietary. By 2024, open-weight and open-source models made up the majority of releases. Meta's LLaMA leak in 2023 was the spark — once researchers could study and fine-tune frontier-class models, the community produced an explosion of derivatives. This democratization may be the most consequential trend in AI history.",
      chart: (
        <div className="flex flex-col gap-3">
          <MiniChart>
            {(w, h) => {
              const M = { top: 12, right: 8, bottom: 28, left: 32 };
              const iW = w - M.left - M.right;
              const iH = h - M.top - M.bottom;
              const filteredYears = YEARS.filter((y) => modelsByYear[y] > 0);
              const maxVal = Math.max(...filteredYears.map((y) => modelsByYear[y]));
              const x = d3.scaleBand<number>().domain(filteredYears).range([0, iW]).padding(0.25);
              const y = d3.scaleLinear().domain([0, maxVal + 5]).range([iH, 0]);
              return (
                <svg width={w} height={h}>
                  <g transform={`translate(${M.left},${M.top})`}>
                    {filteredYears.map((yr) => {
                      const bx = x(yr)!;
                      const bw = x.bandwidth();
                      const cl = opennessByYear[yr].closed;
                      const op = opennessByYear[yr].open;
                      return (
                        <g key={yr}>
                          <rect x={bx} y={y(cl + op)} width={bw} height={y(op) - y(cl + op)} rx={0} fill="#ef4444" opacity={0.7} />
                          <rect x={bx} y={y(op)} width={bw} height={iH - y(op)} rx={0} fill="#10b981" opacity={0.8} />
                        </g>
                      );
                    })}
                    <g transform={`translate(0,${iH})`}>
                      {filteredYears.map((yr) => (
                        <text key={yr} x={x(yr)! + x.bandwidth() / 2} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                          {String(yr).slice(2)}
                        </text>
                      ))}
                    </g>
                    {y.ticks(4).map((t) => (
                      <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                        {t}
                      </text>
                    ))}
                  </g>
                </svg>
              );
            }}
          </MiniChart>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-[#ef4444] opacity-70" />
              <span>Closed Models</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-[#10b981] opacity-80" />
              <span>Open Models</span>
            </div>
          </div>
        </div>
      ),
    },

    // 3. Deepest Family Trees
    {
      id: "lineage",
      number: 3,
      title: "The Deepest Family Trees",
      stat: `GPT lineage reaches ${topLineages[0]?.depth ?? 14} generations deep`,
      statGradient: "linear-gradient(135deg, #f59e0b, #f97316)",
      accentColor: "#f59e0b",
      analysis:
        "OpenAI's GPT family is the deepest evolutionary tree in AI, with 14 generations from GPT-1 to GPT-5.5. This isn't just version numbering — each generation represents genuine architectural or training breakthroughs. Anthropic's Claude lineage, while shorter at 10 generations, shows the fastest iteration pace.",
      chart: (
        <MiniChart height={220}>
          {(w, h) => {
            const M = { top: 8, right: 16, bottom: 8, left: 90 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            const maxDepth = topLineages[0]?.depth ?? 14;
            const barH = Math.min(24, iH / topLineages.length - 4);
            const y = d3.scaleBand<string>().domain(topLineages.map((l) => l.family)).range([0, iH]).padding(0.2);
            const x = d3.scaleLinear().domain([0, maxDepth + 1]).range([0, iW]);
            const barColors = ["#f59e0b", "#fb923c", "#fbbf24", "#f97316", "#fcd34d", "#fdba74", "#fde68a", "#fed7aa"];
            return (
              <svg width={w} height={h}>
                <g transform={`translate(${M.left},${M.top})`}>
                  {topLineages.map((l, i) => (
                    <g key={l.family}>
                      <text x={-6} y={(y(l.family) ?? 0) + barH / 2 + 1} textAnchor="end" dominantBaseline="middle" className="fill-text-secondary text-[10px]">
                        {FAMILY_LABELS_SHORT[l.family] ?? l.family}
                      </text>
                      <rect
                        x={0}
                        y={y(l.family) ?? 0}
                        width={x(l.depth)}
                        height={barH}
                        rx={4}
                        fill={barColors[i] ?? "#f59e0b"}
                        opacity={0.8}
                      />
                      <text
                        x={x(l.depth) + 6}
                        y={(y(l.family) ?? 0) + barH / 2 + 1}
                        dominantBaseline="middle"
                        className="fill-text-primary text-[10px] font-bold"
                      >
                        {l.depth}
                      </text>
                    </g>
                  ))}
                </g>
              </svg>
            );
          }}
        </MiniChart>
      ),
    },

    // 4. MoE Takeover
    {
      id: "moe",
      number: 4,
      title: "The MoE Takeover",
      stat: `${totalMoE} models now use Mixture-of-Experts architecture`,
      statGradient: "linear-gradient(135deg, #06b6d4, #3b82f6)",
      accentColor: "#06b6d4",
      analysis:
        "Mixture-of-Experts started as a 2017 paper and was mostly ignored. Mixtral 8x7B's viral success in late 2023 proved MoE could deliver GPT-4-class quality at a fraction of the inference cost. Within 12 months, MoE became the default architecture for any model over 100B parameters — adopted by DeepSeek V2/V3, Grok, DBRX, Arctic, and Qwen.",
      chart: (
        <MiniChart>
          {(w, h) => {
            const M = { top: 16, right: 16, bottom: 28, left: 32 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            const maxVal = moeCumulative[moeCumulative.length - 1]?.count ?? 1;
            const x = d3.scaleLinear().domain([2018, 2026]).range([0, iW]);
            const y = d3.scaleLinear().domain([0, maxVal + 3]).range([iH, 0]);
            const lineGen = d3.line<{ year: number; count: number }>().x((d) => x(d.year)).y((d) => y(d.count)).curve(d3.curveMonotoneX);
            const areaGen = d3.area<{ year: number; count: number }>().x((d) => x(d.year)).y0(iH).y1((d) => y(d.count)).curve(d3.curveMonotoneX);
            return (
              <svg width={w} height={h}>
                <defs>
                  <linearGradient id="g-moe-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <g transform={`translate(${M.left},${M.top})`}>
                  {y.ticks(4).map((t) => (
                    <line key={t} x1={0} x2={iW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}
                  <path d={areaGen(moeCumulative) ?? ""} fill="url(#g-moe-area)" />
                  <path d={lineGen(moeCumulative) ?? ""} fill="none" stroke="#06b6d4" strokeWidth={2.5} />
                  {moeCumulative.filter((d) => d.count > 0).map((d) => (
                    <circle key={d.year} cx={x(d.year)} cy={y(d.count)} r={4} fill="#06b6d4" stroke="#0a0a0f" strokeWidth={2} />
                  ))}
                  <g transform={`translate(0,${iH})`}>
                    {YEARS.map((yr) => (
                      <text key={yr} x={x(yr)} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                        {String(yr).slice(2)}
                      </text>
                    ))}
                  </g>
                  {y.ticks(4).map((t) => (
                    <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                      {t}
                    </text>
                  ))}
                </g>
              </svg>
            );
          }}
        </MiniChart>
      ),
    },

    // 5. Context Window Explosion
    {
      id: "context",
      number: 5,
      title: "The Context Window Explosion",
      stat: "Context windows grew from 512 to 10M+ tokens — a 19,000× increase",
      statGradient: "linear-gradient(135deg, #ec4899, #f43f5e)",
      accentColor: "#ec4899",
      analysis:
        "In 2018, GPT-1 had a 512-token context window. By 2025, Gemini offered 10 million tokens — enough to process entire codebases or dozens of novels at once. This wasn't just incremental improvement; it required fundamental innovations like Flash Attention and rotary position embeddings. The practical impact: AI went from answering single questions to analyzing entire projects.",
      chart: (
        <MiniChart height={220}>
          {(w, h) => {
            const M = { top: 16, right: 16, bottom: 28, left: 42 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            const minDate = new Date("2018-01-01");
            const maxDate = new Date("2026-12-01");
            const x = d3.scaleTime().domain([minDate, maxDate]).range([0, iW]);
            const y = d3.scaleLog().domain([500, 12_000_000]).range([iH, 0]).clamp(true);
            const logTicks = [1000, 10_000, 100_000, 1_000_000, 10_000_000];
            const formatTick = (v: number) => {
              if (v >= 1_000_000) return `${v / 1_000_000}M`;
              if (v >= 1_000) return `${v / 1_000}K`;
              return String(v);
            };
            return (
              <svg width={w} height={h}>
                <g transform={`translate(${M.left},${M.top})`}>
                  {logTicks.map((t) => (
                    <line key={t} x1={0} x2={iW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}
                  {contextData.map((d, i) => (
                    <circle
                      key={i}
                      cx={x(d.date)}
                      cy={y(d.ctx)}
                      r={3}
                      fill="#ec4899"
                      opacity={0.6}
                    />
                  ))}
                  <g transform={`translate(0,${iH})`}>
                    {[2018, 2020, 2022, 2024, 2026].map((yr) => (
                      <text key={yr} x={x(new Date(`${yr}-06-01`))} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                        {yr}
                      </text>
                    ))}
                  </g>
                  {logTicks.map((t) => (
                    <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                      {formatTick(t)}
                    </text>
                  ))}
                </g>
              </svg>
            );
          }}
        </MiniChart>
      ),
    },

    // 6. Companies
    {
      id: "companies",
      number: 6,
      title: `${totalCompanies} Companies, One Race`,
      stat: `Models from ${totalCompanies} organizations across 10+ countries`,
      statGradient: "linear-gradient(135deg, #a78bfa, #8b5cf6)",
      accentColor: "#a78bfa",
      analysis:
        `What started as a two-horse race between OpenAI and Google has become a global competition spanning ${totalCompanies} organizations. ${chinaCount} models come from Chinese labs — DeepSeek alone has ${specializedCounts["deepseek"] ?? 7} entries, while Alibaba's Qwen and Zhipu AI's GLM families are rapidly expanding. Community contributors and startups (Nous Research, Eric Hartford) punch far above their weight through fine-tuning and abliteration techniques.`,
      chart: (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
          {topCompanies.map(([company, count], i) => (
            <div
              key={company}
              className="glass rounded-lg px-3 py-2.5 text-center transition-all hover:bg-surface-elevated"
              style={{
                animationDelay: `${i * 50}ms`,
              }}
            >
              <div className="text-lg sm:text-xl font-bold text-accent-violet">{count}</div>
              <div className="text-[10px] text-text-muted leading-tight truncate">{company}</div>
            </div>
          ))}
        </div>
      ),
    },

    // 7. Innovation Pipeline
    {
      id: "pipeline",
      number: 7,
      title: "Innovation Pipeline: Paper to Product",
      stat: "Average ~2 years from paper to widespread model adoption",
      statGradient: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)",
      accentColor: "#fbbf24",
      analysis:
        "The pipeline from research paper to production model has dramatically accelerated. Early innovations like RLHF took 5+ years to go mainstream. Now, architectures like Mamba go from paper to production in months. This compression is both exciting (faster progress) and concerning (less time for safety evaluation).",
      chart: (
        <div className="space-y-1.5 mt-4">
          {pipeline.map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div className="flex-1 text-right text-text-secondary truncate">
                {p.paper} <span className="text-text-muted">({p.paperYear})</span>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <div className="w-2 h-2 rounded-full bg-accent-amber" />
                <div className="w-8 sm:w-12 h-px bg-gradient-to-r from-accent-amber to-accent-emerald" />
                <div className="w-2 h-2 rounded-full bg-accent-emerald" />
              </div>
              <div className="flex-1 text-text-secondary truncate">
                {p.model} <span className="text-text-muted">({p.modelYear})</span>
              </div>
              <span className="text-[10px] font-medium text-accent-amber shrink-0 w-16 text-right">{p.gap}</span>
            </div>
          ))}
        </div>
      ),
    },

    // 8. Modality Matrix
    {
      id: "modality",
      number: 8,
      title: "The Modality Matrix",
      stat: "Text dropped from 100% to just 20% of new models",
      statGradient: "linear-gradient(135deg, #22d3ee, #06b6d4, #0891b2)",
      accentColor: "#22d3ee",
      analysis:
        "Early AI was text-only. Now, over half of new models handle multiple modalities — images, audio, video, and code. The trend is unmistakable: the future of AI is models that can see, hear, speak, code, and reason simultaneously. The arrival of models like GPT-4o (text+image+audio) and Gemini 2.0 (text+image+video) marks the beginning of truly general-purpose AI.",
      chart: (() => {
        const modalities = ["text", "multimodal", "code", "image", "audio", "video"];
        const modColors: Record<string, string> = {
          text: "#8b5cf6",
          multimodal: "#06b6d4",
          code: "#10b981",
          image: "#ec4899",
          audio: "#f59e0b",
          video: "#f43f5e",
        };
        return (
          <div className="flex flex-col gap-3">
            <MiniChart>
              {(w, h) => {
                const M = { top: 12, right: 8, bottom: 18, left: 32 };
                const iW = w - M.left - M.right;
                const iH = h - M.top - M.bottom;
                const filteredYears = YEARS.filter((y) => modelsByYear[y] > 0);
                const maxStack = Math.max(
                  ...filteredYears.map((y) => Object.values(modalityByYear[y]).reduce((a, b) => a + b, 0))
                );
                const x = d3.scaleBand<number>().domain(filteredYears).range([0, iW]).padding(0.2);
                const y = d3.scaleLinear().domain([0, maxStack + 3]).range([iH, 0]);
                return (
                  <svg width={w} height={h}>
                    <g transform={`translate(${M.left},${M.top})`}>
                      {filteredYears.map((yr) => {
                        const bx = x(yr)!;
                        const bw = x.bandwidth();
                        let cumY = 0;
                        return (
                          <g key={yr}>
                            {modalities.map((mod) => {
                              const val = modalityByYear[yr][mod] || 0;
                              if (val === 0) return null;
                              const segY = y(cumY + val);
                              const segH = y(cumY) - segY;
                              cumY += val;
                              return (
                                <rect key={mod} x={bx} y={segY} width={bw} height={segH} fill={modColors[mod] || "#666"} opacity={0.75} rx={1} />
                              );
                            })}
                          </g>
                        );
                      })}
                      <g transform={`translate(0,${iH})`}>
                        {filteredYears.map((yr) => (
                          <text key={yr} x={x(yr)! + x.bandwidth() / 2} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                            {String(yr).slice(2)}
                          </text>
                        ))}
                      </g>
                      {y.ticks(4).map((t) => (
                        <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                          {t}
                        </text>
                      ))}
                    </g>
                  </svg>
                );
              }}
            </MiniChart>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-text-muted">
              {modalities.map((mod) => (
                <div key={mod} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: modColors[mod], opacity: 0.8 }} />
                  <span className="capitalize">{mod}</span>
                </div>
              ))}
            </div>
          </div>
        );
      })(),
    },

    // 9. Reasoning Revolution
    {
      id: "reasoning",
      number: 9,
      title: "The Reasoning Revolution",
      stat: `${totalReasoning} models now claim reasoning capabilities`,
      statGradient: "linear-gradient(135deg, #f97316, #ef4444)",
      accentColor: "#f97316",
      analysis: [
        {
          year: "Early 2026",
          text: "Reasoning has exploded from a niche capability (Chain-of-Thought prompting in 2022) to the most sought-after feature in AI. OpenAI's o1 proved that 'thinking longer' (test-time compute) could dramatically improve performance on hard problems. Now every major lab — Anthropic, Google, DeepSeek — is racing to build models that don't just pattern-match but actually reason step-by-step.",
        },
        {
          year: "Late 2026",
          text: "In late 2026, reasoning evolved into continuous self-correcting loops where models automatically backtrack and fix their own logic during inference, seen in GPT-5.6 and Claude 5 Opus. The paradigm has shifted from discrete 'thinking steps' to fluid, adaptive problem-solving that mimics human reflection.",
        }
      ],
      chart: (
        <MiniChart>
          {(w, h) => {
            const M = { top: 16, right: 16, bottom: 28, left: 32 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            const maxVal = reasoningCum[reasoningCum.length - 1]?.count ?? 1;
            const x = d3.scaleLinear().domain([2018, 2026]).range([0, iW]);
            const y = d3.scaleLinear().domain([0, maxVal + 3]).range([iH, 0]);
            const lineGen = d3.line<{ year: number; count: number }>().x((d) => x(d.year)).y((d) => y(d.count)).curve(d3.curveMonotoneX);
            const areaGen = d3.area<{ year: number; count: number }>().x((d) => x(d.year)).y0(iH).y1((d) => y(d.count)).curve(d3.curveMonotoneX);
            return (
              <svg width={w} height={h}>
                <defs>
                  <linearGradient id="g-reason-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <g transform={`translate(${M.left},${M.top})`}>
                  {y.ticks(4).map((t) => (
                    <line key={t} x1={0} x2={iW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}
                  <path d={areaGen(reasoningCum) ?? ""} fill="url(#g-reason-area)" />
                  <path d={lineGen(reasoningCum) ?? ""} fill="none" stroke="#f97316" strokeWidth={2.5} />
                  {reasoningCum.filter((d) => d.count > 0).map((d) => (
                    <circle key={d.year} cx={x(d.year)} cy={y(d.count)} r={4} fill="#f97316" stroke="#0a0a0f" strokeWidth={2} />
                  ))}
                  <g transform={`translate(0,${iH})`}>
                    {YEARS.map((yr) => (
                      <text key={yr} x={x(yr)} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                        {String(yr).slice(2)}
                      </text>
                    ))}
                  </g>
                  {y.ticks(4).map((t) => (
                    <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                      {t}
                    </text>
                  ))}
                </g>
              </svg>
            );
          }}
        </MiniChart>
      ),
    },

    // 10. The China Factor
    {
      id: "china",
      number: 10,
      title: "The China Factor",
      stat: `${chinaCount} Chinese models tracked, up from 0 in 2022`,
      statGradient: "linear-gradient(135deg, #f43f5e, #e11d48, #be123c)",
      accentColor: "#f43f5e",
      analysis: [
        {
          year: "Early 2026",
          text: "China has emerged as the world's second AI superpower. DeepSeek, Alibaba, and Baidu are rapidly closing the gap with Western frontier models. The US-China AI race is now the defining dynamic of the industry, with implications for regulation, export controls, and the future of open research.",
        },
        {
          year: "Late 2026",
          text: "Companies like DeepSeek proved that innovative architecture (MLA, multi-head latent attention) can compete with brute-force scaling. Moonshot AI's Kimi K3 (open-weight) and MiniMax show that Chinese labs are no longer just following — they're leading on specific frontiers.",
        }
      ],
      chart: (
        <div className="flex flex-col gap-3">
          <MiniChart height={220}>
            {(w, h) => {
              const M = { top: 16, right: 16, bottom: 18, left: 32 };
              const iW = w - M.left - M.right;
              const iH = h - M.top - M.bottom;
              const filteredYears = YEARS.filter((y) => usByYear[y] > 0 || chinaByYear[y] > 0);
              const maxVal = Math.max(...filteredYears.map((y) => usByYear[y] + chinaByYear[y]));
              const x = d3.scaleBand<number>().domain(filteredYears).range([0, iW]).padding(0.2);
              const y = d3.scaleLinear().domain([0, maxVal + 3]).range([iH, 0]);
              return (
                <svg width={w} height={h}>
                  <defs>
                    <linearGradient id="g-china" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" />
                      <stop offset="100%" stopColor="#be123c" />
                    </linearGradient>
                    <linearGradient id="g-us" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                  <g transform={`translate(${M.left},${M.top})`}>
                    {y.ticks(4).map((t) => (
                      <line key={t} x1={0} x2={iW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                    ))}
                    {filteredYears.map((yr) => {
                      const bx = x(yr)!;
                      const bw = x.bandwidth() / 2 - 1;
                      const usVal = usByYear[yr];
                      const cnVal = chinaByYear[yr];
                      return (
                        <g key={yr}>
                          <rect x={bx} y={y(usVal)} width={bw} height={iH - y(usVal)} rx={3} fill="url(#g-us)" opacity={0.8} />
                          <rect x={bx + bw + 2} y={y(cnVal)} width={bw} height={iH - y(cnVal)} rx={3} fill="url(#g-china)" opacity={0.8} />
                          {usVal > 0 && <text x={bx + bw / 2} y={y(usVal) - 4} textAnchor="middle" className="fill-text-secondary text-[8px] font-medium">{usVal}</text>}
                          {cnVal > 0 && <text x={bx + bw + 2 + bw / 2} y={y(cnVal) - 4} textAnchor="middle" className="fill-text-secondary text-[8px] font-medium">{cnVal}</text>}
                        </g>
                      );
                    })}
                    <g transform={`translate(0,${iH})`}>
                      {filteredYears.map((yr) => (
                        <text key={yr} x={x(yr)! + x.bandwidth() / 2} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                          {String(yr).slice(2)}
                        </text>
                      ))}
                    </g>
                    {y.ticks(4).map((t) => (
                      <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                        {t}
                      </text>
                    ))}
                  </g>
                </svg>
              );
            }}
          </MiniChart>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[10px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-[#3b82f6] opacity-80" />
              <span>United States</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm shrink-0 bg-[#f43f5e] opacity-80" />
              <span>China</span>
            </div>
          </div>
        </div>
      ),
    },

    // 11. The Efficiency Revolution
    {
      id: "efficiency",
      number: 11,
      title: "The Efficiency Revolution",
      stat: `${totalEfficiency} models use efficiency innovations (distillation, MoE, parameter sharing)`,
      statGradient: "linear-gradient(135deg, #10b981, #059669, #047857)",
      accentColor: "#10b981",
      analysis:
        "The AI industry hit a wall: training ever-larger models became prohibitively expensive. The response was an efficiency revolution. DistilBERT showed you could compress BERT to 60% of its size while keeping 97% of its capability. ALBERT proved parameter sharing could slash model size 18×. Mixture-of-Experts architectures (Mixtral, DeepSeek-V2) activate only a fraction of parameters per query. LoRA made fine-tuning accessible on consumer GPUs. The Chinchilla paper proved most models were undertrained relative to their size. The new mantra: smaller, smarter, cheaper.",
      chart: (
        <MiniChart>
          {(w, h) => {
            const M = { top: 16, right: 16, bottom: 28, left: 32 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            const maxVal = efficiencyCum[efficiencyCum.length - 1]?.count ?? 1;
            const x = d3.scaleLinear().domain([2018, 2026]).range([0, iW]);
            const y = d3.scaleLinear().domain([0, maxVal + 3]).range([iH, 0]);
            const lineGen = d3.line<{ year: number; count: number }>().x((d) => x(d.year)).y((d) => y(d.count)).curve(d3.curveMonotoneX);
            const areaGen = d3.area<{ year: number; count: number }>().x((d) => x(d.year)).y0(iH).y1((d) => y(d.count)).curve(d3.curveMonotoneX);
            return (
              <svg width={w} height={h}>
                <defs>
                  <linearGradient id="g-eff-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <g transform={`translate(${M.left},${M.top})`}>
                  {y.ticks(4).map((t) => (
                    <line key={t} x1={0} x2={iW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}
                  <path d={areaGen(efficiencyCum) ?? ""} fill="url(#g-eff-area)" />
                  <path d={lineGen(efficiencyCum) ?? ""} fill="none" stroke="#10b981" strokeWidth={2.5} />
                  {efficiencyCum.filter((d) => d.count > 0).map((d) => (
                    <circle key={d.year} cx={x(d.year)} cy={y(d.count)} r={4} fill="#10b981" stroke="#0a0a0f" strokeWidth={2} />
                  ))}
                  <g transform={`translate(0,${iH})`}>
                    {YEARS.map((yr) => (
                      <text key={yr} x={x(yr)} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                        {String(yr).slice(2)}
                      </text>
                    ))}
                  </g>
                  {y.ticks(4).map((t) => (
                    <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                      {t}
                    </text>
                  ))}
                </g>
              </svg>
            );
          }}
        </MiniChart>
      ),
    },

    // 12. The Safety Imperative
    {
      id: "safety-alignment",
      number: 12,
      title: "The Safety Imperative",
      stat: `${safetyFamilyCount} dedicated safety models + ${rlhfCount} RLHF-aligned models`,
      statGradient: "linear-gradient(135deg, #ef4444, #f97316, #f59e0b)",
      accentColor: "#ef4444",
      analysis:
        "Safety went from an academic afterthought to an industry imperative. The RLHF paper (2017) took 5 years to become standard practice. Constitutional AI gave Anthropic a principled framework for self-improvement. But the real shift came when Meta released Llama Guard — a dedicated safety classifier that any developer could use. Google followed with ShieldGemma. Meanwhile, the open-source community pushed back with 'abliteration' techniques, raising fundamental questions: who decides what's safe, and should guardrails be removable?",
      chart: (
        <MiniChart height={180}>
          {(w, h) => {
            const M = { top: 12, right: 16, bottom: 8, left: 8 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            const milestones = [
              { year: 2017, label: "RLHF Paper", color: "#f97316" },
              { year: 2022, label: "Constitutional AI", color: "#ef4444" },
              { year: 2022, label: "InstructGPT", color: "#f59e0b" },
              { year: 2024, label: "Llama Guard", color: "#10b981" },
              { year: 2024, label: "ShieldGemma", color: "#3b82f6" },
            ];
            const x = d3.scaleLinear().domain([2016, 2025]).range([0, iW]);
            return (
              <svg width={w} height={h}>
                <g transform={`translate(${M.left},${M.top})`}>
                  {/* Timeline line */}
                  <line x1={0} x2={iW} y1={iH / 2} y2={iH / 2} stroke="rgba(255,255,255,0.08)" strokeWidth={2} />
                  {milestones.map((m, i) => {
                    const cx = x(m.year);
                    const cy = (i % 2 === 0) ? iH / 2 - 20 - (i * 4) : iH / 2 + 20 + ((i - 1) * 4);
                    return (
                      <g key={m.label}>
                        <line x1={cx} x2={cx} y1={iH / 2} y2={cy} stroke={m.color} strokeWidth={1.5} strokeDasharray="3 3" />
                        <circle cx={cx} cy={iH / 2} r={5} fill={m.color} stroke="#0a0a0f" strokeWidth={2} />
                        <text x={cx} y={cy + (i % 2 === 0 ? -6 : 12)} textAnchor="middle" className="fill-text-secondary text-[9px] font-medium">
                          {m.label}
                        </text>
                        <text x={cx} y={cy + (i % 2 === 0 ? -18 : 24)} textAnchor="middle" className="fill-text-muted text-[8px]">
                          {m.year}
                        </text>
                      </g>
                    );
                  })}
                </g>
              </svg>
            );
          }}
        </MiniChart>
      ),
    },

    // 13. From Text to Everything
    {
      id: "specialization",
      number: 13,
      title: "From Text to Everything",
      stat: `${uniqueModalities.size} modalities × ${Object.keys(specializedCounts).length} specialized verticals = ${totalSpecialized} specialist models`,
      statGradient: "linear-gradient(135deg, #8b5cf6, #06b6d4, #10b981, #f59e0b, #ec4899)",
      accentColor: "#8b5cf6",
      analysis:
        "AI has fragmented from one thing (text prediction) into a dozen specialized disciplines. Embedding models (text-embedding-3, BGE) power every search engine and RAG pipeline. Safety models (Llama Guard, ShieldGemma) act as AI immune systems. Robotics models (RT-2, PaLM-E) bridge language and physical action. Music generators (Suno, Udio), speech synthesizers (VALL-E, ElevenLabs), and coding agents (Devin, Cursor, SWE-Agent) each represent billion-dollar verticals. The 'foundation model' era is giving way to an era of specialized, deeply integrated AI products.",
      chart: (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-4">
          {Object.entries(specializedCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([family, count]) => {
              const colors: Record<string, string> = {
                "image-gen": "#ec4899",
                "coding-tool": "#10b981",
                "search-tool": "#3b82f6",
                embedding: "#06b6d4",
                safety: "#ef4444",
                "speech-ai": "#f59e0b",
                "music-gen": "#a78bfa",
                robotics: "#f97316",
              };
              const labels: Record<string, string> = {
                "image-gen": "Image Gen",
                "coding-tool": "Coding",
                "search-tool": "Search",
                embedding: "Embedding",
                safety: "Safety",
                "speech-ai": "Speech",
                "music-gen": "Music",
                robotics: "Robotics",
              };
              return (
                <div
                  key={family}
                  className="glass rounded-lg px-3 py-3 text-center transition-all hover:bg-surface-elevated"
                >
                  <div className="text-xl sm:text-2xl font-bold" style={{ color: colors[family] ?? "#8b5cf6" }}>
                    {count}
                  </div>
                  <div className="text-[10px] text-text-muted leading-tight">
                    {labels[family] ?? family}
                  </div>
                </div>
              );
            })}
        </div>
      ),
    },

    // 11. The Era of Autonomous Agents
    {
      id: "agents",
      number: 14,
      title: "The Era of Autonomous Agents",
      stat: `${agenticCount} models specifically designed for autonomous, long-horizon workflows`,
      statGradient: "linear-gradient(135deg, #10b981, #3b82f6)",
      accentColor: "#10b981",
      analysis:
        "The paradigm has shifted from conversational chatbots to autonomous agents capable of extended task planning. Triggered by innovations like Google DeepMind's 'Prospective Credit Assignment' and open alternatives like Nemotron Lightning, models are now increasingly designed to run continuously, correcting their own mistakes and managing multi-step workflows over hours or days.",
      chart: (
        <MiniChart>
          {(w, h) => {
            const M = { top: 16, right: 16, bottom: 28, left: 32 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            
            // Calculate cumulative agentic count
            const agenticCum: { year: number; count: number }[] = [];
            let cumAgentic = 0;
            YEARS.forEach((y) => {
              const count = models.filter((m) => {
                const my = parseDate(m.releaseDate).getFullYear();
                return my === y && m.innovations.includes("agentic");
              }).length;
              cumAgentic += count;
              agenticCum.push({ year: y, count: cumAgentic });
            });
            const maxVal = agenticCum[agenticCum.length - 1]?.count ?? 1;
            const x = d3.scaleLinear().domain([2018, 2026]).range([0, iW]);
            const y = d3.scaleLinear().domain([0, maxVal + 3]).range([iH, 0]);
            const lineGen = d3.line<{ year: number; count: number }>().x((d) => x(d.year)).y((d) => y(d.count)).curve(d3.curveMonotoneX);
            const areaGen = d3.area<{ year: number; count: number }>().x((d) => x(d.year)).y0(iH).y1((d) => y(d.count)).curve(d3.curveMonotoneX);
            return (
              <svg width={w} height={h}>
                <defs>
                  <linearGradient id="g-agent-area" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <g transform={`translate(${M.left},${M.top})`}>
                  {y.ticks(4).map((t) => (
                    <line key={t} x1={0} x2={iW} y1={y(t)} y2={y(t)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}
                  <path d={areaGen(agenticCum) ?? ""} fill="url(#g-agent-area)" />
                  <path d={lineGen(agenticCum) ?? ""} fill="none" stroke="#10b981" strokeWidth={2.5} />
                  {agenticCum.filter((d) => d.count > 0).map((d) => (
                    <circle key={d.year} cx={x(d.year)} cy={y(d.count)} r={4} fill="#10b981" stroke="#0a0a0f" strokeWidth={2} />
                  ))}
                  <g transform={`translate(0,${iH})`}>
                    {YEARS.map((yr) => (
                      <text key={yr} x={x(yr)} y={16} textAnchor="middle" className="fill-text-muted text-[9px]">
                        {String(yr).slice(2)}
                      </text>
                    ))}
                  </g>
                  {y.ticks(4).map((t) => (
                    <text key={t} x={-6} y={y(t)} textAnchor="end" dominantBaseline="middle" className="fill-text-muted text-[9px]">
                      {t}
                    </text>
                  ))}
                </g>
              </svg>
            );
          }}
        </MiniChart>
      ),
    },

    // 12. Hardware Specialization
    {
      id: "hardware",
      number: 15,
      title: "Hardware Specialization",
      stat: `Scaling from chips to gigawatt racks and model-specific ASICs`,
      statGradient: "linear-gradient(135deg, #f59e0b, #ef4444)",
      accentColor: "#f59e0b",
      analysis:
        "We are witnessing the rapid diversification of AI hardware. It is no longer just about buying faster general-purpose GPUs. In late 2026, companies introduced massive rack-scale deployment solutions (AMD Helios) and hyper-specialized ASICs (Taalas) designed to embed specific model weights directly into silicon. This solves the memory-bandwidth bottleneck, enabling dense agentic workflows at scale.",
      chart: (
        <div className="flex justify-around items-center mt-6 p-4 glass rounded-xl">
          <div className="text-center">
            <div className="text-3xl mb-2">🖥️</div>
            <div className="text-sm font-bold text-accent-cyan">General GPU</div>
            <div className="text-[10px] text-text-muted">Flexible, High-Cost</div>
          </div>
          <div className="w-12 h-px bg-border-hover" />
          <div className="text-center">
            <div className="text-3xl mb-2">🏢</div>
            <div className="text-sm font-bold text-accent-violet">Rack-Scale</div>
            <div className="text-[10px] text-text-muted">Dense, Agentic Workloads</div>
          </div>
          <div className="w-12 h-px bg-border-hover" />
          <div className="text-center">
            <div className="text-3xl mb-2">🧠</div>
            <div className="text-sm font-bold text-accent-amber">Silicon ASICs</div>
            <div className="text-[10px] text-text-muted">Embedded Weights</div>
          </div>
        </div>
      ),
    },
  ];

  // ── Table of Contents ───────────────────────────────────────────────────

  const tocItems = [
    ...insights.map((i) => ({ id: i.id, label: i.title })),
    { id: "whats-next", label: "What's Next" },
  ];

  // 2024 open pct for "emerging patterns"
  const openPct2026 = openPctByYear.find((y) => y.year === 2026)?.pct ?? 35;

  const allInsightIds = [...insights.map((i) => i.id), "whats-next"];

  return (
    <div className="flex flex-col gap-10">
      {/* Scroll Progress Indicator */}
      <ScrollProgress insightIds={allInsightIds} />

      {/* Table of Contents */}
      <nav className="glass rounded-2xl p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">
          Table of Contents
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
          {tocItems.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="group flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-surface-elevated transition-colors text-xs"
            >
              <span className="text-accent-violet font-bold shrink-0">{i + 1}.</span>
              <span className="text-text-secondary group-hover:text-text-primary transition-colors leading-tight">
                {item.label}
              </span>
            </a>
          ))}
        </div>
      </nav>

      {/* Insight Cards */}
      {insights.map((insight, i) => (
        <InsightCard key={insight.id} insight={insight} index={i} />
      ))}

      {/* 16. What's Next — Special treatment */}
      <WhatNextCard
        agenticCount={agenticCount}
        openPct2026={openPct2026}
        hardwareCount={hardware.length}
      />

      {/* Data attribution */}
      <div className="text-center text-xs text-text-muted pb-8">
        Analysis based on {models.length} models, {papers.length} papers, and{" "}
        {hardware.length} hardware milestones tracked in the LLM Tree of Life.
      </div>
    </div>
  );
}

// ============================================================================
// "What's Next" — Special glass card (Insight #16)
// ============================================================================

function WhatNextCard({
  agenticCount,
  openPct2026,
  hardwareCount,
}: {
  agenticCount: number;
  openPct2026: number;
  hardwareCount: number;
}) {
  const { ref, visible } = useInView(0.1);

  const predictions = [
    {
      label: "Agent-first",
      icon: "🤖",
      text: `${agenticCount} models already have agentic capabilities — expect this to become the default interaction model.`,
    },
    {
      label: "Efficiency over scale",
      icon: "⚡",
      text: "Parameter growth is plateauing; efficiency (MoE, Mamba, MLA) is the new frontier. Smaller, smarter models are winning.",
    },
    {
      label: "Open is winning… for now",
      icon: "🔓",
      text: `Open-source share peaked at 62% but dropped to ${openPct2026}% in 2026 as frontier labs restrict access to their most powerful models.`,
    },
    {
      label: "Hardware is the bottleneck",
      icon: "🖥️",
      text: `The ${hardwareCount} hardware milestones show compute doubling every ~18 months, but model demands are growing faster.`,
    },
    {
      label: "Specialization",
      icon: "🎯",
      text: "Coding tools, search engines, music generators — AI is fragmenting into specialized, deeply integrated products that do one thing exceptionally well.",
    },
    {
      label: "The US-China race",
      icon: "🌏",
      text: "The US-China AI race will intensify — Chinese open-weight models (DeepSeek, Kimi K2) are already matching Western closed models on key benchmarks.",
    },
    {
      label: "Vertical foundation models",
      icon: "🏥",
      text: "Every industry vertical will have its own foundation model — legal AI, medical AI, financial AI — each trained on domain-specific data at scale.",
    },
  ];

  return (
    <div
      ref={ref}
      id="whats-next"
      className={`
        relative rounded-2xl overflow-visible transition-all duration-700
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-br from-accent-violet via-accent-cyan to-accent-emerald">
        <div className="w-full h-full rounded-2xl bg-surface-primary" />
      </div>

      <div className="relative z-10 p-6 sm:p-8">
        <div className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-3">
          Insight #16
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-2">
          What&apos;s Next: Emerging Patterns
        </h2>
        <p className="text-sm text-text-secondary mb-6 max-w-2xl">
          Based on the trajectories we&apos;ve tracked, here are the patterns most likely
          to define AI&apos;s next chapter.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {predictions.map((p, i) => (
            <div
              key={p.label}
              className="glass rounded-xl p-4 flex gap-3 transition-all duration-300 hover:bg-surface-elevated"
              style={{
                transitionDelay: `${i * 80}ms`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(12px)",
              }}
            >
              <span className="text-2xl shrink-0" role="img" aria-label={p.label}>
                {p.icon}
              </span>
              <div>
                <div className="text-sm font-semibold text-text-primary mb-1">
                  {p.label}
                </div>
                <p className="text-xs text-text-secondary leading-relaxed">
                  <AutoGlossary text={p.text} />
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
