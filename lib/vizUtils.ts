// ============================================================================
// LLM Tree of Life — Visualization Utilities
// Parsing and mapping functions for multi-dimensional visual encoding
// ============================================================================

/**
 * Parse a context window string (e.g., "128K", "1M", "2048") into a
 * numeric token count, then map it to a visual radius.
 *
 * Mapping: 4K → 8px, 128K → 14px, 1M → 22px
 */
export function contextWindowToRadius(contextWindow?: string): number {
  if (!contextWindow) return 10; // Default for unknown

  const normalized = contextWindow.replace(/[^0-9.kKmMbB]/g, "").trim();
  let tokens = 0;

  if (/m/i.test(contextWindow)) {
    tokens = parseFloat(normalized) * 1_000_000;
  } else if (/k/i.test(contextWindow)) {
    tokens = parseFloat(normalized) * 1_000;
  } else {
    tokens = parseFloat(normalized);
  }

  if (isNaN(tokens) || tokens <= 0) return 10;

  // Log-scale mapping: 4K=8, 32K=11, 128K=14, 512K=18, 1M=20, 2M=22
  const minLog = Math.log(4_000);
  const maxLog = Math.log(2_000_000);
  const minR = 8;
  const maxR = 22;
  const t = Math.max(0, Math.min(1, (Math.log(tokens) - minLog) / (maxLog - minLog)));
  return minR + t * (maxR - minR);
}

/**
 * Parse a parameter count string (e.g., "175B", "1.8T", "7B") into a
 * numeric value, then map it to a saturation multiplier (0.4–1.0).
 *
 * Higher params → higher saturation → richer color
 */
export function paramCountToSaturation(parameterCount?: string): number {
  if (!parameterCount) return 0.65; // Default for unknown

  const normalized = parameterCount.replace(/[^0-9.tTbBmM]/g, "").trim();
  let params = 0;

  if (/t/i.test(parameterCount)) {
    params = parseFloat(normalized) * 1_000_000_000_000;
  } else if (/b/i.test(parameterCount)) {
    params = parseFloat(normalized) * 1_000_000_000;
  } else if (/m/i.test(parameterCount)) {
    params = parseFloat(normalized) * 1_000_000;
  } else {
    params = parseFloat(normalized);
  }

  if (isNaN(params) || params <= 0) return 0.65;

  // Log-scale: 1B=0.4, 7B=0.5, 70B=0.65, 175B=0.75, 540B=0.85, 1.8T=1.0
  const minLog = Math.log(1_000_000_000);
  const maxLog = Math.log(1_800_000_000_000);
  const minSat = 0.4;
  const maxSat = 1.0;
  const t = Math.max(0, Math.min(1, (Math.log(params) - minLog) / (maxLog - minLog)));
  return minSat + t * (maxSat - minSat);
}

/**
 * Apply saturation to a hex color.
 * saturation: 0–1 (0 = fully desaturated/gray, 1 = full color)
 */
export function adjustColorSaturation(hex: string, saturation: number): string {
  // Parse hex
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Convert to HSL
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Apply saturation multiplier
  s = s * saturation;

  // Convert back to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  let r2: number, g2: number, b2: number;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1 / 3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (n: number) =>
    Math.round(n * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
}

/**
 * SVG path data for different modality shapes.
 * Each shape is centered at (0,0) with a given radius.
 */
export function getModalityShape(
  modality: string | undefined,
  r: number
): { type: "circle" | "polygon"; points?: string; r?: number } {
  switch (modality) {
    case "multimodal":
      // Diamond (rotated square)
      return {
        type: "polygon",
        points: `0,${-r} ${r},0 0,${r} ${-r},0`,
      };
    case "code":
      // Hexagon
      {
        const a = (2 * Math.PI) / 6;
        const pts = Array.from({ length: 6 }, (_, i) => {
          const angle = a * i - Math.PI / 2;
          return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
        }).join(" ");
        return { type: "polygon", points: pts };
      }
    case "vision":
      // Pentagon
      {
        const a = (2 * Math.PI) / 5;
        const pts = Array.from({ length: 5 }, (_, i) => {
          const angle = a * i - Math.PI / 2;
          return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
        }).join(" ");
        return { type: "polygon", points: pts };
      }
    case "audio":
      // Triangle
      {
        const pts = [
          `0,${-r}`,
          `${r * 0.866},${r * 0.5}`,
          `${-r * 0.866},${r * 0.5}`,
        ].join(" ");
        return { type: "polygon", points: pts };
      }
    case "image":
      // Square (canvas / frame)
      {
        const s = r * 0.85;
        const pts = [
          `${-s},${-s}`,
          `${s},${-s}`,
          `${s},${s}`,
          `${-s},${s}`,
        ].join(" ");
        return { type: "polygon", points: pts };
      }
    case "video":
      // Octagon (like a play button / film reel)
      {
        const a = (2 * Math.PI) / 8;
        const pts = Array.from({ length: 8 }, (_, i) => {
          const angle = a * i - Math.PI / 8;
          return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
        }).join(" ");
        return { type: "polygon", points: pts };
      }
    default:
      // Circle for "text" and unknown
      return { type: "circle", r };
  }
}

/**
 * Parse release date string to a normalized 0–1 value for Z-axis positioning.
 */
export function releaseDateToNormalized(releaseDate: string): number {
  const date = new Date(releaseDate);
  const minYear = 2017;
  const maxYear = 2027;
  const t = (date.getFullYear() + date.getMonth() / 12 - minYear) / (maxYear - minYear);
  return Math.max(0, Math.min(1, t));
}
