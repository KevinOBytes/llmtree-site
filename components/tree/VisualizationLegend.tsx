"use client";

import { useState } from "react";
import { FAMILY_COLORS } from "@/lib/types";

// ============================================================================
// VisualizationLegend — Educational guide to visual encodings
// ============================================================================

interface VisualizationLegendProps {
  viewDimension: "2d" | "3d";
  motionEnabled: boolean;
}

/** Subset of families shown in the legend for brevity */
const LEGEND_FAMILIES: { family: keyof typeof FAMILY_COLORS; label: string }[] =
  [
    { family: "openai-gpt", label: "GPT" },
    { family: "anthropic-claude", label: "Claude" },
    { family: "google-gemini", label: "Gemini" },
    { family: "meta-llama", label: "LLaMA" },
    { family: "deepseek", label: "DeepSeek" },
  ];

export function VisualizationLegend({
  viewDimension,
}: VisualizationLegendProps) {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <div
      className="absolute bottom-4 left-4 z-30 max-w-[260px] select-none"
      role="complementary"
      aria-label="Visualization legend"
    >
      <div className="glass rounded-xl overflow-hidden">
        {/* ── Header / toggle ──────────────────────────────────────────── */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="
            flex items-center justify-between w-full
            px-3 py-2 cursor-pointer
            text-xs font-semibold text-text-secondary
            hover:text-text-primary transition-colors duration-200
          "
        >
          <span className="flex items-center gap-1.5">
            {/* Eye icon */}
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              className="text-accent-violet"
            >
              <path
                d="M1.5 8s2.5-4.5 6.5-4.5S14.5 8 14.5 8s-2.5 4.5-6.5 4.5S1.5 8 1.5 8Z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <circle
                cx="8"
                cy="8"
                r="2"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
            Visual Guide
          </span>
          {/* Chevron */}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform duration-300 ${
              collapsed ? "rotate-0" : "rotate-180"
            }`}
          >
            <path
              d="M3 4.5L6 7.5L9 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* ── Expandable body ──────────────────────────────────────────── */}
        <div
          className={`
            grid transition-[grid-template-rows] duration-300 ease-[var(--ease-spring)]
            ${collapsed ? "grid-rows-[0fr]" : "grid-rows-[1fr]"}
          `}
        >
          <div className="overflow-hidden">
            <div className="px-3 pb-3 space-y-3 stagger">
              {/* ── 1. Color → Family ────────────────────────────────── */}
              <LegendSection title="Color → Family">
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {LEGEND_FAMILIES.map(({ family, label }) => (
                    <span
                      key={family}
                      className="flex items-center gap-1 text-[10px] text-text-secondary"
                    >
                      <span
                        className="inline-block w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: FAMILY_COLORS[family] }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </LegendSection>

              {/* ── 2. Color Depth → Parameters ──────────────────────── */}
              <LegendSection title="Color Depth → Parameters">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-muted">Fewer</span>
                  <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-accent-violet/30 via-accent-violet/60 to-accent-violet" />
                  <span className="text-[10px] text-text-muted">More</span>
                </div>
              </LegendSection>

              {/* ── 3. Shape → Modality ───────────────────────────────── */}
              <LegendSection title="Shape → Modality">
                <div className="flex gap-3">
                  <ShapeLabel shape="circle" label="Text" />
                  <ShapeLabel shape="diamond" label="Multimodal" />
                  <ShapeLabel shape="hexagon" label="Code" />
                </div>
              </LegendSection>

              {/* ── 4. Size → Context window ──────────────────────────── */}
              <LegendSection title="Size → Context Window">
                <div className="flex items-end gap-3">
                  <SizeCircle size={6} label="4K" />
                  <SizeCircle size={10} label="128K" />
                  <SizeCircle size={16} label="1M+" />
                </div>
              </LegendSection>

              {/* ── 5. Glow → Status ─────────────────────────────────── */}
              <LegendSection title="Glow → Status">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-violet shadow-[0_0_6px_rgba(139,92,246,0.7)]" />
                    Active
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent-violet/30" />
                    Deprecated
                  </span>
                </div>
              </LegendSection>

              {/* ── 6. Ring → Openness ────────────────────────────────── */}
              <LegendSection title="Ring → Openness">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <circle
                        cx="6"
                        cy="6"
                        r="5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                    Closed
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-text-secondary">
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <circle
                        cx="6"
                        cy="6"
                        r="5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeDasharray="2 2"
                      />
                    </svg>
                    Open-weight
                  </span>
                </div>
              </LegendSection>

              {/* ── 7. Depth → Release date (3D only) ────────────────── */}
              {viewDimension === "3d" && (
                <LegendSection title="Depth → Release Date">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-text-muted">Closer</span>
                    <div className="flex-1 flex items-center gap-0.5">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div
                          key={i}
                          className="flex-1 h-1.5 rounded-full bg-text-muted"
                          style={{ opacity: 0.15 + i * 0.12 }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] text-text-muted">Further</span>
                  </div>
                </LegendSection>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Internal sub-components
// ============================================================================

function LegendSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-wide uppercase text-text-muted mb-1">
        {title}
      </p>
      {children}
    </div>
  );
}

function ShapeLabel({
  shape,
  label,
}: {
  shape: "circle" | "diamond" | "hexagon";
  label: string;
}) {
  const shapeElement = (() => {
    switch (shape) {
      case "circle":
        return (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <circle
              cx="6"
              cy="6"
              r="5"
              fill="var(--color-accent-violet)"
              opacity="0.7"
            />
          </svg>
        );
      case "diamond":
        return (
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect
              x="6"
              y="0.5"
              width="7.5"
              height="7.5"
              rx="1"
              transform="rotate(45 6 0.5)"
              fill="var(--color-accent-cyan)"
              opacity="0.7"
            />
          </svg>
        );
      case "hexagon":
        return (
          <svg width="14" height="12" viewBox="0 0 14 12">
            <polygon
              points="7,0.5 13,3 13,9 7,11.5 1,9 1,3"
              fill="var(--color-accent-emerald)"
              opacity="0.7"
            />
          </svg>
        );
    }
  })();

  return (
    <span className="flex items-center gap-1 text-[10px] text-text-secondary">
      {shapeElement}
      {label}
    </span>
  );
}

function SizeCircle({ size, label }: { size: number; label: string }) {
  return (
    <span className="flex flex-col items-center gap-0.5">
      <span
        className="rounded-full border border-accent-violet/50 bg-accent-violet/20"
        style={{ width: size, height: size }}
      />
      <span className="text-[9px] text-text-muted">{label}</span>
    </span>
  );
}
