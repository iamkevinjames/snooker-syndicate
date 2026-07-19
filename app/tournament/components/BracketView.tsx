import { RoundState } from "../lib/types";
import MatchCard from "./MatchCard";

interface BracketViewProps {
  rounds: Array<{ title: string; round: RoundState }>;
  thirdPlaceRound?: { title: string; round: RoundState };
}

export default function BracketView({
  rounds,
  thirdPlaceRound,
}: BracketViewProps) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-[980px] items-center gap-3">
        {rounds.map((item, index) => (
          <div key={item.round.id} className="flex items-center gap-3">
            {index === rounds.length - 1 && thirdPlaceRound ? (
              <div className="flex min-w-[220px] flex-col gap-6">
                <div className="flex min-w-[190px] flex-col gap-3">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                  </div>
                  {item.round.matches.map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
                <div className="rounded-2xl border border-green-800/20 bg-[#0a1410] p-3">
                  <div className="mb-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9fb59d]">
                      {thirdPlaceRound.title}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {thirdPlaceRound.round.matches.map((match) => (
                      <MatchCard key={match.id} match={match} />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-w-[190px] flex-col gap-3">
                <div className="text-center">
                  <p className="text-sm font-semibold text-white">
                    {item.title}
                  </p>
                </div>
                {item.round.matches.map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
            {index < rounds.length - 1 ? (
              <svg
                width="24"
                height="92"
                viewBox="0 0 24 92"
                className="text-green-600"
              >
                <line
                  x1="12"
                  y1="0"
                  x2="12"
                  y2="92"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <line
                  x1="12"
                  y1="46"
                  x2="24"
                  y2="46"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </svg>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
