import { GroupKey, MatchState, RoundId, TournamentMeta } from "./types";

const API_BASE_URL = "http://localhost:3001";

interface ApiTournament {
  id: string;
  name: string;
  type: "Singles" | "Doubles";
  date: string;
}

interface ApiGroup {
  id: string;
  tournamentId: string;
  key: GroupKey;
  members: string[];
}

interface ApiMatch {
  id: number;
  tournamentId: string;
  roundId: RoundId;
  matchCode: string;
  order: number;
  gameNumber?: number;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  winner: string;
}

interface ApiRoundLock {
  id: number | string;
  tournamentId: string;
  roundId: RoundId;
  locked: boolean;
}

export interface MatchQueryResult {
  recordId: number;
  tournamentId: string;
  roundId: RoundId;
  matchCode: string;
  order: number;
  gameNumber: number;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  winner: string;
}

export interface ApiTournamentPayload {
  meta: TournamentMeta;
  groups: Record<GroupKey, string[]>;
  rounds: Record<RoundId, MatchState[]>;
  roundLocks: Record<RoundId, boolean>;
}

type MatchPatch = Partial<
  Pick<MatchState, "player1" | "player2" | "score1" | "score2" | "winner">
>;

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

function toRoundBuckets(matches: ApiMatch[]): Record<RoundId, MatchState[]> {
  const buckets: Record<RoundId, MatchState[]> = {
    "round-1": [],
    "round-2": [],
    "round-3": [],
    "round-4": [],
    "round-5": [],
    "round-6": [],
    "round-7": [],
  };

  matches
    .sort((a, b) => a.order - b.order)
    .forEach((match) => {
      buckets[match.roundId].push({
        id: match.matchCode,
        recordId: match.id,
        gameNumber: match.gameNumber ?? match.order,
        player1: match.player1,
        player2: match.player2,
        score1: match.score1,
        score2: match.score2,
        winner: match.winner,
      });
    });

  return buckets;
}

function toRoundLockMap(roundLocks: ApiRoundLock[]): Record<RoundId, boolean> {
  const defaults: Record<RoundId, boolean> = {
    "round-1": false,
    "round-2": false,
    "round-3": false,
    "round-4": false,
    "round-5": false,
    "round-6": false,
    "round-7": false,
  };

  roundLocks.forEach((roundLock) => {
    defaults[roundLock.roundId] = roundLock.locked;
  });

  return defaults;
}

export async function getTournamentPayload(
  tournamentId: string,
): Promise<ApiTournamentPayload | null> {
  const [tournaments, groups, matches, roundLocks] = await Promise.all([
    fetchJson<ApiTournament[]>(`/tournaments?id=${tournamentId}`),
    fetchJson<ApiGroup[]>(`/groups?tournamentId=${tournamentId}`),
    fetchJson<ApiMatch[]>(`/matches?tournamentId=${tournamentId}`),
    fetchJson<ApiRoundLock[]>(`/roundLocks?tournamentId=${tournamentId}`),
  ]);

  const tournament = tournaments[0];
  if (!tournament) {
    return null;
  }

  const groupMap: Record<GroupKey, string[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };

  groups.forEach((group) => {
    groupMap[group.key] = group.members;
  });

  const members = [...groupMap.A, ...groupMap.B, ...groupMap.C, ...groupMap.D];

  return {
    meta: {
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      date: tournament.date,
      members,
    },
    groups: groupMap,
    rounds: toRoundBuckets(matches),
    roundLocks: toRoundLockMap(roundLocks),
  };
}

export async function getMatches(
  tournamentId: string,
  roundId?: RoundId,
): Promise<MatchQueryResult[]> {
  const path = roundId
    ? `/matches?tournamentId=${tournamentId}&roundId=${roundId}`
    : `/matches?tournamentId=${tournamentId}`;

  const matches = await fetchJson<ApiMatch[]>(path);

  return matches
    .sort((a, b) => a.order - b.order)
    .map((match) => ({
      recordId: match.id,
      tournamentId: match.tournamentId,
      roundId: match.roundId,
      matchCode: match.matchCode,
      order: match.order,
      gameNumber: match.gameNumber ?? match.order,
      player1: match.player1,
      player2: match.player2,
      score1: match.score1,
      score2: match.score2,
      winner: match.winner,
    }));
}

export async function updateMatch(
  recordId: number,
  patch: MatchPatch,
): Promise<void> {
  await fetchJson<ApiMatch>(`/matches/${recordId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function updateManyMatches(
  updates: Array<{
    recordId: number;
    patch: MatchPatch;
  }>,
): Promise<void> {
  await Promise.all(
    updates.map((update) => updateMatch(update.recordId, update.patch)),
  );
}

export async function updateRoundLock(
  tournamentId: string,
  roundId: RoundId,
  locked: boolean,
): Promise<void> {
  const roundLocks = await fetchJson<ApiRoundLock[]>(
    `/roundLocks?tournamentId=${tournamentId}&roundId=${roundId}`,
  );
  const roundLock = roundLocks[0];

  if (!roundLock) {
    return;
  }

  await fetchJson<ApiRoundLock>(`/roundLocks/${roundLock.id}`, {
    method: "PATCH",
    body: JSON.stringify({ locked }),
  });
}

function randomLeaguePoints(): number {
  return Math.floor(Math.random() * 8) + 2;
}

function randomKnockoutPoints(): number {
  return Math.floor(Math.random() * 3) + 1;
}

function toReadyMatches(matches: MatchQueryResult[]): MatchQueryResult[] {
  return matches.filter((match) => match.player1 && match.player2);
}

export async function randomizeLeagueRound(
  tournamentId: string,
  roundId: RoundId,
): Promise<void> {
  const matches = toReadyMatches(await getMatches(tournamentId, roundId));
  const updates = matches.map((match) => {
    const winnerIsPlayer1 = Math.random() >= 0.5;
    const points = randomLeaguePoints();

    return {
      recordId: match.recordId,
      patch: {
        score1: winnerIsPlayer1 ? points : 0,
        score2: winnerIsPlayer1 ? 0 : points,
        winner: winnerIsPlayer1 ? match.player1 : match.player2,
      },
    };
  });

  await updateManyMatches(updates);
}

export async function randomizeBestOfThreeRound(
  tournamentId: string,
  roundId: RoundId,
): Promise<void> {
  const matches = toReadyMatches(await getMatches(tournamentId, roundId));
  const updates = matches.map((match) => {
    let player1Wins = 0;
    let player2Wins = 0;
    let player1Points = 0;
    let player2Points = 0;

    while (player1Wins < 2 && player2Wins < 2) {
      const player1WonGame = Math.random() >= 0.5;
      const points = randomKnockoutPoints();

      if (player1WonGame) {
        player1Wins += 1;
        player1Points = Math.max(player1Points, points);
      } else {
        player2Wins += 1;
        player2Points = Math.max(player2Points, points);
      }
    }

    return {
      recordId: match.recordId,
      patch: {
        score1: player1Points,
        score2: player2Points,
        winner: player1Wins > player2Wins ? match.player1 : match.player2,
      },
    };
  });

  await updateManyMatches(updates);
}

export async function resetDatabase(): Promise<void> {
  const response = await fetch("/api/reset-db", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Reset failed: ${response.status}`);
  }
}
