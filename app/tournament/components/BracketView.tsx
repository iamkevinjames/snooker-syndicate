import { RoundState } from "../lib/types";
import MatchCard from "./MatchCard";

interface BracketViewProps {
  rounds: Array<{ title: string; round: RoundState }>;
  thirdPlaceRound?: { title: string; round: RoundState };
}

const roundSlotTemplate: Record<RoundState["id"], string[]> = {
  "round-1": [],
  "round-2": [],
  "round-3": ["r3-1", "r3-2", "r3-3", "r3-4", "r3-5", "r3-6", "r3-7", "r3-8"],
  "round-4": ["r4-1", "r4-2", "r4-3", "r4-4"],
  "round-5": ["r5-1", "r5-2"],
  "round-6": ["r6-1"],
  "round-7": ["r7-1"],
};

function getDisplayMatches(round: RoundState) {
  const template = roundSlotTemplate[round.id];

  if (!template || template.length === 0) {
    return round.matches;
  }

  const matchById = new Map(round.matches.map((match) => [match.id, match]));

  return template.map((slotId, index) => {
    const existing = matchById.get(slotId);
    if (existing) {
      return existing;
    }

    return {
      id: slotId,
      recordId: -1,
      gameNumber: index + 1,
      player1: "",
      player2: "",
      score1: null,
      score2: null,
      winner: "",
    };
  });
}

export default function BracketView({
  rounds,
  thirdPlaceRound,
}: BracketViewProps) {
  return (
    <div className="print-scroll-reset -mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
      <div className="print-bracket flex min-w-[980px] items-center gap-3">
        {rounds.map((item, index) => (
          <div
            key={item.round.id}
            className="print-break-inside-avoid flex items-center gap-3"
          >
            {index === rounds.length - 1 && thirdPlaceRound ? (
              <div className="flex min-w-[220px] flex-col gap-6">
                <div className="flex min-w-[190px] flex-col gap-3">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                  </div>
                  {getDisplayMatches(item.round).map((match) => (
                    <MatchCard key={match.id} match={match} />
                  ))}
                </div>
                <div className="print-shell rounded-2xl border border-green-800/20 bg-[#0a1410] p-3">
                  <div className="mb-3 text-center">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#9fb59d]">
                      {thirdPlaceRound.title}
                    </p>
                  </div>
                  <div className="space-y-3">
                    {getDisplayMatches(thirdPlaceRound.round).map((match) => (
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
                {getDisplayMatches(item.round).map((match) => (
                  <MatchCard key={match.id} match={match} />
                ))}
              </div>
            )}
            {index < rounds.length - 1 ? (
              <svg
                width="24"
                height="92"
                viewBox="0 0 24 92"
                className="no-print text-green-600"
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
