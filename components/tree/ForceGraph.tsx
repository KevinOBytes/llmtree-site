"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelNode, type ModelFamily } from "@/lib/types";

// ─── Types ───────────────────────────────────────────────────────────────────

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  model: ModelNode;
  radius: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: "parent" | "influence";
}

interface ForceGraphProps {
  familyFilter: ModelFamily | "all";
  searchQuery: string;
  onSelectModel: (model: ModelNode | null) => void;
  selectedModelId: string | null;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const FAMILY_LABELS: Record<string, string> = {
  "openai-gpt": "OpenAI GPT",
  "openai-o": "OpenAI o-series",
  "anthropic-claude": "Anthropic Claude",
  "google-gemini": "Google Gemini",
  "google-palm": "Google PaLM",
  "meta-llama": "Meta LLaMA",
  mistral: "Mistral AI",
  "xai-grok": "xAI Grok",
  "cohere-command": "Cohere Command",
  "microsoft-phi": "Microsoft Phi",
  deepseek: "DeepSeek",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function ForceGraph({
  familyFilter,
  searchQuery,
  onSelectModel,
  selectedModelId,
}: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);
  const [tooltipData, setTooltipData] = useState<{
    model: ModelNode;
    x: number;
    y: number;
  } | null>(null);
  const hoveredNodeRef = useRef<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Observe container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Filter data
  const getFilteredData = useCallback(() => {
    let filtered = models;
    if (familyFilter !== "all") {
      filtered = filtered.filter((m) => m.family === familyFilter);
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [familyFilter, searchQuery]);

  // Build and render the graph
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const { width, height } = dimensions;
    if (width < 100 || height < 100) return;

    const filteredModels = getFilteredData();
    const filteredIds = new Set(filteredModels.map((m) => m.id));

    // Build nodes
    const nodes: GraphNode[] = filteredModels.map((model) => ({
      id: model.id,
      model,
      radius: model.parentIds.length === 0 ? 14 : 10,
    }));


    // Build links (only if both sides exist in filtered set)
    const links: GraphLink[] = [];
    for (const model of filteredModels) {
      for (const parentId of model.parentIds) {
        if (filteredIds.has(parentId)) {
          links.push({
            source: parentId,
            target: model.id,
            type: "parent",
          });
        }
      }
      if (model.influenceIds) {
        for (const infId of model.influenceIds) {
          if (filteredIds.has(infId)) {
            links.push({
              source: infId,
              target: model.id,
              type: "influence",
            });
          }
        }
      }
    }

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svg
      .attr("width", width)
      .attr("height", height)
      .call(zoom as unknown as (selection: d3.Selection<SVGSVGElement, unknown, null, undefined>) => void)
      .on("dblclick.zoom", null);

    // Main group for zoom/pan transforms
    const g = svg.append("g");

    // Defs for arrow markers and gradients
    const defs = svg.append("defs");

    // Arrow marker for parent links
    defs
      .append("marker")
      .attr("id", "arrow-parent")
      .attr("viewBox", "0 -4 8 8")
      .attr("refX", 16)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-4L8,0L0,4")
      .attr("fill", "rgba(255,255,255,0.25)");

    // Arrow marker for influence links
    defs
      .append("marker")
      .attr("id", "arrow-influence")
      .attr("viewBox", "0 -4 8 8")
      .attr("refX", 16)
      .attr("refY", 0)
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-3L6,0L0,3")
      .attr("fill", "rgba(245, 158, 11, 0.3)");

    // Radial gradient for background glow
    const bgGrad = defs
      .append("radialGradient")
      .attr("id", "bg-glow")
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%");
    bgGrad
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgba(139, 92, 246, 0.04)");
    bgGrad
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(0,0,0,0)");

    // Background glow
    g.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", Math.min(width, height) * 0.4)
      .attr("fill", "url(#bg-glow)");

    // Force simulation
    const simulation = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance((d) => (d.type === "parent" ? 80 : 120))
          .strength((d) => (d.type === "parent" ? 0.7 : 0.15))
      )
      .force("charge", d3.forceManyBody().strength(-200).distanceMax(350))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collision",
        d3.forceCollide<GraphNode>().radius((d) => d.radius + 8)
      )
      .force(
        "x",
        d3
          .forceX<GraphNode>(width / 2)
          .strength(0.03)
      )
      .force(
        "y",
        d3
          .forceY<GraphNode>((d) => {
            // Position nodes vertically by release date
            const date = new Date(d.model.releaseDate);
            const minYear = 2018;
            const maxYear = 2027;
            const t =
              (date.getFullYear() + date.getMonth() / 12 - minYear) /
              (maxYear - minYear);
            return height * 0.1 + t * height * 0.8;
          })
          .strength(0.12)
      )
      .alphaDecay(0.03)
      .velocityDecay(0.4);

    simulationRef.current = simulation;

    // Draw links
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", (d) =>
        d.type === "parent"
          ? "rgba(255, 255, 255, 0.15)"
          : "rgba(245, 158, 11, 0.15)"
      )
      .attr("stroke-width", (d) => (d.type === "parent" ? 1.5 : 1))
      .attr("stroke-dasharray", (d) =>
        d.type === "influence" ? "4 4" : "none"
      )
      .attr("marker-end", (d) =>
        d.type === "parent"
          ? "url(#arrow-parent)"
          : "url(#arrow-influence)"
      );

