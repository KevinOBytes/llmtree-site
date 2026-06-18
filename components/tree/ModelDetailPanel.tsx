"use client";

import { FAMILY_COLORS, type ModelNode } from "@/lib/types";

interface ModelDetailPanelProps {
  model: ModelNode;
  onClose: () => void;
}

const INNOVATION_LABELS: Record<string, string> = {
  transformer: "Transformer",
  autoregressive: "Autoregressive",
  "masked-lm": "Masked LM",
  rlhf: "RLHF",
  "constitutional-ai": "Constitutional AI",
  "chain-of-thought": "Chain-of-Thought",
  "mixture-of-experts": "MoE",
  multimodal: "Multimodal",
  "long-context": "Long Context",
  "instruction-tuning": "Instruction Tuning",
  "few-shot": "Few-Shot",
  "zero-shot": "Zero-Shot",
  "tool-use": "Tool Use",
  agentic: "Agentic",
  reasoning: "Reasoning",
  "code-generation": "Code Gen",
  "open-weight": "Open Weight",
  distillation: "Distillation",
  "scaling-laws": "Scaling Laws",
  "attention-mechanism": "Attention",
  "test-time-compute": "Test-Time Compute",
  abliteration: "Abliteration",
};

export function ModelDetailPanel({ model, onClose }: ModelDetailPanelProps) {
  const color = FAMILY_COLORS[model.family];

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December",
    ];
    if (parts.length >= 2) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${months[monthIdx]} ${parts[0]}`;
    }
    return parts[0];
  };

  return (
    <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-border-default bg-surface-secondary overflow-y-auto animate-fade-in-up [animation-duration:300ms]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border-default bg-surface-secondary/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ background: color }}
          />
          <h3 className="font-semibold text-text-primary">{model.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors text-text-muted hover:text-text-primary"
          aria-label="Close detail panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Meta info */}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Company" value={model.company} />
          <InfoItem label="Released" value={formatDate(model.releaseDate)} />
          {model.parameterCount && (
            <InfoItem label="Parameters" value={model.parameterCount} />
          )}
          {model.contextWindow && (
            <InfoItem label="Context" value={model.contextWindow} />
          )}
          {model.architecture && (
            <InfoItem label="Architecture" value={model.architecture.replace(/-/g, " ")} />
          )}
          <InfoItem
            label="Openness"
            value={model.openness.replace(/-/g, " ")}
            accent={model.openness !== "closed" ? "emerald" : undefined}
          />
          {model.status && model.status !== "active" && (
            <InfoItem
              label="Status"
              value={model.status === "discontinued" ? "☠ Discontinued" : model.status === "deprecated" ? "⚠ Deprecated" : "Legacy"}
              accent={model.status === "discontinued" || model.status === "deprecated" ? "red" : undefined}
            />
          )}
          {model.discontinuedDate && (
            <InfoItem label="Sunset Date" value={formatDate(model.discontinuedDate)} />
          )}
        </div>

        {/* Description */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
            Description
          </h4>
          <p className="text-sm text-text-secondary leading-relaxed">
            {model.description}
          </p>
        </div>

        {/* Innovations */}
        {model.innovations.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
              Key Innovations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {model.innovations.map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-accent-violet/10 text-accent-violet font-medium"
                >
                  {INNOVATION_LABELS[tag] ?? tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Variants */}
        {model.variants && model.variants.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
              Variants
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {model.variants.map((v) => (
                <span
                  key={v}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-surface-elevated text-text-secondary font-medium border border-border-default"
                >
                  {v}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* API status */}
        {model.apiAvailable !== undefined && (
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`w-2 h-2 rounded-full ${
                model.apiAvailable ? "bg-accent-emerald" : "bg-text-muted"
              }`}
            />
            <span className="text-text-secondary">
              API {model.apiAvailable ? "Available" : "Not Available"}
            </span>
          </div>
        )}

        {/* Links */}
        <div className="flex flex-col gap-2 pt-2 border-t border-border-default">
          {model.paperUrl && (
            <a
              href={model.paperUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-violet hover:underline flex items-center gap-1"
            >
              📄 Research Paper
            </a>
          )}
          {model.announcementUrl && (
            <a
              href={model.announcementUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-accent-violet hover:underline flex items-center gap-1"
            >
              🔗 Announcement
            </a>
          )}
        </div>
      </div>
    </aside>
  );
}

function InfoItem({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5 p-2.5 rounded-lg bg-surface-tertiary">
      <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">
        {label}
      </span>
      <span
        className={`text-sm font-medium capitalize ${
          accent === "emerald"
            ? "text-accent-emerald"
            : accent === "red"
            ? "text-red-400"
            : "text-text-primary"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
