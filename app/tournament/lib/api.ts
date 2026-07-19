import { supabase } from "@/lib/supabaseClient";
import { getTournamentPlacements } from "./bracket";
import {
  GroupKey,
  MatchState,
  RoundId,
  TournamentMeta,
  TournamentState,
} from "./types";

const ROUND_IDS: RoundId[] = [
  "round-1",
  "round-2",
  "round-3",
  "round-4",
  "round-5",
  "round-6",
  "round-7",
];

const roundIdToDbRound: Record<RoundId, string> = {
  "round-1": "round1",
  "round-2": "round2",
  "round-3": "knockout",
  "round-4": "qf",
  "round-5": "sf",
  "round-6": "final",
  "round-7": "third_place",
};

const dbRoundToRoundId: Record<string, RoundId> = {
  round1: "round-1",
  round2: "round-2",
  knockout: "round-3",
  qf: "round-4",
  sf: "round-5",
  final: "round-6",
  third_place: "round-7",
};

const knockoutRounds = new Set<RoundId>([
  "round-3",
  "round-4",
  "round-5",
  "round-6",
  "round-7",
]);

interface SupabaseTournamentRow {
  id: string;
  name: string;
  type: "Singles" | "Doubles";
  date: string;
  status?: string | null;
  locked_rounds?: Record<string, boolean> | null;
}

interface SupabaseGroupRow {
  id: string;
  tournament_id: string;
  name: string;
}

interface SupabasePlayerRow {
  id: string;
  tournament_id: string;
  group_id: string | null;
  name: string;
  group_letter: string | null;
}

interface SupabaseMatchRow {
  id: string;
  tournament_id: string;
  round: string;
  game_number: number;
  player1_id: string | null;
  player2_id: string | null;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  status: string;
  best_of: number;
  created_at: string;
}

interface SupabaseMatchGameRow {
  id: string;
  match_id: string;
  game_number: number;
  player1_score: number | null;
  player2_score: number | null;
  winner_id: string | null;
  created_at: string;
}

export interface TournamentListItem {
  id: string;
  name: string;
  type: "Singles" | "Doubles";
  date: string;
  status: "upcoming" | "ongoing" | "completed";
  winner: string;
}

export interface CreateTournamentInput {
  name: string;
  date: string;
  type: "Singles" | "Doubles";
  players: string[];
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

// Client-side auth checks are only UX; Supabase RLS must still enforce writes.
async function ensureAuthenticatedWrite(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    console.error("Unauthorized");
    return false;
  }

  return true;
}

function buildTournamentState(payload: ApiTournamentPayload): TournamentState {
  return {
    groups: payload.groups,
    rounds: {
      "round-1": {
        id: "round-1",
        title: "Round 1",
        mode: "league",
        locked: payload.roundLocks["round-1"],
        matches: payload.rounds["round-1"],
      },
      "round-2": {
        id: "round-2",
        title: "Round 2",
        mode: "league",
        locked: payload.roundLocks["round-2"],
        matches: payload.rounds["round-2"],
      },
      "round-3": {
        id: "round-3",
        title: "Round 3",
        mode: "knockout",
        locked: payload.roundLocks["round-3"],
        matches: payload.rounds["round-3"],
      },
      "round-4": {
        id: "round-4",
        title: "Quarterfinals",
        mode: "knockout",
        locked: payload.roundLocks["round-4"],
        matches: payload.rounds["round-4"],
      },
      "round-5": {
        id: "round-5",
        title: "Semifinals",
        mode: "knockout",
        locked: payload.roundLocks["round-5"],
        matches: payload.rounds["round-5"],
      },
      "round-6": {
        id: "round-6",
        title: "Final",
        mode: "knockout",
        locked: payload.roundLocks["round-6"],
        matches: payload.rounds["round-6"],
      },
      "round-7": {
        id: "round-7",
        title: "Third Place",
        mode: "knockout",
        locked: payload.roundLocks["round-7"],
        matches: payload.rounds["round-7"],
      },
    },
  };
}

async function maybeCompleteTournament(tournamentId: string): Promise<void> {
  if (!(await ensureAuthenticatedWrite())) {
    return;
  }

  const payload = await getTournamentPayload(tournamentId, false);
  if (!payload) {
    return;
  }

  if (!getTournamentPlacements(buildTournamentState(payload))) {
    return;
  }

  const { error } = await supabase
    .from("tournaments")
    .update({ status: "completed" })
    .eq("id", tournamentId);
  assertNoError(error);
}

const recordIdToMatchId = new Map<number, string>();
const matchIdToTournamentId = new Map<string, string>();
const tournamentPlayerNameToId = new Map<string, Map<string, string>>();
const tournamentPlayerIdToName = new Map<string, Map<string, string>>();
const tournamentPlayerIdToGroup = new Map<string, Map<string, GroupKey>>();

function assertNoError(error: { message: string } | null): void {
  if (error) {
    throw new Error(error.message);
  }
}

function normalizeGroupKey(value: string): GroupKey {
  const upper = value.trim().toUpperCase();
  if (upper === "A" || upper === "B" || upper === "C" || upper === "D") {
    return upper;
  }
  return "A";
}

function isRoundId(value: string): value is RoundId {
  return ROUND_IDS.includes(value as RoundId);
}

function normalizeDbRoundValue(value: string): string {
  const compact = value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");

  switch (compact) {
    case "round1":
    case "r1":
      return "round1";
    case "round2":
    case "r2":
      return "round2";
    case "round3":
    case "r3":
    case "knockout":
      return "knockout";
    case "round4":
    case "r4":
    case "qf":
    case "quarterfinal":
    case "quarterfinals":
      return "qf";
    case "round5":
    case "r5":
    case "sf":
    case "semifinal":
    case "semifinals":
      return "sf";
    case "round6":
    case "r6":
    case "final":
      return "final";
    case "round7":
    case "r7":
    case "third":
    case "thirdplace":
    case "thirdplacematch":
      return "third_place";
    default:
      return value.trim().toLowerCase();
  }
}

function toRoundIdFromDbRound(value: string): RoundId | null {
  const roundId = dbRoundToRoundId[normalizeDbRoundValue(value)];
  return isRoundId(roundId) ? roundId : null;
}

function defaultsRoundLocks(): Record<RoundId, boolean> {
  return {
    "round-1": false,
    "round-2": false,
    "round-3": false,
    "round-4": false,
    "round-5": false,
    "round-6": false,
    "round-7": false,
  };
}

function toRoundLocksMap(
  value: Record<string, boolean> | null | undefined,
): Record<RoundId, boolean> {
  const locks = defaultsRoundLocks();
  if (!value) {
    return locks;
  }

  ROUND_IDS.forEach((roundId) => {
    if (typeof value[roundId] === "boolean") {
      locks[roundId] = value[roundId];
    }
  });

  return locks;
}

function hashStringToRecordId(input: string): number {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return (hash % 900000000) + 1;
}

function toRecordId(matchId: string): number {
  const existing = Array.from(recordIdToMatchId.entries()).find(
    ([, value]) => value === matchId,
  );

  if (existing) {
    return existing[0];
  }

  let candidate = hashStringToRecordId(matchId);
  while (
    recordIdToMatchId.has(candidate) &&
    recordIdToMatchId.get(candidate) !== matchId
  ) {
    candidate += 1;
  }

  recordIdToMatchId.set(candidate, matchId);
  return candidate;
}

function clearTournamentCaches(tournamentId?: string): void {
  if (!tournamentId) {
    tournamentPlayerNameToId.clear();
    tournamentPlayerIdToName.clear();
    tournamentPlayerIdToGroup.clear();
    recordIdToMatchId.clear();
    matchIdToTournamentId.clear();
    return;
  }

  tournamentPlayerNameToId.delete(tournamentId);
  tournamentPlayerIdToName.delete(tournamentId);
  tournamentPlayerIdToGroup.delete(tournamentId);

  const matchIds = Array.from(matchIdToTournamentId.entries())
    .filter(([, tid]) => tid === tournamentId)
    .map(([matchId]) => matchId);

  matchIds.forEach((matchId) => {
    matchIdToTournamentId.delete(matchId);
    const recordEntry = Array.from(recordIdToMatchId.entries()).find(
      ([, mappedMatchId]) => mappedMatchId === matchId,
    );
    if (recordEntry) {
      recordIdToMatchId.delete(recordEntry[0]);
    }
  });
}

