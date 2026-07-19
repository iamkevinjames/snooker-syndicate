import { GroupKey, MatchState, RoundId, TournamentState } from "./types";

type FeedTarget = {
  nextRoundId: RoundId;
  nextMatchId: string;
  slot: "player1" | "player2";
  source: "winner" | "loser";
};

const knockoutFeeds: Record<RoundId, Record<string, FeedTarget[]>> = {
  "round-1": {},
  "round-2": {},
  "round-3": {
    "r3-1": [
      {
        nextRoundId: "round-4",
        nextMatchId: "r4-1",
        slot: "player1",
        source: "winner",
      },
    ],
    "r3-8": [
      {
        nextRoundId: "round-4",
        nextMatchId: "r4-1",
        slot: "player2",
        source: "winner",
      },
    ],
    "r3-2": [
      {
        nextRoundId: "round-4",
        nextMatchId: "r4-2",
        slot: "player1",
        source: "winner",
      },
    ],
    "r3-7": [
      {
        nextRoundId: "round-4",
        nextMatchId: "r4-2",
        slot: "player2",
        source: "winner",
      },
    ],
    "r3-3": [
      {
        nextRoundId: "round-4",
        nextMatchId: "r4-3",
        slot: "player1",
        source: "winner",
      },
    ],
    "r3-6": [
      {
        nextRoundId: "round-4",
        nextMatchId: "r4-3",
        slot: "player2",
        source: "winner",
      },
    ],
    "r3-4": [
      {
        nextRoundId: "round-4",
        nextMatchId: "r4-4",
        slot: "player1",
        source: "winner",
      },
    ],
    "r3-5": [
      {
        nextRoundId: "round-4",
        nextMatchId: "r4-4",
        slot: "player2",
        source: "winner",
      },
    ],
  },
  "round-4": {
    "r4-1": [
      {
        nextRoundId: "round-5",
        nextMatchId: "r5-1",
        slot: "player1",
        source: "winner",
      },
    ],
    "r4-2": [
      {
        nextRoundId: "round-5",
        nextMatchId: "r5-1",
        slot: "player2",
        source: "winner",
      },
    ],
    "r4-3": [
      {
        nextRoundId: "round-5",
        nextMatchId: "r5-2",
        slot: "player1",
        source: "winner",
      },
    ],
    "r4-4": [
      {
        nextRoundId: "round-5",
        nextMatchId: "r5-2",
        slot: "player2",
        source: "winner",
      },
    ],
  },
  "round-5": {
    "r5-1": [
      {
        nextRoundId: "round-6",
        nextMatchId: "r6-1",
        slot: "player1",
        source: "winner",
      },
      {
        nextRoundId: "round-7",
        nextMatchId: "r7-1",
        slot: "player1",
        source: "loser",
      },
    ],
    "r5-2": [
      {
        nextRoundId: "round-6",
        nextMatchId: "r6-1",
        slot: "player2",
        source: "winner",
      },
      {
        nextRoundId: "round-7",
        nextMatchId: "r7-1",
        slot: "player2",
        source: "loser",
      },
    ],
  },
  "round-6": {},
  "round-7": {},
};

export interface StandingRow {
  playerName: string;
  gamesWon: number;
  totalScore: number;
  eliminated: boolean;
}

type StandingsMap = Record<GroupKey, StandingRow[]>;

const placeholderStandings: StandingRow[] = [
  {
    playerName: "TBD",
    gamesWon: 0,
    totalScore: 0,
    eliminated: false,
  },
];

export function computeWinner(match: MatchState): string {
  if (
    match.score1 === null ||
    match.score2 === null ||
    !match.player1 ||
    !match.player2
  ) {
    return "";
  }

  if (match.score1 > match.score2) {
    return match.player1;
  }

  if (match.score2 > match.score1) {
    return match.player2;
  }

  return "";
}

function computeLoser(match: MatchState): string {
  const winner = computeWinner(match);

  if (!winner) {
    return "";
  }

  return winner === match.player1 ? match.player2 : match.player1;
}

