import { Info } from "lucide-react";

export default function DemoBanner() {
  return (
    <div className="bg-[#FEF7E6] border-b border-[#E1E5EB] px-4 py-2 text-xs text-[#946200]">
      <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-[#946200]" />
          <span>
            <strong>Demonstration Mode: </strong>
            Sample records and seed complaints are active to demonstrate platform workflows. Production records are compiled exclusively from verified user submissions under our published methodology.
          </span>
        </div>
        <span className="shrink-0 font-medium uppercase tracking-wider text-[10px] bg-[#946200]/10 px-2 py-0.5 rounded border border-[#946200]/20">
          Dev / Preview
        </span>
      </div>
    </div>
  );
}
