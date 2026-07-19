import { ReactNode } from "react";

interface RoundSectionProps {
  title: string;
  badge?: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export default function RoundSection({
  title,
  badge,
  isExpanded,
  onToggle,
  children,
}: RoundSectionProps) {
  return (
    <section className="rounded-2xl border border-green-800/30 bg-[#0d1710]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
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
      {isExpanded ? (
        <div className="border-t border-green-800/20 px-5 py-4">{children}</div>
      ) : null}
    </section>
  );
}