export function isRoundComplete(
  state: TournamentState,
  roundId: RoundId,
): boolean {
  const matches = state.rounds[roundId].matches;

  if (matches.length === 0) {
    return false;
  }

  return matches.every(
    (match) =>
      Boolean(match.player1) &&
      Boolean(match.player2) &&
      match.score1 !== null &&
      match.score2 !== null &&
      Boolean(match.winner),
  );
}

export interface TournamentPlacement {
  place: 1 | 2 | 3 | 4;
  playerName: string;
}

export function getTournamentPlacements(
  state: TournamentState,
): TournamentPlacement[] | null {
  if (
    !isRoundComplete(state, "round-6") ||
    !isRoundComplete(state, "round-7")
  ) {
    return null;
  }

  const finalMatch = state.rounds["round-6"].matches[0];
  const thirdPlaceMatch = state.rounds["round-7"].matches[0];

  if (!finalMatch || !thirdPlaceMatch) {
    return null;
  }

  const champion = computeWinner(finalMatch);
  const runnerUp = computeLoser(finalMatch);
  const third = computeWinner(thirdPlaceMatch);
  const fourth = computeLoser(thirdPlaceMatch);

  if (!champion || !runnerUp || !third || !fourth) {
    return null;
  }

  return [
    { place: 1, playerName: champion },
    { place: 2, playerName: runnerUp },
    { place: 3, playerName: third },
    { place: 4, playerName: fourth },
  ];
}

export function getTournamentChampion(state: TournamentState): string {
  return getTournamentPlacements(state)?.[0]?.playerName ?? "";
}

function getGroupFromPlayer(
  groups: Record<GroupKey, string[]>,
  player: string,
): GroupKey | null {
  const entries = Object.entries(groups) as Array<[GroupKey, string[]]>;
  const found = entries.find(([, names]) => names.includes(player));
  return found ? found[0] : null;
}

function scoreToNumber(value: number | null): number {
  return value === null ? 0 : value;
}

function buildStandingsForPlayers(
  matches: MatchState[],
  players: string[],
  eliminatedCount: number,
): StandingRow[] {
  const scoreMap = new Map<string, StandingRow>();
  players.forEach((player) => {
    scoreMap.set(player, {
      playerName: player,
      gamesWon: 0,
      totalScore: 0,
      eliminated: false,
    });
  });

  matches.forEach((match) => {
    const left = scoreToNumber(match.score1);
    const right = scoreToNumber(match.score2);
    const p1 = scoreMap.get(match.player1);
    const p2 = scoreMap.get(match.player2);

    if (!p1 && !p2) {
      return;
    }

    if (p1) {
      p1.totalScore += left;
    }
    if (p2) {
      p2.totalScore += right;
    }

    if (match.score1 !== null && match.score2 !== null) {
      if (left > right) {
        if (p1) {
          p1.gamesWon += 1;
        }
      } else if (right > left) {
        if (p2) {
          p2.gamesWon += 1;
        }
      }
    }
  });

  const ranked = Array.from(scoreMap.values()).sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }

    if (b.gamesWon !== a.gamesWon) {
      return b.gamesWon - a.gamesWon;
    }

    return a.playerName.localeCompare(b.playerName);
  });

  ranked.forEach((row, index) => {
    row.eliminated = index >= ranked.length - eliminatedCount;
  });

  return ranked;
}

function getRound1MatchesForGroup(
  state: TournamentState,
  group: GroupKey,
): MatchState[] {
  return state.rounds["round-1"].matches.filter((match) => {
    const g1 = getGroupFromPlayer(state.groups, match.player1);
    const g2 = getGroupFromPlayer(state.groups, match.player2);
    return g1 === group && g2 === group;
  });
}

export function getRound1Standings(state: TournamentState): StandingsMap {
  return {
    A: buildStandingsForPlayers(
      getRound1MatchesForGroup(state, "A"),
      state.groups.A,
      1,
    ),
    B: buildStandingsForPlayers(
      getRound1MatchesForGroup(state, "B"),
      state.groups.B,
      1,
    ),
    C: buildStandingsForPlayers(
      getRound1MatchesForGroup(state, "C"),
      state.groups.C,
      1,
    ),
    D: buildStandingsForPlayers(
      getRound1MatchesForGroup(state, "D"),
      state.groups.D,
      1,
    ),
  };
}

