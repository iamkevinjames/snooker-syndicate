import { MatchState } from "../lib/types";

interface MatchCardProps {
  match: MatchState;
}

export default function MatchCard({ match }: MatchCardProps) {
  const p1 = match.player1 || "TBD";
  const p2 = match.player2 || "TBD";
  const isPlaceholder = !match.player1 && !match.player2;
  const winner = match.winner;

  return (
    <div
      className={`print-shell print-break-inside-avoid rounded-xl border p-3 text-sm ${isPlaceholder ? "border-dashed border-green-700/40 bg-[#0a1410] text-[#8ea388]" : "border-green-800/30 bg-[#0d1710] text-[#dff5d6]"}`}
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <span
            className={
              winner === match.player1
                ? "font-semibold text-green-300"
                : "font-medium"
            }
          >
            {p1}
          </span>
          <span>{match.score1 ?? "-"}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={
              winner === match.player2
                ? "font-semibold text-green-300"
                : "font-medium"
            }
          >
            {p2}
          </span>
          <span>{match.score2 ?? "-"}</span>
        </div>
      </div>
      <p className="mt-3 text-xs text-[#9fb59d]">
        Winner:{" "}
        <span className="font-semibold text-green-300">{winner || "TBD"}</span>
      </p>
    </div>
  );
}
