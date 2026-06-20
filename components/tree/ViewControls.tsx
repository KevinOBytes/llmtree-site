"use client";

// ============================================================================
// ViewControls — Dimension & Motion toggle bar
// ============================================================================

interface ViewControlsProps {
  viewDimension: "2d" | "3d";
  onViewDimensionChange: (dim: "2d" | "3d") => void;
  motionEnabled: boolean;
  onMotionEnabledChange: (enabled: boolean) => void;
  layoutMode: "timeline" | "ancestry" | "network";
  onLayoutModeChange: (mode: "timeline" | "ancestry" | "network") => void;
}

export function ViewControls({
  viewDimension,
  onViewDimensionChange,
  motionEnabled,
  onMotionEnabledChange,
  layoutMode,
  onLayoutModeChange,
}: ViewControlsProps) {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* ── Layout Mode Toggle (Only applicable or visible in 2D mode) ── */}
      {viewDimension === "2d" && (
        <ToggleGroup
          label="Layout"
          options={[
            { key: "timeline" as const, label: "Timeline" },
            { key: "ancestry" as const, label: "Ancestry" },
            { key: "network" as const, label: "Network" },
          ]}
          value={layoutMode}
          onChange={onLayoutModeChange}
          activeClassName="bg-accent-emerald text-white shadow-[0_0_12px_rgba(16,185,129,0.35)]"
        />
      )}

      {/* ── Dimension Toggle ─────────────────────────────────────────────── */}
      <ToggleGroup
        label="View"
        options={[
          { key: "2d" as const, label: "2D" },
          { key: "3d" as const, label: "3D" },
        ]}
        value={viewDimension}
        onChange={onViewDimensionChange}
        activeClassName="bg-accent-violet text-white shadow-[0_0_12px_rgba(139,92,246,0.35)]"
      />

      {/* ── Motion Toggle ────────────────────────────────────────────────── */}
      <ToggleGroup
        label="Motion"
        options={[
          { key: false as const, label: "Static" },
          { key: true as const, label: "Animated" },
        ]}
        value={motionEnabled}
        onChange={onMotionEnabledChange}
        activeClassName="bg-accent-cyan text-white shadow-[0_0_12px_rgba(6,182,212,0.35)]"
      />

      {/* ── Contextual hint ──────────────────────────────────────────────── */}
      <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] text-text-muted select-none ml-1">
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          className="opacity-50 shrink-0"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M8 7v4M8 5h.005"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Scroll to zoom · Drag to pan · Click nodes to explore
      </span>
    </div>
  );
}

// ============================================================================
// ToggleGroup — Reusable pill-style toggle
// ============================================================================

interface ToggleOption<T> {
  key: T;
  label: string;
}

interface ToggleGroupProps<T> {
  label: string;
  options: ToggleOption<T>[];
  value: T;
  onChange: (value: T) => void;
  activeClassName: string;
}

function ToggleGroup<T>({
  label,
  options,
  value,
  onChange,
  activeClassName,
}: ToggleGroupProps<T>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-medium tracking-wider uppercase text-text-muted select-none">
        {label}
      </span>
      <div className="flex rounded-full bg-surface-tertiary p-0.5 border border-border-default">
        {options.map((opt) => {
          const isActive = opt.key === value;
          return (
            <button
              key={String(opt.key)}
              type="button"
              onClick={() => onChange(opt.key)}
              className={`
                relative text-xs font-semibold py-1.5 px-3 rounded-full
                transition-all duration-200 ease-[var(--ease-spring)]
                cursor-pointer select-none
                ${
                  isActive
                    ? activeClassName
                    : "text-text-muted hover:text-text-secondary"
                }
              `}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
