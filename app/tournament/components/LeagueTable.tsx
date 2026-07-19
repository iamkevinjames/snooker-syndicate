import { StandingRow } from "../lib/bracket";

interface LeagueTableProps {
  title: string;
  rows: StandingRow[];
  highlightElimination?: boolean;
}

export default function LeagueTable({
  title,
  rows,
  highlightElimination = false,
}: LeagueTableProps) {
  return (
    <div className="print-shell print-break-inside-avoid rounded-xl border border-green-800/20 bg-[#0a1410] p-3 sm:p-4">
      <h4 className="text-sm font-semibold uppercase tracking-[0.2em] text-green-300">
        {title}
      </h4>
      <div className="print-scroll-reset -mx-3 mt-3 overflow-x-auto sm:mx-0">
        <table className="min-w-[420px] w-full text-left text-sm text-[#dff5d6] sm:min-w-full">
          <thead>
            <tr className="border-b border-green-800/30 text-[#9fb59d]">
              <th className="px-2 py-2">Player Name</th>
              <th className="px-2 py-2 text-center">Games Won</th>
              <th className="px-2 py-2 text-right">Total Points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.playerName}
                className={`border-b border-green-900/30 last:border-b-0 ${highlightElimination && row.eliminated ? "bg-red-950/40 text-[#ffb4b4]" : ""}`}
              >
                <td className="px-2 py-2">{row.playerName}</td>
                <td className="px-2 py-2 text-center">{row.gamesWon}</td>
                <td className="px-2 py-2 text-right font-semibold text-green-300">
                  {row.totalScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
