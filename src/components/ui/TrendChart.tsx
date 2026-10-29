"use client";

import { useState } from "react";
import Link from "next/link";
import { DailyTrendPoint } from "@/lib/aggregation/counting";
import {
  Table as TableIcon,
  Activity,
  Calendar,
  ChevronRight,
} from "lucide-react";

interface TrendChartProps {
  trends: DailyTrendPoint[];
  range: 7 | 30;
  onRangeChange: (range: 7 | 30) => void;
  loading?: boolean;
}

export default function TrendChart({
  trends,
  range,
  onRangeChange,
  loading = false,
}: TrendChartProps) {
  const [activePoint, setActivePoint] = useState<DailyTrendPoint | null>(null);
  const [showTable, setShowTable] = useState(false);

  const totalReports = trends.reduce((acc, t) => acc + t.newReports, 0);
  const totalResolutions = trends.reduce((acc, t) => acc + t.resolutions, 0);
  const totalVolume = totalReports + totalResolutions;

  const maxVal = Math.max(
    ...trends.map((t) => Math.max(t.newReports, t.resolutions)),
    3
  );

  return (
    <div className="rounded-2xl border border-[#E1E5EB] bg-white p-5 sm:p-6 shadow-xs transition-all">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E1E5EB]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[#EFF4FF] text-[#2457D6]">
              <Activity className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-[#17212F]">
              Complaint &amp; Resolution Telemetry
            </h3>
          </div>
          <p className="text-xs text-[#5B6573] mt-0.5">
            Verified consumer grievances vs. customer-confirmed resolutions ({range}-day rolling window)
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Time range selector */}
          <div className="inline-flex rounded-lg border border-[#E1E5EB] p-0.5 bg-[#F7F8FA] text-xs font-semibold">
            <button
              onClick={() => onRangeChange(7)}
              className={`px-3 py-1 rounded-md transition-colors ${
                range === 7
                  ? "bg-white text-[#2457D6] shadow-xs"
                  : "text-[#5B6573] hover:text-[#17212F]"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => onRangeChange(30)}
              className={`px-3 py-1 rounded-md transition-colors ${
                range === 30
                  ? "bg-white text-[#2457D6] shadow-xs"
                  : "text-[#5B6573] hover:text-[#17212F]"
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Table Toggle */}
          <button
            onClick={() => setShowTable(!showTable)}
            className={`p-1.5 rounded-lg border text-xs font-medium transition-colors ${
              showTable
                ? "bg-[#EFF4FF] border-[#2457D6]/30 text-[#2457D6]"
                : "border-[#E1E5EB] text-[#5B6573] hover:bg-[#F7F8FA] hover:text-[#17212F]"
            }`}
            title={showTable ? "Switch to Visual Chart" : "Switch to Accessible Data Table"}
            aria-label="Toggle accessible data table"
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart Body */}
      <div className="pt-4">
        {loading ? (
          <div className="h-44 flex items-center justify-center text-xs text-[#5B6573] animate-pulse">
            Retrieving telemetry records from verified database...
          </div>
        ) : showTable ? (
          /* Accessible Table View */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E1E5EB] bg-[#F7F8FA] text-[#5B6573]">
                  <th className="py-2.5 px-3 font-semibold">Date</th>
                  <th className="py-2.5 px-3 font-semibold text-right">New Verified Complaints</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Confirmed Resolutions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E1E5EB]">
                {trends.map((t) => (
                  <tr key={t.date} className="hover:bg-[#F7F8FA]/60 transition-colors">
                    <td className="py-2 px-3 font-medium text-[#17212F]">{t.label}</td>
                    <td className="py-2 px-3 tabular-nums font-semibold text-right text-[#2457D6]">
                      {t.newReports}
                    </td>
                    <td className="py-2 px-3 tabular-nums font-semibold text-right text-[#18794E]">
                      {t.resolutions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : totalVolume === 0 ? (
          /* ADAPTIVE STATE 1: Zero Reports (Honest Telemetry Card instead of Empty Void) */
          <div className="rounded-xl border border-dashed border-[#E1E5EB] bg-[#F7F8FA]/60 p-6 text-center space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#E1E5EB] px-3 py-1 text-xs font-semibold text-[#5B6573]">
              <Calendar className="h-3.5 w-3.5 text-[#2457D6]" />
              <span>{range}-Day Window Active: 0 Verified Grievances Logged</span>
            </div>
            <p className="text-xs text-[#5B6573] max-w-md mx-auto leading-relaxed">
              No complaint reports currently fall in this time range. As citizens submit verifiable order delay timelines, aggregate trend trajectories will automatically chart here.
            </p>
            <div className="pt-1">
              <Link
                href="/report"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2457D6] hover:text-[#1B44AA]"
              >
                <span>Document a delayed delivery</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : totalVolume <= 3 ? (
          /* ADAPTIVE STATE 2: Small Dataset (1-3 Reports: Compact Honest Activity View) */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-[#F7F8FA] p-3 rounded-xl border border-[#E1E5EB]">
              <span className="font-semibold text-[#17212F]">
                Initial Reporting Dataset: {totalReports} complaint{totalReports !== 1 ? "s" : ""}, {totalResolutions} resolution{totalResolutions !== 1 ? "s" : ""}
              </span>
              <span className="text-[11px] text-[#5B6573]">
                Strictly deduplicated genuine records
              </span>
            </div>

            {/* Compact timeline cards for the active points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {trends
                .filter((t) => t.newReports > 0 || t.resolutions > 0)
                .map((pt) => (
                  <div
                    key={pt.date}
                    className="p-3.5 rounded-xl border border-[#E1E5EB] bg-white shadow-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[#5B6573]">
                      <span>{pt.label}</span>
                      <span className="text-[10px] text-[#18794E] bg-[#EDF7F1] px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-[#2457D6] font-bold">
                        {pt.newReports} new complaint{pt.newReports !== 1 ? "s" : ""}
                      </span>
                      <span className="text-[#18794E] font-medium">
                        {pt.resolutions} resolved
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ) : (
          /* ADAPTIVE STATE 3: Rich Dataset (Full SVG Visual Chart with Tooltip) */
          <div>
            {/* Active inspection bar & Legend */}
            <div className="h-7 mb-2 flex items-center justify-between text-xs">
              {activePoint ? (
                <div className="flex items-center gap-3 bg-[#F7F8FA] border border-[#E1E5EB] px-3 py-1 rounded-lg">
                  <span className="font-semibold text-[#17212F]">{activePoint.label}:</span>
                  <span className="text-[#2457D6] font-bold">
                    {activePoint.newReports} complaint{activePoint.newReports !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[#18794E] font-semibold">
                    {activePoint.resolutions} resolved
                  </span>
                </div>
              ) : (
                <span className="text-[#5B6573] text-[11px]">
                  Hover or tap a daily bar to inspect verified counts
                </span>
              )}

              {/* Legend */}
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#2457D6]"></span>
                  <span className="text-[#5B6573] text-[11px]">New Complaints</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#18794E]"></span>
                  <span className="text-[#5B6573] text-[11px]">Reported Resolved</span>
                </span>
              </div>
            </div>

            {/* Bar visualization */}
            <div className="relative h-44 w-full flex items-end gap-1 sm:gap-2 pt-4 border-b border-[#E1E5EB]">
              {trends.map((pt) => {
                const reportHeightPct = Math.round((pt.newReports / maxVal) * 100);
                const resHeightPct = Math.round((pt.resolutions / maxVal) * 100);
                const isSelected = activePoint?.date === pt.date;

                return (
                  <div
                    key={pt.date}
                    onMouseEnter={() => setActivePoint(pt)}
                    onMouseLeave={() => setActivePoint(null)}
                    onClick={() => setActivePoint(pt)}
                    className={`relative flex-1 h-full flex items-end justify-center gap-0.5 cursor-pointer rounded-t-sm transition-opacity ${
                      isSelected ? "opacity-100 ring-2 ring-[#2457D6]/20 bg-[#EFF4FF]" : "hover:opacity-90"
                    }`}
                  >
                    {/* Complaints Bar */}
                    <div
                      style={{ height: `${Math.max(reportHeightPct, pt.newReports > 0 ? 8 : 2)}%` }}
                      className={`w-full max-w-[12px] rounded-t-sm transition-all ${
                        pt.newReports > 0 ? "bg-[#2457D6]" : "bg-transparent"
                      }`}
                    ></div>

                    {/* Resolutions Bar */}
                    <div
                      style={{ height: `${Math.max(resHeightPct, pt.resolutions > 0 ? 8 : 2)}%` }}
                      className={`w-full max-w-[12px] rounded-t-sm transition-all ${
                        pt.resolutions > 0 ? "bg-[#18794E]" : "bg-transparent"
                      }`}
                    ></div>
                  </div>
                );
              })}
            </div>

            {/* X-Axis dates */}
            <div className="flex justify-between text-[10px] text-[#5B6573] pt-2 px-1">
              <span>{trends[0]?.label}</span>
              <span>{trends[Math.floor(trends.length / 2)]?.label}</span>
              <span>{trends[trends.length - 1]?.label}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
