"use client";

import { useState } from "react";
import { DailyTrendPoint } from "@/lib/aggregation/counting";
import { BarChart3, Table as TableIcon } from "lucide-react";

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

  const maxVal = Math.max(
    ...trends.map((t) => Math.max(t.newReports, t.resolutions)),
    5
  );

  return (
    <div className="rounded-xl border border-[#E1E5EB] bg-white p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold text-[#17212F] flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-[#2457D6]" />
            Complaint & Resolution Trend
          </h3>
          <p className="text-xs text-[#5B6573] mt-0.5">
            Daily verified complaint submissions vs. customer-confirmed resolutions ({range}-day window)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* 7d / 30d Toggle */}
          <div className="inline-flex rounded-lg border border-[#E1E5EB] p-0.5 bg-[#F7F8FA] text-xs font-medium">
            <button
              onClick={() => onRangeChange(7)}
              className={`px-3 py-1 rounded-md transition-colors ${
                range === 7
                  ? "bg-white text-[#2457D6] font-semibold shadow-xs"
                  : "text-[#5B6573] hover:text-[#17212F]"
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => onRangeChange(30)}
              className={`px-3 py-1 rounded-md transition-colors ${
                range === 30
                  ? "bg-white text-[#2457D6] font-semibold shadow-xs"
                  : "text-[#5B6573] hover:text-[#17212F]"
              }`}
            >
              30 Days
            </button>
          </div>

          {/* Accessible Table View Toggle */}
          <button
            onClick={() => setShowTable(!showTable)}
            className="p-1.5 rounded-lg border border-[#E1E5EB] text-[#5B6573] hover:text-[#17212F] hover:bg-[#F7F8FA]"
            title={showTable ? "Show Chart View" : "Show Screen-Reader Accessible Table"}
            aria-label="Toggle accessible tabular data"
          >
            <TableIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center text-xs text-[#5B6573] animate-pulse">
          Loading trend metrics...
        </div>
      ) : showTable ? (
        /* Accessible Tabular View */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E1E5EB] bg-[#F7F8FA] text-[#5B6573]">
                <th className="py-2 px-3 font-semibold">Date</th>
                <th className="py-2 px-3 font-semibold">New Reports</th>
                <th className="py-2 px-3 font-semibold">Reported Resolutions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E1E5EB]">
              {trends.map((t) => (
                <tr key={t.date} className="hover:bg-[#F7F8FA]/50">
                  <td className="py-2 px-3 font-medium text-[#17212F]">{t.label}</td>
                  <td className="py-2 px-3 tabular-nums text-[#2457D6] font-medium">{t.newReports}</td>
                  <td className="py-2 px-3 tabular-nums text-[#18794E] font-medium">{t.resolutions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* SVG Interactive Chart */
        <div>
          {/* Active tooltip indicator */}
          <div className="h-6 mb-2 flex items-center justify-between text-xs">
            {activePoint ? (
              <div className="flex items-center gap-4 bg-[#F7F8FA] border border-[#E1E5EB] px-3 py-1 rounded-md">
                <span className="font-semibold text-[#17212F]">{activePoint.label}:</span>
                <span className="text-[#2457D6] font-medium">
                  {activePoint.newReports} new complaint{activePoint.newReports !== 1 ? "s" : ""}
                </span>
                <span className="text-[#18794E] font-medium">
                  {activePoint.resolutions} resolved
                </span>
              </div>
            ) : (
              <span className="text-[#5B6573] italic">
                Hover or tap bars for daily statistics
              </span>
            )}

            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#2457D6]"></span>
                <span className="text-[#5B6573]">New Complaints</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#18794E]"></span>
                <span className="text-[#5B6573]">Reported Resolved</span>
              </span>
            </div>
          </div>

          {/* Chart Bars or Honest Zero State */}
          {trends.reduce((sum, t) => sum + t.newReports + t.resolutions, 0) === 0 ? (
            <div className="h-44 w-full flex flex-col items-center justify-center border-b border-[#E1E5EB] bg-[#F7F8FA]/40 rounded-lg text-center p-4">
              <p className="text-xs font-semibold text-[#17212F]">
                0 complaints logged in this {range}-day window
              </p>
              <p className="text-[11px] text-[#5B6573] mt-1 max-w-sm">
                Verified delivery failure statistics will display here as consumers submit reports under our published methodology.
              </p>
            </div>
          ) : (
            <div className="relative h-44 w-full flex items-end gap-1 sm:gap-2 pt-4 border-b border-[#E1E5EB]">
              {trends.map((pt) => {
                const reportHeightPct = Math.round((pt.newReports / maxVal) * 100);
                const resolvedHeightPct = Math.round((pt.resolutions / maxVal) * 100);

                return (
                  <div
                    key={pt.date}
                    onMouseEnter={() => setActivePoint(pt)}
                    onMouseLeave={() => setActivePoint(null)}
                    onClick={() => setActivePoint(pt)}
                    className="flex-1 h-full flex flex-col justify-end items-center group cursor-pointer"
                  >
                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {/* Complaints bar */}
                      <div
                        style={{ height: pt.newReports > 0 ? `${Math.max(reportHeightPct, 6)}%` : "0%" }}
                        className={`w-1/2 max-w-[12px] rounded-t-xs transition-all ${
                          activePoint?.date === pt.date
                            ? "bg-[#1B44AA]"
                            : "bg-[#2457D6] group-hover:bg-[#1B44AA]"
                        }`}
                      ></div>
                      {/* Resolutions bar */}
                      <div
                        style={{ height: pt.resolutions > 0 ? `${Math.max(resolvedHeightPct, 6)}%` : "0%" }}
                        className={`w-1/2 max-w-[12px] rounded-t-xs transition-all ${
                          activePoint?.date === pt.date
                            ? "bg-[#125838]"
                            : "bg-[#18794E] group-hover:bg-[#125838]"
                        }`}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* X Axis Labels */}
          <div className="flex justify-between text-[10px] text-[#5B6573] mt-2 tabular-nums">
            <span>{trends[0]?.label}</span>
            <span>{trends[Math.floor(trends.length / 2)]?.label}</span>
            <span>{trends[trends.length - 1]?.label}</span>
          </div>
        </div>
      )}
    </div>
  );
}
