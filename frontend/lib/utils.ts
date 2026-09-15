import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}

// ─── Formatters ────────────────────────────────────────────────────────────
export const formatNauticalMiles = (v: number) => `${v.toFixed(0)} NM`;
export const formatKnots         = (v: number) => `${v.toFixed(1)} kn`;
export const formatHours         = (v: number) => `${v.toFixed(1)} hrs`;
export const formatFuelTons      = (v: number) => `${v.toFixed(1)} MT`;
export const formatMeters        = (v: number) => `${v} m`;
export const formatPercent       = (v: number) => `${v.toFixed(0)}%`;

// ─── Risk classification ────────────────────────────────────────────────────
export function riskLabel(score: number): "LOW" | "MODERATE" | "HIGH" {
  if (score < 35) return "LOW";
  if (score < 65) return "MODERATE";
  return "HIGH";
}

export function riskBadge(score: number): string {
  if (score < 35) return "bg-risk-low-bg text-risk-low border-risk-low/30";
  if (score < 65) return "bg-risk-med-bg text-risk-med border-risk-med/30";
  return "bg-risk-high-bg text-risk-high border-risk-high/30";
}

export function riskBar(score: number): string {
  if (score < 35) return "bg-risk-low";
  if (score < 65) return "bg-risk-med";
  return "bg-risk-high";
}

// ─── Equirectangular map projection ────────────────────────────────────────
// Antarctic sector: 62.0°S – 66.5°S  ×  54.0°W – 64.0°W  →  1000 × 650 SVG
export function coordToSvg(lat: number, lon: number, w = 1000, h = 650) {
  const x = ((lon + 64) / 10) * w;
  const y = ((-62 - lat) / 4.5) * h;
  return {
    x: Math.max(0, Math.min(w, x)),
    y: Math.max(0, Math.min(h, y)),
  };
}
