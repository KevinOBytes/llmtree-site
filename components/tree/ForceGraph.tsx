"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelNode } from "@/lib/types";
import { FAMILY_LABELS } from "@/lib/chartUtils";
import {
  contextWindowToRadius,
  paramCountToSaturation,
  adjustColorSaturation,
  getModalityShape,
} from "@/lib/vizUtils";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  model: ModelNode;
  radius: number;
  color: string; // Saturation-adjusted family color
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  type: "parent" | "influence";
}

interface ForceGraph2DProps {
  selectedFamilies: Set<string>;
  searchQuery: string;
  onSelectModel: (model: ModelNode | null) => void;
  selectedModelId: string | null;
  motionEnabled: boolean;
  opennessFilter?: string;
  modalityFilter?: string;
  layoutMode?: "timeline" | "ancestry" | "network";
  modelsOverride?: ModelNode[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PREFERRED_FAMILY_ORDER: string[] = [
  // Frontier / Tier-1 Labs
  "openai-gpt",
  "openai-o",
  "anthropic-claude",
  "google-gemini",
  "google-gemma",
  "google-palm",
  "meta-llama",
  "mistral",
  "deepseek",
  "xai-grok",
  "alibaba-qwen",
  "microsoft-phi",
  // Enterprise & Cloud
  "amazon-nova",
  "nvidia-nemotron",
  "cohere-command",
  "tii-falcon",
  "ibm",
  // Open / Global / Labs
  "chinese-llm",
  "01ai-yi",
  "allen-ai",
  "community",
  "foundational",
  // Multimodal & Creative
  "image-gen",
  "stability-ai",
  "midjourney",
  "music-gen",
  "speech-ai",
  // Specialized & Emerging
  "coding-tool",
  "search-tool",
  "embedding",
  "safety",
  "robotics",
  "apple",
  "ai21-jamba",
  "inflection",
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ForceGraph2D({
  selectedFamilies,
  searchQuery,
  onSelectModel,
  selectedModelId,
  motionEnabled,
  opennessFilter = "all",
  modalityFilter = "all",
  layoutMode = "timeline",
  modelsOverride,
}: ForceGraph2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(
    null
  );
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const fitViewRef = useRef<((animated?: boolean) => void) | null>(null);

  // Stable refs for callbacks and active selection
  const onSelectModelRef = useRef(onSelectModel);
  const selectedModelIdRef = useRef(selectedModelId);
  const prevSelectedModelIdRef = useRef<string | null>(null);

  useEffect(() => {
    onSelectModelRef.current = onSelectModel;
    selectedModelIdRef.current = selectedModelId;
  }, [onSelectModel, selectedModelId]);

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomRef.current.scaleBy, 1.35);
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(250)
      .call(zoomRef.current.scaleBy, 1 / 1.35);
  }, []);

  const handleFitView = useCallback(() => {
    fitViewRef.current?.(true);
  }, []);

  // Stable serialization of selectedFamilies for dependency tracking
  const familiesKey = Array.from(selectedFamilies).sort().join(",");

  // Filter data
  const getFilteredData = useCallback(() => {
    if (modelsOverride) return modelsOverride;
    let filtered = models;
    if (selectedFamilies.size > 0) {
      filtered = filtered.filter((m) => selectedFamilies.has(m.family));
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
    if (opennessFilter === "open") {
      filtered = filtered.filter((m) => m.openness === "open-weight" || m.openness === "open-source");
    } else if (opennessFilter === "closed") {
      filtered = filtered.filter((m) => m.openness === "closed");
    }
    if (modalityFilter !== "all") {
      filtered = filtered.filter((m) => (m.modality ?? "text") === modalityFilter);
    }
    return filtered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsOverride, familiesKey, searchQuery, opennessFilter, modalityFilter]);

  // Build and render the graph
  useEffect(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;
    if (width < 100 || height < 100) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const filteredModels = getFilteredData();
    const filteredIds = new Set(filteredModels.map((m) => m.id));

    // Build nodes with multi-dimensional encoding
    const nodes: GraphNode[] = filteredModels.map((model) => {
      const baseColor = FAMILY_COLORS[model.family];
      const saturation = paramCountToSaturation(model.parameterCount);
      return {
        id: model.id,
        model,
        radius: contextWindowToRadius(model.contextWindow),
        color: adjustColorSaturation(baseColor, saturation),
      };
    });

    // Build links with ancestor fallback to bridge gaps when intermediate nodes are filtered
    const modelsByIdMap = new Map(models.map((m) => [m.id, m]));
    const links: GraphLink[] = [];
    const addedLinkKeys = new Set<string>();

    for (const model of filteredModels) {
      let hasDirectParent = false;
      for (const parentId of model.parentIds) {
        if (filteredIds.has(parentId)) {
          const key = `${parentId}->${model.id}`;
          if (!addedLinkKeys.has(key)) {
            links.push({ source: parentId, target: model.id, type: "parent" });
            addedLinkKeys.add(key);
            hasDirectParent = true;
          }
        }
      }

      // If direct parents are not in the filtered set, connect to nearest visible ancestors
      if (!hasDirectParent && model.parentIds.length > 0) {
        const queue: { id: string; depth: number }[] = model.parentIds.map((pid) => ({ id: pid, depth: 1 }));
        const visited = new Set<string>(model.parentIds);
        while (queue.length > 0) {
          const item = queue.shift()!;
          if (filteredIds.has(item.id)) {
            const key = `${item.id}->${model.id}`;
            if (!addedLinkKeys.has(key)) {
              links.push({ source: item.id, target: model.id, type: "parent" });
              addedLinkKeys.add(key);
            }
            continue;
          }
          if (item.depth < 5) {
            const ancestorModel = modelsByIdMap.get(item.id);
            if (ancestorModel) {
              for (const pid of ancestorModel.parentIds) {
                if (!visited.has(pid)) {
                  visited.add(pid);
                  queue.push({ id: pid, depth: item.depth + 1 });
                }
              }
            }
          }
        }
      }

      if (model.influenceIds) {
        for (const infId of model.influenceIds) {
          if (filteredIds.has(infId)) {
            const key = `inf:${infId}->${model.id}`;
            if (!addedLinkKeys.has(key)) {
              links.push({ source: infId, target: model.id, type: "influence" });
              addedLinkKeys.add(key);
            }
          }
        }
      }
    }

    // ── SVG setup ──────────────────────────────────────────────────────────
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3.5])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    zoomRef.current = zoom;