    // Draw node groups
    const node = g
      .append("g")
      .attr("class", "nodes")
      .selectAll<SVGGElement, GraphNode>("g")
      .data(nodes)
      .join("g")
      .attr("class", "tree-node")
      .attr("cursor", "pointer")
      .call(
        d3
          .drag<SVGGElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    // Node outer glow ring
    node
      .append("circle")
      .attr("r", (d) => d.radius + 4)
      .attr("fill", "none")
      .attr("stroke", (d) => {
        const model = d.model;
        const isDead = model.status === "deprecated" || model.status === "discontinued";
        return isDead ? "rgba(255,255,255,0.08)" : FAMILY_COLORS[model.family];
      })
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.15);

    // Node background circle
    node
      .append("circle")
      .attr("r", (d) => d.radius)
      .attr("fill", (d) => {
        const model = d.model;
        const isDead = model.status === "deprecated" || model.status === "discontinued";
        if (isDead) return "rgba(255,255,255,0.03)";
        const c = FAMILY_COLORS[model.family];
        return `${c}30`;
      })
      .attr("stroke", (d) => {
        const model = d.model;
        const isDead = model.status === "deprecated" || model.status === "discontinued";
        if (isDead) return "rgba(255,255,255,0.15)";
        return FAMILY_COLORS[model.family];
      })
      .attr("stroke-width", (d) => {
        const isDead = d.model.status === "deprecated" || d.model.status === "discontinued";
        return isDead ? 1 : 2;
      })
      .attr("stroke-dasharray", (d) => {
        const isDead = d.model.status === "deprecated" || d.model.status === "discontinued";
        return isDead ? "3 2" : "none";
      })
      .classed("node-circle", true);

    // Inner dot
    node
      .append("circle")
      .attr("r", 3)
      .attr("fill", (d) => FAMILY_COLORS[d.model.family]);

