"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Loader from "../components/Loader";
import {
  createTournament,
  CreateTournamentInput,
  getTournamentList,
  startTournament,
  TournamentListItem,
} from "./lib/api";
import { useAuthContext } from "../context/AuthContext";

interface PendingStartDialogState {
  id: string;
  name: string;
}

const cardClassName =
  "rounded-2xl border border-green-800/30 bg-[#111d15] p-6 transition hover:-translate-y-1 hover:border-green-500";

export default function TournamentPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startingTournamentId, setStartingTournamentId] = useState<
    string | null
  >(null);
  const [pendingStartDialog, setPendingStartDialog] =
    useState<PendingStartDialogState | null>(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState<"Singles" | "Doubles">("Singles");
  const [playerInput, setPlayerInput] = useState("");
  const [players, setPlayers] = useState<string[]>([]);

  const canSubmit = name.trim().length > 0 && date && players.length > 0;

  const sortedPlayers = useMemo(
    () => [...players].sort((left, right) => left.localeCompare(right)),
    [players],
  );

  const loadTournaments = async () => {
    setIsLoading(true);
    try {
      const items = await getTournamentList();
      setTournaments(items);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTournaments();
  }, []);

  const visibleTournaments = useMemo(() => {
    if (user) {
      return tournaments;
    }

    return tournaments.filter(
      (tournament) =>
        tournament.status === "ongoing" || tournament.status === "completed",
    );
  }, [tournaments, user]);

  const addPlayer = () => {
    const value = playerInput.trim();
    if (!value) {
      return;
    }

    if (
      players.some((player) => player.toLowerCase() === value.toLowerCase())
    ) {
      setPlayerInput("");
      return;
    }

    setPlayers((prev) => [...prev, value]);
    setPlayerInput("");
  };

  const removePlayer = (player: string) => {
    setPlayers((prev) => prev.filter((item) => item !== player));
  };

  const resetCreateForm = () => {
    setName("");
    setDate("");
    setType("Singles");
    setPlayerInput("");
    setPlayers([]);
  };

  const handleCreateTournament = async () => {
    if (!canSubmit) {
      return;
    }

    const payload: CreateTournamentInput = {
      name: name.trim(),
      date,
      type,
      players,
    };

    setIsSubmitting(true);
    try {
      await createTournament(payload);
      setIsCreateOpen(false);
      resetCreateForm();
      await loadTournaments();
    } finally {
      setIsSubmitting(false);
    }
  };

  const executeStartTournament = async (tournamentId: string) => {
    setStartingTournamentId(tournamentId);
    try {
      await startTournament(tournamentId);
      await loadTournaments();
      router.push(`/tournament/${tournamentId}`);
    } finally {
      setStartingTournamentId(null);
    }
  };

  const handleCardClick = (tournament: TournamentListItem) => {
    if (tournament.status === "upcoming") {
      setPendingStartDialog({ id: tournament.id, name: tournament.name });
      return;
    }

    router.push(`/tournament/${tournament.id}`);
  };

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-green-300">
              Upcoming events
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
              Tournament calendar
            </h1>
          </div>
          {user ? (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="rounded-full border border-green-600 bg-green-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
            >
              Create Tournament
            </button>
          ) : null}
        </div>

        {isLoading ? (
          <Loader fullPage label="Loading tournaments..." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visibleTournaments.map((tournament) => {
              const isUpcoming = tournament.status === "upcoming";
              const isStarting = startingTournamentId === tournament.id;

              return (
                <article
                  key={tournament.id}
                  className={`${cardClassName} cursor-pointer`}
                  onClick={() => handleCardClick(tournament)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleCardClick(tournament);
                    }
                  }}
                >
                  <p className="text-sm uppercase tracking-[0.3em] text-green-300">
                    {tournament.type}
                  </p>
                  <h2 className="mt-3 text-xl font-semibold text-white">
                    {tournament.name}
                  </h2>
                  <p className="mt-3 text-[#cbd8c2]">{tournament.date}</p>

                  <div className="mt-4 inline-flex items-center rounded-full border border-green-700/40 bg-[#0d1710] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#a9bc9f]">
                    {tournament.status}
                  </div>

                  {tournament.status === "completed" && tournament.winner ? (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-400/10 px-3 py-1.5 text-sm font-semibold text-amber-100">
                      <span aria-hidden="true">🏆</span>
                      <span>Winner: {tournament.winner}</span>
                    </div>
                  ) : null}

                  {user && isUpcoming ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void executeStartTournament(tournament.id);
                        }}
                        disabled={isStarting}
                        className="rounded-full border border-green-600 bg-green-700 px-4 py-2 text-xs font-semibold uppercase tracking-[0.15em] text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isStarting ? "Starting..." : "Start Tournament"}
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {user && isCreateOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-green-800/30 bg-[#101a13] p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-white">
                Create Tournament
              </h2>
              <button
                type="button"
                onClick={() => {
                  setIsCreateOpen(false);
                }}
                className="rounded-full border border-green-700/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#9fb59d] hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm text-[#dff5d6]">
                Tournament Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
                />
              </label>

              <label className="text-sm text-[#dff5d6]">
                Date
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
                />
              </label>

              <label className="text-sm text-[#dff5d6]">
                Type
                <select
                  value={type}
                  onChange={(event) =>
                    setType(event.target.value as "Singles" | "Doubles")
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
                >
                  <option value="Singles">Singles</option>
                  <option value="Doubles">Doubles</option>
                </select>
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-green-800/30 bg-[#0b1510] p-4">
              <p className="text-sm font-semibold text-white">Players</p>
              <p className="mt-1 text-xs text-[#9fb59d]">
                Add player names one by one. 28+ players is recommended for 4
                groups of 7.
              </p>

              <div className="mt-3 flex gap-2">
                <input
                  value={playerInput}
                  onChange={(event) => setPlayerInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addPlayer();
                    }
                  }}
                  placeholder="Player name"
                  className="h-11 flex-1 rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
                />
                <button
                  type="button"
                  onClick={addPlayer}
                  className="rounded-lg border border-green-600 bg-green-700 px-4 text-sm font-semibold text-white hover:bg-green-600"
                >
                  Add
                </button>
              </div>

              <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
                {sortedPlayers.map((player) => (
                  <div
                    key={player}
                    className="flex items-center justify-between rounded-lg border border-green-800/30 bg-[#0a1410] px-3 py-2"
                  >
                    <span className="text-sm text-[#dff5d6]">{player}</span>
                    <button
                      type="button"
                      onClick={() => removePlayer(player)}
                      className="text-xs font-semibold uppercase tracking-[0.12em] text-red-300 hover:text-red-200"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <span className="text-xs text-[#9fb59d]">
                {players.length} players added
              </span>
              <button
                type="button"
                onClick={() => {
                  void handleCreateTournament();
                }}
                disabled={!canSubmit || isSubmitting}
                className="rounded-full border border-green-600 bg-green-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader label="Creating..." className="text-white" />
                ) : (
                  "Create Tournament"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {user && pendingStartDialog ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-green-800/30 bg-[#101a13] p-6">
            <h3 className="text-lg font-semibold text-white">
              Tournament not started yet
            </h3>
            <p className="mt-2 text-sm text-[#9fb59d]">
              Start tournament to view details?
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPendingStartDialog(null)}
                className="rounded-full border border-green-700/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#9fb59d] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = pendingStartDialog.id;
                  setPendingStartDialog(null);
                  void executeStartTournament(id);
                }}
                className="rounded-full border border-green-600 bg-green-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-green-600"
              >
                Start Tournament
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