    svg
      .attr("width", width)
      .attr("height", height)
      .call(
        zoom as unknown as (
          s: d3.Selection<SVGSVGElement, unknown, null, undefined>
        ) => void
      )
      .on("dblclick.zoom", null);

    const g = svg.append("g");

    // ── Defs ───────────────────────────────────────────────────────────────
    const defs = svg.append("defs");

    // Arrow markers
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

    // Per-node radial gradients
    nodes.forEach((n) => {
      const grad = defs
        .append("radialGradient")
        .attr("id", `grad-${n.id}`)
        .attr("cx", "35%")
        .attr("cy", "35%")
        .attr("r", "65%");
      grad
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", n.color)
        .attr("stop-opacity", 0.6);
      grad
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", n.color)
        .attr("stop-opacity", 0.15);
    });

    // Background glow (re-added)
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

    g.append("circle")
      .attr("cx", width / 2)
      .attr("cy", height / 2)
      .attr("r", Math.min(width, height) * 0.4)
      .attr("fill", "url(#bg-glow)");

    // Rank computation for Generational depth (ancestry)
    const ranks: Record<string, number> = {};
    const getRank = (id: string): number => {
      if (id in ranks) return ranks[id];
      const node = filteredModels.find((m) => m.id === id);
      if (!node || !node.parentIds || node.parentIds.length === 0) {
        ranks[id] = 0;
        return 0;
      }
      
      const activeParents = node.parentIds.filter((pId) => filteredIds.has(pId));
      if (activeParents.length === 0) {
        ranks[id] = 0;
        return 0;
      }
      
      const maxParentRank = Math.max(...activeParents.map((pId) => getRank(pId)));
      ranks[id] = maxParentRank + 1;
      return ranks[id];
    };
    
    filteredModels.forEach((m) => getRank(m.id));
    const maxRank = Math.max(...Object.values(ranks), 1);

    // ── Virtual World Dimensions (Expansive space to eliminate crowding) ──
    // Sort families logically so related families and major providers are clustered
    const rawFamilies = [...new Set(filteredModels.map((m) => m.family))];
    const familyList = rawFamilies.sort((a, b) => {
      const idxA = PREFERRED_FAMILY_ORDER.indexOf(a);
      const idxB = PREFERRED_FAMILY_ORDER.indexOf(b);
      const orderA = idxA === -1 ? 999 : idxA;
      const orderB = idxB === -1 ? 999 : idxB;
      return orderA - orderB;
    });

    // Count models per family to allocate column space proportionally
    const familyCounts: Record<string, number> = {};
    filteredModels.forEach((m) => {
      familyCounts[m.family] = (familyCounts[m.family] || 0) + 1;
    });

    const getColWidth = (fam: string): number => {
      const count = familyCounts[fam] || 1;
      if (count >= 20) return 220; // High volume (OpenAI, Gemini, Community)
      if (count >= 10) return 175; // Medium-high (Claude, LLaMA, Chinese LLM)
      if (count >= 5) return 135;  // Medium (DeepSeek, Mistral, Qwen, Phi)
      return 95;                   // Low volume (1-4 models)
    };

    // Pre-calculate family column centers with proportional widths
    const familyGroups: Record<string, number> = {};
    let totalTimelineWidth = 180;
    if (layoutMode === "timeline") {
      familyList.forEach((f) => {
        const colW = getColWidth(f);
        familyGroups[f] = totalTimelineWidth + colW / 2;
        totalTimelineWidth += colW;
      });
      totalTimelineWidth += 120; // Right margin
    }

    let worldWidth = width;
    let worldHeight = height;

    if (layoutMode === "timeline") {
      worldWidth = Math.max(totalTimelineWidth, width * 1.5, 2200);
      worldHeight = Math.max(height * 2.2, 9 * 360 + 320, 3400);
    } else if (layoutMode === "ancestry") {
      worldWidth = Math.max(width * 1.8, (maxRank + 1) * 240 + 360, 3000);
      worldHeight = Math.max(height * 2.0, 2600);
    } else {
      // Network freeform mode
      const rad = Math.max(Math.sqrt(nodes.length) * 110, 1300);
      worldWidth = rad * 2 + 400;
      worldHeight = rad * 2 + 400;
    }

