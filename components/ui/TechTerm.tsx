"use client";

import { useState, useRef, useEffect, useCallback, type ReactNode } from "react";
import { GLOSSARY, glossaryLookup } from "@/lib/glossary";

// ============================================================================
// TechTerm — inline tooltip for glossary terms
// ============================================================================

export function TechTerm({
  term,
  children,
}: {
  term: string;
  children?: ReactNode;
}) {
  const definition = GLOSSARY[term];
  const [showTooltip, setShowTooltip] = useState(false);
  const [position, setPosition] = useState<"above" | "below">("above");
  const [align, setAlign] = useState<"center" | "left" | "right">("center");
  const spanRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayContent = children ?? term;

  // If term isn't in glossary, just render children without decoration
  if (!definition) {
    return <>{displayContent}</>;
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Determine position before showing
    if (spanRef.current) {
      const rect = spanRef.current.getBoundingClientRect();
      // Vertical: if too close to top, show below
      setPosition(rect.top < 120 ? "below" : "above");
      // Horizontal: if too close to edges, align accordingly
      if (rect.left < 160) {
        setAlign("left");
      } else if (window.innerWidth - rect.right < 160) {
        setAlign("right");
      } else {
        setAlign("center");
      }
    }
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setShowTooltip(false), 100);
  };

  const alignClasses =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "left"
      ? "left-0"
      : "right-0";

  const posClasses =
    position === "above"
      ? `bottom-full mb-2.5 ${alignClasses}`
      : `top-full mt-2.5 ${alignClasses}`;

  // Arrow position
  const arrowPos =
    position === "above"
      ? "top-full"
      : "bottom-full";
  const arrowBorder =
    position === "above"
      ? "border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[rgba(18,18,26,0.95)]"
      : "border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-[rgba(18,18,26,0.95)]";

  return (
    <span
      ref={spanRef}
      className="relative inline cursor-help border-b border-dashed border-accent-cyan/50 text-accent-cyan/90 hover:text-accent-cyan hover:border-accent-cyan transition-colors duration-150"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {displayContent}
      <span
        className={`
          absolute ${posClasses} z-50
          px-3.5 py-2.5 rounded-xl
          bg-[rgba(18,18,26,0.95)] backdrop-blur-md
          border border-border-hover
          text-xs text-text-secondary leading-relaxed
          max-w-[300px] w-max
          shadow-xl shadow-black/40
          pointer-events-none
          transition-opacity duration-150
          ${showTooltip ? "opacity-100" : "opacity-0"}
        `}
      >
        <span className="font-semibold text-text-primary block mb-0.5 text-[11px]">
          {term}
        </span>
        {definition}
        {/* Arrow */}
        <span
          className={`absolute ${arrowPos} ${
            align === "center"
              ? "left-1/2 -translate-x-1/2"
              : align === "left"
              ? "left-4"
              : "right-4"
          } w-0 h-0 ${arrowBorder}`}
        />
      </span>
    </span>
  );
}

// ============================================================================
// AutoGlossary — auto-wrap recognized terms in <TechTerm>
// ============================================================================

export function AutoGlossary({ text }: { text: string }) {
  const matches = glossaryLookup(text);

  if (matches.length === 0) {
    return <>{text}</>;
  }

  const parts: ReactNode[] = [];
  let lastEnd = 0;

  for (const match of matches) {
    // Text before this match
    if (match.start > lastEnd) {
      parts.push(text.slice(lastEnd, match.start));
    }
    // The matched term — use the original text slice to preserve original casing
    const originalText = text.slice(match.start, match.end);
    parts.push(
      <TechTerm key={`${match.start}-${match.term}`} term={match.term}>
        {originalText}
      </TechTerm>
    );
    lastEnd = match.end;
  }

  // Remaining text after last match
  if (lastEnd < text.length) {
    parts.push(text.slice(lastEnd));
  }

  return <>{parts}</>;
}
