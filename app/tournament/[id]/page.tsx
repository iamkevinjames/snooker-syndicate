"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Loader from "../../components/Loader";
import { useNavigationLoading } from "../../context/NavigationLoadingContext";
import BracketView from "../components/BracketView";
import GroupCard from "../components/GroupCard";
import LeagueTable from "../components/LeagueTable";
import PodiumSection from "../components/PodiumSection";
import RoundSection from "../components/RoundSection";
import {
  getTournamentPlacements,
  getRound1Standings,
  getRound2Standings,
  isRound1GroupComplete,
  isRound2GroupComplete,
} from "../lib/bracket";
import { knockoutRoundOrder, thirdPlaceRound } from "../data/mockTournament";
import { useTournamentContext } from "../context/TournamentContext";
import { useAuthContext } from "../../context/AuthContext";
import { getTournamentList } from "../lib/api";

type DetailSectionId = "round-1" | "round-2" | "bracket";

const defaultExpandedSections: Record<DetailSectionId, boolean> = {
  "round-1": true,
  "round-2": true,
  bracket: true,
};

export default function TournamentDetailPage() {
  const params = useParams<{ id: string }>();
  const tournamentId = params.id;
  const { user, loading: authLoading } = useAuthContext();
  const { showNavigationLoader, hideNavigationLoader } = useNavigationLoading();
  const { initializeTournament, getTournamentState, getTournamentMetaById } =
    useTournamentContext();
  const [expandedSections, setExpandedSections] = useState(
    defaultExpandedSections,
  );
  const [redirecting, setRedirecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const tournamentState = getTournamentState(tournamentId);
  const tournamentMeta = getTournamentMetaById(tournamentId);

  useEffect(() => {
    setIsLoading(true);
    initializeTournament(tournamentId);
  }, [initializeTournament, tournamentId]);

  useEffect(() => {
    if (authLoading || user) {
      return;
    }

    let active = true;

    const checkTournamentVisibility = async () => {
      const items = await getTournamentList();
      if (!active) {
        return;
      }

      const tournament = items.find((item) => item.id === tournamentId);
      if (tournament?.status === "upcoming") {
        setRedirecting(true);
        window.location.assign("/tournament");
      }
    };

    void checkTournamentVisibility();

    return () => {
      active = false;
    };
  }, [authLoading, tournamentId, user]);

  useEffect(() => {
    if (tournamentState && tournamentMeta) {
      setIsLoading(false);
    }
  }, [tournamentMeta, tournamentState]);

  useEffect(() => {
    if (!authLoading && !isLoading && !redirecting && tournamentState) {
      hideNavigationLoader();
    }
  }, [
    authLoading,
    hideNavigationLoader,
    isLoading,
    redirecting,
    tournamentState,
  ]);

  if (authLoading || isLoading || redirecting || !tournamentState) {
    return <Loader fullPage label="Loading tournament details..." />;
  }

  const round1Standings = getRound1Standings(tournamentState);
  const round2Standings = getRound2Standings(tournamentState);
  const round1Complete = {
    A: isRound1GroupComplete(tournamentState, "A"),
    B: isRound1GroupComplete(tournamentState, "B"),
    C: isRound1GroupComplete(tournamentState, "C"),
    D: isRound1GroupComplete(tournamentState, "D"),
  };
  const round2Complete = {
    A: isRound2GroupComplete(tournamentState, "A"),
    B: isRound2GroupComplete(tournamentState, "B"),
    C: isRound2GroupComplete(tournamentState, "C"),
    D: isRound2GroupComplete(tournamentState, "D"),
  };
  const placements = getTournamentPlacements(tournamentState);

  const toggleSection = (sectionId: DetailSectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const areAllExpanded = Object.values(expandedSections).every(Boolean);

  const setAllExpanded = (expanded: boolean) => {
    setExpandedSections({
      "round-1": expanded,
      "round-2": expanded,
      bracket: expanded,
    });
  };

  const handlePrint = () => {
    const previousTitle = document.title;
    const nextTitle = `${tournamentMeta?.name ?? "Tournament"} - Tournament Details`;

    const restoreTitle = () => {
      document.title = previousTitle;
      window.removeEventListener("afterprint", restoreTitle);
    };

    document.title = nextTitle;
    window.addEventListener("afterprint", restoreTitle);
    window.print();
    window.setTimeout(restoreTitle, 1000);
  };

  return (
    <main className="flex-1">
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-24 print:px-0 print:py-6">
        <div className="print-shell rounded-3xl border border-green-800/30 bg-[#111d15] p-4 sm:p-8 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-green-300">
                Tournament details
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white sm:text-4xl">
                {tournamentMeta?.name ?? "Fixtures"}
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
                href={`/tournament/${tournamentId}/matches`}
                onClick={() => {
                  showNavigationLoader("Loading matches...");
                }}
                className="rounded-full bg-green-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-600"
              >
                Matches
              </Link>
            </div>
          </div>

          {placements ? (
            <PodiumSection
              placements={placements}
              groups={tournamentState.groups}
            />
          ) : null}

          <div className="mt-8 space-y-6">
            <div className="no-print flex items-center justify-end">
              <button
                type="button"
                onClick={() => setAllExpanded(!areAllExpanded)}
                className="rounded-full border border-green-700/40 px-4 py-2 text-sm font-semibold text-green-300 transition hover:border-green-500 hover:text-white"
              >
                {areAllExpanded ? "Collapse All" : "Expand All"}
              </button>
            </div>

            <RoundSection
              title="Round 1 - League"
              badge={
                tournamentState.rounds["round-1"].locked ? "Locked" : undefined
              }
              isExpanded={expandedSections["round-1"]}
              onToggle={() => toggleSection("round-1")}
            >
              <div className="grid gap-3 lg:grid-cols-2">
                <LeagueTable
                  title="Group A"
                  rows={round1Standings.A}
                  highlightElimination={round1Complete.A}
                />
                <LeagueTable
                  title="Group B"
                  rows={round1Standings.B}
                  highlightElimination={round1Complete.B}
                />
                <LeagueTable
                  title="Group C"
                  rows={round1Standings.C}
                  highlightElimination={round1Complete.C}
                />
                <LeagueTable
                  title="Group D"
                  rows={round1Standings.D}
                  highlightElimination={round1Complete.D}
                />
              </div>
            </RoundSection>

            <RoundSection
              title="Round 2 - League"
              badge={
                tournamentState.rounds["round-2"].locked ? "Locked" : undefined
              }
              isExpanded={expandedSections["round-2"]}
              onToggle={() => toggleSection("round-2")}
            >
              <div className="grid gap-3 lg:grid-cols-2">
                <LeagueTable
                  title="Group A"
                  rows={round2Standings.A}
                  highlightElimination={round2Complete.A}
                />
                <LeagueTable
                  title="Group B"
                  rows={round2Standings.B}
                  highlightElimination={round2Complete.B}
                />
                <LeagueTable
                  title="Group C"
                  rows={round2Standings.C}
                  highlightElimination={round2Complete.C}
                />
                <LeagueTable
                  title="Group D"
                  rows={round2Standings.D}
                  highlightElimination={round2Complete.D}
                />
              </div>
            </RoundSection>

            <RoundSection
              title="Knockout Bracket"
              isExpanded={expandedSections.bracket}
              onToggle={() => toggleSection("bracket")}
            >
              <BracketView
                rounds={knockoutRoundOrder.map((item) => ({
                  title: item.title,
                  round: tournamentState.rounds[item.id],
                }))}
                thirdPlaceRound={{
                  title: thirdPlaceRound.title,
                  round: tournamentState.rounds[thirdPlaceRound.id],
                }}
              />
            </RoundSection>
          </div>

          <div className="mt-10">
            <h2 className="text-xl font-semibold text-white">Groups</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Object.entries(tournamentState.groups).map(
                ([groupName, members]) => (
                  <GroupCard
                    key={groupName}
                    groupName={groupName}
                    members={members}
                  />
                ),
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
