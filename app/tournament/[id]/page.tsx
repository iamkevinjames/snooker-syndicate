import { notFound } from "next/navigation";
import { tournaments, tournamentMembers } from "../../data";

export default async function TournamentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tournament = tournaments.find((item) => item.id === id);

  if (!tournament) {
    notFound();
  }

  const groups = Array.from({ length: 4 }, (_, index) =>
    tournamentMembers.slice(index * 7, index * 7 + 7),
  );

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-green-800/30 bg-[#111d15] p-8 sm:p-10">
          <p className="text-sm uppercase tracking-[0.35em] text-green-300">Tournament details</p>
          <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">{tournament.name}</h1>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-[#cbd8c2]">
            <span className="rounded-full border border-green-700/40 px-3 py-1">{tournament.type}</span>
            <span className="rounded-full border border-green-700/40 px-3 py-1">{tournament.date}</span>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-white">Members</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {tournament.members.map((member) => (
                <li key={member} className="rounded-xl border border-green-800/20 bg-[#0d1710] px-4 py-3 text-[#dff5d6]">
                  {member}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-white">Fixtures</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {groups.map((group, index) => (
                <div key={`group-${index + 1}`} className="rounded-2xl border border-green-800/20 bg-[#0d1710] p-5">
                  <h3 className="text-lg font-semibold text-green-300">Group {String.fromCharCode(65 + index)}</h3>
                  <ul className="mt-4 space-y-2 text-[#dff5d6]">
                    {group.map((member) => (
                      <li key={member} className="rounded-lg border border-green-800/20 px-3 py-2">
                        {member}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
