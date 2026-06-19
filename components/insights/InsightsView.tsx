"use client";

import { useMemo, useEffect, useRef, useState, type ReactNode } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { papers } from "@/lib/data/papers";
import { hardware } from "@/lib/data/hardware";
import { parseContextWindow, parseDate } from "@/lib/chartUtils";

// ============================================================================
// Types
// ============================================================================

interface InsightSection {
  id: string;
  number: number;
  title: string;
  stat: string;
  statGradient: string;
  accentColor: string;
  analysis: string;
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
// Insight Card component
// ============================================================================

function InsightCard({ insight, index }: { insight: InsightSection; index: number }) {
  const { ref, visible } = useInView(0.1);

  return (
    <div
      ref={ref}
      id={insight.id}
      className={`
        relative rounded-2xl glass overflow-hidden transition-all duration-700
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      {/* Left accent border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
        style={{ background: insight.accentColor }}
      />

      <div className="p-6 sm:p-8 pl-7 sm:pl-10">
        {/* Section number */}
        <div className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-3">
          Insight #{insight.number}
        </div>

        {/* Title */}
        <h2 className="text-xl sm:text-2xl font-bold text-text-primary mb-4">
          {insight.title}
        </h2>

        {/* Big stat */}
        <div
          className="text-3xl sm:text-4xl lg:text-5xl font-black bg-clip-text text-transparent mb-6 leading-tight"
          style={{ backgroundImage: insight.statGradient }}
        >
          {insight.stat}
        </div>

        {/* Chart */}
        <div className="mb-6">{insight.chart}</div>

        {/* Analysis */}
        <p className="text-sm sm:text-base text-text-secondary leading-relaxed">
          {insight.analysis}
        </p>
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
        "The AI landscape went from a handful of research projects to an industry producing nearly 70 new models per year. 2023 was the inflection point — the year ChatGPT's success triggered an industry-wide arms race. Every major tech company, from Apple to Amazon, scrambled to release their own models.",
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
                        <rect x={bx} y={y(cl + op)} width={bw} height={iH - y(cl + op)} rx={3} fill="#ef4444" opacity={0.3} />
                        <rect x={bx} y={y(cl + op)} width={bw} height={iH - y(op) > 0 ? y(cl) - y(cl + op) : 0} rx={0} fill="#ef4444" opacity={0.7} />
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
        "What started as a two-horse race between OpenAI and Google has become a global competition. Chinese companies (DeepSeek, Alibaba/Qwen, 01.AI) now produce models that match Western counterparts. Community contributors and startups (Nous Research, Eric Hartford) punch far above their weight through fine-tuning and abliteration techniques.",
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
      chart: (
        <MiniChart>
          {(w, h) => {
            const M = { top: 12, right: 8, bottom: 28, left: 32 };
            const iW = w - M.left - M.right;
            const iH = h - M.top - M.bottom;
            const filteredYears = YEARS.filter((y) => modelsByYear[y] > 0);
            const modalities = ["text", "multimodal", "code", "image", "audio", "video"];
            const modColors: Record<string, string> = {
              text: "#8b5cf6",
              multimodal: "#06b6d4",
              code: "#10b981",
              image: "#ec4899",
              audio: "#f59e0b",
              video: "#f43f5e",
            };
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
                {/* Legend */}
                <g transform={`translate(${M.left + 4}, ${h - 4})`}>
                  {modalities.slice(0, 4).map((mod, i) => (
                    <g key={mod} transform={`translate(${i * (iW / 4)}, 0)`}>
                      <rect width={8} height={8} rx={2} fill={modColors[mod]} opacity={0.8} y={-8} />
                      <text x={12} className="fill-text-muted text-[8px]" dominantBaseline="middle">
                        {mod}
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

    // 9. Reasoning Revolution
    {
      id: "reasoning",
      number: 9,
      title: "The Reasoning Revolution",
      stat: `${totalReasoning} models now claim reasoning capabilities`,
      statGradient: "linear-gradient(135deg, #f97316, #ef4444)",
      accentColor: "#f97316",
      analysis:
        "Reasoning has exploded from a niche capability (Chain-of-Thought prompting in 2022) to the most sought-after feature in AI. OpenAI's o1 proved that 'thinking longer' (test-time compute) could dramatically improve performance on hard problems. Now every major lab — Anthropic, Google, DeepSeek — is racing to build models that don't just pattern-match but actually reason step-by-step.",
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
  ];

  // ── Table of Contents ───────────────────────────────────────────────────

  const tocItems = [
    ...insights.map((i) => ({ id: i.id, label: i.title })),
    { id: "whats-next", label: "What's Next" },
  ];

  // 2024 open pct for "emerging patterns"
  const openPct2026 = openPctByYear.find((y) => y.year === 2026)?.pct ?? 35;

  return (
    <div className="flex flex-col gap-10">
      {/* Table of Contents */}
      <nav className="glass rounded-2xl p-5 sm:p-6">
        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-widest mb-4">
          Table of Contents
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
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

      {/* 10. What's Next — Special treatment */}
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
// "What's Next" — Special glass card (Insight #10)
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
      text: "Coding tools, search engines, music generators — AI is fragmenting into specialized, deeply integrated products.",
    },
  ];

  return (
    <div
      ref={ref}
      id="whats-next"
      className={`
        relative rounded-2xl overflow-hidden transition-all duration-700
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
    >
      {/* Gradient border effect */}
      <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-br from-accent-violet via-accent-cyan to-accent-emerald">
        <div className="w-full h-full rounded-2xl bg-surface-primary" />
      </div>

      <div className="relative z-10 p-6 sm:p-8">
        <div className="text-[10px] uppercase tracking-widest text-text-muted font-medium mb-3">
          Insight #10
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
                  {p.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
