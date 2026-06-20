/* eslint-disable react-hooks/immutability */
"use client";

import { useRef, useMemo, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Text, Billboard } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";

import { models } from "@/lib/data/models";
import { FAMILY_COLORS, type ModelNode } from "@/lib/types";
import {
  contextWindowToRadius,
  paramCountToSaturation,
  adjustColorSaturation,
  releaseDateToNormalized,
} from "@/lib/vizUtils";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Graph3DNode {
  id: string;
  model: ModelNode;
  x: number;
  y: number;
  z: number;
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  vx?: number;
  vy?: number;
  vz?: number;
  radius: number;
  color: string;
  threeColor: THREE.Color;
  emissiveIntensity: number;
}

interface Graph3DLink {
  source: string | Graph3DNode;
  target: string | Graph3DNode;
  type: "parent" | "influence";
}

interface ForceGraph3DProps {
  selectedFamilies: Set<string>;
  searchQuery: string;
  onSelectModel: (model: ModelNode | null) => void;
  selectedModelId: string | null;
  motionEnabled: boolean;
  opennessFilter?: string;
  modalityFilter?: string;
}

// ─── Geometry helpers ────────────────────────────────────────────────────────

function getGeometry(modality: string | undefined): THREE.BufferGeometry {
  switch (modality) {
    case "multimodal":
      return new THREE.OctahedronGeometry(1, 0);
    case "code":
      return new THREE.DodecahedronGeometry(1, 0);
    case "vision":
      return new THREE.IcosahedronGeometry(1, 0);
    case "audio":
      return new THREE.TetrahedronGeometry(1, 0);
    case "image":
      return new THREE.ConeGeometry(1, 1.6, 5);
    case "video":
      return new THREE.CylinderGeometry(0.8, 0.8, 1.2, 8);
    default:
      return new THREE.SphereGeometry(1, 16, 16);
  }
}

// ─── Graph Scene (runs inside Canvas) ────────────────────────────────────────

interface GraphSceneProps {
  nodes: Graph3DNode[];
  links: Graph3DLink[];
  selectedModelId: string | null;
  onSelectModel: (model: ModelNode | null) => void;
  motionEnabled: boolean;
}