    if (layoutMode !== "timeline") {
      const colWidth = worldWidth / Math.max(familyList.length, 1);
      familyList.forEach((f, i) => {
        familyGroups[f] = i * colWidth + colWidth / 2;
      });
    }

    // Pre-position nodes with horizontal fan-out in their respective column
    nodes.forEach((n, idx) => {
      if (layoutMode === "timeline") {
        const date = new Date(n.model.releaseDate);
        const minYear = 2018;
        const maxYear = 2027;
        const yearFraction = date.getFullYear() + (date.getMonth() + 0.5) / 12;
        const t = (yearFraction - minYear) / (maxYear - minYear);
        const targetY = 160 + t * (worldHeight - 320);
        const targetX = familyGroups[n.model.family] ?? worldWidth / 2;
        const colW = getColWidth(n.model.family);
        const horizontalSpread = Math.min(colW * 0.35, 40);
        const angle = (idx * 1.37) % (Math.PI * 2);
        const dist = 10 + ((idx % 3) * (horizontalSpread / 2));
        n.x = targetX + Math.cos(angle) * dist;
        n.y = targetY + Math.sin(angle) * 8;
      } else if (layoutMode === "ancestry") {
        const r = ranks[n.id] ?? 0;
        n.x = 180 + (r / maxRank) * (worldWidth - 360);
        n.y = worldHeight / 2 + Math.sin(idx * 0.9) * 350;
      } else {
        const theta = (idx / nodes.length) * Math.PI * 2;
        const r = 320 + (idx % 6) * 130;
        n.x = worldWidth / 2 + Math.cos(theta) * r;
        n.y = worldHeight / 2 + Math.sin(theta) * r;
      }
    });

    // ── Axis labels (year markers & column headers in virtual coordinates) ──
    if (layoutMode === "timeline") {
      const minYear = 2018;
      const maxYear = 2027;
      const axisGroup = g.append("g").attr("class", "axis-labels");

      // Clean vertical Y-axis line
      axisGroup
        .append("line")
        .attr("x1", 120)
        .attr("x2", 120)
        .attr("y1", 100)
        .attr("y2", worldHeight - 100)
        .attr("stroke", "rgba(255,255,255,0.15)")
        .attr("stroke-width", 1.5);

      for (let year = minYear; year <= 2026; year++) {
        const t = (year - minYear) / (maxYear - minYear);
        const yPos = 160 + t * (worldHeight - 320);

        // Horizontal year guide line extending across full world width
        axisGroup
          .append("line")
          .attr("x1", 120)
          .attr("x2", worldWidth - 60)
          .attr("y1", yPos)
          .attr("y2", yPos)
          .attr("stroke", "rgba(255,255,255,0.06)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "6 8");

        // Year label to the left of Y-axis
        axisGroup
          .append("text")
          .text(year.toString())
          .attr("x", 105)
          .attr("y", yPos + 5)
          .attr("fill", "rgba(255,255,255,0.45)")
          .attr("font-size", "13px")
          .attr("font-weight", "600")
          .attr("font-family", "var(--font-mono)")
          .attr("text-anchor", "end");
      }

      // Column headers for each family at top
      familyList.forEach((fam) => {
        const posX = familyGroups[fam];
        if (posX) {
          const color = FAMILY_COLORS[fam] || "#888";
          // Subtle column guide
          axisGroup
            .append("line")
            .attr("x1", posX)
            .attr("x2", posX)
            .attr("y1", 95)
            .attr("y2", worldHeight - 95)
            .attr("stroke", "rgba(255,255,255,0.025)")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "3 6");

          // Dot
          axisGroup
            .append("circle")
            .attr("cx", posX)
            .attr("cy", 68)
            .attr("r", 4.5)
            .attr("fill", color)
            .attr("opacity", 0.9);

          // Short name
          axisGroup
            .append("text")
            .text(FAMILY_LABELS[fam] || fam)
            .attr("x", posX)
            .attr("y", 84)
            .attr("fill", "rgba(255,255,255,0.65)")
            .attr("font-size", "10px")
            .attr("font-weight", "600")
            .attr("font-family", "var(--font-sans)")
            .attr("text-anchor", "middle");
        }
      });
    }

    // ── Force simulation ───────────────────────────────────────────────────
    const simulation = d3.forceSimulation<GraphNode>(nodes);

    // Link Force: longer distance and balanced strength to prevent cramping
    simulation.force(
      "link",
      d3
        .forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance((d) => (d.type === "parent" ? 95 : 140))
        .strength((d) => (d.type === "parent" ? 0.35 : 0.08))
    );

    // Collision Force: strictly enforce generous spacing around node and labels
    simulation.force(
      "collision",
      d3
        .forceCollide<GraphNode>()
        .radius((d) => Math.max(d.radius + 18, 30))
        .iterations(3)
    );

