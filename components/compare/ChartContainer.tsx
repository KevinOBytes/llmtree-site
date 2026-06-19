"use client";

import { useRef, useEffect, useState, type ReactNode } from "react";

// ── Responsive SVG container with ResizeObserver ─────────────────────────────
interface ChartContainerProps {
  title: string;
  description: string;
  children: (width: number, height: number) => ReactNode;
  aspectRatio?: number; // height = width / aspectRatio — default 1.5
  minHeight?: number;
}

export function ChartContainer({
  title,
  description,
  children,
  aspectRatio = 1.5,
  minHeight = 300,
}: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        const h = Math.max(w / aspectRatio, minHeight);
        setDims({ width: w, height: h });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [aspectRatio, minHeight]);

  return (
    <div className="glass rounded-2xl p-5 sm:p-6 flex flex-col gap-3 animate-fade-in-up">
      <div>
        <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          {description}
        </p>
      </div>
      <div ref={containerRef} className="w-full relative">
        {dims.width > 0 && children(dims.width, dims.height)}
      </div>
    </div>
  );
}

// ── Tooltip ──────────────────────────────────────────────────────────────────
export interface TooltipData {
  x: number;
  y: number;
  content: ReactNode;
}

export function ChartTooltip({ data }: { data: TooltipData | null }) {
  if (!data) return null;

  return (
    <div
      className="pointer-events-none absolute z-50 glass-elevated rounded-lg px-3 py-2 text-xs shadow-xl max-w-64 transition-opacity duration-150"
      style={{
        left: data.x,
        top: data.y,
        transform: "translate(-50%, -110%)",
      }}
    >
      {data.content}
    </div>
  );
}