export function isRound1GroupComplete(
  state: TournamentState,
  group: GroupKey,
): boolean {
  const matches = getRound1MatchesForGroup(state, group);
  if (matches.length === 0) {
    return false;
  }

  return matches.every(
    (match) =>
      match.score1 !== null && match.score2 !== null && Boolean(match.winner),
  );
}

function getRound2GroupMatches(
  state: TournamentState,
  group: GroupKey,
): MatchState[] {
  const opponentByGroup: Record<GroupKey, GroupKey> = {
    A: "B",
    B: "A",
    C: "D",
    D: "C",
  };

  const opponent = opponentByGroup[group];
  return state.rounds["round-2"].matches.filter((match) => {
    if (!match.player1 || !match.player2) {
      return false;
    }

    const g1 = getGroupFromPlayer(state.groups, match.player1);
    const g2 = getGroupFromPlayer(state.groups, match.player2);

    return (
      (g1 === group && g2 === opponent) || (g1 === opponent && g2 === group)
    );
  });
}

export function isRound2GroupComplete(
  state: TournamentState,
  group: GroupKey,
): boolean {
  if (!isRoundComplete(state, "round-1")) {
    return false;
  }

  const matches = getRound2GroupMatches(state, group);
  if (matches.length === 0) {
    return false;
  }

  return matches.every(
    (match) =>
      match.score1 !== null && match.score2 !== null && Boolean(match.winner),
  );
}

function buildRound2Matches(
  playersA: string[],
  playersB: string[],
  prefix: "ab" | "cd",
  previousMatches: MatchState[],
): MatchState[] {
  const previousById = new Map(
    previousMatches.map((match) => [match.id, match]),
  );
  const previousMap = new Map(
    previousMatches.map((match) => [
      `${match.player1}::${match.player2}`,
      match,
    ]),
  );

  const matches: MatchState[] = [];
  let gameCounter = 1;

  for (let round = 0; round < playersA.length; round += 1) {
    for (let slot = 0; slot < playersA.length; slot += 1) {
      const playerA = playersA[slot];
      const playerB = playersB[(slot + round) % playersB.length];
      const id = `r2-${prefix}-${gameCounter}`;
      const existing =
        previousMap.get(`${playerA}::${playerB}`) ?? previousById.get(id);
      const score1 = existing?.score1 ?? null;
      const score2 = existing?.score2 ?? null;

      matches.push({
        id,
        recordId: existing?.recordId ?? -1,
        gameNumber: existing?.gameNumber ?? gameCounter,
        player1: playerA,
        player2: playerB,
        score1,
        score2,
        winner:
          score1 !== null && score2 !== null
            ? score1 > score2
              ? playerA
              : score2 > score1
                ? playerB
                : ""
            : "",
      });
      gameCounter += 1;
    }
  }

  return matches;
}

function interleaveMatches(primary: MatchState[], secondary: MatchState[]) {
  const maxLength = Math.max(primary.length, secondary.length);
  const ordered: MatchState[] = [];

  for (let index = 0; index < maxLength; index += 1) {
    if (primary[index]) {
      ordered.push(primary[index]);
    }

    if (secondary[index]) {
      ordered.push(secondary[index]);
    }
  }

  return ordered;
}

function buildRound2Standings(
  state: TournamentState,
  survivors: Record<GroupKey, string[]>,
): StandingsMap {
  const round2Matches = state.rounds["round-2"].matches;

  const aMatches = round2Matches.filter(
    (match) =>
      survivors.A.includes(match.player1) &&
      survivors.B.includes(match.player2),
  );
  const cMatches = round2Matches.filter(
    (match) =>
      survivors.C.includes(match.player1) &&
      survivors.D.includes(match.player2),
  );

  return {
    A: buildStandingsForPlayers(aMatches, survivors.A, 2),
    B: buildStandingsForPlayers(
      aMatches.map((match) => ({
        ...match,
        player1: match.player2,
        player2: match.player1,
        score1: match.score2,
        score2: match.score1,
      })),
      survivors.B,
      2,
    ),
    C: buildStandingsForPlayers(cMatches, survivors.C, 2),
    D: buildStandingsForPlayers(
      cMatches.map((match) => ({
        ...match,
        player1: match.player2,
        player2: match.player1,
        score1: match.score2,
        score2: match.score1,
      })),
      survivors.D,
      2,
    ),
  };
}