    // Apply layout-specific forces
    if (layoutMode === "timeline") {
      simulation
        .force("charge", d3.forceManyBody().strength(-400).distanceMax(700))
        .force(
          "x",
          d3
            .forceX<GraphNode>((d) => familyGroups[d.model.family] ?? worldWidth / 2)
            .strength(0.35)
        )
        .force(
          "y",
          d3
            .forceY<GraphNode>((d) => {
              const date = new Date(d.model.releaseDate);
              const minYear = 2018;
              const maxYear = 2027;
              const yearFraction = date.getFullYear() + (date.getMonth() + 0.5) / 12;
              const t = (yearFraction - minYear) / (maxYear - minYear);
              return 160 + t * (worldHeight - 320);
            })
            .strength(0.4) // Balanced strength allowing collision to naturally stagger same-month models!
        );
    } else if (layoutMode === "ancestry") {
      simulation
        .force("charge", d3.forceManyBody().strength(-300).distanceMax(500))
        .force(
          "x",
          d3
            .forceX<GraphNode>((d) => {
              const r = ranks[d.id] ?? 0;
              return 180 + (r / maxRank) * (worldWidth - 360);
            })
            .strength(0.75)
        )
        .force(
          "y",
          d3.forceY<GraphNode>(worldHeight / 2).strength(0.12)
        );
    } else {
      // Network (freeform clustering)
      simulation
        .force("charge", d3.forceManyBody().strength(-350).distanceMax(600))
        .force("x", d3.forceX<GraphNode>(worldWidth / 2).strength(0.08))
        .force("y", d3.forceY<GraphNode>(worldHeight / 2).strength(0.08));
    }

    simulation
      .alphaDecay(0.035)
      .velocityDecay(0.45);

    // Warm-up simulation for 30 ticks so nodes are well-spaced immediately
    for (let i = 0; i < 30; ++i) simulation.tick();

    simulationRef.current = simulation;

