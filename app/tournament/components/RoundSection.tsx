import { ReactNode } from "react";

interface RoundSectionProps {
  title: string;
  badge?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
  printPageBreak?: boolean;
}

export default function RoundSection({
  title,
  badge,
  isExpanded,
  onToggle,
  children,
  printPageBreak = false,
}: RoundSectionProps) {
  return (
    <section
      className={`print-shell print-page-section rounded-2xl border border-green-800/30 bg-[#0d1710] ${printPageBreak ? "print-bracket-page" : ""}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className="no-print flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="min-w-0 text-lg font-semibold text-white">{title}</h3>
          {badge ? (
            <span className="rounded-full border border-amber-600/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-200">
              {badge}
            </span>
          ) : null}
        </div>
        <span className="text-sm font-semibold text-green-300">
          {isExpanded ? "Hide" : "Show"}
        </span>
      </button>

      <div className="print-round-heading hidden border-b border-green-800/20 px-4 py-3 print:block sm:px-5">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="min-w-0 text-lg font-semibold text-white">{title}</h3>
          {badge ? (
            <span className="rounded-full border border-amber-600/50 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-amber-200">
              {badge}
            </span>
          ) : null}
        </div>
      </div>

      <div className="no-print border-t border-green-800/20 print:hidden" />

      <div
        className={`print-section-body min-w-0 w-full max-w-full px-4 py-4 sm:px-5 ${isExpanded ? "block" : "hidden print:block"}`}
      >
        {children}
      </div>
    </section>
  );
}
