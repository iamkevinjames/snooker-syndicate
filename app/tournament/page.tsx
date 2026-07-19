"use client";

import { useEffect } from "react";
import { tournaments } from "../data";
import TournamentListCard from "./components/TournamentListCard";
import { useTournamentContext } from "./context/TournamentContext";
import { getTournamentChampion } from "./lib/bracket";

export default function TournamentPage() {
  const { initializeTournament, getTournamentState } = useTournamentContext();

  useEffect(() => {
    tournaments.forEach((tournament) => {
      initializeTournament(tournament.id);
    });
  }, [initializeTournament]);

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.35em] text-green-300">
            Upcoming events
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
            Tournament calendar
          </h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentListCard
              key={tournament.id}
              tournament={tournament}
              winner={(() => {
                const state = getTournamentState(tournament.id);
                return state ? getTournamentChampion(state) : "";
              })()}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
