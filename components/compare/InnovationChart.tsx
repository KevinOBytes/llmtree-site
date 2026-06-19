"use client";

import { useMemo, useState, useCallback } from "react";
import { models } from "@/lib/data/models";
import type { InnovationTag } from "@/lib/types";
import { ChartContainer, type TooltipData, ChartTooltip } from "./ChartContainer";

const MARGIN = { top: 12, right: 40, bottom: 24, left: 140 };

const TAG_COLORS: Record<string, string> = {
  reasoning: "#8b5cf6",
  multimodal: "#06b6d4",
  "open-weight": "#10b981",
  "mixture-of-experts": "#3b82f6",
  "code-generation": "#14b8a6",
  agentic: "#f59e0b",
  "instruction-tuning": "#ec4899",
  rlhf: "#f43f5e",
  distillation: "#a78bfa",
  "long-context": "#22d3ee",
  transformer: "#6366f1",
  "tool-use": "#f97316",
  "test-time-compute": "#eab308",
  abliteration: "#e040fb",
  "constitutional-ai": "#d97757",
  autoregressive: "#84cc16",
  diffusion: "#fb7185",
  "text-to-image": "#c084fc",
  "chain-of-thought": "#fbbf24",
  "scaling-laws": "#38bdf8",
  "few-shot": "#4ade80",
  "zero-shot": "#2dd4bf",
  "speech-recognition": "#fb923c",
  "text-to-audio": "#a3e635",
  "text-to-video": "#f472b6",
  "masked-lm": "#94a3b8",
  "attention-mechanism": "#818cf8",
};

const TAG_LABELS: Record<string, string> = {
  reasoning: "Reasoning",
  multimodal: "Multimodal",
  "open-weight": "Open Weight",
  "mixture-of-experts": "Mixture of Experts",
  "code-generation": "Code Generation",
  agentic: "Agentic",
  "instruction-tuning": "Instruction Tuning",
  rlhf: "RLHF",
  distillation: "Distillation",
  "long-context": "Long Context",
  transformer: "Transformer",
  "tool-use": "Tool Use",
  "test-time-compute": "Test-Time Compute",
  abliteration: "Abliteration",
  "constitutional-ai": "Constitutional AI",
  autoregressive: "Autoregressive",
  diffusion: "Diffusion",
  "text-to-image": "Text-to-Image",
  "chain-of-thought": "Chain of Thought",
  "scaling-laws": "Scaling Laws",
  "few-shot": "Few-Shot",
  "zero-shot": "Zero-Shot",
  "speech-recognition": "Speech Recognition",
  "text-to-audio": "Text-to-Audio",
  "text-to-video": "Text-to-Video",
  "masked-lm": "Masked LM",
  "attention-mechanism": "Attention Mechanism",
};

const TOP_N = 15;

export function InnovationChart() {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of models) {
      for (const tag of m.innovations) {
        counts[tag] = (counts[tag] || 0) + 1;
      }
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, TOP_N)
      .map(([tag, count]) => ({
        tag: tag as InnovationTag,
        count,
        label: TAG_LABELS[tag] ?? tag,
        color: TAG_COLORS[tag] ?? "#6b6b80",
      }));
  }, []);

  const renderChart = useCallback(
    (width: number, height: number) => {
      const innerW = width - MARGIN.left - MARGIN.right;
      const innerH = height - MARGIN.top - MARGIN.bottom;
      const barH = Math.min(26, innerH / data.length - 4);
      const gap = Math.max(4, (innerH - barH * data.length) / (data.length - 1));
      const totalH = data.length * (barH + gap) - gap;
      const maxCount = Math.max(...data.map((d) => d.count));

      const xScale = (v: number) => (v / maxCount) * innerW;

      return (
        <div className="relative">
          <svg
            width={width}
            height={MARGIN.top + totalH + MARGIN.bottom}
            className="overflow-visible"
          >
            <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
              {data.map((d, i) => {
                const y = i * (barH + gap);
                const bw = xScale(d.count);
                const isHovered = hovered === d.tag;
                return (
                  <g
                    key={d.tag}
                    style={{
                      animation: `fadeInUp 0.4s ease-out ${i * 40}ms both`,
                    }}
                    onMouseEnter={(e) => {
                      setHovered(d.tag);
                      const rect = (
                        e.currentTarget.closest("div") as HTMLElement
                      ).getBoundingClientRect();
                      const svgRect = (
                        e.currentTarget.closest("svg") as SVGElement
                      ).getBoundingClientRect();
                      setTooltip({
                        x: svgRect.left - rect.left + MARGIN.left + bw / 2,
                        y: svgRect.top - rect.top + MARGIN.top + y,
                        content: (
                          <div>
                            <div className="font-semibold text-text-primary">
                              {d.label}
                            </div>
                            <div className="text-text-muted">
                              Used by {d.count} model
                              {d.count !== 1 ? "s" : ""}
                            </div>
                          </div>
                        ),
                      });
                    }}
                    onMouseLeave={() => {
                      setHovered(null);
                      setTooltip(null);
                    }}
                  >
                    <text
                      x={-8}
                      y={y + barH / 2}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className={`text-[11px] ${
                        isHovered
                          ? "fill-text-primary font-semibold"
                          : "fill-text-secondary"
                      } transition-colors`}
                    >
                      {d.label}
                    </text>
                    <rect
                      x={0}
                      y={y}
                      width={innerW}
                      height={barH}
                      rx={4}
                      fill="rgba(255,255,255,0.03)"
                    />
                    <rect
                      x={0}
                      y={y}
                      width={bw}
                      height={barH}
                      rx={4}
                      fill={d.color}
                      opacity={isHovered ? 1 : 0.8}
                      className="transition-opacity duration-200"
                    />
                    <text
                      x={bw + 8}
                      y={y + barH / 2}
                      dominantBaseline="middle"
                      className="fill-text-secondary text-[11px] font-medium"
                    >
                      {d.count}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
          <ChartTooltip data={tooltip} />
        </div>
      );
    },
    [data, hovered, tooltip]
  );

  return (
    <ChartContainer
      title="Top Innovation Tags"
      description="Most common innovation tags across all models — the techniques and paradigms shaping modern AI."
      aspectRatio={0.95}
    >
      {renderChart}
    </ChartContainer>
  );
}