function GraphScene({
  nodes,
  links,
  selectedModelId,
  onSelectModel,
  motionEnabled,
}: GraphSceneProps) {
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const lineRef = useRef<THREE.LineSegments>(null);
  const hoveredRef = useRef<string | null>(null);

  // Helper: compute full ancestry set (walk parentIds to root)
  const getAncestryIds = useCallback((nodeId: string): Set<string> => {
    const ancestry = new Set<string>();
    const visited = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const n = nodes.find((node) => node.id === currentId);
      if (n) {
        for (const pid of n.model.parentIds) {
          if (nodes.some((node) => node.id === pid)) {
            ancestry.add(pid);
            queue.push(pid);
          }
        }
      }
    }
    return ancestry;
  }, [nodes]);

  // Helper: compute full descendant set (walk children to leaves)
  const getDescendantIds = useCallback((nodeId: string): Set<string> => {
    const descendants = new Set<string>();
    const visited = new Set<string>();
    const queue = [nodeId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      for (const n of nodes) {
        if (n.model.parentIds.includes(currentId) && !descendants.has(n.id)) {
          descendants.add(n.id);
          queue.push(n.id);
        }
      }
    }
    return descendants;
  }, [nodes]);

  const activeLineageRef = useRef<{
    activeId: string | null;
    lineageIds: Set<string>;
  }>({ activeId: null, lineageIds: new Set() });

  // Build line geometry for all edges
  const lineGeometry = useMemo(() => {
    const positions = new Float32Array(links.length * 6);
    const colors = new Float32Array(links.length * 6);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [links.length]);

  // Update positions every frame
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    const activeId = hoveredRef.current || selectedModelId;
    if (activeLineageRef.current.activeId !== activeId) {
      const lineageIds = new Set<string>();
      if (activeId) {
        lineageIds.add(activeId);
        getAncestryIds(activeId).forEach((id) => lineageIds.add(id));
        getDescendantIds(activeId).forEach((id) => lineageIds.add(id));
      }
      activeLineageRef.current = { activeId, lineageIds };
    }
    const { lineageIds } = activeLineageRef.current;
    const hasActiveLineage = lineageIds.size > 0;

    // Update node mesh positions and materials
    nodes.forEach((node, i) => {
      const mesh = meshRefs.current.get(node.id);
      if (!mesh) return;

      let x = node.x;
      let y = node.y;
      let z = node.z;

      // Motion mode: gentle orbital breathing
      if (motionEnabled && hoveredRef.current !== node.id) {
        const phase = i * 0.7;
        const amp = 0.3 + (node.radius / 1.5) * 0.2;
        x += Math.sin(t * 0.5 + phase) * amp;
        y += Math.cos(t * 0.4 + phase * 1.3) * amp * 0.6;
        z += Math.sin(t * 0.3 + phase * 0.8) * amp * 0.4;
      }

      mesh.position.set(x, y, z);

      // Dynamic Material styling for highlighting
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const dead = node.model.status === "deprecated" || node.model.status === "discontinued";

      if (hasActiveLineage) {
        const inLineage = lineageIds.has(node.id);
        const isActive = node.id === activeId;

        if (isActive) {
          mat.emissiveIntensity = node.id === selectedModelId ? 2.5 : 2.0;
          mat.opacity = 1.0;
        } else if (inLineage) {
          mat.emissiveIntensity = dead ? 0.6 : 1.4;
          mat.opacity = dead ? 0.6 : 0.9;
        } else {
          mat.emissiveIntensity = dead ? 0.05 : 0.1;
          mat.opacity = dead ? 0.08 : 0.12;
        }
      } else {
        mat.emissiveIntensity = dead ? 0.3 : node.emissiveIntensity;
        mat.opacity = dead ? 0.4 : 0.9;
      }
    });

    // Update line positions and colors
    const posArray = lineGeometry.attributes.position.array as Float32Array;
    const colArray = lineGeometry.attributes.color.array as Float32Array;

    links.forEach((link, i) => {
      const src =
        typeof link.source === "object" ? (link.source as Graph3DNode) : nodes.find((n) => n.id === link.source);
      const tgt =
        typeof link.target === "object" ? (link.target as Graph3DNode) : nodes.find((n) => n.id === link.target);
      if (!src || !tgt) return;

      const srcMesh = meshRefs.current.get(src.id);
      const tgtMesh = meshRefs.current.get(tgt.id);
      const sx = srcMesh?.position.x ?? src.x;
      const sy = srcMesh?.position.y ?? src.y;
      const sz = srcMesh?.position.z ?? src.z;
      const tx = tgtMesh?.position.x ?? tgt.x;
      const ty = tgtMesh?.position.y ?? tgt.y;
      const tz = tgtMesh?.position.z ?? tgt.z;

      posArray[i * 6] = sx;
      posArray[i * 6 + 1] = sy;
      posArray[i * 6 + 2] = sz;
      posArray[i * 6 + 3] = tx;
      posArray[i * 6 + 4] = ty;
      posArray[i * 6 + 5] = tz;

      const isLineageLink = hasActiveLineage && link.type === "parent" && lineageIds.has(src.id) && lineageIds.has(tgt.id);

      if (hasActiveLineage) {
        if (isLineageLink) {
          const srcColor = src.threeColor;
          const tgtColor = tgt.threeColor;
          colArray[i * 6] = srcColor.r;
          colArray[i * 6 + 1] = srcColor.g;
          colArray[i * 6 + 2] = srcColor.b;
          colArray[i * 6 + 3] = tgtColor.r;
          colArray[i * 6 + 4] = tgtColor.g;
          colArray[i * 6 + 5] = tgtColor.b;
        } else {
          const dim = 0.02;
          colArray[i * 6] = dim;
          colArray[i * 6 + 1] = dim;
          colArray[i * 6 + 2] = dim;
          colArray[i * 6 + 3] = dim;
          colArray[i * 6 + 4] = dim;
          colArray[i * 6 + 5] = dim;
        }
      } else {
        const c = link.type === "parent" ? 0.15 : 0.06;
        colArray[i * 6] = c;
        colArray[i * 6 + 1] = c;
        colArray[i * 6 + 2] = c;
        colArray[i * 6 + 3] = c;
        colArray[i * 6 + 4] = c;
        colArray[i * 6 + 5] = c;
      }
    });

    lineGeometry.attributes.position.needsUpdate = true;
    lineGeometry.attributes.color.needsUpdate = true;
  });

  return (
    <>
      {/* Ambient + directional lights */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[10, 10, 10]} intensity={0.6} />
      <pointLight position={[0, 0, 10]} intensity={0.4} color="#8b5cf6" />

      {/* Edges */}
      <lineSegments ref={lineRef} geometry={lineGeometry}>
        <lineBasicMaterial
          vertexColors
          transparent
          opacity={0.85}
          depthWrite={false}
        />
      </lineSegments>

      {/* Nodes */}
      {nodes.map((node) => {
        const dead =
          node.model.status === "deprecated" ||
          node.model.status === "discontinued";
        const color = new THREE.Color(node.color);
        const geom = getGeometry(node.model.modality);
        const scale = node.radius * 0.08;

        return (
          <group key={node.id}>
            <mesh
              ref={(el) => {
                if (el) meshRefs.current.set(node.id, el);
              }}
              geometry={geom}
              scale={[scale, scale, scale]}
              position={[node.x, node.y, node.z]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectModel(node.model);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                hoveredRef.current = node.id;
                document.body.style.cursor = "pointer";
              }}
              onPointerOut={() => {
                hoveredRef.current = null;
                document.body.style.cursor = "default";
              }}
            >
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={dead ? 0.3 : node.emissiveIntensity}
                transparent
                opacity={dead ? 0.4 : 0.9}
                roughness={0.3}
                metalness={0.1}
                toneMapped={false}
              />
            </mesh>

            {/* Node label */}
            <Billboard
              position={[node.x, node.y - scale - 0.3, node.z]}
              follow
            >
              <Text
                fontSize={0.15}
                color="rgba(255,255,255,0.6)"
                anchorX="center"
                anchorY="top"
                maxWidth={2}
              >
                {node.model.name.length > 18
                  ? node.model.name.slice(0, 16) + "…"
                  : node.model.name}
              </Text>
            </Billboard>
          </group>
        );
      })}

      {/* Camera controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.1}
        rotateSpeed={0.5}
        zoomSpeed={0.8}
        minDistance={3}
        maxDistance={60}
      />

      {/* Post-processing: bloom for glowing nodes */}
      <EffectComposer>
        <Bloom
          luminanceThreshold={0.8}
          luminanceSmoothing={0.3}
          mipmapBlur
          intensity={0.8}
        />
      </EffectComposer>
    </>
  );
}

