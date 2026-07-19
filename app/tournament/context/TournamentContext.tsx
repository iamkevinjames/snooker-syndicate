"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  getTournamentPayload,
  updateManyMatches,
  updateMatch,
  updateRoundLock,
} from "../lib/api";
import { recalculateTournamentState } from "../lib/bracket";
import {
  MatchState,
  RoundId,
  TournamentMeta,
  TournamentState,
} from "../lib/types";

interface TournamentContextValue {
  initializeTournament: (tournamentId: string) => void;
  refreshTournament: (tournamentId: string) => void;
  getTournamentState: (tournamentId: string) => TournamentState | null;
  getTournamentMetaById: (tournamentId: string) => TournamentMeta | null;
  updateMatchScore: (
    tournamentId: string,
    roundId: RoundId,
    matchId: string,
    score1: number | null,
    score2: number | null,
  ) => Promise<{ shouldPromptLock: boolean; roundTitle: string }>;
  lockRound: (tournamentId: string, roundId: RoundId) => Promise<void>;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

const roundTitles: Record<RoundId, string> = {
  "round-1": "Round 1",
  "round-2": "Round 2",
  "round-3": "Round 3",
  "round-4": "Quarterfinals",
  "round-5": "Semifinals",
  "round-6": "Final",
  "round-7": "Third Place",
};

function isCompleted(match: MatchState): boolean {
  return match.score1 !== null && match.score2 !== null;
}

function sortMatchesOnRefresh(matches: MatchState[]): MatchState[] {
  return [...matches].sort((left, right) => {
    const leftDone = isCompleted(left);
    const rightDone = isCompleted(right);

    if (leftDone !== rightDone) {
      return leftDone ? 1 : -1;
    }

    return left.gameNumber - right.gameNumber;
  });
}

function sortStateOnRefresh(state: TournamentState): TournamentState {
  const next = structuredClone(state);

  (Object.keys(next.rounds) as RoundId[]).forEach((roundId) => {
    next.rounds[roundId].matches = sortMatchesOnRefresh(
      next.rounds[roundId].matches,
    );
  });

  return next;
}

function createStateFromPayload(payload: {
  groups: Record<"A" | "B" | "C" | "D", string[]>;
  rounds: Record<RoundId, MatchState[]>;
  roundLocks: Record<RoundId, boolean>;
}): TournamentState {
  return {
    groups: payload.groups,
    rounds: {
      "round-1": {
        id: "round-1",
        title: roundTitles["round-1"],
        mode: "league",
        locked: payload.roundLocks["round-1"],
        matches: payload.rounds["round-1"],
      },
      "round-2": {
        id: "round-2",
        title: roundTitles["round-2"],
        mode: "league",
        locked: payload.roundLocks["round-2"],
        matches: payload.rounds["round-2"],
      },
      "round-3": {
        id: "round-3",
        title: roundTitles["round-3"],
        mode: "knockout",
        locked: payload.roundLocks["round-3"],
        matches: payload.rounds["round-3"],
      },
      "round-4": {
        id: "round-4",
        title: roundTitles["round-4"],
        mode: "knockout",
        locked: payload.roundLocks["round-4"],
        matches: payload.rounds["round-4"],
      },
      "round-5": {
        id: "round-5",
        title: roundTitles["round-5"],
        mode: "knockout",
        locked: payload.roundLocks["round-5"],
        matches: payload.rounds["round-5"],
      },
      "round-6": {
        id: "round-6",
        title: roundTitles["round-6"],
        mode: "knockout",
        locked: payload.roundLocks["round-6"],
        matches: payload.rounds["round-6"],
      },
      "round-7": {
        id: "round-7",
        title: roundTitles["round-7"],
        mode: "knockout",
        locked: payload.roundLocks["round-7"],
        matches: payload.rounds["round-7"],
      },
    },
  };
}

function collectMatchUpdates(
  original: TournamentState,
  derived: TournamentState,
): Array<{
  recordId: number;
  patch: Partial<
    Pick<MatchState, "player1" | "player2" | "score1" | "score2" | "winner">
  >;
}> {
  const updates: Array<{
    recordId: number;
    patch: Partial<
      Pick<MatchState, "player1" | "player2" | "score1" | "score2" | "winner">
    >;
  }> = [];

  (Object.keys(original.rounds) as RoundId[]).forEach((roundId) => {
    const beforeRound = original.rounds[roundId].matches;
    const afterRound = derived.rounds[roundId].matches;

    beforeRound.forEach((beforeMatch) => {
      const afterMatch = afterRound.find((item) => item.id === beforeMatch.id);
      if (!afterMatch) {
        return;
      }

      const patch: Partial<
        Pick<MatchState, "player1" | "player2" | "score1" | "score2" | "winner">
      > = {};

      if (beforeMatch.player1 !== afterMatch.player1) {
        patch.player1 = afterMatch.player1;
      }
      if (beforeMatch.player2 !== afterMatch.player2) {
        patch.player2 = afterMatch.player2;
      }
      if (beforeMatch.score1 !== afterMatch.score1) {
        patch.score1 = afterMatch.score1;
      }
      if (beforeMatch.score2 !== afterMatch.score2) {
        patch.score2 = afterMatch.score2;
      }
      if (beforeMatch.winner !== afterMatch.winner) {
        patch.winner = afterMatch.winner;
      }

      if (Object.keys(patch).length > 0 && beforeMatch.recordId > 0) {
        updates.push({ recordId: beforeMatch.recordId, patch });
      }
    });
  });

  return updates;
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [stateMap, setStateMap] = useState<Record<string, TournamentState>>({});
  const [metaMap, setMetaMap] = useState<Record<string, TournamentMeta>>({});
  const loadingRef = useRef<Set<string>>(new Set());

  const syncDerivedState = useCallback(
    async (tournamentId: string, rawState: TournamentState) => {
      const derivedState = recalculateTournamentState(rawState);
      const updates = collectMatchUpdates(rawState, derivedState);

      if (updates.length > 0) {
        await updateManyMatches(updates);
      }

      setStateMap((prev) => ({
        ...prev,
        [tournamentId]: sortStateOnRefresh(derivedState),
      }));
    },
    [],
  );

  const reloadTournament = useCallback(
    async (tournamentId: string) => {
      if (loadingRef.current.has(tournamentId)) {
        return;
      }

      loadingRef.current.add(tournamentId);

      try {
        const payload = await getTournamentPayload(tournamentId);
        if (!payload) {
          return;
        }

        setMetaMap((prev) => ({ ...prev, [tournamentId]: payload.meta }));
        const rawState = createStateFromPayload(payload);
        await syncDerivedState(tournamentId, rawState);
      } finally {
        loadingRef.current.delete(tournamentId);
      }
    },
    [syncDerivedState],
  );

  const initializeTournament = useCallback(
    (tournamentId: string) => {
      if (stateMap[tournamentId]) {
        return;
      }

      void reloadTournament(tournamentId);
    },
    [reloadTournament, stateMap],
  );

  const refreshTournament = useCallback(
    (tournamentId: string) => {
      void reloadTournament(tournamentId);
    },
    [reloadTournament],
  );

  const getTournamentState = useCallback(
    (tournamentId: string) => stateMap[tournamentId] ?? null,
    [stateMap],
  );

  const getTournamentMetaById = useCallback(
    (tournamentId: string) => metaMap[tournamentId] ?? null,
    [metaMap],
  );

  const updateMatchScore = useCallback(
    async (
      tournamentId: string,
      roundId: RoundId,
      matchId: string,
      score1: number | null,
      score2: number | null,
    ) => {
      const existing = stateMap[tournamentId];
      if (!existing) {
        return { shouldPromptLock: false, roundTitle: "" };
      }

      if (existing.rounds[roundId].locked) {
        return {
          shouldPromptLock: false,
          roundTitle: existing.rounds[roundId].title,
        };
      }

      const targetMatch = existing.rounds[roundId].matches.find(
        (match) => match.id === matchId,
      );

      if (!targetMatch) {
        return { shouldPromptLock: false, roundTitle: "" };
      }

      const winner =
        score1 !== null && score2 !== null
          ? score1 > score2
            ? targetMatch.player1
            : score2 > score1
              ? targetMatch.player2
              : ""
          : "";

      let shouldPromptLock = false;

      setStateMap((prev) => {
        const current = prev[tournamentId];
        if (!current) {
          return prev;
        }

        const draft = structuredClone(current);
        const localMatch = draft.rounds[roundId].matches.find(
          (match) => match.id === matchId,
        );

        if (!localMatch) {
          return prev;
        }

        localMatch.score1 = score1;
        localMatch.score2 = score2;
        localMatch.winner = winner;

        const recalculated = recalculateTournamentState(draft);
        shouldPromptLock =
          !recalculated.rounds[roundId].locked &&
          recalculated.rounds[roundId].matches.every(
            (match) =>
              Boolean(match.player1) &&
              Boolean(match.player2) &&
              match.score1 !== null &&
              match.score2 !== null &&
              Boolean(match.winner),
          );
        return { ...prev, [tournamentId]: recalculated };
      });

      await updateMatch(targetMatch.recordId, {
        score1,
        score2,
        winner,
      });

      return {
        shouldPromptLock,
        roundTitle: existing.rounds[roundId].title,
      };
    },
    [stateMap],
  );

  const lockRound = useCallback(
    async (tournamentId: string, roundId: RoundId) => {
      setStateMap((prev) => {
        const current = prev[tournamentId];
        if (!current) {
          return prev;
        }

        return {
          ...prev,
          [tournamentId]: {
            ...current,
            rounds: {
              ...current.rounds,
              [roundId]: {
                ...current.rounds[roundId],
                locked: true,
              },
            },
          },
        };
      });

      await updateRoundLock(tournamentId, roundId, true);
    },
    [],
  );

  const value = useMemo(
    () => ({
      initializeTournament,
      refreshTournament,
      getTournamentState,
      getTournamentMetaById,
      updateMatchScore,
      lockRound,
    }),
    [
      initializeTournament,
      refreshTournament,
      getTournamentMetaById,
      getTournamentState,
      lockRound,
      updateMatchScore,
    ],
  );

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournamentContext() {
  const context = useContext(TournamentContext);
  if (!context) {
    throw new Error(
      "useTournamentContext must be used within TournamentProvider",
    );
  }
  return context;
}
