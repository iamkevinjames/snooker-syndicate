"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import MatchScoreCard from "../../components/MatchScoreCard";
import RoundLockConfirmationDialog from "../../components/RoundLockConfirmationDialog";
import RoundSection from "../../components/RoundSection";
import { useTournamentContext } from "../../context/TournamentContext";
import { RoundId } from "../../lib/types";
import {
  randomizeBestOfThreeRound,
  randomizeLeagueRound,
  resetDatabase,
} from "../../lib/api";

const allRoundOrder: Array<{
  id: RoundId;
  roundNumber: number;
  sectionTitle: string;
}> = [
  { id: "round-1", roundNumber: 1, sectionTitle: "Round 1 - League" },
  { id: "round-2", roundNumber: 2, sectionTitle: "Round 2 - League" },
  { id: "round-3", roundNumber: 3, sectionTitle: "Round 3 - Knockout" },
  { id: "round-4", roundNumber: 4, sectionTitle: "Quarterfinals" },
  { id: "round-5", roundNumber: 5, sectionTitle: "Semifinals" },
  { id: "round-6", roundNumber: 6, sectionTitle: "Final" },
  { id: "round-7", roundNumber: 7, sectionTitle: "Third Place" },
];

const buttonClassName =
  "rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500 disabled:opacity-60";