function getDeterministicJitter(id: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0;
  }
  return ((Math.abs(hash) % 1000) / 1000) - 0.5;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function ForceGraph3D({
  selectedFamilies,
  searchQuery,
  onSelectModel,
  selectedModelId,
  motionEnabled,
  opennessFilter = "all",
  modalityFilter = "all",
}: ForceGraph3DProps) {
  // Stable serialization of selectedFamilies for dependency tracking
  const familiesKey = Array.from(selectedFamilies).sort().join(",");

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

  // Run simulation and set final positions
  const graphData = useMemo(() => {
    const filteredModels = getFilteredData();
    const filteredIds = new Set(filteredModels.map((m) => m.id));

    // Group by family for spatial arrangement
    const familyGroups: Record<string, ModelNode[]> = {};
    filteredModels.forEach((m) => {
      if (!familyGroups[m.family]) familyGroups[m.family] = [];
      familyGroups[m.family].push(m);
    });
    const familyKeys = Object.keys(familyGroups);

    const nodes: Graph3DNode[] = filteredModels.map((model) => {
      const baseColor = FAMILY_COLORS[model.family];
      const saturation = paramCountToSaturation(model.parameterCount);
      const dead =
        model.status === "deprecated" || model.status === "discontinued";

      // Arrange in 3D space: family determines angle, date determines z-depth
      const familyIndex = familyKeys.indexOf(model.family);
      const familyAngle = (familyIndex / familyKeys.length) * Math.PI * 2;
      const modelsInFamily = familyGroups[model.family];
      const indexInFamily = modelsInFamily.indexOf(model);
      const spreadInFamily = indexInFamily * 1.5;

      const radius = 5 + spreadInFamily * 0.8;
      const zPos = releaseDateToNormalized(model.releaseDate) * 20 - 10;
      const jitterX = getDeterministicJitter(model.id, 42) * 2;
      const jitterY = getDeterministicJitter(model.id, 99) * 2;
      const calculatedColor = adjustColorSaturation(baseColor, saturation);

      return {
        id: model.id,
        model,
        x: Math.cos(familyAngle) * radius + jitterX,
        y: Math.sin(familyAngle) * radius + jitterY,
        z: zPos,
        radius: contextWindowToRadius(model.contextWindow),
        color: calculatedColor,
        threeColor: new THREE.Color(calculatedColor),
        emissiveIntensity: dead ? 0.3 : 1.2,
      };
    });

    const links: Graph3DLink[] = [];
    for (const model of filteredModels) {
      for (const parentId of model.parentIds) {
        if (filteredIds.has(parentId)) {
          links.push({ source: parentId, target: model.id, type: "parent" });
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

    return { nodes, links };
  }, [getFilteredData]);

  if (graphData.nodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-text-muted">
        Loading 3D graph...
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[500px]">
      <Canvas
        camera={{ position: [15, 10, 25], fov: 55 }}
        style={{ background: "transparent" }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <GraphScene
          nodes={graphData.nodes}
          links={graphData.links}
          selectedModelId={selectedModelId}
          onSelectModel={onSelectModel}
          motionEnabled={motionEnabled}
        />
      </Canvas>
    </div>
  );
}
