"use client";

import { useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";
import { models } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelNode } from "@/lib/types";
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
}

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
}: ForceGraph2DProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(
    null
  );

  // Stable serialization of selectedFamilies for dependency tracking
  const familiesKey = Array.from(selectedFamilies).sort().join(",");

  // Filter data
  const getFilteredData = useCallback(() => {
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
  }, [familiesKey, searchQuery, opennessFilter, modalityFilter]);

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

    // Build links
    const links: GraphLink[] = [];
    for (const model of filteredModels) {
      for (const parentId of model.parentIds) {
        if (filteredIds.has(parentId)) {
          links.push({ source: parentId, target: model.id, type: "parent" });
        }
      }
      if (model.influenceIds) {
        for (const infId of model.influenceIds) {
          if (filteredIds.has(infId)) {
            links.push({ source: infId, target: model.id, type: "influence" });
          }
        }
      }
    }

    // ── SVG setup ──────────────────────────────────────────────────────────
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 3])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

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

    // ── Axis labels (year markers) ─────────────────────────────────────────
    if (layoutMode === "timeline") {
      const minYear = 2018;
      const maxYear = 2027;
      const axisGroup = g.append("g").attr("class", "axis-labels");

      // Clean vertical Y-axis line
      axisGroup
        .append("line")
        .attr("x1", 80)
        .attr("x2", 80)
        .attr("y1", height * 0.08)
        .attr("y2", height * 0.92)
        .attr("stroke", "rgba(255,255,255,0.12)")
        .attr("stroke-width", 1.5);

      for (let year = minYear; year <= 2026; year++) {
        const t = (year - minYear) / (maxYear - minYear);
        const yPos = height * 0.1 + t * height * 0.8;

        // Subtle horizontal guide line extending to the right of Y-axis
        axisGroup
          .append("line")
          .attr("x1", 80)
          .attr("x2", width - 20)
          .attr("y1", yPos)
          .attr("y2", yPos)
          .attr("stroke", "rgba(255,255,255,0.04)")
          .attr("stroke-width", 1)
          .attr("stroke-dasharray", "4 8");

        // Year label to the left of Y-axis
        axisGroup
          .append("text")
          .text(year.toString())
          .attr("x", 68)
          .attr("y", yPos + 4)
          .attr("fill", "rgba(255,255,255,0.25)")
          .attr("font-size", "10px")
          .attr("font-family", "var(--font-mono)")
          .attr("text-anchor", "end");
      }

      // "Timeline" vertical label
      axisGroup
        .append("text")
        .text("TIMELINE ↓")
        .attr("x", 8)
        .attr("y", height * 0.06)
        .attr("fill", "rgba(255,255,255,0.25)")
        .attr("font-size", "9px")
        .attr("font-family", "var(--font-sans)")
        .attr("font-weight", "600")
        .attr("letter-spacing", "2px")
        .attr("text-anchor", "start");

      // "Family" horizontal label at bottom
      axisGroup
        .append("text")
        .text("← FAMILY CLUSTERING →")
        .attr("x", width / 2)
        .attr("y", height - 8)
        .attr("fill", "rgba(255,255,255,0.18)")
        .attr("font-size", "9px")
        .attr("font-family", "var(--font-sans)")
        .attr("font-weight", "600")
        .attr("letter-spacing", "2px")
        .attr("text-anchor", "middle");
    }

    // ── Force simulation ───────────────────────────────────────────────────
    // Group models by family for horizontal clustering
    const familyGroups: Record<string, number> = {};
    const familyList = [...new Set(filteredModels.map((m) => m.family))];
    familyList.forEach((f, i) => {
      if (layoutMode === "timeline") {
        // Spread families evenly within the zone to the right of the timeline Y-axis (margin 120px)
        familyGroups[f] = 120 + ((i + 0.5) / familyList.length) * (width - 160);
      } else {
        // Spread families evenly across the full width
        familyGroups[f] = ((i + 0.5) / familyList.length) * width;
      }
    });

    const simulation = d3.forceSimulation<GraphNode>(nodes);

    // Link Force
    simulation.force(
      "link",
      d3
        .forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance((d) => (d.type === "parent" ? 50 : 90))
        .strength((d) => (d.type === "parent" ? 0.8 : 0.1))
    );

    // Collision Force
    simulation.force(
      "collision",
      d3.forceCollide<GraphNode>().radius((d) => d.radius + 8)
    );

    // Apply layout-specific forces
    if (layoutMode === "timeline") {
      simulation
        .force("charge", d3.forceManyBody().strength(-200).distanceMax(300))
        .force(
          "x",
          d3
            .forceX<GraphNode>((d) => familyGroups[d.model.family] ?? width / 2)
            .strength(0.15)
        )
        .force(
          "y",
          d3
            .forceY<GraphNode>((d) => {
              const date = new Date(d.model.releaseDate);
              const minYear = 2018;
              const maxYear = 2027;
              const t =
                (date.getFullYear() + date.getMonth() / 12 - minYear) /
                (maxYear - minYear);
              return height * 0.08 + t * height * 0.84;
            })
            .strength(0.8)
        );
    } else if (layoutMode === "ancestry") {
      simulation
        .force("charge", d3.forceManyBody().strength(-80).distanceMax(200))
        .force(
          "x",
          d3
            .forceX<GraphNode>((d) => {
              const r = ranks[d.id] ?? 0;
              return width * 0.08 + (r / maxRank) * width * 0.84;
            })
            .strength(0.855) // Strong horizontal constraint to keep in generational ranks
        )
        .force(
          "y",
          d3.forceY<GraphNode>(height / 2).strength(0.1) // Soft vertical pull
        );
    } else {
      // Network (freeform clustering)
      simulation
        .force("charge", d3.forceManyBody().strength(-220).distanceMax(300))
        .force("x", d3.forceX<GraphNode>(width / 2).strength(0.06))
        .force("y", d3.forceY<GraphNode>(height / 2).strength(0.06));
    }

    simulation
      .alphaDecay(0.03)
      .velocityDecay(0.5);

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

    node
      .on("click", (_event, d) => {
        onSelectModel(d.model);

        // Build full lineage set (self + ancestors + descendants)
        const ancestryIds = getAncestryIds(d.id);
        const descendantIds = getDescendantIds(d.id);
        const lineageIds = new Set([d.id, ...ancestryIds, ...descendantIds]);

        // Highlight lineage links with a glowing trail
        link
          .transition()
          .duration(300)
          .attr("stroke", (l) => {
            if (l.type !== "parent") return "rgba(245, 158, 11, 0.06)";
            if (isLineageLink(l, lineageIds)) return d.color;
            return "rgba(255, 255, 255, 0.04)";
          })
          .attr("stroke-width", (l) => {
            if (l.type !== "parent") return 0.5;
            if (isLineageLink(l, lineageIds)) return 3;
            return 1;
          })
          .attr("stroke-opacity", (l) => {
            if (isLineageLink(l, lineageIds)) return 1;
            return 0.3;
          });

        // Dim non-lineage nodes, keep lineage bright
        node
          .transition()
          .duration(300)
          .attr("opacity", (n) => {
            if (lineageIds.has(n.id)) return 1;
            return 0.12;
          });
      })

    // ── Highlight selected node & lineage ──────────────────────────────────
    if (selectedModelId) {
      const ancestryIds = getAncestryIds(selectedModelId);
      const descendantIds = getDescendantIds(selectedModelId);
      const lineageIds = new Set([selectedModelId, ...ancestryIds, ...descendantIds]);

      // Highlight the selected node ring
      node.each(function (d) {
        const isSel = d.id === selectedModelId;
        const isLineage = lineageIds.has(d.id);
        const dead = d.model.status === "deprecated" || d.model.status === "discontinued";
        d3.select(this)
          .select(".node-shape")
          .attr("stroke-width", isSel ? 3.5 : isLineage ? 2.5 : (dead ? 1 : 2))
          .attr("stroke", isSel ? "#fff" : d.color);
      });

      // Highlight lineage links
      link
        .attr("stroke", (l) => {
          if (l.type !== "parent") return "rgba(245, 158, 11, 0.06)";
          if (isLineageLink(l, lineageIds)) {
            const selNode = nodes.find((n) => n.id === selectedModelId);
            return selNode?.color ?? "rgba(255, 255, 255, 0.8)";
          }
          return "rgba(255, 255, 255, 0.04)";
        })
        .attr("stroke-width", (l) => {
          if (l.type !== "parent") return 0.5;
          if (isLineageLink(l, lineageIds)) return 3;
          return 1;
        });

      // Dim non-lineage nodes
      node.attr("opacity", (n) => (lineageIds.has(n.id) ? 1 : 0.12));
    }

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
        node.each(function (n) {
          const isActive = n.id === d.id;
          const isSel = n.id === selectedModelId;
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

        if (selectedModelId) {
          // Restore selected model lineage highlights
          const ancestryIds = getAncestryIds(selectedModelId);
          const descendantIds = getDescendantIds(selectedModelId);
          const lineageIds = new Set([selectedModelId, ...ancestryIds, ...descendantIds]);

          node.transition().duration(200).attr("opacity", (n) => lineageIds.has(n.id) ? 1 : 0.12);

          node.each(function (n) {
            const isSel = n.id === selectedModelId;
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
      // Keep nodes strictly constrained within safe bounds
      nodes.forEach((d) => {
        const r = d.radius || 10;
        const minX = layoutMode === "timeline" ? 90 + r : r + 10;
        const maxX = width - 20 - r;
        const minY = height * 0.06 + r;
        const maxY = height * 0.94 - r;
        
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

    // ── Zoom-to-fit after settling ─────────────────────────────────────────
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
        const translateX = width / 2 - ((minX + maxX) / 2) * scale;
        const translateY = height / 2 - ((minY + maxY) / 2) * scale;

        svg
          .transition()
          .duration(600)
          .call(
            zoom.transform as unknown as (
              s: d3.Transition<SVGSVGElement, unknown, null, undefined>
            ) => void,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
          );
      }
    });

    // ── Resize observer ────────────────────────────────────────────────────
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    familiesKey,
    searchQuery,
    getFilteredData,
    onSelectModel,
    motionEnabled,
    layoutMode,
  ]);

  // ── Highlight selected node & lineage without rebuilding graph ──────────
  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const svg = d3.select(svgEl);
    const node = svg.selectAll<d3.BaseType, GraphNode>(".tree-node");
    const link = svg.selectAll<d3.BaseType, GraphLink>(".links path");

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

  }, [selectedModelId, getFilteredData]);

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[500px]">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: "transparent" }}
      />
    </div>
  );
}