export default function TournamentUpdatePage() {
  const params = useParams<{ id: string }>();
  const tournamentId = params.id;
  const {
    initializeTournament,
    refreshTournament,
    getTournamentState,
    updateMatchScore,
    lockRound,
  } = useTournamentContext();
  const [groupFilter, setGroupFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRunningUtility, setIsRunningUtility] = useState(false);
  const [lockPromptRoundId, setLockPromptRoundId] = useState<RoundId | null>(
    null,
  );
  const [lockPromptRoundTitle, setLockPromptRoundTitle] = useState("");
  const [expandedRounds, setExpandedRounds] = useState<
    Record<RoundId, boolean>
  >({
    "round-1": true,
    "round-2": true,
    "round-3": true,
    "round-4": true,
    "round-5": true,
    "round-6": true,
    "round-7": true,
  });

  useEffect(() => {
    initializeTournament(tournamentId);
  }, [initializeTournament, tournamentId]);

  const tournamentState = getTournamentState(tournamentId);

  if (!tournamentState) {
    return null;
  }

  const groupByMember = useMemo(() => {
    const map = new Map<string, string>();
    Object.entries(tournamentState.groups).forEach(([group, members]) => {
      members.forEach((member) => map.set(member, group));
    });
    return map;
  }, [tournamentState.groups]);

  const allMembers = useMemo(
    () => Array.from(groupByMember.keys()).sort((a, b) => a.localeCompare(b)),
    [groupByMember],
  );

  const isCompleted = (score1: number | null, score2: number | null) =>
    score1 !== null && score2 !== null;

  const filteredRoundMatches = (roundId: RoundId) => {
    const source = tournamentState.rounds[roundId].matches;

    return source.filter((match) => {
      const g1 = groupByMember.get(match.player1) ?? "";
      const g2 = groupByMember.get(match.player2) ?? "";

      if (groupFilter !== "all" && g1 !== groupFilter && g2 !== groupFilter) {
        return false;
      }

      if (
        memberFilter !== "all" &&
        match.player1 !== memberFilter &&
        match.player2 !== memberFilter
      ) {
        return false;
      }

      const done = isCompleted(match.score1, match.score2);
      if (statusFilter === "completed" && !done) {
        return false;
      }
      if (statusFilter === "pending" && done) {
        return false;
      }

      return true;
    });
  };

  const toggleRound = (roundId: RoundId) => {
    setExpandedRounds((prev) => ({ ...prev, [roundId]: !prev[roundId] }));
  };

  const areAllExpanded = Object.values(expandedRounds).every(Boolean);

  const setAllExpanded = (expanded: boolean) => {
    setExpandedRounds({
      "round-1": expanded,
      "round-2": expanded,
      "round-3": expanded,
      "round-4": expanded,
      "round-5": expanded,
      "round-6": expanded,
      "round-7": expanded,
    });
  };

  const isRoundReady = (roundId: RoundId) => {
    const matches = tournamentState.rounds[roundId].matches;
    return (
      matches.length > 0 &&
      matches.every((match) => Boolean(match.player1) && Boolean(match.player2))
    );
  };

  const getRoundBlockedMessage = (roundId: RoundId) => {
    switch (roundId) {
      case "round-2":
        return "Complete Round 1 first";
      case "round-3":
        return "Complete Round 2 first";
      case "round-4":
        return "Complete Round 3 first";
      case "round-5":
        return "Complete Quarterfinals first";
      case "round-6":
      case "round-7":
        return "Complete Semifinals first";
      default:
        return "Round not ready";
    }
  };

  const runUtility = async (action: () => Promise<void>) => {
    setIsRunningUtility(true);
    try {
      await action();
      refreshTournament(tournamentId);
    } finally {
      setIsRunningUtility(false);
    }
  };

  const runRandomizeRound1 = async () => {
    await runUtility(() => randomizeLeagueRound(tournamentId, "round-1"));
  };

  const runRandomizeRound2 = async () => {
    await runUtility(() => randomizeLeagueRound(tournamentId, "round-2"));
  };

  const runRandomizeRound3 = async () => {
    await runUtility(() => randomizeBestOfThreeRound(tournamentId, "round-3"));
  };

  const runRandomizeQuarterfinals = async () => {
    await runUtility(() => randomizeBestOfThreeRound(tournamentId, "round-4"));
  };

  const runRandomizeSemifinals = async () => {
    await runUtility(() => randomizeBestOfThreeRound(tournamentId, "round-5"));
  };

  const runRandomizeFinal = async () => {
    await runUtility(() => randomizeBestOfThreeRound(tournamentId, "round-6"));
  };

  const runRandomizeThirdPlace = async () => {
    await runUtility(() => randomizeBestOfThreeRound(tournamentId, "round-7"));
  };

  const runResetDatabase = async () => {
    setIsRunningUtility(true);
    try {
      await resetDatabase();
      refreshTournament(tournamentId);
      window.location.reload();
    } finally {
      setIsRunningUtility(false);
    }
  };

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="rounded-3xl border border-green-800/30 bg-[#111d15] p-8 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-green-300">
                Score management
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Update Scores
              </h1>
            </div>
            <Link
              href={`/tournament/${tournamentId}`}
              className="rounded-full border border-green-600 px-5 py-2 text-sm font-semibold text-green-300 transition hover:border-green-500 hover:text-white"
            >
              Back to Fixtures
            </Link>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runRandomizeRound1}
              disabled={isRunningUtility}
              className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
            >
              Randomize Round 1 Scores
            </button>
            <button
              type="button"
              onClick={runRandomizeRound2}
              disabled={isRunningUtility || !isRoundReady("round-2")}
              title={
                isRoundReady("round-2") ? "" : getRoundBlockedMessage("round-2")
              }
              className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
            >
              Randomize Round 2 Scores
            </button>
            <button
              type="button"
              onClick={runRandomizeRound3}
              disabled={isRunningUtility || !isRoundReady("round-3")}
              title={
                isRoundReady("round-3") ? "" : getRoundBlockedMessage("round-3")
              }
              className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
            >
              Randomize Round 3 (Knockout) Scores
            </button>
            <button
              type="button"
              onClick={runRandomizeQuarterfinals}
              disabled={isRunningUtility || !isRoundReady("round-4")}
              title={
                isRoundReady("round-4") ? "" : getRoundBlockedMessage("round-4")
              }
              className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
            >
              Randomize Quarterfinal Scores
            </button>
            <button
              type="button"
              onClick={runRandomizeSemifinals}
              disabled={isRunningUtility || !isRoundReady("round-5")}
              title={
                isRoundReady("round-5") ? "" : getRoundBlockedMessage("round-5")
              }
              className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
            >
              Randomize Semifinal Scores
            </button>
            <button
              type="button"
              onClick={runRandomizeFinal}
              disabled={isRunningUtility || !isRoundReady("round-6")}
              title={
                isRoundReady("round-6") ? "" : getRoundBlockedMessage("round-6")
              }
              className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
            >
              Randomize Final Scores
            </button>
            <button
              type="button"
              onClick={runRandomizeThirdPlace}
              disabled={isRunningUtility || !isRoundReady("round-7")}
              title={
                isRoundReady("round-7") ? "" : getRoundBlockedMessage("round-7")
              }
              className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
            >
              Randomize Third Place Scores
            </button>
            <button
              type="button"
              onClick={runResetDatabase}
              disabled={isRunningUtility}
              className={`${buttonClassName} border-red-700 text-red-300 hover:border-red-500 hover:text-white`}
            >
              Reset Database
            </button>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              className="h-11 rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
            >
              <option value="all">Group: All</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="D">D</option>
            </select>

            <div>
              <input
                list="member-options"
                value={memberFilter === "all" ? "" : memberFilter}
                onChange={(event) =>
                  setMemberFilter(event.target.value || "all")
                }
                placeholder="Member: All"
                className="h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
              />
              <datalist id="member-options">
                {allMembers.map((member) => (
                  <option key={member} value={member} />
                ))}
              </datalist>
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-11 rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
            >
              <option value="all">Status: All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setAllExpanded(!areAllExpanded)}
              className="rounded-full border border-green-700/40 px-4 py-2 text-sm font-semibold text-green-300 transition hover:border-green-500 hover:text-white"
            >
              {areAllExpanded ? "Collapse All" : "Expand All"}
            </button>
          </div>

          <div className="mt-8 space-y-8">
            {allRoundOrder.map((round) => (
              <RoundSection
                key={round.id}
                title={round.sectionTitle}
                badge={
                  tournamentState.rounds[round.id].locked ? "Locked" : undefined
                }
                isExpanded={expandedRounds[round.id]}
                onToggle={() => toggleRound(round.id)}
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredRoundMatches(round.id).map((match) => (
                    <MatchScoreCard
                      key={match.id}
                      roundId={round.id}
                      roundTitle={`${round.sectionTitle} - Game ${match.gameNumber}`}
                      match={match}
                      player1Group={groupByMember.get(match.player1)}
                      player2Group={groupByMember.get(match.player2)}
                      showEditButton={!tournamentState.rounds[round.id].locked}
                      onSave={async (saveRoundId, matchId, score1, score2) => {
                        const result = await updateMatchScore(
                          tournamentId,
                          saveRoundId,
                          matchId,
                          score1,
                          score2,
                        );

                        if (result.shouldPromptLock) {
                          setLockPromptRoundId(saveRoundId);
                          setLockPromptRoundTitle(result.roundTitle);
                        }
                      }}
                    />
                  ))}
                </div>
              </RoundSection>
            ))}
          </div>

          <RoundLockConfirmationDialog
            isOpen={Boolean(lockPromptRoundId)}
            roundTitle={lockPromptRoundTitle}
            onCancel={() => {
              setLockPromptRoundId(null);
              setLockPromptRoundTitle("");
            }}
            onConfirm={() => {
              if (!lockPromptRoundId) {
                return;
              }

              void (async () => {
                await lockRound(tournamentId, lockPromptRoundId);
                setLockPromptRoundId(null);
                setLockPromptRoundTitle("");
              })();
            }}
          />
        </div>
      </section>
    </main>
  );
}
