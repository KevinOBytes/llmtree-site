"use client";

import Link from "next/link";
import type { ModelFamily } from "@/lib/types";

interface FamilyCardProps {
  family: ModelFamily;
  label: string;
  color: string;
  count: number;
  latest: string;
  latestDate: string;
}

export function FamilyCard({
  family,
  label,
  color,
  count,
  latest,
  latestDate,
}: FamilyCardProps) {
  // Format date for display
  const formatDate = (dateStr: string) => {
    const parts = dateStr.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    if (parts.length >= 2) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      return `${months[monthIdx]} ${parts[0]}`;
    }
    return parts[0];
  };

  return (
    <Link
      href={`/tree?family=${family}`}
      className="group relative flex flex-col p-5 rounded-2xl glass hover:glass-elevated transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
      style={
        {
          "--family-color": color,
        } as React.CSSProperties
      }
    >
      {/* Color accent bar */}
      <div
        className="absolute top-0 left-4 right-4 h-[2px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
        style={{ background: color }}
      />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-offset-surface-primary"
            style={{ background: color }}
          />
          <h3 className="font-semibold text-text-primary">{label}</h3>
        </div>
        <span className="text-xs font-medium text-text-muted px-2 py-0.5 rounded-full bg-surface-elevated">
          {count} models
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <span className="text-text-muted">Latest:</span>
        <span className="font-medium text-text-primary">{latest}</span>
      </div>

      <div className="mt-1 text-xs text-text-muted">{formatDate(latestDate)}</div>

      {/* Hover arrow */}
      <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-all transform translate-x-1 group-hover:translate-x-0">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}
