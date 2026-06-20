"use client";

import { ParamTimeline } from "./ParamTimeline";
import { ContextTimeline } from "./ContextTimeline";
import { FamilyBarChart } from "./FamilyBarChart";
import { OpenClosedChart } from "./OpenClosedChart";
import { ArchitectureDonut } from "./ArchitectureDonut";
import { ModalityDonut } from "./ModalityDonut";
import { ReleaseCadence } from "./ReleaseCadence";
import { InnovationChart } from "./InnovationChart";
import { PapersTimeline } from "./PapersTimeline";
import { PapersEraDonut } from "./PapersEraDonut";
import { HardwareTimeline } from "./HardwareTimeline";
import { InnovationFlow } from "./InnovationFlow";

export function ComparePageClient() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 stagger">
      {/* Full-width scatter plots */}
      <div className="lg:col-span-2">
        <ParamTimeline />
      </div>
      <div className="lg:col-span-2">
        <ContextTimeline />
      </div>

      {/* Side-by-side donut charts */}
      <ArchitectureDonut />
      <ModalityDonut />

      {/* Full-width cadence chart */}
      <div className="lg:col-span-2">
        <ReleaseCadence />
      </div>

      {/* Side-by-side bar charts */}
      <FamilyBarChart />
      <InnovationChart />

      {/* Full-width open/closed chart */}
      <div className="lg:col-span-2">
        <OpenClosedChart />
      </div>

      {/* ── Section divider: Research & Hardware ────────────────────────── */}
      <div className="lg:col-span-2 pt-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-default to-transparent" />
          <div className="flex items-center gap-2">
            <span className="text-accent-cyan text-lg">◆</span>
            <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
              Research & Infrastructure
            </span>
            <span className="text-accent-violet text-lg">◆</span>
          </div>
          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border-default to-transparent" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-1">
          Research & Hardware
        </h2>
        <p className="text-sm text-text-muted">
          Papers that shaped the field and the hardware that made it possible
        </p>
      </div>

      {/* Full-width papers timeline */}
      <div className="lg:col-span-2">
        <PapersTimeline />
      </div>

      {/* Papers donut + Innovation flow side by side */}
      <PapersEraDonut />
      <InnovationFlow />

      {/* Full-width hardware timeline */}
      <div className="lg:col-span-2">
        <HardwareTimeline />
      </div>
    </div>
  );
}