    // Label
    node
      .append("text")
      .text((d) => {
        // Short name for graph readability
        const name = d.model.name;
        if (name.length > 16) return name.slice(0, 14) + "…";
        return name;
      })
      .attr("dy", (d) => d.radius + 14)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--color-text-secondary)")
      .attr("font-size", "9px")
      .attr("font-family", "var(--font-sans)")
      .attr("pointer-events", "none");

    // Date sub-label for root nodes
    node
      .filter((d) => d.model.parentIds.length === 0)
      .append("text")
      .text((d) => d.model.releaseDate)
      .attr("dy", (d) => d.radius + 24)
      .attr("text-anchor", "middle")
      .attr("fill", "var(--color-text-muted)")
      .attr("font-size", "8px")
      .attr("font-family", "var(--font-mono)")
      .attr("pointer-events", "none");

    // Interaction
    node
      .on("click", (_event, d) => {
        onSelectModel(d.model);
      })
      .on("mouseenter", (_event, d) => {
        hoveredNodeRef.current = d.id;
        // Highlight connected links
        link
          .attr("stroke", (l) => {
            const src =
              typeof l.source === "object"
                ? (l.source as GraphNode).id
                : l.source;
            const tgt =
              typeof l.target === "object"
                ? (l.target as GraphNode).id
                : l.target;
            if (src === d.id || tgt === d.id) {
              return l.type === "parent"
                ? FAMILY_COLORS[d.model.family]
                : "rgba(245, 158, 11, 0.8)";
            }
            return l.type === "parent"
              ? "rgba(255, 255, 255, 0.06)"
              : "rgba(245, 158, 11, 0.06)";
          })
          .attr("stroke-width", (l) => {
            const src =
              typeof l.source === "object"
                ? (l.source as GraphNode).id
                : l.source;
            const tgt =
              typeof l.target === "object"
                ? (l.target as GraphNode).id
                : l.target;
            if (src === d.id || tgt === d.id) return 2.5;
            return l.type === "parent" ? 1 : 0.5;
          });

        // Dim non-connected nodes
        node.attr("opacity", (n) => {
          if (n.id === d.id) return 1;
          const isConnected = links.some((l) => {
            const src = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
            const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
            return (src === d.id && tgt === n.id) || (tgt === d.id && src === n.id);
          });
          return isConnected ? 1 : 0.25;
        });

        // Use the node's simulation position for stable tooltip
        const transform = d3.zoomTransform(svgEl);
        const tooltipX = transform.applyX(d.x!) ;
        const tooltipY = transform.applyY(d.y!) - d.radius - 10;
        setTooltipData({
          model: d.model,
          x: tooltipX,
          y: tooltipY,
        });
      })
      .on("mouseleave", () => {
        hoveredNodeRef.current = null;
        // Reset links
        link
          .attr("stroke", (d) =>
            d.type === "parent"
              ? "rgba(255, 255, 255, 0.15)"
              : "rgba(245, 158, 11, 0.15)"
          )
          .attr("stroke-width", (d) => (d.type === "parent" ? 1.5 : 1));
        // Reset node opacity
        node.attr("opacity", 1);
        setTooltipData(null);
      });

    // Highlight selected node
    node.each(function (d) {
      if (d.id === selectedModelId) {
        d3.select(this)
          .select("circle.node-circle")
          .attr("stroke-width", 3)
          .attr("stroke", "#fff");
      }
    });

    // Tick handler
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => (d.source as GraphNode).x!)
        .attr("y1", (d) => (d.source as GraphNode).y!)
        .attr("x2", (d) => (d.target as GraphNode).x!)
        .attr("y2", (d) => (d.target as GraphNode).y!);

      node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    });

    // Initial zoom-to-fit after simulation settles
    simulation.on("end", () => {
      const padding = 60;
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      nodes.forEach((n) => {
        if (n.x! < minX) minX = n.x!;
        if (n.x! > maxX) maxX = n.x!;
        if (n.y! < minY) minY = n.y!;
        if (n.y! > maxY) maxY = n.y!;
      });

      if (nodes.length > 0) {
        const graphWidth = maxX - minX + padding * 2;
        const graphHeight = maxY - minY + padding * 2;
        const scale = Math.min(
          width / graphWidth,
          height / graphHeight,
          1.5
        );
        const translateX =
          width / 2 - ((minX + maxX) / 2) * scale;
        const translateY =
          height / 2 - ((minY + maxY) / 2) * scale;

        svg
          .transition()
          .duration(600)
          .call(
            zoom.transform as unknown as (selection: d3.Transition<SVGSVGElement, unknown, null, undefined>) => void,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }
    });

    return () => {
      simulation.stop();
    };
  }, [
    dimensions,
    familyFilter,
    searchQuery,
    selectedModelId,
    getFilteredData,
    onSelectModel,
  ]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 p-3 rounded-xl glass text-[10px] pointer-events-none">
        <div className="flex items-center gap-2">
          <div className="w-4 h-[2px] bg-white/30" />
          <span className="text-text-muted">Parent lineage</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-[2px] border-t border-dashed border-amber-500/40" />
          <span className="text-text-muted">Influence</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="w-3 h-3 rounded-full border-2 border-accent-violet bg-accent-violet/20" />
          <span className="text-text-muted">Root model</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full border border-dashed border-white/20 bg-white/5" />
          <span className="text-text-muted">Deprecated / Killed</span>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-4 right-4 p-2.5 rounded-xl glass text-[10px] text-text-muted pointer-events-none">
        Scroll to zoom · Drag to pan · Click nodes to explore
      </div>

      {/* Tooltip */}
      {tooltipData && (
        <div
          className="absolute z-50 pointer-events-none glass-elevated rounded-xl p-3 max-w-[260px] animate-fade-in-up [animation-duration:150ms]"
          style={{
            left: `${Math.min(Math.max(tooltipData.x - 130, 8), dimensions.width - 280)}px`,
            top: `${Math.max(tooltipData.y - 90, 8)}px`,
            transition: "left 80ms ease-out, top 80ms ease-out",
          }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{
                background: (tooltipData.model.status === "deprecated" || tooltipData.model.status === "discontinued")
                  ? "rgba(255,255,255,0.15)"
                  : FAMILY_COLORS[tooltipData.model.family],
              }}
            />
            <h4 className="text-xs font-semibold text-text-primary">
              {tooltipData.model.name}
            </h4>
            {(tooltipData.model.status === "deprecated" || tooltipData.model.status === "discontinued") && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 font-medium">
                {tooltipData.model.status === "discontinued" ? "☠ Killed" : "⚠ Deprecated"}
              </span>
            )}
            <span className="text-[10px] text-text-muted font-mono ml-auto">
              {tooltipData.model.releaseDate}
            </span>
          </div>
          <p className="text-[10px] text-text-secondary leading-relaxed line-clamp-3">
            {tooltipData.model.description}
          </p>
          {tooltipData.model.parameterCount && (
            <div className="mt-1.5 text-[10px] text-text-muted">
              <span className="text-text-secondary font-medium">
                {tooltipData.model.parameterCount}
              </span>{" "}
              parameters
            </div>
          )}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {tooltipData.model.innovations.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent-violet/15 text-accent-violet"
              >
                {tag.replace(/-/g, " ")}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