export function getRound2Standings(state: TournamentState): StandingsMap {
  if (!isRoundComplete(state, "round-1")) {
    return {
      A: placeholderStandings,
      B: placeholderStandings,
      C: placeholderStandings,
      D: placeholderStandings,
    };
  }

  const round1Standings = getRound1Standings(state);
  const survivors: Record<GroupKey, string[]> = {
    A: round1Standings.A.filter((row) => !row.eliminated).map(
      (row) => row.playerName,
    ),
    B: round1Standings.B.filter((row) => !row.eliminated).map(
      (row) => row.playerName,
    ),
    C: round1Standings.C.filter((row) => !row.eliminated).map(
      (row) => row.playerName,
    ),
    D: round1Standings.D.filter((row) => !row.eliminated).map(
      (row) => row.playerName,
    ),
  };

  return buildRound2Standings(state, survivors);
}

function applyRound2Seeding(state: TournamentState): TournamentState {
  const next = structuredClone(state);

  if (!isRoundComplete(next, "round-1")) {
    next.rounds["round-2"].matches = next.rounds["round-2"].matches.map(
      (match) => ({
        ...match,
        player1: "",
        player2: "",
        score1: null,
        score2: null,
        winner: "",
      }),
    );

    ["round-3", "round-4", "round-5", "round-6", "round-7"].forEach(
      (roundId) => {
        next.rounds[roundId as RoundId].matches = next.rounds[
          roundId as RoundId
        ].matches.map((match) => ({
          ...match,
          player1: "",
          player2: "",
          score1: null,
          score2: null,
          winner: "",
        }));
      },
    );

    return next;
  }

  const round1Standings = getRound1Standings(next);

  const survivors: Record<GroupKey, string[]> = {
    A: round1Standings.A.filter((row) => !row.eliminated).map(
      (row) => row.playerName,
    ),
    B: round1Standings.B.filter((row) => !row.eliminated).map(
      (row) => row.playerName,
    ),
    C: round1Standings.C.filter((row) => !row.eliminated).map(
      (row) => row.playerName,
    ),
    D: round1Standings.D.filter((row) => !row.eliminated).map(
      (row) => row.playerName,
    ),
  };

  const previousRound2 = next.rounds["round-2"].matches;
  const round2AB = buildRound2Matches(
    survivors.A,
    survivors.B,
    "ab",
    previousRound2,
  );
  const round2CD = buildRound2Matches(
    survivors.C,
    survivors.D,
    "cd",
    previousRound2,
  );
  next.rounds["round-2"].matches = interleaveMatches(round2AB, round2CD).map(
    (match) => ({
      ...match,
      winner: computeWinner(match),
    }),
  );

  if (!isRoundComplete(next, "round-2")) {
    ["round-3", "round-4", "round-5", "round-6", "round-7"].forEach(
      (roundId) => {
        next.rounds[roundId as RoundId].matches = next.rounds[
          roundId as RoundId
        ].matches.map((match) => ({
          ...match,
          player1: "",
          player2: "",
          score1: null,
          score2: null,
          winner: "",
        }));
      },
    );

    return next;
  }

  const round2Standings = buildRound2Standings(next, survivors);
  const seeded: Record<GroupKey, string[]> = {
    A: round2Standings.A.slice(0, 4).map((row) => row.playerName),
    B: round2Standings.B.slice(0, 4).map((row) => row.playerName),
    C: round2Standings.C.slice(0, 4).map((row) => row.playerName),
    D: round2Standings.D.slice(0, 4).map((row) => row.playerName),
  };

  const round3 = next.rounds["round-3"].matches.map((match) => {
    const previous = next.rounds["round-3"].matches.find(
      (item) => item.id === match.id,
    );
    const withPlayers = (player1: string, player2: string) => {
      const samePlayers =
        previous?.player1 === player1 && previous?.player2 === player2;

      return {
        ...match,
        player1,
        player2,
        score1: samePlayers ? (previous?.score1 ?? null) : null,
        score2: samePlayers ? (previous?.score2 ?? null) : null,
        winner: "",
      };
    };

    switch (match.id) {
      case "r3-1":
        return withPlayers(seeded.A[0] ?? "", seeded.B[3] ?? "");
      case "r3-2":
        return withPlayers(seeded.A[1] ?? "", seeded.B[2] ?? "");
      case "r3-3":
        return withPlayers(seeded.A[2] ?? "", seeded.B[1] ?? "");
      case "r3-4":
        return withPlayers(seeded.A[3] ?? "", seeded.B[0] ?? "");
      case "r3-5":
        return withPlayers(seeded.C[0] ?? "", seeded.D[3] ?? "");
      case "r3-6":
        return withPlayers(seeded.C[1] ?? "", seeded.D[2] ?? "");
      case "r3-7":
        return withPlayers(seeded.C[2] ?? "", seeded.D[1] ?? "");
      case "r3-8":
        return withPlayers(seeded.C[3] ?? "", seeded.D[0] ?? "");
      default:
        return match;
    }
  });

  next.rounds["round-3"].matches = round3;

  return next;
}

