export type GroupKey = "A" | "B" | "C" | "D";

export type RoundId =
  | "round-1"
  | "round-2"
  | "round-3"
  | "round-4"
  | "round-5"
  | "round-6"
  | "round-7";

export interface MatchState {
  id: string;
  recordId: number;
  gameNumber: number;
  player1: string;
  player2: string;
  score1: number | null;
  score2: number | null;
  winner: string;
}

export interface RoundState {
  id: RoundId;
  title: string;
  mode: "league" | "knockout";
  locked: boolean;
  matches: MatchState[];
}

export interface TournamentState {
  rounds: Record<RoundId, RoundState>;
  groups: Record<GroupKey, string[]>;
}

export interface TournamentMeta {
  id: string;
  name: string;
  type: "Singles" | "Doubles";
  date: string;
  members: string[];
}

export interface LeagueTableConfig {
  title: string;
  roundId: "round-1" | "round-2";
  matchIds: string[];
}
