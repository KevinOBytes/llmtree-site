"use client";

import { useEffect, useRef } from "react";

/**
 * Animated abstract tree visualization for the hero section.
 * Renders an SVG radial tree with pulsing nodes and connecting branches.
 */
export function HeroTree() {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    // Add subtle rotation animation
    const svg = svgRef.current;
    if (!svg) return;

    let frame: number;
    let angle = 0;

    const animate = () => {
      angle += 0.1;
      const nodes = svg.querySelectorAll<SVGCircleElement>(".hero-node");
      nodes.forEach((node, i) => {
        const offset = Math.sin((angle + i * 40) * 0.02) * 2;
        node.setAttribute(
          "cy",
          String(parseFloat(node.dataset.baseY ?? "0") + offset)
        );
      });
      frame = requestAnimationFrame(animate);
    };

    // Set base positions
    const nodes = svg.querySelectorAll<SVGCircleElement>(".hero-node");
    nodes.forEach((node) => {
      node.dataset.baseY = node.getAttribute("cy") ?? "0";
    });

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Build a mini tree structure for visualization
  const cx = 200;
  const branches = [
    // Root
    { x1: cx, y1: 280, x2: cx, y2: 200, color: "#8b5cf6" },
    // Level 1
    { x1: cx, y1: 200, x2: cx - 80, y2: 140, color: "#10a37f" },
    { x1: cx, y1: 200, x2: cx + 80, y2: 140, color: "#d97757" },
    { x1: cx, y1: 200, x2: cx, y2: 120, color: "#4285f4" },
    // Level 2
    { x1: cx - 80, y1: 140, x2: cx - 120, y2: 80, color: "#10a37f" },
    { x1: cx - 80, y1: 140, x2: cx - 50, y2: 75, color: "#0668e1" },
    { x1: cx + 80, y1: 140, x2: cx + 50, y2: 80, color: "#d97757" },
    { x1: cx + 80, y1: 140, x2: cx + 120, y2: 70, color: "#ff7000" },
    { x1: cx, y1: 120, x2: cx - 20, y2: 60, color: "#4285f4" },
    { x1: cx, y1: 120, x2: cx + 30, y2: 55, color: "#4d6bfe" },
    // Level 3
    { x1: cx - 120, y1: 80, x2: cx - 150, y2: 35, color: "#10a37f" },
    { x1: cx - 120, y1: 80, x2: cx - 100, y2: 30, color: "#10a37f" },
    { x1: cx + 120, y1: 70, x2: cx + 140, y2: 30, color: "#ff7000" },
    { x1: cx + 50, y1: 80, x2: cx + 60, y2: 35, color: "#d97757" },
  ];

  const nodes = [
    // Root
    { cx: cx, cy: 280, r: 6, color: "#8b5cf6", label: "Transformer" },
    // Level 1
    { cx: cx - 80, cy: 140, r: 5, color: "#10a37f", label: "GPT" },
    { cx: cx + 80, cy: 140, r: 5, color: "#d97757", label: "Claude" },
    { cx: cx, cy: 120, r: 5, color: "#4285f4", label: "Gemini" },
    // Level 2
    { cx: cx - 120, cy: 80, r: 4, color: "#10a37f", label: "" },
    { cx: cx - 50, cy: 75, r: 4, color: "#0668e1", label: "LLaMA" },
    { cx: cx + 50, cy: 80, r: 4, color: "#d97757", label: "" },
    { cx: cx + 120, cy: 70, r: 4, color: "#ff7000", label: "Mistral" },
    { cx: cx - 20, cy: 60, r: 4, color: "#4285f4", label: "" },
    { cx: cx + 30, cy: 55, r: 4, color: "#4d6bfe", label: "DeepSeek" },
    // Level 3 (leaf nodes)
    { cx: cx - 150, cy: 35, r: 3, color: "#10a37f", label: "" },
    { cx: cx - 100, cy: 30, r: 3, color: "#10a37f", label: "" },
    { cx: cx + 140, cy: 30, r: 3, color: "#ff7000", label: "" },
    { cx: cx + 60, cy: 35, r: 3, color: "#d97757", label: "" },
  ];

  return (
    <div className="relative w-[400px] h-[340px] animate-fade-in-up [animation-delay:400ms]">
      {/* Glow behind */}
      <div className="absolute inset-0 rounded-full bg-accent-violet/5 blur-[60px]" />

      <svg
        ref={svgRef}
        viewBox="0 0 400 320"
        className="w-full h-full relative z-10"
        aria-label="Abstract tree visualization of AI model families"
      >
        {/* Branches */}
        {branches.map((b, i) => (
          <line
            key={`branch-${i}`}
            x1={b.x1}
            y1={b.y1}
            x2={b.x2}
            y2={b.y2}
            stroke={b.color}
            strokeWidth="1.5"
            strokeOpacity="0.3"
            className="transition-all duration-700"
          />
        ))}

        {/* Nodes */}
        {nodes.map((n, i) => (
          <g key={`node-${i}`}>
            {/* Glow circle */}
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r * 3}
              fill={n.color}
              opacity="0.08"
              className="animate-pulse-glow"
              style={{ animationDelay: `${i * 200}ms` }}
            />
            {/* Core circle */}
            <circle
              cx={n.cx}
              cy={n.cy}
              r={n.r}
              fill={n.color}
              opacity="0.9"
              className="hero-node"
            />
            {/* Label */}
            {n.label && (
              <text
                x={n.cx}
                y={n.cy + n.r + 14}
                textAnchor="middle"
                fill="rgba(255,255,255,0.5)"
                fontSize="9"
                fontFamily="var(--font-sans)"
              >
                {n.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
