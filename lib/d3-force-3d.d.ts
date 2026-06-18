// Type declarations for d3-force-3d
// Extends d3-force with 3D support

declare module "d3-force-3d" {
  import {
    Simulation,
    SimulationNodeDatum,
    SimulationLinkDatum,
    Force,
  } from "d3-force";

  export interface SimulationNodeDatum3D extends SimulationNodeDatum {
    z?: number;
    vz?: number;
    fz?: number | null;
  }

  export function forceSimulation<
    NodeDatum extends SimulationNodeDatum3D = SimulationNodeDatum3D
  >(
    nodes?: NodeDatum[]
  ): Simulation<NodeDatum, undefined> & {
    numDimensions(n: number): Simulation<NodeDatum, undefined>;
  };

  export function forceManyBody<
    NodeDatum extends SimulationNodeDatum3D = SimulationNodeDatum3D
  >(): Force<NodeDatum, undefined> & {
    strength(): number;
    strength(
      strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
    ): Force<NodeDatum, undefined> & ReturnType<typeof forceManyBody>;
    distanceMax(): number;
    distanceMax(
      distance: number
    ): Force<NodeDatum, undefined> & ReturnType<typeof forceManyBody>;
    distanceMin(): number;
    distanceMin(
      distance: number
    ): Force<NodeDatum, undefined> & ReturnType<typeof forceManyBody>;
  };

  export function forceCenter<
    NodeDatum extends SimulationNodeDatum3D = SimulationNodeDatum3D
  >(
    x?: number,
    y?: number,
    z?: number
  ): Force<NodeDatum, undefined>;

  export function forceLink<
    NodeDatum extends SimulationNodeDatum3D = SimulationNodeDatum3D,
    LinkDatum extends SimulationLinkDatum<NodeDatum> = SimulationLinkDatum<NodeDatum>
  >(
    links?: LinkDatum[]
  ): Force<NodeDatum, LinkDatum> & {
    id(): (node: NodeDatum, i: number, nodesData: NodeDatum[]) => string;
    id(
      id: (node: NodeDatum, i: number, nodesData: NodeDatum[]) => string
    ): Force<NodeDatum, LinkDatum> & ReturnType<typeof forceLink>;
    distance(): number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number);
    distance(
      distance: number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number)
    ): Force<NodeDatum, LinkDatum> & ReturnType<typeof forceLink>;
    strength(): number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number);
    strength(
      strength: number | ((link: LinkDatum, i: number, links: LinkDatum[]) => number)
    ): Force<NodeDatum, LinkDatum> & ReturnType<typeof forceLink>;
  };

  export function forceCollide<
    NodeDatum extends SimulationNodeDatum3D = SimulationNodeDatum3D
  >(): Force<NodeDatum, undefined> & {
    radius(): number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number);
    radius(
      radius: number | ((node: NodeDatum, i: number, nodes: NodeDatum[]) => number)
    ): Force<NodeDatum, undefined> & ReturnType<typeof forceCollide>;
  };

  export function forceX<
    NodeDatum extends SimulationNodeDatum3D = SimulationNodeDatum3D
  >(
    x?: number | ((d: NodeDatum) => number)
  ): Force<NodeDatum, undefined> & {
    strength(): number;
    strength(
      strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
    ): Force<NodeDatum, undefined> & ReturnType<typeof forceX>;
  };

  export function forceY<
    NodeDatum extends SimulationNodeDatum3D = SimulationNodeDatum3D
  >(
    y?: number | ((d: NodeDatum) => number)
  ): Force<NodeDatum, undefined> & {
    strength(): number;
    strength(
      strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
    ): Force<NodeDatum, undefined> & ReturnType<typeof forceY>;
  };

  export function forceZ<
    NodeDatum extends SimulationNodeDatum3D = SimulationNodeDatum3D
  >(
    z?: number | ((d: NodeDatum) => number)
  ): Force<NodeDatum, undefined> & {
    strength(): number;
    strength(
      strength: number | ((d: NodeDatum, i: number, data: NodeDatum[]) => number)
    ): Force<NodeDatum, undefined> & ReturnType<typeof forceZ>;
  };
}
