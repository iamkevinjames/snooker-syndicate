import { GroupKey } from "../lib/types";
import { TournamentPlacement } from "../lib/bracket";

interface PodiumSectionProps {
  placements: TournamentPlacement[];
  groups: Record<GroupKey, string[]>;
}

const podiumMeta: Record<
  1 | 2 | 3 | 4,
  {
    icon: string;
    label: string;
    accent: string;
    block: string;
    height: string;
    order: string;
  }
> = {
  1: {
    icon: "T",
    label: "Champion",
    accent: "text-amber-200 border-amber-400/40 bg-amber-300/10",
    block:
      "border-amber-300/30 bg-gradient-to-b from-amber-300/20 to-[#1e2411]",
    height: "h-28",
    order: "md:order-2",
  },
  2: {
    icon: "2",
    label: "Runner-up",
    accent: "text-slate-200 border-slate-400/40 bg-slate-200/10",
    block:
      "border-slate-300/30 bg-gradient-to-b from-slate-200/20 to-[#171e21]",
    height: "h-20",
    order: "md:order-1",
  },
  3: {
    icon: "3",
    label: "Third Place",
    accent: "text-orange-200 border-orange-500/40 bg-orange-400/10",
    block:
      "border-orange-400/30 bg-gradient-to-b from-orange-400/20 to-[#21170f]",
    height: "h-16",
    order: "md:order-3",
  },
  4: {
    icon: "4",
    label: "Fourth Place",
    accent: "text-[#d6dbc8] border-green-700/40 bg-green-900/20",
    block:
      "border-green-800/30 bg-gradient-to-b from-green-900/20 to-[#121b14]",
    height: "h-12",
    order: "md:order-4",
  },
};

function getGroupBadge(
  groups: Record<GroupKey, string[]>,
  playerName: string,
): GroupKey | null {
  const entries = Object.entries(groups) as Array<[GroupKey, string[]]>;
  return (
    entries.find(([, members]) => members.includes(playerName))?.[0] ?? null
  );
}

export default function PodiumSection({
  placements,
  groups,
}: PodiumSectionProps) {
  return (
    <section className="print-shell print-page-section print-break-inside-avoid mt-8 rounded-3xl border border-green-800/30 bg-[radial-gradient(circle_at_top,#2d3f19_0%,#162018_38%,#111d15_100%)] p-4 sm:p-6 lg:p-8 print:mt-4 print:p-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.35em] text-amber-200/80">
            Tournament Champions
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
            Final Standings
          </h2>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-center">
        {placements.map((placement) => {
          const meta = podiumMeta[placement.place];
          const group = getGroupBadge(groups, placement.playerName);

          return (
            <article
              key={placement.place}
              className={`flex flex-1 flex-col justify-end rounded-2xl border p-4 shadow-[0_20px_60px_rgba(0,0,0,0.22)] ${meta.block} ${meta.order}`}
            >
              <div className="mb-4 flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold uppercase ${meta.accent}`}
                >
                  {meta.icon}
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#b7c8ae]">
                    {meta.label}
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {placement.playerName}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#dff5d6]">
                  #{placement.place}
                </span>
                {group ? (
                  <span className="rounded-full border border-green-600/40 bg-green-900/20 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-green-200">
                    Group {group}
                  </span>
                ) : null}
              </div>
              <div
                className={`mt-4 rounded-xl border px-4 ${meta.height} ${meta.accent} flex items-center justify-center`}
              >
                <span className="text-2xl font-bold text-white">
                  {placement.place}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
