"use client";

import type { RouteAlternative } from "@/lib/data";
import { formatFuelTons, formatHours, formatNauticalMiles, riskBadge, riskBar, cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface Props {
  route: RouteAlternative;
  isSelected: boolean;
  onSelect: () => void;
}

const COMPAT_STYLE: Record<string, string> = {
  high:     "text-risk-low bg-risk-low-bg border-risk-low/30",
  marginal: "text-risk-med bg-risk-med-bg border-risk-med/30",
  low:      "text-risk-high bg-risk-high-bg border-risk-high/30",
};

export function RouteCard({ route, isSelected, onSelect }: Props) {
  return (
    <div
      className={cn(
        "group flex flex-col rounded-xl border bg-surface p-4 shadow-sm transition-all cursor-pointer",
        isSelected
          ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md"
          : "border-border hover:border-border-strong hover:shadow-md"
      )}
      onClick={onSelect}
    >
      {/* Title + risk badge */}
      <div className="flex items-start justify-between gap-2">
        <h3 className={cn("text-sm font-bold", isSelected ? "text-blue-600" : "text-navy-900")}>
          {route.name}
        </h3>
        <span className={cn("shrink-0 rounded border px-2 py-0.5 font-mono text-xs font-bold", riskBadge(route.averageRiskScore))}>
          {route.averageRiskScore}
        </span>
      </div>

      {/* Trade-off */}
      <p className="mt-1 text-xs text-text-muted leading-relaxed flex-1">{route.tradeOff}</p>

      {/* Risk bar */}
      <div className="mt-3">
        <div className="h-1 rounded-full bg-border overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all", riskBar(route.averageRiskScore))}
            style={{ width: `${route.averageRiskScore}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-text-subtle">
          <span>Avg risk</span>
          <span>Max: {route.maxRiskScore}</span>
        </div>
      </div>

      {/* Metrics grid */}
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border pt-3">
        {[
          { dt: "Distance", dd: formatNauticalMiles(route.distanceNm) },
          { dt: "ETA",      dd: formatHours(route.etaHours) },
          { dt: "Fuel",     dd: formatFuelTons(route.fuelTons) },
          { dt: "Compat.",  dd: route.compatibility },
        ].map(({ dt, dd }) => (
          <div key={dt}>
            <dt className="text-[10px] text-text-subtle">{dt}</dt>
            <dd className={cn(
              "font-mono text-xs font-semibold",
              dt === "Compat."
                ? COMPAT_STYLE[route.compatibility] ? cn("rounded border px-1.5 py-0.5 text-[10px]", COMPAT_STYLE[route.compatibility] ?? "") : "text-navy-900"
                : "text-navy-900"
            )}>
              {dd}
            </dd>
          </div>
        ))}
      </dl>

      {/* Select button */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        className={cn(
          "mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-all",
          isSelected
            ? "bg-blue-600 text-white"
            : "bg-navy-900 text-white hover:bg-navy-800"
        )}
      >
        {isSelected && <CheckCircle2 size={12} />}
        {isSelected ? "Selected" : "Select route"}
      </button>
    </div>
  );
}
