"use client";

import { useState } from "react";
import { Download, FileCode, Printer, Check } from "lucide-react";
import {
  type RiskTelemetryPayload,
  downloadRiskCsv,
  downloadRiskJson,
} from "@/lib/riskExport";

export interface TelemetryExportBarProps {
  payload: RiskTelemetryPayload;
}

export function TelemetryExportBar({ payload }: TelemetryExportBarProps) {
  const [downloadState, setDownloadState] = useState<"csv" | "json" | null>(null);

  const handleCsvExport = () => {
    downloadRiskCsv(payload);
    setDownloadState("csv");
    setTimeout(() => setDownloadState(null), 1800);
  };

  const handleJsonExport = () => {
    downloadRiskJson(payload);
    setDownloadState("json");
    setTimeout(() => setDownloadState(null), 1800);
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2 no-print">
      <button
        type="button"
        onClick={handleCsvExport}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-xs transition-all hover:border-border-strong hover:bg-surface2 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
        title="Export telemetry and mitigations to CSV (RFC 4180)"
      >
        {downloadState === "csv" ? (
          <Check size={13} className="text-risk-low" />
        ) : (
          <Download size={13} className="text-text-muted" />
        )}
        <span>{downloadState === "csv" ? "CSV Downloaded" : "Export CSV"}</span>
      </button>

      <button
        type="button"
        onClick={handleJsonExport}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-navy-900 shadow-xs transition-all hover:border-border-strong hover:bg-surface2 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
        title="Export full telemetry dataset to JSON"
      >
        {downloadState === "json" ? (
          <Check size={13} className="text-risk-low" />
        ) : (
          <FileCode size={13} className="text-text-muted" />
        )}
        <span>{downloadState === "json" ? "JSON Downloaded" : "Export JSON"}</span>
      </button>

      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-1.5 rounded-lg border border-navy-900 bg-navy-900 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-navy-800 focus:ring-2 focus:ring-blue-600 focus:outline-none cursor-pointer"
        title="Print risk briefing document or save as PDF"
      >
        <Printer size={13} />
        <span>Print Briefing</span>
      </button>
    </div>
  );
}