function setTournamentPlayerCaches(
  tournamentId: string,
  groups: SupabaseGroupRow[],
  players: SupabasePlayerRow[],
): Record<GroupKey, string[]> {
  const groupNameById = new Map<string, GroupKey>();
  groups.forEach((group) => {
    groupNameById.set(group.id, normalizeGroupKey(group.name));
  });

  const nameToId = new Map<string, string>();
  const idToName = new Map<string, string>();
  const idToGroup = new Map<string, GroupKey>();

  const grouped: Record<GroupKey, string[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };

  players.forEach((player) => {
    nameToId.set(player.name, player.id);
    idToName.set(player.id, player.name);

    const groupLetter =
      player.group_letter ||
      (player.group_id ? groupNameById.get(player.group_id) : undefined);

    if (!groupLetter) {
      return;
    }

    const group = normalizeGroupKey(groupLetter);
    grouped[group].push(player.name);
    idToGroup.set(player.id, group);
  });

  tournamentPlayerNameToId.set(tournamentId, nameToId);
  tournamentPlayerIdToName.set(tournamentId, idToName);
  tournamentPlayerIdToGroup.set(tournamentId, idToGroup);

  return grouped;
}

async function ensureTournamentPlayerCaches(
  tournamentId: string,
): Promise<void> {
  if (tournamentPlayerNameToId.has(tournamentId)) {
    return;
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id,tournament_id,name")
    .eq("tournament_id", tournamentId);
  assertNoError(groupsError);

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,tournament_id,group_id,name,group_letter")
    .eq("tournament_id", tournamentId);
  assertNoError(playersError);

  setTournamentPlayerCaches(
    tournamentId,
    (groups ?? []) as SupabaseGroupRow[],
    (players ?? []) as SupabasePlayerRow[],
  );
}

function getMatchOrder(
  roundId: RoundId,
  gameNumber: number,
  player1Id: string | null,
  player2Id: string | null,
  playerIdToGroup: Map<string, GroupKey>,
): number {
  if (roundId === "round-2") {
    const g1 = player1Id ? playerIdToGroup.get(player1Id) : undefined;
    const g2 = player2Id ? playerIdToGroup.get(player2Id) : undefined;
    const isAB = [g1, g2].every((group) => group === "A" || group === "B");
    return isAB ? gameNumber * 2 - 1 : gameNumber * 2;
  }

  return gameNumber;
}

function buildMatchCode(
  roundId: RoundId,
  gameNumber: number,
  player1Id: string | null,
  player2Id: string | null,
  playerIdToGroup: Map<string, GroupKey>,
): string {
  if (roundId === "round-1") {
    const group =
      (player1Id ? playerIdToGroup.get(player1Id) : undefined) ||
      (player2Id ? playerIdToGroup.get(player2Id) : undefined) ||
      "A";
    return `r1-${group.toLowerCase()}-${gameNumber}`;
  }

  if (roundId === "round-2") {
    const g1 = player1Id ? playerIdToGroup.get(player1Id) : undefined;
    const g2 = player2Id ? playerIdToGroup.get(player2Id) : undefined;
    const isAB = [g1, g2].every((group) => group === "A" || group === "B");
    return `r2-${isAB ? "ab" : "cd"}-${gameNumber}`;
  }

  const roundNumber = roundId.replace("round-", "");
  return `r${roundNumber}-${gameNumber}`;
}

function getMatchesForRound(
  matches: SupabaseMatchRow[],
  roundId: RoundId,
): SupabaseMatchRow[] {
  return matches.filter(
    (match) => toRoundIdFromDbRound(match.round) === roundId,
  );
}

function isMatchCompleted(match: SupabaseMatchRow): boolean {
  return (
    match.status === "completed" &&
    Boolean(match.player1_id) &&
    Boolean(match.player2_id) &&
    match.player1_score !== null &&
    match.player2_score !== null &&
    Boolean(match.winner_id)
  );
}

function isRoundFullyCompleted(
  matches: SupabaseMatchRow[],
  roundId: RoundId,
): boolean {
  const rows = getMatchesForRound(matches, roundId);
  return rows.length > 0 && rows.every(isMatchCompleted);
}

function scoreToNumber(value: number | null): number {
  return value ?? 0;
}

function getPlayerGroupLetter(player: SupabasePlayerRow): GroupKey | null {
  if (!player.group_letter) {
    return null;
  }

  const key = normalizeGroupKey(player.group_letter);
  return key;
}

function isRound1FullyCompletedAcrossGroups(
  players: SupabasePlayerRow[],
  matches: SupabaseMatchRow[],
): boolean {
  const round1Matches = getMatchesForRound(matches, "round-1");
  if (round1Matches.length === 0 || !round1Matches.every(isMatchCompleted)) {
    return false;
  }

  const groupSizes: Record<GroupKey, number> = { A: 0, B: 0, C: 0, D: 0 };
  const playerGroupById = new Map<string, GroupKey>();

  players.forEach((player) => {
    const group = getPlayerGroupLetter(player);
    if (!group) {
      return;
    }

    groupSizes[group] += 1;
    playerGroupById.set(player.id, group);
  });

  const requiredGroups = (
    Object.entries(groupSizes) as Array<[GroupKey, number]>
  )
    .filter(([, count]) => count >= 2)
    .map(([group]) => group);

  if (requiredGroups.length === 0) {
    return false;
  }

  return requiredGroups.every((group) =>
    round1Matches.some((match) => {
      const g1 = match.player1_id
        ? playerGroupById.get(match.player1_id)
        : null;
      const g2 = match.player2_id
        ? playerGroupById.get(match.player2_id)
        : null;
      return g1 === group && g2 === group;
    }),
  );
}

function buildRound2Rows(
  tournamentId: string,
  players: SupabasePlayerRow[],
  round1Matches: SupabaseMatchRow[],
): Array<{
  tournament_id: string;
  round: string;
  game_number: number;
  player1_id: string;
  player2_id: string;
  player1_score: null;
  player2_score: null;
  winner_id: null;
  status: "pending";
  best_of: number;
}> {
  const playerNameById = new Map(
    players.map((player) => [player.id, player.name]),
  );
  const playerGroupById = new Map<string, GroupKey>();
  const playersByGroup: Record<GroupKey, string[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };

  players.forEach((player) => {
    const group = getPlayerGroupLetter(player);
    if (!group) {
      return;
    }

    playerGroupById.set(player.id, group);
    playersByGroup[group].push(player.id);
  });

  const statsByPlayer = new Map<
    string,
    { totalScore: number; gamesWon: number; playerName: string }
  >();
  players.forEach((player) => {
    statsByPlayer.set(player.id, {
      totalScore: 0,
      gamesWon: 0,
      playerName: player.name,
    });
  });

  round1Matches.forEach((match) => {
    if (!isMatchCompleted(match) || !match.player1_id || !match.player2_id) {
      return;
    }

    const g1 = playerGroupById.get(match.player1_id);
    const g2 = playerGroupById.get(match.player2_id);
    if (!g1 || !g2 || g1 !== g2) {
      return;
    }

    const p1 = statsByPlayer.get(match.player1_id);
    const p2 = statsByPlayer.get(match.player2_id);
    if (!p1 || !p2) {
      return;
    }

    const left = match.player1_score ?? 0;
    const right = match.player2_score ?? 0;

    p1.totalScore += left;
    p2.totalScore += right;

    if (left > right) {
      p1.gamesWon += 1;
    } else if (right > left) {
      p2.gamesWon += 1;
    }
  });

  const rankGroup = (group: GroupKey): string[] => {
    const ranked = playersByGroup[group]
      .map((playerId) => ({
        playerId,
        ...(statsByPlayer.get(playerId) ?? {
          totalScore: 0,
          gamesWon: 0,
          playerName: playerNameById.get(playerId) ?? "",
        }),
      }))
      .sort((left, right) => {
        if (right.totalScore !== left.totalScore) {
          return right.totalScore - left.totalScore;
        }
        if (right.gamesWon !== left.gamesWon) {
          return right.gamesWon - left.gamesWon;
        }
        return left.playerName.localeCompare(right.playerName);
      });

    const survivorsCount = Math.max(0, ranked.length - 1);
    return ranked.slice(0, survivorsCount).map((entry) => entry.playerId);
  };

  const survivors = {
    A: rankGroup("A"),
    B: rankGroup("B"),
    C: rankGroup("C"),
    D: rankGroup("D"),
  };

  const buildPairings = (
    left: string[],
    right: string[],
  ): Array<{ player1_id: string; player2_id: string; game_number: number }> => {
    if (left.length === 0 || right.length === 0) {
      return [];
    }

    const pairings: Array<{
      player1_id: string;
      player2_id: string;
      game_number: number;
    }> = [];

    let gameNumber = 1;
    for (let round = 0; round < left.length; round += 1) {
      for (let slot = 0; slot < left.length; slot += 1) {
        pairings.push({
          player1_id: left[slot],
          player2_id: right[(slot + round) % right.length],
          game_number: gameNumber,
        });
        gameNumber += 1;
      }
    }

    return pairings;
  };

  const interleavePairings = (
    first: Array<{
      player1_id: string;
      player2_id: string;
      game_number: number;
    }>,
    second: Array<{
      player1_id: string;
      player2_id: string;
      game_number: number;
    }>,
  ) => {
    const combined: Array<{
      player1_id: string;
      player2_id: string;
      game_number: number;
      isAB: boolean;
    }> = [];
    const maxLength = Math.max(first.length, second.length);

    for (let index = 0; index < maxLength; index += 1) {
      if (first[index]) {
        combined.push({ ...first[index], isAB: true });
      }
      if (second[index]) {
        combined.push({ ...second[index], isAB: false });
      }
    }

    return combined;
  };

  const round2AB = buildPairings(survivors.A, survivors.B);
  const round2CD = buildPairings(survivors.C, survivors.D);
  const interleaved = interleavePairings(round2AB, round2CD);

  return interleaved.map((pair) => ({
    tournament_id: tournamentId,
    round: "round2",
    game_number: pair.game_number,
    player1_id: pair.player1_id,
    player2_id: pair.player2_id,
    player1_score: null,
    player2_score: null,
    winner_id: null,
    status: "pending",
    best_of: 1,
  }));
}

function buildStatsByPlayerIds(
  matches: SupabaseMatchRow[],
  playerIds: string[],
  playerNameById: Map<string, string>,
): Array<{
  playerId: string;
  totalScore: number;
  gamesWon: number;
  playerName: string;
}> {
  const stats = new Map(
    playerIds.map((playerId) => [
      playerId,
      {
        playerId,
        totalScore: 0,
        gamesWon: 0,
        playerName: playerNameById.get(playerId) ?? "",
      },
    ]),
  );

  matches.forEach((match) => {
    if (!isMatchCompleted(match) || !match.player1_id || !match.player2_id) {
      return;
    }

    const left = stats.get(match.player1_id);
    const right = stats.get(match.player2_id);

    if (!left && !right) {
      return;
    }

    const score1 = scoreToNumber(match.player1_score);
    const score2 = scoreToNumber(match.player2_score);

    if (left) {
      left.totalScore += score1;
    }
    if (right) {
      right.totalScore += score2;
    }

    if (score1 > score2) {
      if (left) {
        left.gamesWon += 1;
      }
    } else if (score2 > score1) {
      if (right) {
        right.gamesWon += 1;
      }
    }
  });

  return Array.from(stats.values()).sort((left, right) => {
    if (right.totalScore !== left.totalScore) {
      return right.totalScore - left.totalScore;
    }

    if (right.gamesWon !== left.gamesWon) {
      return right.gamesWon - left.gamesWon;
    }

    return left.playerName.localeCompare(right.playerName);
  });
}

function buildRound1Survivors(
  players: SupabasePlayerRow[],
  round1Matches: SupabaseMatchRow[],
): Record<GroupKey, string[]> {
  const playerNameById = new Map(
    players.map((player) => [player.id, player.name]),
  );
  const playersByGroup: Record<GroupKey, string[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };

  players.forEach((player) => {
    const group = getPlayerGroupLetter(player);
    if (!group) {
      return;
    }

    playersByGroup[group].push(player.id);
  });

  const rankGroup = (group: GroupKey) => {
    const ranked = buildStatsByPlayerIds(
      round1Matches,
      playersByGroup[group],
      playerNameById,
    );
    return ranked
      .slice(0, Math.max(0, ranked.length - 1))
      .map((row) => row.playerId);
  };

  return {
    A: rankGroup("A"),
    B: rankGroup("B"),
    C: rankGroup("C"),
    D: rankGroup("D"),
  };
}

function mirrorMatchSides(match: SupabaseMatchRow): SupabaseMatchRow {
  return {
    ...match,
    player1_id: match.player2_id,
    player2_id: match.player1_id,
    player1_score: match.player2_score,
    player2_score: match.player1_score,
  };
}

function buildRound2Seeds(
  players: SupabasePlayerRow[],
  round1Matches: SupabaseMatchRow[],
  round2Matches: SupabaseMatchRow[],
): Record<GroupKey, string[]> {
  const playerNameById = new Map(
    players.map((player) => [player.id, player.name]),
  );
  const survivors = buildRound1Survivors(players, round1Matches);

  const round2ABMatches = round2Matches.filter(
    (match) =>
      Boolean(match.player1_id) &&
      Boolean(match.player2_id) &&
      survivors.A.includes(match.player1_id as string) &&
      survivors.B.includes(match.player2_id as string),
  );
  const round2CDMatches = round2Matches.filter(
    (match) =>
      Boolean(match.player1_id) &&
      Boolean(match.player2_id) &&
      survivors.C.includes(match.player1_id as string) &&
      survivors.D.includes(match.player2_id as string),
  );

  const rankA = buildStatsByPlayerIds(
    round2ABMatches,
    survivors.A,
    playerNameById,
  )
    .slice(0, 4)
    .map((row) => row.playerId);
  const rankB = buildStatsByPlayerIds(
    round2ABMatches.map(mirrorMatchSides),
    survivors.B,
    playerNameById,
  )
    .slice(0, 4)
    .map((row) => row.playerId);
  const rankC = buildStatsByPlayerIds(
    round2CDMatches,
    survivors.C,
    playerNameById,
  )
    .slice(0, 4)
    .map((row) => row.playerId);
  const rankD = buildStatsByPlayerIds(
    round2CDMatches.map(mirrorMatchSides),
    survivors.D,
    playerNameById,
  )
    .slice(0, 4)
    .map((row) => row.playerId);

  return {
    A: rankA,
    B: rankB,
    C: rankC,
    D: rankD,
  };
}

type InsertableMatchRow = {
  tournament_id: string;
  round: string;
  game_number: number;
  player1_id: string;
  player2_id: string;
  player1_score: null;
  player2_score: null;
  winner_id: null;
  status: "pending";
  best_of: number;
};

function createPendingMatch(
  tournamentId: string,
  round: string,
  gameNumber: number,
  player1Id: string,
  player2Id: string,
): InsertableMatchRow {
  return {
    tournament_id: tournamentId,
    round,
    game_number: gameNumber,
    player1_id: player1Id,
    player2_id: player2Id,
    player1_score: null,
    player2_score: null,
    winner_id: null,
    status: "pending",
    best_of: round === "round2" ? 1 : 3,
  };
}

function buildRound3Rows(
  tournamentId: string,
  players: SupabasePlayerRow[],
  round1Matches: SupabaseMatchRow[],
  round2Matches: SupabaseMatchRow[],
): InsertableMatchRow[] {
  const seeds = buildRound2Seeds(players, round1Matches, round2Matches);

  return [
    createPendingMatch(
      tournamentId,
      "knockout",
      1,
      seeds.A[0] ?? "",
      seeds.B[3] ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "knockout",
      2,
      seeds.A[1] ?? "",
      seeds.B[2] ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "knockout",
      3,
      seeds.A[2] ?? "",
      seeds.B[1] ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "knockout",
      4,
      seeds.A[3] ?? "",
      seeds.B[0] ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "knockout",
      5,
      seeds.C[0] ?? "",
      seeds.D[3] ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "knockout",
      6,
      seeds.C[1] ?? "",
      seeds.D[2] ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "knockout",
      7,
      seeds.C[2] ?? "",
      seeds.D[1] ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "knockout",
      8,
      seeds.C[3] ?? "",
      seeds.D[0] ?? "",
    ),
  ].filter((match) => match.player1_id && match.player2_id);
}

function buildRound4Rows(
  tournamentId: string,
  round3Matches: SupabaseMatchRow[],
): InsertableMatchRow[] {
  const winnerByGameNumber = new Map<number, string>();
  round3Matches.forEach((match) => {
    if (isMatchCompleted(match) && match.winner_id) {
      winnerByGameNumber.set(match.game_number, match.winner_id);
    }
  });

  return [
    createPendingMatch(
      tournamentId,
      "qf",
      1,
      winnerByGameNumber.get(1) ?? "",
      winnerByGameNumber.get(8) ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "qf",
      2,
      winnerByGameNumber.get(2) ?? "",
      winnerByGameNumber.get(7) ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "qf",
      3,
      winnerByGameNumber.get(3) ?? "",
      winnerByGameNumber.get(6) ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "qf",
      4,
      winnerByGameNumber.get(4) ?? "",
      winnerByGameNumber.get(5) ?? "",
    ),
  ].filter((match) => match.player1_id && match.player2_id);
}

function buildRound5Rows(
  tournamentId: string,
  round4Matches: SupabaseMatchRow[],
): InsertableMatchRow[] {
  const winnerByGameNumber = new Map<number, string>();
  round4Matches.forEach((match) => {
    if (isMatchCompleted(match) && match.winner_id) {
      winnerByGameNumber.set(match.game_number, match.winner_id);
    }
  });

  return [
    createPendingMatch(
      tournamentId,
      "sf",
      1,
      winnerByGameNumber.get(1) ?? "",
      winnerByGameNumber.get(2) ?? "",
    ),
    createPendingMatch(
      tournamentId,
      "sf",
      2,
      winnerByGameNumber.get(3) ?? "",
      winnerByGameNumber.get(4) ?? "",
    ),
  ].filter((match) => match.player1_id && match.player2_id);
}

function buildRound6And7Rows(
  tournamentId: string,
  round5Matches: SupabaseMatchRow[],
): { finalRows: InsertableMatchRow[]; thirdPlaceRows: InsertableMatchRow[] } {
  const semifinalOne = round5Matches.find((match) => match.game_number === 1);
  const semifinalTwo = round5Matches.find((match) => match.game_number === 2);

  const semifinalOneWinner = semifinalOne?.winner_id ?? "";
  const semifinalTwoWinner = semifinalTwo?.winner_id ?? "";
  const semifinalOneLoser =
    semifinalOne && isMatchCompleted(semifinalOne)
      ? semifinalOne.winner_id === semifinalOne.player1_id
        ? (semifinalOne.player2_id ?? "")
        : (semifinalOne.player1_id ?? "")
      : "";
  const semifinalTwoLoser =
    semifinalTwo && isMatchCompleted(semifinalTwo)
      ? semifinalTwo.winner_id === semifinalTwo.player1_id
        ? (semifinalTwo.player2_id ?? "")
        : (semifinalTwo.player1_id ?? "")
      : "";

  return {
    finalRows:
      semifinalOneWinner && semifinalTwoWinner
        ? [
            createPendingMatch(
              tournamentId,
              "final",
              1,
              semifinalOneWinner,
              semifinalTwoWinner,
            ),
          ]
        : [],
    thirdPlaceRows:
      semifinalOneLoser && semifinalTwoLoser
        ? [
            createPendingMatch(
              tournamentId,
              "third_place",
              1,
              semifinalOneLoser,
              semifinalTwoLoser,
            ),
          ]
        : [],
  };
}

async function fetchTournamentRowsForGeneration(tournamentId: string): Promise<{
  players: SupabasePlayerRow[];
  matches: SupabaseMatchRow[];
}> {
  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,tournament_id,group_id,name,group_letter")
    .eq("tournament_id", tournamentId);
  assertNoError(playersError);

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id,tournament_id,round,game_number,player1_id,player2_id,player1_score,player2_score,winner_id,status,best_of,created_at",
    )
    .eq("tournament_id", tournamentId);
  assertNoError(matchesError);

  return {
    players: (players ?? []) as SupabasePlayerRow[],
    matches: (matches ?? []) as SupabaseMatchRow[],
  };
}