function propagateFromRound(
  state: TournamentState,
  fromRoundId: RoundId,
): TournamentState {
  const next = structuredClone(state);
  const feedMap = knockoutFeeds[fromRoundId];

  next.rounds[fromRoundId].matches.forEach((match) => {
    const targets = feedMap[match.id] ?? [];

    if (targets.length === 0) {
      return;
    }

    targets.forEach((target) => {
      const participant =
        target.source === "winner" ? computeWinner(match) : computeLoser(match);
      const targetRound = next.rounds[target.nextRoundId];
      const targetMatch = targetRound.matches.find(
        (item) => item.id === target.nextMatchId,
      );

      if (!targetMatch) {
        return;
      }

      if (targetMatch[target.slot] !== participant) {
        targetMatch.score1 = null;
        targetMatch.score2 = null;
        targetMatch.winner = "";
      }

      targetMatch[target.slot] = participant;
      if (!participant) {
        targetMatch.score1 = null;
        targetMatch.score2 = null;
        targetMatch.winner = "";
      }
    });
  });

  return next;
}

export function recalculateTournamentState(
  state: TournamentState,
): TournamentState {
  const nextRound1 = state.rounds["round-1"].matches.map((match) => ({
    ...match,
    winner: computeWinner(match),
  }));

  let nextState = {
    ...state,
    rounds: {
      ...state.rounds,
      "round-1": {
        ...state.rounds["round-1"],
        matches: nextRound1,
      },
    },
  };

  let next = applyRound2Seeding(nextState);

  next.rounds["round-3"].matches = next.rounds["round-3"].matches.map(
    (match) => ({
      ...match,
      winner: computeWinner(match),
    }),
  );

  next = propagateFromRound(next, "round-3");

  next.rounds["round-4"].matches = next.rounds["round-4"].matches.map(
    (match) => ({
      ...match,
      winner: computeWinner(match),
    }),
  );

  next = propagateFromRound(next, "round-4");

  next.rounds["round-5"].matches = next.rounds["round-5"].matches.map(
    (match) => ({
      ...match,
      winner: computeWinner(match),
    }),
  );

  next = propagateFromRound(next, "round-5");

  next.rounds["round-6"].matches = next.rounds["round-6"].matches.map(
    (match) => ({
      ...match,
      winner: computeWinner(match),
    }),
  );

  next.rounds["round-7"].matches = next.rounds["round-7"].matches.map(
    (match) => ({
      ...match,
      winner: computeWinner(match),
    }),
  );

  return next;
}