    // ── Draw links (curved paths for cleaner routing) ─────────────────────
    const link = g
      .append("g")
      .attr("class", "links")
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", (d) =>
        d.type === "parent"
          ? "rgba(255, 255, 255, 0.12)"
          : "rgba(245, 158, 11, 0.12)"
      )
      .attr("stroke-width", (d) => (d.type === "parent" ? 1.5 : 1))
      .attr("stroke-dasharray", (d) =>
        d.type === "influence" ? "4 4" : "none"
      )
      .attr("marker-end", (d) =>
        d.type === "parent" ? "url(#arrow-parent)" : "url(#arrow-influence)"
      );

    // ── Draw node groups ───────────────────────────────────────────────────
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
            // Warm up the simulation on drag end so nodes snap back to force-directed positions
            simulation.alpha(1).restart();
          })
      );

    // ── Node rendering with shape encoding ─────────────────────────────────
    const isDead = (m: ModelNode) =>
      m.status === "deprecated" || m.status === "discontinued";
    const isOpen = (m: ModelNode) =>
      m.openness === "open-weight" || m.openness === "open-source";

    // Outer glow ring
    node
      .append("circle")
      .attr("r", (d) => d.radius + 4)
      .attr("fill", "none")
      .attr("stroke", (d) =>
        isDead(d.model) ? "rgba(255,255,255,0.06)" : d.color
      )
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", (d) => (isDead(d.model) ? 0.1 : 0.2))
      .classed("glow-ring", true);

    // Main shape (modality-encoded)
    node.each(function (d) {
      const group = d3.select(this);
      const shape = getModalityShape(d.model.modality, d.radius);
      const dead = isDead(d.model);
      const open = isOpen(d.model);

      if (shape.type === "circle") {
        group
          .append("circle")
          .attr("r", d.radius)
          .attr("fill", dead ? "rgba(255,255,255,0.03)" : `url(#grad-${d.id})`)
          .attr("stroke", dead ? "rgba(255,255,255,0.15)" : d.color)
          .attr("stroke-width", dead ? 1 : 2)
          .attr("stroke-dasharray", dead ? "3 2" : open ? "4 2" : "none")
          .classed("node-shape", true);
      } else {
        group
          .append("polygon")
          .attr("points", shape.points!)
          .attr("fill", dead ? "rgba(255,255,255,0.03)" : `url(#grad-${d.id})`)
          .attr("stroke", dead ? "rgba(255,255,255,0.15)" : d.color)
          .attr("stroke-width", dead ? 1 : 2)
          .attr("stroke-dasharray", dead ? "3 2" : open ? "4 2" : "none")
          .attr("stroke-linejoin", "round")
          .classed("node-shape", true);
      }
    });

    // Inner dot
    node
      .append("circle")
      .attr("r", 2.5)
      .attr("fill", (d) => d.color);

    // Label
    node
      .append("text")
      .text((d) => {
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

    // ── D3-only tooltip (no React state) ───────────────────────────────────
    const tooltipGroup = g
      .append("g")
      .attr("class", "tooltip-group")
      .style("pointer-events", "none")
      .style("display", "none");

    const tooltipFo = tooltipGroup
      .append("foreignObject")
      .attr("width", 280)
      .attr("height", 180)
      .attr("x", -140)
      .attr("y", -180);

    const tooltipDiv = tooltipFo
      .append("xhtml:div")
      .style("background", "rgba(18, 18, 26, 0.85)")
      .style("backdrop-filter", "blur(20px)")
      .style("-webkit-backdrop-filter", "blur(20px)")
      .style("border", "1px solid rgba(255,255,255,0.12)")
      .style("border-radius", "12px")
      .style("padding", "12px 14px")
      .style("max-width", "280px")
      .style("font-family", "var(--font-sans)")
      .style("pointer-events", "none")
      .style("box-shadow", "0 8px 32px rgba(0,0,0,0.4)");

    // ── Hover state (pure D3, no React) ────────────────────────────────────
    let hoveredId: string | null = null;
    let savedFx: number | null = null;
    let savedFy: number | null = null;

    // ── Helper: compute full ancestry set (walk parentIds to root) ────────
    function getAncestryIds(nodeId: string): Set<string> {
      const ancestry = new Set<string>();
      const visited = new Set<string>();
      const queue = [nodeId];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        const model = filteredModels.find((m) => m.id === currentId);
        if (model) {
          for (const pid of model.parentIds) {
            if (filteredIds.has(pid)) {
              ancestry.add(pid);
              queue.push(pid);
            }
          }
        }
      }
      return ancestry;
    }

    // ── Helper: compute full descendant set (walk children to leaves) ────
    function getDescendantIds(nodeId: string): Set<string> {
      const descendants = new Set<string>();
      const visited = new Set<string>();
      const queue = [nodeId];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        for (const model of filteredModels) {
          if (model.parentIds.includes(currentId) && !descendants.has(model.id)) {
            descendants.add(model.id);
            queue.push(model.id);
          }
        }
      }
      return descendants;
    }

    // ── Helper: check if a link connects two nodes in a lineage set ─────
    function isLineageLink(
      l: GraphLink,
      lineageIds: Set<string>
    ): boolean {
      const src =
        typeof l.source === "object"
          ? (l.source as GraphNode).id
          : l.source;
      const tgt =
        typeof l.target === "object"
          ? (l.target as GraphNode).id
          : l.target;
      return lineageIds.has(src as string) && lineageIds.has(tgt as string);
    }

    // Deselect when clicking SVG canvas background
    svg.on("click", (event) => {
      if (event.target === svgEl || (event.target as Element).tagName === "svg") {
        onSelectModelRef.current(null);
      }
    });

    node.on("click", (event, d) => {
      event.stopPropagation();
      onSelectModelRef.current(d.model);
    });

    node.on("mouseenter", (_event, d) => {
        if (hoveredId === d.id) return;
        hoveredId = d.id;

        // Pin the node — prevents it from drifting under cursor
        savedFx = d.fx ?? null;
        savedFy = d.fy ?? null;
        d.fx = d.x;
        d.fy = d.y;

        // Freeze simulation
        simulation.alphaTarget(0).alpha(Math.min(simulation.alpha(), 0.01));

        // Build full lineage set for the hovered node
        const ancestryIds = getAncestryIds(d.id);
        const descendantIds = getDescendantIds(d.id);
        const lineageIds = new Set([d.id, ...ancestryIds, ...descendantIds]);

        // Highlight lineage links with a glowing color trail
        link
          .transition()
          .duration(120)
          .attr("stroke", (l) => {
            if (l.type !== "parent") return "rgba(245, 158, 11, 0.06)";
            if (isLineageLink(l, lineageIds)) {
              const srcNode = typeof l.source === "object" ? (l.source as GraphNode) : nodes.find(n => n.id === l.source);
              return srcNode?.color || d.color;
            }
            return "rgba(255, 255, 255, 0.04)";
          })
          .attr("stroke-width", (l) => {
            if (l.type !== "parent") return 0.5;
            if (isLineageLink(l, lineageIds)) return 3;
            return 1;
          })
          .attr("stroke-opacity", (l) => {
            if (isLineageLink(l, lineageIds)) return 1;
            return 0.35;
          });

        // Dim non-lineage nodes, keep lineage nodes bright
        node
          .transition()
          .duration(120)
          .attr("opacity", (n) => (lineageIds.has(n.id) ? 1 : 0.12));

        // Highlight the hovered/selected node rings specifically
        const activeSelectedId = selectedModelIdRef.current;
        node.each(function (n) {
          const isActive = n.id === d.id;
          const isSel = n.id === activeSelectedId;
          const isLineage = lineageIds.has(n.id);
          const dead = n.model.status === "deprecated" || n.model.status === "discontinued";
          d3.select(this)
            .select(".node-shape")
            .transition()
            .duration(120)
            .attr("stroke-width", isActive || isSel ? 3.5 : isLineage ? 2.5 : (dead ? 1 : 2))
            .attr("stroke", isActive ? "#fff" : (isSel ? "#fff" : n.color));
        });

        // Build tooltip HTML
        const dead = isDead(d.model);
        const statusBadge = dead
          ? `<span style="font-size:9px;padding:2px 6px;border-radius:99px;background:rgba(239,68,68,0.15);color:#f87171;font-weight:500">${d.model.status === "discontinued" ? "☠ Killed" : "⚠ Deprecated"}</span>`
          : "";
        const openBadge = isOpen(d.model)
          ? `<span style="font-size:9px;padding:2px 6px;border-radius:99px;background:rgba(16,185,129,0.15);color:#34d399;font-weight:500">${d.model.openness === "open-source" ? "Open Source" : "Open Weight"}</span>`
          : "";
        const paramHtml = d.model.parameterCount
          ? `<span style="font-size:9px;padding:2px 6px;border-radius:99px;background:rgba(139,92,246,0.12);color:#a78bfa">${d.model.parameterCount} params</span>`
          : "";
        const ctxHtml = d.model.contextWindow
          ? `<span style="font-size:9px;padding:2px 6px;border-radius:99px;background:rgba(6,182,212,0.12);color:#67e8f9">${d.model.contextWindow} ctx</span>`
          : "";
        const modalityHtml = d.model.modality
          ? `<span style="font-size:9px;padding:2px 6px;border-radius:99px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5)">${d.model.modality}</span>`
          : "";

        tooltipDiv.html(`
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <div style="width:8px;height:8px;border-radius:50%;background:${d.color};flex-shrink:0"></div>
            <span style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.95)">${escapeHtml(d.model.name)}</span>
            <span style="font-size:10px;color:rgba(255,255,255,0.35);font-family:monospace;margin-left:auto">${escapeHtml(d.model.releaseDate)}</span>
          </div>
          <p style="font-size:10px;color:rgba(255,255,255,0.55);line-height:1.6;margin:0 0 8px 0;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${escapeHtml(d.model.description)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${statusBadge}${openBadge}${paramHtml}${ctxHtml}${modalityHtml}</div>
        `);

        tooltipGroup
          .attr("transform", `translate(${d.x},${d.y})`)
          .style("display", null);
      })
      .on("mouseleave", (_event, d) => {
        if (hoveredId !== d.id) return;
        hoveredId = null;

        // Unpin node
        d.fx = savedFx;
        d.fy = savedFy;
        savedFx = null;
        savedFy = null;

        // Hide tooltip
        tooltipGroup.style("display", "none");

        const activeSelectedId = selectedModelIdRef.current;
        if (activeSelectedId) {
          // Restore selected model lineage highlights
          const ancestryIds = getAncestryIds(activeSelectedId);
          const descendantIds = getDescendantIds(activeSelectedId);
          const lineageIds = new Set([activeSelectedId, ...ancestryIds, ...descendantIds]);

          node.transition().duration(200).attr("opacity", (n) => lineageIds.has(n.id) ? 1 : 0.12);

          node.each(function (n) {
            const isSel = n.id === activeSelectedId;
            const isLineage = lineageIds.has(n.id);
            const dead = n.model.status === "deprecated" || n.model.status === "discontinued";
            d3.select(this)
              .select(".node-shape")
              .transition()
              .duration(200)
              .attr("stroke-width", isSel ? 3.5 : isLineage ? 2.5 : (dead ? 1 : 2))
              .attr("stroke", isSel ? "#fff" : n.color);
          });

          link.transition().duration(200)
            .attr("stroke", (l) => {
              if (l.type !== "parent") return "rgba(245, 158, 11, 0.06)";
              if (isLineageLink(l, lineageIds)) {
                const srcNode = typeof l.source === "object" ? (l.source as GraphNode) : nodes.find(n => n.id === l.source);
                return srcNode?.color || "rgba(255, 255, 255, 0.8)";
              }
              return "rgba(255, 255, 255, 0.04)";
            })
            .attr("stroke-width", (l) => {
              if (l.type !== "parent") return 0.5;
              if (isLineageLink(l, lineageIds)) return 3;
              return 1;
            })
            .attr("stroke-opacity", (l) => {
              if (isLineageLink(l, lineageIds)) return 1;
              return 0.35;
            });
        } else {
          // Reset links
          link
            .transition()
            .duration(200)
            .attr("stroke", (l) =>
              l.type === "parent"
                ? "rgba(255, 255, 255, 0.12)"
                : "rgba(245, 158, 11, 0.12)"
            )
            .attr("stroke-width", (l) => (l.type === "parent" ? 1.5 : 1))
            .attr("stroke-opacity", 1);

          // Reset nodes
          node.transition().duration(200).attr("opacity", 1);
          node.each(function (n) {
            const dead = n.model.status === "deprecated" || n.model.status === "discontinued";
            d3.select(this)
              .select(".node-shape")
              .transition()
              .duration(200)
              .attr("stroke-width", dead ? 1 : 2)
              .attr("stroke", dead ? "rgba(255,255,255,0.15)" : n.color);
          });
        }
      });

    // ── Motion mode: orbital breathing ─────────────────────────────────────
    let motionAnimFrame: number | null = null;
    const motionStartTime = Date.now();

    function animateMotion() {
      const t = (Date.now() - motionStartTime) / 1000;

      node.each(function (d, i) {
        if (hoveredId === d.id) return; // Don't animate pinned node
        const phase = i * 0.7;
        const amp = 2 + (d.radius / 22) * 3;
        const ox = Math.sin(t * 0.5 + phase) * amp;
        const oy = Math.cos(t * 0.4 + phase * 1.3) * amp * 0.6;
        d3.select(this).attr(
          "transform",
          `translate(${(d.x ?? 0) + ox},${(d.y ?? 0) + oy})`
        );
      });

      motionAnimFrame = requestAnimationFrame(animateMotion);
    }

    // Start motion immediately if enabled
    if (motionEnabled) {
      motionAnimFrame = requestAnimationFrame(animateMotion);
    }

    // ── Tick handler ───────────────────────────────────────────────────────
    simulation.on("tick", () => {
      // Keep nodes comfortably inside the virtual canvas space
      nodes.forEach((d) => {
        const r = d.radius || 10;
        const minX = layoutMode === "timeline" ? 140 + r : 40 + r;
        const maxX = worldWidth - 40 - r;
        const minY = 80 + r;
        const maxY = worldHeight - 80 - r;

        d.x = Math.max(minX, Math.min(maxX, d.x!));
        d.y = Math.max(minY, Math.min(maxY, d.y!));
      });

      // Use curved paths (quadratic bezier) for cleaner link routing
      link.attr("d", (d) => {
        const sx = (d.source as GraphNode).x!;
        const sy = (d.source as GraphNode).y!;
        const tx = (d.target as GraphNode).x!;
        const ty = (d.target as GraphNode).y!;
        // Control point offset for curve — horizontal offset based on distance
        const dx = tx - sx;
        const dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.3;
        const midX = (sx + tx) / 2 + (dy > 0 ? dr * 0.3 : -dr * 0.3);
        const midY = (sy + ty) / 2;
        return `M${sx},${sy} Q${midX},${midY} ${tx},${ty}`;
      });

      // When motion is off, position nodes directly
      if (!motionEnabled) {
        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
      }
      // When motion is on, the rAF loop handles positioning with offsets

      // Keep tooltip pinned to hovered node
      if (hoveredId) {
        const hNode = nodes.find((n) => n.id === hoveredId);
        if (hNode) {
          tooltipGroup.attr(
            "transform",
            `translate(${hNode.x},${hNode.y})`
          );
        }
      }
    });

    // ── Dynamic Fit-to-View ────────────────────────────────────────────────
    const fitView = (animated = true) => {
      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;

      nodes.forEach((n) => {
        if (n.x !== undefined && n.y !== undefined) {
          if (n.x < minX) minX = n.x;
          if (n.x > maxX) maxX = n.x;
          if (n.y < minY) minY = n.y;
          if (n.y > maxY) maxY = n.y;
        }
      });

      if (nodes.length > 0 && isFinite(minX)) {
        const padX = 80;
        const padY = 80;
        const gWidth = maxX - minX + padX * 2;
        const gHeight = maxY - minY + padY * 2;

        const currentW = container.getBoundingClientRect().width || width;
        const currentH = container.getBoundingClientRect().height || height;

        // Ensure scale keeps text readable and nodes well-proportioned
        const fitScale = Math.min(currentW / gWidth, currentH / gHeight);
        const scale = Math.min(Math.max(fitScale, 0.38), 1.05);

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const translateX = currentW / 2 - centerX * scale;
        const translateY = currentH / 2 - centerY * scale;

        const transform = d3.zoomIdentity
          .translate(translateX, translateY)
          .scale(scale);

        if (animated) {
          svg
            .transition()
            .duration(500)
            .ease(d3.easeCubicOut)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .call(zoom.transform as any, transform);
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          svg.call(zoom.transform as any, transform);
        }
      }
    };

    fitViewRef.current = fitView;
    // Initial centering immediately so nodes don't appear microscopic or off-center
    fitView(false);

    // ── Resize observer (only update SVG canvas size; never jump camera) ─────
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        const newW = entry.contentRect.width;
        const newH = entry.contentRect.height;
        if (newW > 100 && newH > 100) {
          svg.attr("width", newW).attr("height", newH);
        }
      }
    });
    observer.observe(container);

    return () => {
      simulation.stop();
      observer.disconnect();
      if (motionAnimFrame) cancelAnimationFrame(motionAnimFrame);
    };
  }, [
    familiesKey,
    searchQuery,
    getFilteredData,
    motionEnabled,
    layoutMode,
  ]);

  // ── Highlight selected node & lineage and smoothly glide camera ──────────
  useEffect(() => {
    const svgEl = svgRef.current;
    const container = containerRef.current;
    if (!svgEl || !container) return;
    const svg = d3.select(svgEl);
    const node = svg.selectAll<d3.BaseType, GraphNode>(".tree-node");
    const link = svg.selectAll<d3.BaseType, GraphLink>(".links path");

    const selectionChanged = prevSelectedModelIdRef.current !== selectedModelId;
    prevSelectedModelIdRef.current = selectedModelId;

    if (!selectedModelId) {
      // Reset styling
      node.transition().duration(250).attr("opacity", 1);
      node.each(function (d) {
        const dead = d.model.status === "deprecated" || d.model.status === "discontinued";
        d3.select(this)
          .select(".node-shape")
          .transition()
          .duration(250)
          .attr("stroke-width", dead ? 1 : 2)
          .attr("stroke", dead ? "rgba(255,255,255,0.15)" : d.color);
      });

      link.transition().duration(250)
        .attr("stroke", (l) =>
          l.type === "parent"
            ? "rgba(255, 255, 255, 0.12)"
            : "rgba(245, 158, 11, 0.12)"
        )
        .attr("stroke-width", (l) => (l.type === "parent" ? 1.5 : 1))
        .attr("stroke-opacity", 1);
      return;
    }

    const filteredModels = getFilteredData();
    const filteredIds = new Set(filteredModels.map((m) => m.id));

    // Helper: compute full ancestor set
    const getAncestryIds = (nodeId: string): Set<string> => {
      const ancestry = new Set<string>();
      const visited = new Set<string>();
      const queue = [nodeId];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        const model = filteredModels.find((m) => m.id === currentId);
        if (model) {
          for (const pid of model.parentIds) {
            if (filteredIds.has(pid)) {
              ancestry.add(pid);
              queue.push(pid);
            }
          }
        }
      }
      return ancestry;
    };

    // Helper: compute full descendant set
    const getDescendantIds = (nodeId: string): Set<string> => {
      const descendants = new Set<string>();
      const visited = new Set<string>();
      const queue = [nodeId];
      while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        for (const model of filteredModels) {
          if (model.parentIds.includes(currentId) && !descendants.has(model.id)) {
            descendants.add(model.id);
            queue.push(model.id);
          }
        }
      }
      return descendants;
    };

    const isLineageLink = (l: GraphLink, lineageIds: Set<string>): boolean => {
      const src = typeof l.source === "object" ? (l.source as GraphNode).id : l.source;
      const tgt = typeof l.target === "object" ? (l.target as GraphNode).id : l.target;
      return lineageIds.has(src as string) && lineageIds.has(tgt as string);
    };

    const ancestryIds = getAncestryIds(selectedModelId);
    const descendantIds = getDescendantIds(selectedModelId);
    const lineageIds = new Set([selectedModelId, ...ancestryIds, ...descendantIds]);

    // Dim non-lineage nodes, keep lineage nodes bright
    node.transition().duration(250).attr("opacity", (n) => lineageIds.has(n.id) ? 1 : 0.12);

    // Highlight the selected node ring specifically
    node.each(function (n) {
      const isSelected = n.id === selectedModelId;
      const isLineage = lineageIds.has(n.id);
      const dead = n.model.status === "deprecated" || n.model.status === "discontinued";
      d3.select(this)
        .select(".node-shape")
        .transition()
        .duration(250)
        .attr("stroke-width", isSelected ? 3.5 : isLineage ? 2.5 : (dead ? 1 : 2))
        .attr("stroke", isSelected ? "#fff" : n.color);
    });

    // Highlight lineage links with glowing color trail
    link.transition().duration(250)
      .attr("stroke", (l) => {
        if (l.type !== "parent") return "rgba(245, 158, 11, 0.06)";
        if (isLineageLink(l, lineageIds)) {
          const srcColor = typeof l.source === "object" ? (l.source as GraphNode).color : null;
          const tgtColor = typeof l.target === "object" ? (l.target as GraphNode).color : null;
          return srcColor || tgtColor || "#fff";
        }
        return "rgba(255, 255, 255, 0.04)";
      })
      .attr("stroke-width", (l) => {
        if (l.type !== "parent") return 0.5;
        if (isLineageLink(l, lineageIds)) return 3;
        return 1;
      })
      .attr("stroke-opacity", (l) => {
        if (isLineageLink(l, lineageIds)) return 1;
        return 0.35;
      });

    // ── Smooth glide to center the selected node in the available viewport ──
    if (selectionChanged) {
      const nodesData: GraphNode[] = [];
      node.each((d) => {
        nodesData.push(d);
      });
      const targetNode = nodesData.find((n) => n.id === selectedModelId);

      if (targetNode && targetNode.x !== undefined && targetNode.y !== undefined && zoomRef.current) {
        const currentTransform = d3.zoomTransform(svgEl);
        const rect = container.getBoundingClientRect();
        const currentW = rect.width || 800;
        const currentH = rect.height || 600;

        // Keep current zoom if user is already zoomed in, but ensure at least 0.65 for great legibility
        const targetScale = Math.max(currentTransform.k, 0.65);
        const targetX = currentW / 2 - targetNode.x * targetScale;
        const targetY = currentH / 2 - targetNode.y * targetScale;

        const transform = d3.zoomIdentity.translate(targetX, targetY).scale(targetScale);

        svg
          .transition()
          .duration(450)
          .ease(d3.easeCubicOut)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          .call(zoomRef.current.transform as any, transform);
      }
    }

  }, [selectedModelId, getFilteredData, layoutMode, motionEnabled]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />

      {/* Floating Canvas Zoom Controls (Bottom Right) */}
      <div className="absolute bottom-4 right-4 z-20 flex flex-col items-center gap-1 bg-surface-primary/85 backdrop-blur-md p-1.5 rounded-xl border border-border-default/70 shadow-lg select-none">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors text-base font-bold cursor-pointer"
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors text-base font-bold cursor-pointer"
          title="Zoom out (−)"
          aria-label="Zoom out"
        >
          −
        </button>
        <div className="w-4 h-px bg-border-default/70 my-0.5" />
        <button
          type="button"
          onClick={handleFitView}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors text-sm cursor-pointer"
          title="Fit view to all models"
          aria-label="Fit view to all models"
        >
          ⛶
        </button>
      </div>
    </div>
  );
}
