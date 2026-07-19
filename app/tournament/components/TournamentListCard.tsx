"use client";

import Link from "next/link";
import { Tournament } from "../../data";

interface TournamentListCardProps {
  tournament: Tournament;
  winner?: string;
}

export default function TournamentListCard({
  tournament,
  winner,
}: TournamentListCardProps) {
  return (
    <Link
      href={`/tournament/${tournament.id}`}
      className="rounded-2xl border border-green-800/30 bg-[#111d15] p-6 transition hover:-translate-y-1 hover:border-green-500"
    >
      <p className="text-sm uppercase tracking-[0.3em] text-green-300">
        {tournament.type}
      </p>
      <h2 className="mt-3 text-xl font-semibold text-white">
        {tournament.name}
      </h2>
      <p className="mt-3 text-[#cbd8c2]">{tournament.date}</p>
      {winner ? (
        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-100">
          <span aria-hidden="true">🏆</span>
          <span>Winner: {winner}</span>
        </div>
      ) : null}
    </Link>
  );
}
