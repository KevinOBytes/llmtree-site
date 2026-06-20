"use client";

import Link from "next/link";
import { FAMILY_COLORS, type ModelNode } from "@/lib/types";
import { models } from "@/lib/data/models";
import { papers } from "@/lib/data/papers";
import { GLOSSARY, INNOVATION_LABELS } from "@/lib/glossary";
import { FAMILY_LABELS } from "@/lib/chartUtils";

interface ModelDetailPanelProps {
  model: ModelNode;
  onClose: () => void;
  onSelectModel?: (model: ModelNode) => void;
}



const ERA_STYLES: Record<string, { label: string; color: string }> = {
  "pre-transformer": { label: "Pre-Transformer", color: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20" },
  transformer: { label: "Transformer", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  scaling: { label: "Scaling", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  alignment: { label: "Alignment", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
  reasoning: { label: "Reasoning", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  architecture: { label: "Architecture", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  diffusion: { label: "Diffusion", color: "text-pink-400 bg-pink-500/10 border-pink-500/20" },
};



const MODALITY_ICONS: Record<string, string> = {
  text: "T",
  multimodal: "◆",
  code: "⌨",
  image: "🖼",
  audio: "♪",
  vision: "👁",
};

export function ModelDetailPanel({
  model,
  onClose,
  onSelectModel,
}: ModelDetailPanelProps) {
  const color = FAMILY_COLORS[model.family];

  // Resolve parent models
  const parentModels = model.parentIds
    .map((pid) => models.find((m) => m.id === pid))
    .filter(Boolean) as ModelNode[];

  // Resolve child models (models that have this as parent)
  const childModels = models.filter((m) => m.parentIds.includes(model.id));

  // Resolve related research papers
  const relatedPapers = papers.filter((p) => p.relatedModelIds?.includes(model.id));

  // Build full ancestry chain
  const ancestryChain: ModelNode[] = [];
  let currentModel: ModelNode | undefined = model;
  const visited = new Set<string>();
  while (currentModel && currentModel.parentIds.length > 0 && !visited.has(currentModel.id)) {
    visited.add(currentModel.id);
    const parent = models.find((m) => m.id === currentModel!.parentIds[0]);
    if (parent) {
      ancestryChain.unshift(parent);
      currentModel = parent;
    } else {
      break;
    }
  }

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
    <aside className="w-full lg:w-[420px] border-t lg:border-t-0 lg:border-l border-border-default bg-surface-secondary overflow-y-auto animate-fade-in-up [animation-duration:300ms]">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-border-default bg-surface-secondary/90 backdrop-blur-sm">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ background: color }}
          />
          <h3 className="font-semibold text-text-primary truncate">
            {model.name}
          </h3>
          {model.modality && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-tertiary text-text-muted flex-shrink-0">
              {MODALITY_ICONS[model.modality] ?? ""} {model.modality}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-surface-tertiary transition-colors text-text-muted hover:text-text-primary flex-shrink-0"
          aria-label="Close detail panel"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* Significance — "Why This Model Matters" */}
        {model.significance && (
          <div className="p-3.5 rounded-xl bg-gradient-to-br from-accent-violet/10 to-accent-cyan/10 border border-accent-violet/20">
            <h4 className="text-[10px] uppercase tracking-wider text-accent-violet font-semibold mb-1.5 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Why It Matters
            </h4>
            <p className="text-sm text-text-primary leading-relaxed">
              {model.significance}
            </p>
          </div>
        )}

        {/* Meta info grid */}
        <div className="grid grid-cols-2 gap-3">
          <InfoItem label="Company" value={model.company} />
          <InfoItem label="Family" value={FAMILY_LABELS[model.family] || model.family} />
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

        {/* Notable Uses */}
        {model.notableUses && model.notableUses.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
              Notable Milestones
            </h4>
            <ul className="space-y-1.5">
              {model.notableUses.map((use, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-text-secondary"
                >
                  <span className="text-accent-amber flex-shrink-0 mt-0.5">▸</span>
                  <span className="leading-relaxed">{use}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Lineage — Ancestry Chain */}
        {ancestryChain.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
              Lineage
            </h4>
            <div className="flex flex-wrap items-center gap-1">
              {ancestryChain.map((ancestor, i) => (
                <span key={ancestor.id} className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectModel?.(ancestor)}
                    className="text-xs px-2 py-1 rounded-md bg-surface-tertiary text-text-secondary hover:bg-surface-elevated hover:text-text-primary transition-colors cursor-pointer"
                    style={{
                      borderLeft: `2px solid ${FAMILY_COLORS[ancestor.family]}`,
                    }}
                  >
                    {ancestor.name}
                  </button>
                  {i < ancestryChain.length - 1 && (
                    <span className="text-text-muted text-[10px]">→</span>
                  )}
                </span>
              ))}
              <span className="text-text-muted text-[10px]">→</span>
              <span
                className="text-xs px-2 py-1 rounded-md bg-accent-violet/15 text-accent-violet font-semibold"
                style={{ borderLeft: `2px solid ${color}` }}
              >
                {model.name}
              </span>
            </div>
          </div>
        )}

        {/* Direct Parents */}
        {parentModels.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
              Built On
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {parentModels.map((parent) => (
                <button
                  key={parent.id}
                  onClick={() => onSelectModel?.(parent)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-surface-elevated text-text-secondary font-medium border border-border-default hover:bg-surface-tertiary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: FAMILY_COLORS[parent.family] }}
                  />
                  {parent.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Children / Successors */}
        {childModels.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
              Successors ({childModels.length})
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {childModels.slice(0, 8).map((child) => (
                <button
                  key={child.id}
                  onClick={() => onSelectModel?.(child)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-surface-elevated text-text-secondary font-medium border border-border-default hover:bg-surface-tertiary hover:text-text-primary transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: FAMILY_COLORS[child.family] }}
                  />
                  {child.name}
                </button>
              ))}
              {childModels.length > 8 && (
                <span className="text-[11px] px-2.5 py-1 text-text-muted">
                  +{childModels.length - 8} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Innovations */}
        {model.innovations.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-text-muted font-medium mb-2">
              Key Innovations
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {model.innovations.map((tag) => {
                const label = INNOVATION_LABELS[tag] ?? tag;
                const definition = GLOSSARY[tag];
                return (
                  <div key={tag} className="group/tip relative inline-block">
                    <span
                      className="text-[11px] px-2.5 py-1 rounded-full bg-accent-violet/10 text-accent-violet font-medium cursor-help inline-block transition-colors group-hover/tip:bg-accent-violet/20"
                    >
                      {label}
                    </span>
                    {definition && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-3 py-2 rounded-lg bg-surface-primary/95 backdrop-blur-sm border border-border-default text-xs text-text-secondary leading-relaxed max-w-[250px] w-max opacity-0 group-hover/tip:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-lg shadow-black/30">
                        <span className="font-semibold text-text-primary block mb-0.5">{label}</span>
                        {definition}
                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-border-default" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-surface-primary/95" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Related Research */}
        {relatedPapers.length > 0 && (
          <div>
            <h4 className="text-xs uppercase tracking-wider text-accent-amber font-medium mb-2 flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
              </svg>
              Related Research ({relatedPapers.length})
            </h4>
            <div className="space-y-2">
              {relatedPapers.map((paper) => {
                const eraStyle = ERA_STYLES[paper.era];
                const snippet =
                  paper.contribution.length > 100
                    ? paper.contribution.slice(0, 100) + "…"
                    : paper.contribution;

                return (
                  <div
                    key={paper.id}
                    className="p-3 rounded-xl bg-gradient-to-br from-amber-500/[0.04] to-amber-600/[0.02] border border-amber-500/10 hover:border-amber-500/25 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      {paper.arxivUrl ? (
                        <a
                          href={paper.arxivUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-accent-amber hover:underline decoration-accent-amber/30 underline-offset-2 leading-snug"
                        >
                          {paper.shortTitle ?? paper.title}
                        </a>
                      ) : (
                        <span className="text-sm font-medium text-text-primary leading-snug">
                          {paper.shortTitle ?? paper.title}
                        </span>
                      )}
                      {eraStyle && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium flex-shrink-0 ${eraStyle.color}`}
                        >
                          {eraStyle.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-text-muted mb-1">
                      {paper.year} · {paper.institution}
                    </div>
                    <p className="text-[11px] text-text-secondary leading-relaxed">
                      {snippet}
                    </p>
                  </div>
                );
              })}
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
          <Link
            href={`/models/${model.id}`}
            className="text-sm font-semibold text-accent-emerald hover:underline flex items-center gap-1 group/link"
          >
            📊 View Full Profile
            <span className="inline-block transition-transform duration-200 group-hover/link:translate-x-0.5">→</span>
          </Link>
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
          {!model.paperUrl && !model.announcementUrl && (
            <span className="text-xs text-text-muted italic">
              No external links available
            </span>
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