async function insertMatchRowsIfMissing(
  tournamentId: string,
  roundId: RoundId,
  rows: InsertableMatchRow[],
): Promise<void> {
  if (rows.length === 0) {
    return;
  }

  const { data: existingRows, error: existingRowsError } = await supabase
    .from("matches")
    .select("player1_id,player2_id,game_number")
    .eq("tournament_id", tournamentId)
    .eq("round", roundIdToDbRound[roundId]);
  assertNoError(existingRowsError);

  const existingKeys = new Set(
    (existingRows ?? []).map(
      (row) =>
        `${row.game_number}:${row.player1_id ?? ""}:${row.player2_id ?? ""}`,
    ),
  );

  const missingRows = rows.filter(
    (row) =>
      !existingKeys.has(
        `${row.game_number}:${row.player1_id}:${row.player2_id}`,
      ),
  );

  if (missingRows.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("matches")
    .insert(missingRows);
  assertNoError(insertError);
}

async function ensureGeneratedRounds(
  tournamentId: string,
  allowWrites = false,
): Promise<void> {
  if (!allowWrites) {
    return;
  }

  if (!(await ensureAuthenticatedWrite())) {
    return;
  }

  let { players, matches } =
    await fetchTournamentRowsForGeneration(tournamentId);

  const round1Matches = getMatchesForRound(matches, "round-1");
  if (isRound1FullyCompletedAcrossGroups(players, matches)) {
    await insertMatchRowsIfMissing(
      tournamentId,
      "round-2",
      buildRound2Rows(tournamentId, players, round1Matches),
    );
    ({ players, matches } =
      await fetchTournamentRowsForGeneration(tournamentId));
  }

  const round2Matches = getMatchesForRound(matches, "round-2");
  if (isRoundFullyCompleted(matches, "round-2")) {
    await insertMatchRowsIfMissing(
      tournamentId,
      "round-3",
      buildRound3Rows(tournamentId, players, round1Matches, round2Matches),
    );
    ({ players, matches } =
      await fetchTournamentRowsForGeneration(tournamentId));
  }

  const round3Matches = getMatchesForRound(matches, "round-3");
  if (isRoundFullyCompleted(matches, "round-3")) {
    await insertMatchRowsIfMissing(
      tournamentId,
      "round-4",
      buildRound4Rows(tournamentId, round3Matches),
    );
    ({ players, matches } =
      await fetchTournamentRowsForGeneration(tournamentId));
  }

  const round4Matches = getMatchesForRound(matches, "round-4");
  if (isRoundFullyCompleted(matches, "round-4")) {
    await insertMatchRowsIfMissing(
      tournamentId,
      "round-5",
      buildRound5Rows(tournamentId, round4Matches),
    );
    ({ players, matches } =
      await fetchTournamentRowsForGeneration(tournamentId));
  }

  const round5Matches = getMatchesForRound(matches, "round-5");
  if (isRoundFullyCompleted(matches, "round-5")) {
    const { finalRows, thirdPlaceRows } = buildRound6And7Rows(
      tournamentId,
      round5Matches,
    );
    await insertMatchRowsIfMissing(tournamentId, "round-6", finalRows);
    await insertMatchRowsIfMissing(tournamentId, "round-7", thirdPlaceRows);
  }
}

function maskRound2AndLaterMatches(
  matches: SupabaseMatchRow[],
): SupabaseMatchRow[] {
  return matches.map((match) => {
    const roundId = toRoundIdFromDbRound(match.round);
    if (!roundId || roundId === "round-1") {
      return match;
    }

    return {
      ...match,
      player1_id: null,
      player2_id: null,
      player1_score: null,
      player2_score: null,
      winner_id: null,
      status: "pending",
    };
  });
}

async function getTournamentMatchGames(
  matchIds: string[],
): Promise<Map<string, SupabaseMatchGameRow[]>> {
  const byMatchId = new Map<string, SupabaseMatchGameRow[]>();
  if (matchIds.length === 0) {
    return byMatchId;
  }

  const { data, error } = await supabase
    .from("match_games")
    .select(
      "id,match_id,game_number,player1_score,player2_score,winner_id,created_at",
    )
    .in("match_id", matchIds)
    .order("game_number", { ascending: true });
  assertNoError(error);

  ((data ?? []) as SupabaseMatchGameRow[]).forEach((game) => {
    const list = byMatchId.get(game.match_id) ?? [];
    list.push(game);
    byMatchId.set(game.match_id, list);
  });

  return byMatchId;
}

function toRoundBuckets(
  tournamentId: string,
  matches: SupabaseMatchRow[],
  gameRowsByMatchId: Map<string, SupabaseMatchGameRow[]>,
): Record<RoundId, MatchState[]> {
  const buckets: Record<RoundId, MatchState[]> = {
    "round-1": [],
    "round-2": [],
    "round-3": [],
    "round-4": [],
    "round-5": [],
    "round-6": [],
    "round-7": [],
  };

  const idToName = tournamentPlayerIdToName.get(tournamentId) ?? new Map();
  const idToGroup = tournamentPlayerIdToGroup.get(tournamentId) ?? new Map();

  const mapped = matches
    .map((match) => {
      const roundId = toRoundIdFromDbRound(match.round);
      if (!roundId) {
        return null;
      }

      const games = gameRowsByMatchId.get(match.id) ?? [];
      let score1 = match.player1_score;
      let score2 = match.player2_score;
      let winnerId = match.winner_id;

      if (knockoutRounds.has(roundId) && games.length > 0) {
        let player1Wins = 0;
        let player2Wins = 0;

        games.forEach((game) => {
          const left = game.player1_score ?? 0;
          const right = game.player2_score ?? 0;
          if (left > right) {
            player1Wins += 1;
          } else if (right > left) {
            player2Wins += 1;
          }
        });

        score1 = player1Wins;
        score2 = player2Wins;
        if (player1Wins > player2Wins) {
          winnerId = match.player1_id;
        } else if (player2Wins > player1Wins) {
          winnerId = match.player2_id;
        } else {
          winnerId = null;
        }
      }

      const order = getMatchOrder(
        roundId,
        match.game_number,
        match.player1_id,
        match.player2_id,
        idToGroup,
      );

      const recordId = toRecordId(match.id);
      matchIdToTournamentId.set(match.id, tournamentId);

      return {
        roundId,
        order,
        row: {
          id: buildMatchCode(
            roundId,
            match.game_number,
            match.player1_id,
            match.player2_id,
            idToGroup,
          ),
          recordId,
          gameNumber: match.game_number,
          player1: match.player1_id
            ? (idToName.get(match.player1_id) ?? "")
            : "",
          player2: match.player2_id
            ? (idToName.get(match.player2_id) ?? "")
            : "",
          score1,
          score2,
          winner: winnerId ? (idToName.get(winnerId) ?? "") : "",
        } satisfies MatchState,
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  mapped
    .sort((left, right) => {
      if (left.roundId === right.roundId) {
        return left.order - right.order;
      }
      return ROUND_IDS.indexOf(left.roundId) - ROUND_IDS.indexOf(right.roundId);
    })
    .forEach((item) => {
      buckets[item.roundId].push(item.row);
    });

  return buckets;
}

function normalizeTournamentStatus(
  status: string | null | undefined,
): "upcoming" | "ongoing" | "completed" {
  if (status === "completed" || status === "ongoing" || status === "upcoming") {
    return status;
  }
  return "upcoming";
}

function shufflePlayers<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = next[i];
    next[i] = next[j];
    next[j] = temp;
  }
  return next;
}

function splitIntoGroups<T>(items: T[]): Record<GroupKey, T[]> {
  const groups: Record<GroupKey, T[]> = {
    A: [],
    B: [],
    C: [],
    D: [],
  };

  const keys: GroupKey[] = ["A", "B", "C", "D"];
  items.forEach((item, index) => {
    groups[keys[index % 4]].push(item);
  });

  return groups;
}

function generateRoundRobinPairs(
  playerIds: string[],
  groupKey: GroupKey,
  playerGroupById: Map<string, GroupKey>,
): Array<{ player1_id: string; player2_id: string; groupKey: GroupKey }> {
  const pairs: Array<{
    player1_id: string;
    player2_id: string;
    groupKey: GroupKey;
  }> = [];

  for (let left = 0; left < playerIds.length; left += 1) {
    for (let right = left + 1; right < playerIds.length; right += 1) {
      const player1Id = playerIds[left];
      const player2Id = playerIds[right];
      const player1Group = playerGroupById.get(player1Id);
      const player2Group = playerGroupById.get(player2Id);

      if (player1Group !== groupKey || player2Group !== groupKey) {
        console.error(
          "Round 1 fixture generation attempted a cross-group pairing",
          {
            groupKey,
            player1Id,
            player2Id,
            player1Group,
            player2Group,
          },
        );
        throw new Error(
          "Round 1 fixture generation must stay within the same group",
        );
      }

      pairs.push({ player1_id: player1Id, player2_id: player2Id, groupKey });
    }
  }

  return pairs;
}

function interleaveRound1Fixtures(
  fixturesByGroup: Record<
    GroupKey,
    Array<{
      player1_id: string;
      player2_id: string;
      groupKey: GroupKey;
    }>
  >,
): Array<{
  player1_id: string;
  player2_id: string;
  groupKey: GroupKey;
}> {
  const ordered: Array<{
    player1_id: string;
    player2_id: string;
    groupKey: GroupKey;
  }> = [];

  const maxLength = Math.max(
    fixturesByGroup.A.length,
    fixturesByGroup.B.length,
    fixturesByGroup.C.length,
    fixturesByGroup.D.length,
  );

  for (let index = 0; index < maxLength; index += 1) {
    (["A", "B", "C", "D"] as GroupKey[]).forEach((groupKey) => {
      const fixture = fixturesByGroup[groupKey][index];
      if (fixture) {
        ordered.push(fixture);
      }
    });
  }

  return ordered;
}

function resolveGroupKeyForPlayer(
  player: SupabasePlayerRow,
  groupNameById: Map<string, GroupKey>,
): GroupKey | null {
  if (player.group_letter) {
    return normalizeGroupKey(player.group_letter);
  }

  if (player.group_id) {
    return groupNameById.get(player.group_id) ?? null;
  }

  return null;
}

function buildRound1MatchRows(
  tournamentId: string,
  players: SupabasePlayerRow[],
  groupNameById: Map<string, GroupKey>,
): Array<{
  tournament_id: string;
  round: string;
  game_number: number;
  player1_id: string;
  player2_id: string;
  player1_score: null;
  player2_score: null;
  winner_id: null;
  status: "pending";
  best_of: number;
}> {
  const groupedPlayers: Record<
    GroupKey,
    Array<{ id: string; name: string; groupToken: string }>
  > = {
    A: [],
    B: [],
    C: [],
    D: [],
  };

  const playerGroupById = new Map<string, GroupKey>();
  const playerGroupTokenById = new Map<string, string>();

  players.forEach((player) => {
    const groupKey = resolveGroupKeyForPlayer(player, groupNameById);
    if (!groupKey) {
      console.error("Round 1 fixture generation requires grouped players", {
        playerId: player.id,
        tournamentId,
      });
      throw new Error(
        "Cannot generate Round 1 fixtures: player group is missing",
      );
    }

    const groupToken = player.group_id ?? `group-letter:${groupKey}`;
    groupedPlayers[groupKey].push({
      id: player.id,
      name: player.name,
      groupToken,
    });
    playerGroupById.set(player.id, groupKey);
    playerGroupTokenById.set(player.id, groupToken);
  });

  (Object.keys(groupedPlayers) as GroupKey[]).forEach((groupKey) => {
    groupedPlayers[groupKey].sort((left, right) => {
      const byName = left.name.localeCompare(right.name);
      if (byName !== 0) {
        return byName;
      }
      return left.id.localeCompare(right.id);
    });
  });

  const fixturesByGroup = {
    A: generateRoundRobinPairs(
      groupedPlayers.A.map((player) => player.id),
      "A",
      playerGroupById,
    ),
    B: generateRoundRobinPairs(
      groupedPlayers.B.map((player) => player.id),
      "B",
      playerGroupById,
    ),
    C: generateRoundRobinPairs(
      groupedPlayers.C.map((player) => player.id),
      "C",
      playerGroupById,
    ),
    D: generateRoundRobinPairs(
      groupedPlayers.D.map((player) => player.id),
      "D",
      playerGroupById,
    ),
  } satisfies Record<
    GroupKey,
    Array<{ player1_id: string; player2_id: string; groupKey: GroupKey }>
  >;

  const fixtures = interleaveRound1Fixtures(fixturesByGroup);

  return fixtures.map((fixture, index) => {
    const player1Group = playerGroupById.get(fixture.player1_id);
    const player2Group = playerGroupById.get(fixture.player2_id);
    const player1GroupToken = playerGroupTokenById.get(fixture.player1_id);
    const player2GroupToken = playerGroupTokenById.get(fixture.player2_id);

    if (
      player1Group !== player2Group ||
      player1Group !== fixture.groupKey ||
      player1GroupToken !== player2GroupToken
    ) {
      console.error(
        "Round 1 fixture generation attempted a cross-group pairing",
        {
          tournamentId,
          fixture,
          player1Group,
          player2Group,
          player1GroupToken,
          player2GroupToken,
        },
      );
      throw new Error(
        "Round 1 fixture generation must stay within the same group",
      );
    }

    return {
      tournament_id: tournamentId,
      round: "round1",
      game_number: index + 1,
      player1_id: fixture.player1_id,
      player2_id: fixture.player2_id,
      player1_score: null,
      player2_score: null,
      winner_id: null,
      status: "pending" as const,
      best_of: 1,
    };
  });
}

async function replaceRound1Matches(
  tournamentId: string,
  rows: Array<{
    tournament_id: string;
    round: string;
    game_number: number;
    player1_id: string;
    player2_id: string;
    player1_score: null;
    player2_score: null;
    winner_id: null;
    status: "pending";
    best_of: number;
  }>,
): Promise<void> {
  const { data: existingMatches, error: existingMatchesError } = await supabase
    .from("matches")
    .select("id")
    .eq("tournament_id", tournamentId)
    .eq("round", "round1");
  assertNoError(existingMatchesError);

  const existingMatchIds = (existingMatches ?? []).map(
    (match) => match.id as string,
  );
  if (existingMatchIds.length > 0) {
    const { error: deleteGamesError } = await supabase
      .from("match_games")
      .delete()
      .in("match_id", existingMatchIds);
    assertNoError(deleteGamesError);

    const { error: deleteMatchesError } = await supabase
      .from("matches")
      .delete()
      .in("id", existingMatchIds);
    assertNoError(deleteMatchesError);
  }

  if (rows.length > 0) {
    const { error: insertMatchesError } = await supabase
      .from("matches")
      .insert(rows);
    assertNoError(insertMatchesError);
  }
}

export async function generateRound1Fixtures(
  tournamentId: string,
): Promise<void> {
  if (!(await ensureAuthenticatedWrite())) {
    return;
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id,name")
    .eq("tournament_id", tournamentId);
  assertNoError(groupsError);

  const groupNameById = new Map<string, GroupKey>(
    ((groups ?? []) as Array<{ id: string; name: string }>).map((group) => [
      group.id,
      normalizeGroupKey(group.name),
    ]),
  );

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,tournament_id,group_id,name,group_letter")
    .eq("tournament_id", tournamentId);
  assertNoError(playersError);

  const playerRows = (players ?? []) as SupabasePlayerRow[];
  if (playerRows.length < 4) {
    throw new Error("At least 4 players are required to generate fixtures");
  }

  const rows = buildRound1MatchRows(tournamentId, playerRows, groupNameById);
  await replaceRound1Matches(tournamentId, rows);

  const { error: updateTournamentError } = await supabase
    .from("tournaments")
    .update({ status: "ongoing" })
    .eq("id", tournamentId);
  assertNoError(updateTournamentError);

  clearTournamentCaches(tournamentId);
}

export async function getTournamentList(): Promise<TournamentListItem[]> {
  const { data: tournaments, error: tournamentsError } = await supabase
    .from("tournaments")
    .select("id,name,type,date,status")
    .order("date", { ascending: true });
  assertNoError(tournamentsError);

  const tournamentRows = (tournaments ?? []) as SupabaseTournamentRow[];
  const tournamentIds = tournamentRows.map((item) => item.id);

  if (tournamentIds.length === 0) {
    return [];
  }

  const { data: finalMatches, error: finalsError } = await supabase
    .from("matches")
    .select("tournament_id,winner_id,status")
    .in("tournament_id", tournamentIds)
    .eq("round", "final")
    .eq("status", "completed");
  assertNoError(finalsError);

  const { data: thirdPlaceMatches, error: thirdPlaceError } = await supabase
    .from("matches")
    .select("tournament_id,status")
    .in("tournament_id", tournamentIds)
    .eq("round", "third_place")
    .eq("status", "completed");
  assertNoError(thirdPlaceError);

  const winnerIds = Array.from(
    new Set(
      (finalMatches ?? [])
        .map((item) => item.winner_id as string | null)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  let playerNameById = new Map<string, string>();
  if (winnerIds.length > 0) {
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id,name")
      .in("id", winnerIds);
    assertNoError(playersError);

    playerNameById = new Map(
      (players ?? []).map((player) => [
        player.id as string,
        player.name as string,
      ]),
    );
  }

  const winnerByTournament = new Map<string, string>();
  (finalMatches ?? []).forEach((match) => {
    const winnerId = match.winner_id as string | null;
    if (!winnerId) {
      return;
    }

    winnerByTournament.set(
      match.tournament_id as string,
      playerNameById.get(winnerId) ?? "",
    );
  });

  const completedTournaments = new Set<string>();
  const thirdPlaceCompleted = new Set(
    (thirdPlaceMatches ?? []).map((match) => match.tournament_id as string),
  );
  (finalMatches ?? []).forEach((match) => {
    const tournamentId = match.tournament_id as string;
    if (thirdPlaceCompleted.has(tournamentId)) {
      completedTournaments.add(tournamentId);
    }
  });

  return tournamentRows.map((tournament) => ({
    id: tournament.id,
    name: tournament.name,
    type: tournament.type,
    date: tournament.date,
    status:
      tournament.status === "completed" ||
      completedTournaments.has(tournament.id)
        ? "completed"
        : normalizeTournamentStatus(tournament.status),
    winner: winnerByTournament.get(tournament.id) ?? "",
  }));
}

export async function createTournament(
  input: CreateTournamentInput,
): Promise<string> {
  if (!(await ensureAuthenticatedWrite())) {
    return "";
  }

  const { data: tournamentRows, error: tournamentError } = await supabase
    .from("tournaments")
    .insert({
      name: input.name.trim(),
      date: input.date,
      type: input.type,
      status: "upcoming",
      locked_rounds: {},
    })
    .select("id")
    .limit(1);
  assertNoError(tournamentError);

  const tournamentId = tournamentRows?.[0]?.id as string | undefined;
  if (!tournamentId) {
    throw new Error("Failed to create tournament");
  }

  const playerRows = input.players
    .map((name) => name.trim())
    .filter(Boolean)
    .map((name) => ({
      tournament_id: tournamentId,
      name,
      group_id: null,
      group_letter: null,
    }));

  if (playerRows.length > 0) {
    const { error: playersError } = await supabase
      .from("players")
      .insert(playerRows);
    assertNoError(playersError);
  }

  clearTournamentCaches(tournamentId);
  return tournamentId;
}

export async function startTournament(tournamentId: string): Promise<void> {
  if (!(await ensureAuthenticatedWrite())) {
    return;
  }

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,name")
    .eq("tournament_id", tournamentId);
  assertNoError(playersError);

  const playerRows = (players ?? []) as Array<{ id: string; name: string }>;
  if (playerRows.length < 4) {
    throw new Error("At least 4 players are required to start a tournament");
  }

  const shuffled = shufflePlayers(playerRows);
  const grouped = splitIntoGroups(shuffled);

  const { data: existingGroups, error: existingGroupsError } = await supabase
    .from("groups")
    .select("id,name")
    .eq("tournament_id", tournamentId);
  assertNoError(existingGroupsError);

  let groupMap = new Map<GroupKey, string>();
  const existingGroupRows = (existingGroups ?? []) as Array<{
    id: string;
    name: string;
  }>;

  if (existingGroupRows.length > 0) {
    groupMap = new Map(
      existingGroupRows.map((group) => [
        normalizeGroupKey(group.name),
        group.id,
      ]),
    );
  } else {
    const { data: insertedGroups, error: insertGroupsError } = await supabase
      .from("groups")
      .insert([
        { tournament_id: tournamentId, name: "A" },
        { tournament_id: tournamentId, name: "B" },
        { tournament_id: tournamentId, name: "C" },
        { tournament_id: tournamentId, name: "D" },
      ])
      .select("id,name");
    assertNoError(insertGroupsError);

    groupMap = new Map(
      ((insertedGroups ?? []) as Array<{ id: string; name: string }>).map(
        (group) => [normalizeGroupKey(group.name), group.id],
      ),
    );
  }

  const groupKeys: GroupKey[] = ["A", "B", "C", "D"];
  for (const key of groupKeys) {
    const groupPlayers = grouped[key];
    const groupId = groupMap.get(key);
    if (!groupId) {
      continue;
    }

    const playerIds = groupPlayers.map((player) => player.id);
    if (playerIds.length === 0) {
      continue;
    }

    const { error: updatePlayersError } = await supabase
      .from("players")
      .update({ group_id: groupId, group_letter: key })
      .in("id", playerIds);
    assertNoError(updatePlayersError);
  }

  const groupNameById = new Map<string, GroupKey>();
  groupMap.forEach((groupId, groupKey) => {
    groupNameById.set(groupId, groupKey);
  });

  const groupedPlayerRows = groupKeys.flatMap((groupKey) =>
    grouped[groupKey].map((player) => ({
      id: player.id,
      tournament_id: tournamentId,
      group_id: groupMap.get(groupKey) ?? null,
      name: player.name,
      group_letter: groupKey,
    })),
  ) as SupabasePlayerRow[];

  const round1Rows = buildRound1MatchRows(
    tournamentId,
    groupedPlayerRows,
    groupNameById,
  );
  await replaceRound1Matches(tournamentId, round1Rows);

  const { error: updateTournamentError } = await supabase
    .from("tournaments")
    .update({ status: "ongoing" })
    .eq("id", tournamentId);
  assertNoError(updateTournamentError);

  clearTournamentCaches(tournamentId);
}

export async function getTournamentPayload(
  tournamentId: string,
  allowWrites = false,
): Promise<ApiTournamentPayload | null> {
  await ensureGeneratedRounds(tournamentId, allowWrites);

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id,name,type,date,locked_rounds")
    .eq("id", tournamentId)
    .maybeSingle();
  assertNoError(tournamentError);

  if (!tournament) {
    return null;
  }

  const { data: groups, error: groupsError } = await supabase
    .from("groups")
    .select("id,tournament_id,name")
    .eq("tournament_id", tournamentId);
  assertNoError(groupsError);

  const { data: players, error: playersError } = await supabase
    .from("players")
    .select("id,tournament_id,group_id,name,group_letter")
    .eq("tournament_id", tournamentId);
  assertNoError(playersError);

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      "id,tournament_id,round,game_number,player1_id,player2_id,player1_score,player2_score,winner_id,status,best_of,created_at",
    )
    .eq("tournament_id", tournamentId);
  assertNoError(matchesError);

  let matchRows = (matches ?? []) as SupabaseMatchRow[];
  const playerRows = (players ?? []) as SupabasePlayerRow[];

  const round1Complete = isRound1FullyCompletedAcrossGroups(
    playerRows,
    matchRows,
  );
  const round2Rows = getMatchesForRound(matchRows, "round-2");

  if (!round1Complete) {
    const hasPrematureRound2Data = round2Rows.some(
      (match) =>
        Boolean(match.player1_id) ||
        Boolean(match.player2_id) ||
        match.status === "completed" ||
        match.player1_score !== null ||
        match.player2_score !== null ||
        Boolean(match.winner_id),
    );

    if (hasPrematureRound2Data) {
      console.warn(
        `[Tournament ${tournamentId}] Round 2 data exists before Round 1 completion. Confirm before deleting any rows.`,
      );
    }
  }

  if (allowWrites && round1Complete && round2Rows.length === 0) {
    const round2InsertRows = buildRound2Rows(
      tournamentId,
      playerRows,
      getMatchesForRound(matchRows, "round-1"),
    );

    if (round2InsertRows.length > 0) {
      const { error: insertRound2Error } = await supabase
        .from("matches")
        .insert(round2InsertRows);
      assertNoError(insertRound2Error);

      const { data: refreshedMatches, error: refreshedMatchesError } =
        await supabase
          .from("matches")
          .select(
            "id,tournament_id,round,game_number,player1_id,player2_id,player1_score,player2_score,winner_id,status,best_of,created_at",
          )
          .eq("tournament_id", tournamentId);
      assertNoError(refreshedMatchesError);
      matchRows = (refreshedMatches ?? []) as SupabaseMatchRow[];
    }
  }

  const safeMatchRows = round1Complete
    ? matchRows
    : maskRound2AndLaterMatches(matchRows);

  const gameRowsByMatchId = await getTournamentMatchGames(
    safeMatchRows.map((match) => match.id),
  );

  const grouped = setTournamentPlayerCaches(
    tournamentId,
    (groups ?? []) as SupabaseGroupRow[],
    playerRows,
  );

  const rounds = toRoundBuckets(tournamentId, safeMatchRows, gameRowsByMatchId);

  return {
    meta: {
      id: tournament.id,
      name: tournament.name,
      type: tournament.type,
      date: tournament.date,
      members: [...grouped.A, ...grouped.B, ...grouped.C, ...grouped.D],
    },
    groups: grouped,
    rounds,
    roundLocks: toRoundLocksMap(
      (tournament as SupabaseTournamentRow).locked_rounds ?? null,
    ),
  };
}

export async function getMatches(
  tournamentId: string,
  roundId?: RoundId,
): Promise<MatchQueryResult[]> {
  await ensureGeneratedRounds(tournamentId, false);
  await ensureTournamentPlayerCaches(tournamentId);

  let query = supabase
    .from("matches")
    .select(
      "id,tournament_id,round,game_number,player1_id,player2_id,player1_score,player2_score,winner_id,status,best_of,created_at",
    )
    .eq("tournament_id", tournamentId);

  if (roundId) {
    query = query.eq("round", roundIdToDbRound[roundId]);
  }

  const { data, error } = await query;
  assertNoError(error);

  const rows = (data ?? []) as SupabaseMatchRow[];
  const gameRowsByMatchId = await getTournamentMatchGames(
    rows.map((row) => row.id),
  );

  let shouldMaskRound2 = false;
  if (roundId === "round-2") {
    const { data: allMatches, error: allMatchesError } = await supabase
      .from("matches")
      .select(
        "id,tournament_id,round,game_number,player1_id,player2_id,player1_score,player2_score,winner_id,status,best_of,created_at",
      )
      .eq("tournament_id", tournamentId);
    assertNoError(allMatchesError);

    const allRows = (allMatches ?? []) as SupabaseMatchRow[];
    shouldMaskRound2 = !isRoundFullyCompleted(allRows, "round-1");

    if (shouldMaskRound2) {
      const hasPrematureRound2Data = rows.some(
        (match) =>
          Boolean(match.player1_id) ||
          Boolean(match.player2_id) ||
          match.status === "completed" ||
          match.player1_score !== null ||
          match.player2_score !== null ||
          Boolean(match.winner_id),
      );

      if (hasPrematureRound2Data) {
        console.warn(
          `[Tournament ${tournamentId}] Round 2 data exists before Round 1 completion. Confirm before deleting any rows.`,
        );
      }
    }
  }

  const idToName = tournamentPlayerIdToName.get(tournamentId) ?? new Map();
  const idToGroup = tournamentPlayerIdToGroup.get(tournamentId) ?? new Map();

  return rows
    .map((row) => {
      const rid = toRoundIdFromDbRound(row.round);
      if (!rid) {
        return null;
      }

      const games = gameRowsByMatchId.get(row.id) ?? [];
      let score1 = row.player1_score;
      let score2 = row.player2_score;
      let winnerId = row.winner_id;

      if (knockoutRounds.has(rid) && games.length > 0) {
        let player1Wins = 0;
        let player2Wins = 0;

        games.forEach((game) => {
          const left = game.player1_score ?? 0;
          const right = game.player2_score ?? 0;
          if (left > right) {
            player1Wins += 1;
          } else if (right > left) {
            player2Wins += 1;
          }
        });

        score1 = player1Wins;
        score2 = player2Wins;
        if (player1Wins > player2Wins) {
          winnerId = row.player1_id;
        } else if (player2Wins > player1Wins) {
          winnerId = row.player2_id;
        } else {
          winnerId = null;
        }
      }

      const recordId = toRecordId(row.id);
      matchIdToTournamentId.set(row.id, tournamentId);

      const player1Name = shouldMaskRound2
        ? ""
        : row.player1_id
          ? (idToName.get(row.player1_id) ?? "")
          : "";
      const player2Name = shouldMaskRound2
        ? ""
        : row.player2_id
          ? (idToName.get(row.player2_id) ?? "")
          : "";

      return {
        recordId,
        tournamentId: row.tournament_id,
        roundId: rid,
        matchCode: buildMatchCode(
          rid,
          row.game_number,
          row.player1_id,
          row.player2_id,
          idToGroup,
        ),
        order: getMatchOrder(
          rid,
          row.game_number,
          row.player1_id,
          row.player2_id,
          idToGroup,
        ),
        gameNumber: row.game_number,
        player1: player1Name,
        player2: player2Name,
        score1: shouldMaskRound2 ? null : score1,
        score2: shouldMaskRound2 ? null : score2,
        winner:
          shouldMaskRound2 || !winnerId ? "" : (idToName.get(winnerId) ?? ""),
      } satisfies MatchQueryResult;
    })
    .filter((row): row is MatchQueryResult => Boolean(row))
    .sort((left, right) => left.order - right.order);
}

async function upsertMatchGamesFromScores(
  match: SupabaseMatchRow,
  score1: number | null,
  score2: number | null,
  winnerId: string | null,
): Promise<void> {
  const mappedRound = toRoundIdFromDbRound(match.round);
  if (!mappedRound || !knockoutRounds.has(mappedRound)) {
    return;
  }

  const { error: deleteError } = await supabase
    .from("match_games")
    .delete()
    .eq("match_id", match.id);
  assertNoError(deleteError);

  if (score1 === null || score2 === null || !winnerId) {
    return;
  }

  const isPlayer1Winner = winnerId === match.player1_id;
  const winnerWins = Math.max(2, Math.min(3, Math.max(score1, score2)));
  const loserWins = Math.max(0, Math.min(1, Math.min(score1, score2)));
  const totalGames = Math.min(3, winnerWins + loserWins);

  const rows: Array<{
    match_id: string;
    game_number: number;
    player1_score: number;
    player2_score: number;
    winner_id: string | null;
  }> = [];

  for (let index = 1; index <= totalGames; index += 1) {
    const winnerTakesGame = index <= winnerWins;
    const leftWinsGame = winnerTakesGame ? isPlayer1Winner : !isPlayer1Winner;

    rows.push({
      match_id: match.id,
      game_number: index,
      player1_score: leftWinsGame ? 1 : 0,
      player2_score: leftWinsGame ? 0 : 1,
      winner_id: leftWinsGame ? match.player1_id : match.player2_id,
    });
  }

  if (rows.length > 0) {
    const { error: insertError } = await supabase
      .from("match_games")
      .insert(rows);
    assertNoError(insertError);
  }
}

export async function updateMatch(
  recordId: number,
  patch: MatchPatch,
): Promise<void> {
  if (!(await ensureAuthenticatedWrite())) {
    return;
  }

  const matchId = recordIdToMatchId.get(recordId);
  if (!matchId) {
    throw new Error(`Unknown match record id: ${recordId}`);
  }

  const { data: currentRow, error: currentError } = await supabase
    .from("matches")
    .select(
      "id,tournament_id,round,game_number,player1_id,player2_id,player1_score,player2_score,winner_id,status,best_of,created_at",
    )
    .eq("id", matchId)
    .maybeSingle();
  assertNoError(currentError);

  if (!currentRow) {
    throw new Error(`Match not found for record id: ${recordId}`);
  }

  const tournamentId = currentRow.tournament_id;
  await ensureTournamentPlayerCaches(tournamentId);

  const playerNameToId =
    tournamentPlayerNameToId.get(tournamentId) ?? new Map<string, string>();

  const updatePayload: Partial<SupabaseMatchRow> = {};
  if (patch.player1 !== undefined) {
    updatePayload.player1_id = patch.player1
      ? (playerNameToId.get(patch.player1) ?? null)
      : null;
  }
  if (patch.player2 !== undefined) {
    updatePayload.player2_id = patch.player2
      ? (playerNameToId.get(patch.player2) ?? null)
      : null;
  }
  if (patch.score1 !== undefined) {
    updatePayload.player1_score = patch.score1;
  }
  if (patch.score2 !== undefined) {
    updatePayload.player2_score = patch.score2;
  }
  if (patch.winner !== undefined) {
    updatePayload.winner_id = patch.winner
      ? (playerNameToId.get(patch.winner) ?? null)
      : null;
  }

  const nextScore1 =
    updatePayload.player1_score !== undefined
      ? updatePayload.player1_score
      : currentRow.player1_score;
  const nextScore2 =
    updatePayload.player2_score !== undefined
      ? updatePayload.player2_score
      : currentRow.player2_score;
  const nextWinnerId =
    updatePayload.winner_id !== undefined
      ? updatePayload.winner_id
      : currentRow.winner_id;

  updatePayload.status =
    nextScore1 !== null && nextScore2 !== null && Boolean(nextWinnerId)
      ? "completed"
      : "pending";

  const { error: updateError } = await supabase
    .from("matches")
    .update(updatePayload)
    .eq("id", matchId);
  assertNoError(updateError);

  await upsertMatchGamesFromScores(
    currentRow,
    nextScore1,
    nextScore2,
    nextWinnerId,
  );

  await maybeCompleteTournament(tournamentId);
}

export async function updateManyMatches(
  updates: Array<{
    recordId: number;
    patch: MatchPatch;
  }>,
): Promise<void> {
  if (!(await ensureAuthenticatedWrite())) {
    return;
  }

  await Promise.all(
    updates.map((update) => updateMatch(update.recordId, update.patch)),
  );
}

export async function updateRoundLock(
  tournamentId: string,
  roundId: RoundId,
  locked: boolean,
): Promise<void> {
  if (!(await ensureAuthenticatedWrite())) {
    return;
  }

  const { data: tournament, error: readError } = await supabase
    .from("tournaments")
    .select("id,locked_rounds")
    .eq("id", tournamentId)
    .maybeSingle();
  assertNoError(readError);

  if (!tournament) {
    return;
  }

  const nextLocks = {
    ...defaultsRoundLocks(),
    ...((tournament.locked_rounds as Record<string, boolean> | null) ?? {}),
    [roundId]: locked,
  };

  const { error: updateError } = await supabase
    .from("tournaments")
    .update({ locked_rounds: nextLocks })
    .eq("id", tournamentId);
  assertNoError(updateError);
}

function randomLeaguePoints(): number {
  return Math.floor(Math.random() * 8) + 2;
}

function toReadyMatches(matches: MatchQueryResult[]): MatchQueryResult[] {
  return matches.filter((match) => match.player1 && match.player2);
}

export async function randomizeLeagueRound(
  tournamentId: string,
  roundId: RoundId,
): Promise<void> {
  try {
    if (!(await ensureAuthenticatedWrite())) {
      return;
    }

    await ensureGeneratedRounds(tournamentId, true);
    const matches = toReadyMatches(await getMatches(tournamentId, roundId));
    if (matches.length === 0) {
      return;
    }

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
    await ensureGeneratedRounds(tournamentId, true);
  } catch (error) {
    console.error(
      `Failed to randomize ${roundId} for tournament ${tournamentId}`,
      error,
    );
    throw error;
  }
}

export async function randomizeBestOfThreeRound(
  tournamentId: string,
  roundId: RoundId,
): Promise<void> {
  try {
    if (!(await ensureAuthenticatedWrite())) {
      return;
    }

    await ensureGeneratedRounds(tournamentId, true);
    const matches = toReadyMatches(await getMatches(tournamentId, roundId));
    if (matches.length === 0) {
      return;
    }

    for (const match of matches) {
      const matchId = recordIdToMatchId.get(match.recordId);
      if (!matchId) {
        continue;
      }

      const tournamentPlayers =
        tournamentPlayerNameToId.get(tournamentId) ?? new Map<string, string>();
      const player1Id = tournamentPlayers.get(match.player1) ?? null;
      const player2Id = tournamentPlayers.get(match.player2) ?? null;

      if (!player1Id || !player2Id) {
        continue;
      }

      let player1Wins = 0;
      let player2Wins = 0;
      let gameNumber = 1;

      const gameRows: Array<{
        match_id: string;
        game_number: number;
        player1_score: number;
        player2_score: number;
        winner_id: string;
      }> = [];

      while (player1Wins < 2 && player2Wins < 2) {
        const player1Won = Math.random() >= 0.5;
        if (player1Won) {
          player1Wins += 1;
        } else {
          player2Wins += 1;
        }

        gameRows.push({
          match_id: matchId,
          game_number: gameNumber,
          player1_score: player1Won ? 1 : 0,
          player2_score: player1Won ? 0 : 1,
          winner_id: player1Won ? player1Id : player2Id,
        });

        gameNumber += 1;
      }

      const winnerId = player1Wins > player2Wins ? player1Id : player2Id;

      const { error: updateError } = await supabase
        .from("matches")
        .update({
          player1_score: player1Wins,
          player2_score: player2Wins,
          winner_id: winnerId,
          status: "completed",
        })
        .eq("id", matchId);
      assertNoError(updateError);

      const { error: deleteError } = await supabase
        .from("match_games")
        .delete()
        .eq("match_id", matchId);
      assertNoError(deleteError);

      const { error: insertError } = await supabase
        .from("match_games")
        .insert(gameRows);
      assertNoError(insertError);
    }

    await ensureGeneratedRounds(tournamentId, true);
    await maybeCompleteTournament(tournamentId);
  } catch (error) {
    console.error(
      `Failed to randomize ${roundId} for tournament ${tournamentId}`,
      error,
    );
    throw error;
  }
}

export async function resetDatabase(tournamentId?: string): Promise<void> {
  if (!(await ensureAuthenticatedWrite())) {
    return;
  }

  const tournamentIds = tournamentId
    ? [tournamentId]
    : await (async () => {
        const { data: tournaments, error: tournamentsError } = await supabase
          .from("tournaments")
          .select("id");
        assertNoError(tournamentsError);
        return (tournaments ?? []).map((item) => item.id as string);
      })();

  for (const id of tournamentIds) {
    const { data: matches, error: matchesError } = await supabase
      .from("matches")
      .select("id,round")
      .eq("tournament_id", id);
    assertNoError(matchesError);

    const matchRows = (matches ?? []) as Array<{ id: string; round: string }>;
    const round1MatchIds = matchRows
      .filter((match) => toRoundIdFromDbRound(match.round) === "round-1")
      .map((match) => match.id);
    const laterMatchIds = matchRows
      .filter((match) => toRoundIdFromDbRound(match.round) !== "round-1")
      .map((match) => match.id);

    if (laterMatchIds.length > 0) {
      const { error: deleteGamesError } = await supabase
        .from("match_games")
        .delete()
        .in("match_id", laterMatchIds);
      assertNoError(deleteGamesError);

      const { error: deleteMatchesError } = await supabase
        .from("matches")
        .delete()
        .in("id", laterMatchIds);
      assertNoError(deleteMatchesError);
    }

    if (round1MatchIds.length > 0) {
      const { error: clearRound1GamesError } = await supabase
        .from("match_games")
        .delete()
        .in("match_id", round1MatchIds);
      assertNoError(clearRound1GamesError);

      const { error: resetRound1Error } = await supabase
        .from("matches")
        .update({
          player1_score: 0,
          player2_score: 0,
          winner_id: null,
          status: "pending",
        })
        .in("id", round1MatchIds);
      assertNoError(resetRound1Error);
    }

    const { error: resetPlayersError } = await supabase
      .from("players")
      .update({ is_eliminated: false })
      .eq("tournament_id", id);
    assertNoError(resetPlayersError);

    const { error: resetTournamentError } = await supabase
      .from("tournaments")
      .update({ status: "ongoing", locked_rounds: {} })
      .eq("id", id);
    assertNoError(resetTournamentError);

    clearTournamentCaches(id);
  }

  if (!tournamentId) {
    clearTournamentCaches();
  }
}
