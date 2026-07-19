"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import Loader from "../../../components/Loader";
import { useNavigationLoading } from "../../../context/NavigationLoadingContext";
import MatchScoreCard from "../../components/MatchScoreCard";
import RoundLockConfirmationDialog from "../../components/RoundLockConfirmationDialog";
import RoundSection from "../../components/RoundSection";
import { useTournamentContext } from "../../context/TournamentContext";
import { useAuthContext } from "../../../context/AuthContext";
import { RoundId } from "../../lib/types";
import {
  generateRound1Fixtures,
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
  { id: "round-3", roundNumber: 3, sectionTitle: "Round 3 - Knockout Rounds" },
  { id: "round-4", roundNumber: 4, sectionTitle: "Quarterfinals" },
  { id: "round-5", roundNumber: 5, sectionTitle: "Semifinals" },
  { id: "round-6", roundNumber: 6, sectionTitle: "Final" },
  { id: "round-7", roundNumber: 7, sectionTitle: "Third Place" },
];

const buttonClassName =
  "rounded-full border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:border-zinc-700 disabled:text-zinc-500 disabled:opacity-60";

const enableDevTools = process.env.NEXT_PUBLIC_ENABLE_DEV_TOOLS === "true";

export default function TournamentMatchesPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = params.id;
  const { user } = useAuthContext();
  const { showNavigationLoader, hideNavigationLoader } = useNavigationLoading();
  const {
    initializeTournament,
    refreshTournament,
    getTournamentState,
    getTournamentMetaById,
    updateMatchScore,
    lockRound,
  } = useTournamentContext();
  const [groupFilter, setGroupFilter] = useState("all");
  const [memberFilter, setMemberFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeUtility, setActiveUtility] = useState<string | null>(null);
  const [lockPromptRoundId, setLockPromptRoundId] = useState<RoundId | null>(
    null,
  );
  const [lockPromptRoundTitle, setLockPromptRoundTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
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
  const tournamentState = getTournamentState(tournamentId);
  const tournamentMeta = getTournamentMetaById(tournamentId);

  useEffect(() => {
    setIsLoading(true);
    initializeTournament(tournamentId);
  }, [initializeTournament, tournamentId]);

  useEffect(() => {
    if (getTournamentState(tournamentId)) {
      setIsLoading(false);
    }
  }, [tournamentState]);

  useEffect(() => {
    if (!isLoading && tournamentState) {
      hideNavigationLoader();
    }
  }, [hideNavigationLoader, isLoading, tournamentState]);

  const groupByMember = useMemo(() => {
    const map = new Map<string, string>();
    if (!tournamentState) {
      return map;
    }

    Object.entries(tournamentState.groups).forEach(([group, members]) => {
      members.forEach((member) => map.set(member, group));
    });
    return map;
  }, [tournamentState]);

  const allMembers = useMemo(
    () => Array.from(groupByMember.keys()).sort((a, b) => a.localeCompare(b)),
    [groupByMember],
  );

  if (isLoading || !tournamentState) {
    return <Loader fullPage label="Loading matches..." />;
  }

  const isCompleted = (match: {
    score1: number | null;
    score2: number | null;
    winner: string;
  }) => match.score1 !== null && match.score2 !== null && Boolean(match.winner);

  const isRound1FullyCompleted =
    tournamentState.rounds["round-1"].matches.length > 0 &&
    tournamentState.rounds["round-1"].matches.every(
      (match) =>
        Boolean(match.player1) &&
        Boolean(match.player2) &&
        isCompleted(match) &&
        Boolean(match.winner),
    );
  const hasRound1Fixtures =
    tournamentState.rounds["round-1"].matches.length > 0;
  const hasPlayers = allMembers.length > 0;

  const filteredRoundMatches = (roundId: RoundId) => {
    const source = [...tournamentState.rounds[roundId].matches].sort(
      (left, right) => left.gameNumber - right.gameNumber,
    );

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

      const done = isCompleted(match);
      if (statusFilter === "completed" && !done) {
        return false;
      }
      if (statusFilter === "pending" && done) {
        return false;
      }

      return true;
    });
  };

  const printMatchCards = allRoundOrder.flatMap((round) =>
    filteredRoundMatches(round.id).map((match) => ({
      round,
      match,
    })),
  );

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

  const runUtility = async (action: () => Promise<void>, utilityId: string) => {
    setActiveUtility(utilityId);
    try {
      await action();
      refreshTournament(tournamentId);
    } finally {
      setActiveUtility(null);
    }
  };

  const runRandomizeRound1 = async () => {
    await runUtility(
      () => randomizeLeagueRound(tournamentId, "round-1"),
      "round-1",
    );
  };

  const runRandomizeRound2 = async () => {
    await runUtility(
      () => randomizeLeagueRound(tournamentId, "round-2"),
      "round-2",
    );
  };

  const runRandomizeRound3 = async () => {
    await runUtility(
      () => randomizeBestOfThreeRound(tournamentId, "round-3"),
      "round-3",
    );
  };

  const runRandomizeQuarterfinals = async () => {
    await runUtility(
      () => randomizeBestOfThreeRound(tournamentId, "round-4"),
      "round-4",
    );
  };

  const runRandomizeSemifinals = async () => {
    await runUtility(
      () => randomizeBestOfThreeRound(tournamentId, "round-5"),
      "round-5",
    );
  };

  const runRandomizeFinal = async () => {
    await runUtility(
      () => randomizeBestOfThreeRound(tournamentId, "round-6"),
      "round-6",
    );
  };

  const runRandomizeThirdPlace = async () => {
    await runUtility(
      () => randomizeBestOfThreeRound(tournamentId, "round-7"),
      "round-7",
    );
  };

  const runResetDatabase = async () => {
    setActiveUtility("reset");
    try {
      await resetDatabase(tournamentId);
      refreshTournament(tournamentId);
    } finally {
      setActiveUtility(null);
    }
  };

  const runGenerateRound1Fixtures = async () => {
    await runUtility(
      () => generateRound1Fixtures(tournamentId),
      "generate-round1",
    );
  };

  const handlePrint = () => {
    const previousTitle = document.title;
    const nextTitle = `${tournamentMeta?.name ?? "Tournament"} - Matches`;
    const previousExpanded = expandedRounds;

    const restore = () => {
      document.title = previousTitle;
      setExpandedRounds(previousExpanded);
      window.removeEventListener("afterprint", restore);
    };

    setExpandedRounds({
      "round-1": true,
      "round-2": true,
      "round-3": true,
      "round-4": true,
      "round-5": true,
      "round-6": true,
      "round-7": true,
    });
    document.title = nextTitle;
    window.addEventListener("afterprint", restore);
    window.setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <main className="print-matches-page flex-1">
      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-24 print:px-0 print:py-0">
        <div className="print-shell min-w-0 w-full max-w-full rounded-3xl border border-green-800/30 bg-[#111d15] p-4 sm:p-8 lg:p-10 print:p-0">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-green-300">
                Score management
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                Matches
              </h1>
            </div>
            <div className="no-print flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePrint}
                className="rounded-full border border-green-700/40 px-5 py-2 text-sm font-semibold text-green-300 transition hover:border-green-500 hover:text-white"
              >
                Print
              </button>
              <Link
                href={`/tournament/${tournamentId}`}
                onClick={() => {
                  showNavigationLoader("Loading tournament details...");
                }}
                className="rounded-full border border-green-600 px-5 py-2 text-sm font-semibold text-green-300 transition hover:border-green-500 hover:text-white"
              >
                Back to Fixtures
              </Link>
            </div>
          </div>

          {user && hasPlayers && !hasRound1Fixtures ? (
            <div className="no-print mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runGenerateRound1Fixtures}
                disabled={activeUtility !== null}
                className={`${buttonClassName} border-amber-600 text-amber-300 hover:border-amber-500 hover:text-white`}
              >
                {activeUtility === "generate-round1" ? (
                  <Loader
                    label="Generating fixtures..."
                    className="text-white"
                  />
                ) : (
                  "Generate Round 1 Fixtures"
                )}
              </button>
            </div>
          ) : null}

          {user && enableDevTools ? (
            <div className="no-print mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runRandomizeRound1}
                disabled={activeUtility !== null}
                className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
              >
                {activeUtility === "round-1" ? (
                  <Loader label="Randomizing..." className="text-white" />
                ) : (
                  "Randomize Round 1 Scores"
                )}
              </button>
              <button
                type="button"
                onClick={runRandomizeRound2}
                disabled={activeUtility !== null || !isRoundReady("round-2")}
                title={
                  isRoundReady("round-2")
                    ? ""
                    : getRoundBlockedMessage("round-2")
                }
                className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
              >
                {activeUtility === "round-2" ? (
                  <Loader label="Randomizing..." className="text-white" />
                ) : (
                  "Randomize Round 2 Scores"
                )}
              </button>
              <button
                type="button"
                onClick={runRandomizeRound3}
                disabled={activeUtility !== null || !isRoundReady("round-3")}
                title={
                  isRoundReady("round-3")
                    ? ""
                    : getRoundBlockedMessage("round-3")
                }
                className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
              >
                {activeUtility === "round-3" ? (
                  <Loader label="Randomizing..." className="text-white" />
                ) : (
                  "Randomize Round 3 (Knockout) Scores"
                )}
              </button>
              <button
                type="button"
                onClick={runRandomizeQuarterfinals}
                disabled={activeUtility !== null || !isRoundReady("round-4")}
                title={
                  isRoundReady("round-4")
                    ? ""
                    : getRoundBlockedMessage("round-4")
                }
                className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
              >
                {activeUtility === "round-4" ? (
                  <Loader label="Randomizing..." className="text-white" />
                ) : (
                  "Randomize Quarterfinal Scores"
                )}
              </button>
              <button
                type="button"
                onClick={runRandomizeSemifinals}
                disabled={activeUtility !== null || !isRoundReady("round-5")}
                title={
                  isRoundReady("round-5")
                    ? ""
                    : getRoundBlockedMessage("round-5")
                }
                className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
              >
                {activeUtility === "round-5" ? (
                  <Loader label="Randomizing..." className="text-white" />
                ) : (
                  "Randomize Semifinal Scores"
                )}
              </button>
              <button
                type="button"
                onClick={runRandomizeFinal}
                disabled={activeUtility !== null || !isRoundReady("round-6")}
                title={
                  isRoundReady("round-6")
                    ? ""
                    : getRoundBlockedMessage("round-6")
                }
                className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
              >
                {activeUtility === "round-6" ? (
                  <Loader label="Randomizing..." className="text-white" />
                ) : (
                  "Randomize Final Scores"
                )}
              </button>
              <button
                type="button"
                onClick={runRandomizeThirdPlace}
                disabled={activeUtility !== null || !isRoundReady("round-7")}
                title={
                  isRoundReady("round-7")
                    ? ""
                    : getRoundBlockedMessage("round-7")
                }
                className={`${buttonClassName} border-green-600 text-green-300 hover:border-green-500 hover:text-white`}
              >
                {activeUtility === "round-7" ? (
                  <Loader label="Randomizing..." className="text-white" />
                ) : (
                  "Randomize Third Place Scores"
                )}
              </button>
              <button
                type="button"
                onClick={runResetDatabase}
                disabled={activeUtility !== null}
                className={`${buttonClassName} border-red-700 text-red-300 hover:border-red-500 hover:text-white`}
              >
                {activeUtility === "reset" ? (
                  <Loader label="Resetting..." className="text-white" />
                ) : (
                  "Reset Database"
                )}
              </button>
            </div>
          ) : null}

          <div className="no-print mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <select
              value={groupFilter}
              onChange={(event) => setGroupFilter(event.target.value)}
              className="h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
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
              className="h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
            >
              <option value="all">Status: All</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="no-print mt-6 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setAllExpanded(!areAllExpanded)}
              className="rounded-full border border-green-700/40 px-4 py-2 text-sm font-semibold text-green-300 transition hover:border-green-500 hover:text-white"
            >
              {areAllExpanded ? "Collapse All" : "Expand All"}
            </button>
          </div>

          <div className="no-print mt-8 space-y-8">
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
                <div className="match-grid grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredRoundMatches(round.id).map((match) => (
                    <MatchScoreCard
                      key={match.id}
                      roundId={round.id}
                      roundTitle={round.sectionTitle}
                      roundNumber={round.roundNumber}
                      match={match}
                      player1Group={groupByMember.get(match.player1)}
                      player2Group={groupByMember.get(match.player2)}
                      showEditButton={
                        Boolean(user) &&
                        !tournamentState.rounds[round.id].locked
                      }
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

          <div className="print-matches-card-list mt-8 hidden print:block">
            {printMatchCards.map(({ round, match }) => (
              <MatchScoreCard
                key={`print-${round.id}-${match.id}`}
                roundId={round.id}
                roundTitle={round.sectionTitle}
                roundNumber={round.roundNumber}
                match={match}
                player1Group={groupByMember.get(match.player1)}
                player2Group={groupByMember.get(match.player2)}
                showEditButton={false}
                onSave={async () => undefined}
              />
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
