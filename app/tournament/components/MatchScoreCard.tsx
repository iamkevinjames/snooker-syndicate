"use client";

import { useEffect, useState } from "react";
import { useAuthContext } from "../../context/AuthContext";
import EditResultConfirmationDialog from "./EditResultConfirmationDialog";
import Loader from "../../components/Loader";
import { MatchState, RoundId } from "../lib/types";

interface MatchScoreCardProps {
  roundId: RoundId;
  roundTitle: string;
  roundNumber: number;
  match: MatchState;
  player1Group?: string;
  player2Group?: string;
  showEditButton?: boolean;
  isSaving?: boolean;
  onSave: (
    roundId: RoundId,
    matchId: string,
    score1: number | null,
    score2: number | null,
  ) => void | Promise<void>;
}

export default function MatchScoreCard({
  roundId,
  roundTitle,
  roundNumber,
  match,
  player1Group,
  player2Group,
  showEditButton = true,
  isSaving: externalSaving = false,
  onSave,
}: MatchScoreCardProps) {
  const { user } = useAuthContext();
  const isKnockoutRound =
    roundId === "round-3" ||
    roundId === "round-4" ||
    roundId === "round-5" ||
    roundId === "round-6" ||
    roundId === "round-7";
  const minPoints = isKnockoutRound ? 1 : 2;
  const maxPoints = isKnockoutRound ? 3 : 9;
  const defaultPoints = String(minPoints);
  const [isOpen, setIsOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedWinner, setSelectedWinner] = useState<"player1" | "player2">(
    "player1",
  );
  const [matchPoints, setMatchPoints] = useState(defaultPoints);
  const [isSaving, setIsSaving] = useState(false);
  const canEdit = Boolean(user) && showEditButton;

  useEffect(() => {
    if (!match.player1 || !match.player2) {
      setSelectedWinner("player1");
      setMatchPoints(defaultPoints);
      return;
    }

    if (match.winner === match.player2) {
      setSelectedWinner("player2");
      setMatchPoints(
        match.score2 !== null
          ? String(Math.max(minPoints, Math.min(maxPoints, match.score2)))
          : defaultPoints,
      );
      return;
    }

    setSelectedWinner("player1");
    setMatchPoints(
      match.score1 !== null
        ? String(Math.max(minPoints, Math.min(maxPoints, match.score1)))
        : defaultPoints,
    );
  }, [
    defaultPoints,
    match.player1,
    match.player2,
    match.score1,
    match.score2,
    match.winner,
    maxPoints,
    minPoints,
  ]);

  useEffect(() => {
    if (!canEdit) {
      setIsOpen(false);
      setIsConfirmOpen(false);
    }
  }, [canEdit]);

  const hasPlayers = Boolean(match.player1 && match.player2);
  const hasSavedResult =
    match.score1 !== null && match.score2 !== null && Boolean(match.winner);

  const openEditor = () => {
    if (!canEdit || !hasPlayers) {
      return;
    }

    if (hasSavedResult) {
      setIsConfirmOpen(true);
      return;
    }

    setIsOpen(true);
  };

  const save = async () => {
    if (!hasPlayers) {
      setIsOpen(false);
      return;
    }

    const winnerPoints = Math.max(
      minPoints,
      Math.min(maxPoints, Number(matchPoints) || minPoints),
    );
    const score1 = selectedWinner === "player1" ? winnerPoints : 0;
    const score2 = selectedWinner === "player2" ? winnerPoints : 0;

    setIsSaving(true);
    try {
      await onSave(roundId, match.id, score1, score2);
      setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const saving = externalSaving || isSaving;

  return (
    <article className="print-shell print-break-inside-avoid print-match-card rounded-xl border border-green-800/25 bg-[#0d1710] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 text-xs uppercase tracking-[0.18em] text-[#9fb59d]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="hidden sm:inline">{roundTitle}</span>
            <span className="sm:hidden">R{roundNumber}</span>
            <span className="whitespace-nowrap">Game {match.gameNumber}</span>
          </div>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={openEditor}
            disabled={!hasPlayers}
            className="no-print rounded-md border border-green-700/40 p-1.5 text-green-300 hover:border-green-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            aria-label="Edit match"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="mt-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`min-w-0 flex-1 text-sm ${match.winner === match.player1 ? "font-semibold text-green-300" : "text-[#dff5d6]"}`}
          >
            <span className="break-words">{match.player1 || "TBD"}</span>
            {match.player1 && player1Group ? ` (${player1Group})` : ""}
          </span>
          <span className="whitespace-nowrap text-sm text-[#dff5d6]">
            {match.score1 ?? 0}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span
            className={`min-w-0 flex-1 text-sm ${match.winner === match.player2 ? "font-semibold text-green-300" : "text-[#dff5d6]"}`}
          >
            <span className="break-words">{match.player2 || "TBD"}</span>
            {match.player2 && player2Group ? ` (${player2Group})` : ""}
          </span>
          <span className="whitespace-nowrap text-sm text-[#dff5d6]">
            {match.score2 ?? 0}
          </span>
        </div>
      </div>

      {canEdit ? (
        <EditResultConfirmationDialog
          isOpen={isConfirmOpen}
          onCancel={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            setIsConfirmOpen(false);
            setIsOpen(true);
          }}
        />
      ) : null}

      {canEdit && isOpen ? (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl border border-green-800/30 bg-[#101a13] p-5">
            <h3 className="text-base font-semibold text-white">Edit Match</h3>
            <p className="mt-1 text-sm text-[#9fb59d]">
              {match.player1 || "TBD"} vs {match.player2 || "TBD"}
            </p>

            <div className="mt-4 space-y-3">
              <label className="block text-sm text-[#dff5d6]">
                Winner
                <select
                  value={selectedWinner}
                  onChange={(event) =>
                    setSelectedWinner(
                      event.target.value as "player1" | "player2",
                    )
                  }
                  className="mt-1 h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
                >
                  <option value="player1">{match.player1 || "TBD"}</option>
                  <option value="player2">{match.player2 || "TBD"}</option>
                </select>
              </label>

              <label className="block text-sm text-[#dff5d6]">
                Match Points
                <select
                  value={matchPoints}
                  onChange={(event) => setMatchPoints(event.target.value)}
                  className="mt-1 h-11 w-full rounded-lg border border-green-700/40 bg-[#0a1410] px-3 text-sm text-[#dff5d6] outline-none focus:border-green-500"
                >
                  {Array.from(
                    { length: maxPoints - minPoints + 1 },
                    (_, index) => {
                      const points = index + minPoints;
                      return (
                        <option key={points} value={points}>
                          {points}
                        </option>
                      );
                    },
                  )}
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={saving}
                className="rounded-full border border-green-700/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-[#9fb59d] hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  void save();
                }}
                disabled={saving}
                className="rounded-full border border-green-600 bg-green-700 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.15em] text-white hover:bg-green-600"
              >
                {saving ? (
                  <Loader label="Saving..." className="text-white" />
                ) : (
                  "Save"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
