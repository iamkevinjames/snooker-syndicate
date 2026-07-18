import Link from "next/link";
import { tournaments } from "../data";

export default function TournamentPage() {
  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10">
          <p className="text-sm uppercase tracking-[0.35em] text-green-300">Upcoming events</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">Tournament calendar</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <Link
              key={tournament.id}
              href={`/tournament/${tournament.id}`}
              className="rounded-2xl border border-green-800/30 bg-[#111d15] p-6 transition hover:-translate-y-1 hover:border-green-500"
            >
              <p className="text-sm uppercase tracking-[0.3em] text-green-300">{tournament.type}</p>
              <h2 className="mt-3 text-xl font-semibold text-white">{tournament.name}</h2>
              <p className="mt-3 text-[#cbd8c2]">{tournament.date}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
