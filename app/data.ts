export type TournamentType = "Singles" | "Doubles";

export interface Tournament {
  id: string;
  name: string;
  type: TournamentType;
  date: string;
  members: string[];
}

export const tournamentMembers = [
  "Aiden Brooks",
  "Bella Carter",
  "Caleb Diaz",
  "Daisy Evans",
  "Ethan Foster",
  "Freya Gomez",
  "Gavin Hughes",
  "Hannah Irwin",
  "Isaac James",
  "Jade King",
  "Kai Lewis",
  "Lila Mason",
  "Mason Norton",
  "Nina Ortiz",
  "Owen Patel",
  "Pia Quinn",
  "Quinn Reed",
  "Riley Shaw",
  "Sage Turner",
  "Theo Vega",
  "Uma Walker",
  "Victor Xu",
  "Wendy Young",
  "Xander Zhou",
  "Yara Adams",
  "Zane Brooks",
  "Ava Collins",
  "Noah Dean",
];

export interface MatchResult {
  id: string;
  player1: string;
  player2: string;
  player1Score: number;
  player2Score: number;
  winner: string;
}

export interface GroupStanding {
  name: string;
  points: number;
  status?: "qualified" | "eliminated";
}

export interface TournamentRound {
  id: string;
  title: string;
  subtitle: string;
  type: "League" | "Knockout";
  matches: MatchResult[];
  standings?: Array<{
    group: string;
    players: GroupStanding[];
  }>;
}

export interface TournamentFixture {
  groups: Record<"A" | "B" | "C" | "D", string[]>;
  rounds: TournamentRound[];
}

const baseGroups: Record<"A" | "B" | "C" | "D", string[]> = {
  A: tournamentMembers.slice(0, 7),
  B: tournamentMembers.slice(7, 14),
  C: tournamentMembers.slice(14, 21),
  D: tournamentMembers.slice(21, 28),
};

const buildFixture = (): TournamentFixture => {
  const groups = baseGroups;

  const round1Matches: MatchResult[] = [
    {
      id: "r1-a1",
      player1: groups.A[0],
      player2: groups.A[1],
      player1Score: 71,
      player2Score: 58,
      winner: groups.A[0],
    },
    {
      id: "r1-a2",
      player1: groups.A[2],
      player2: groups.A[3],
      player1Score: 64,
      player2Score: 69,
      winner: groups.A[3],
    },
    {
      id: "r1-a3",
      player1: groups.A[4],
      player2: groups.A[5],
      player1Score: 77,
      player2Score: 62,
      winner: groups.A[4],
    },
    {
      id: "r1-b1",
      player1: groups.B[0],
      player2: groups.B[1],
      player1Score: 66,
      player2Score: 72,
      winner: groups.B[1],
    },
    {
      id: "r1-b2",
      player1: groups.B[2],
      player2: groups.B[3],
      player1Score: 70,
      player2Score: 61,
      winner: groups.B[2],
    },
    {
      id: "r1-b3",
      player1: groups.B[4],
      player2: groups.B[5],
      player1Score: 57,
      player2Score: 74,
      winner: groups.B[5],
    },
    {
      id: "r1-c1",
      player1: groups.C[0],
      player2: groups.C[1],
      player1Score: 68,
      player2Score: 63,
      winner: groups.C[0],
    },
    {
      id: "r1-c2",
      player1: groups.C[2],
      player2: groups.C[3],
      player1Score: 75,
      player2Score: 60,
      winner: groups.C[2],
    },
    {
      id: "r1-c3",
      player1: groups.C[4],
      player2: groups.C[5],
      player1Score: 59,
      player2Score: 71,
      winner: groups.C[5],
    },
    {
      id: "r1-d1",
      player1: groups.D[0],
      player2: groups.D[1],
      player1Score: 73,
      player2Score: 67,
      winner: groups.D[0],
    },
    {
      id: "r1-d2",
      player1: groups.D[2],
      player2: groups.D[3],
      player1Score: 62,
      player2Score: 78,
      winner: groups.D[3],
    },
    {
      id: "r1-d3",
      player1: groups.D[4],
      player2: groups.D[5],
      player1Score: 76,
      player2Score: 65,
      winner: groups.D[4],
    },
  ];

  const round2Matches: MatchResult[] = [
    {
      id: "r2-ab1",
      player1: groups.A[0],
      player2: groups.B[0],
      player1Score: 68,
      player2Score: 60,
      winner: groups.A[0],
    },
    {
      id: "r2-ab2",
      player1: groups.A[1],
      player2: groups.B[1],
      player1Score: 63,
      player2Score: 74,
      winner: groups.B[1],
    },
    {
      id: "r2-ab3",
      player1: groups.A[2],
      player2: groups.B[2],
      player1Score: 70,
      player2Score: 66,
      winner: groups.A[2],
    },
    {
      id: "r2-ab4",
      player1: groups.A[3],
      player2: groups.B[3],
      player1Score: 59,
      player2Score: 75,
      winner: groups.B[3],
    },
    {
      id: "r2-ab5",
      player1: groups.A[4],
      player2: groups.B[4],
      player1Score: 76,
      player2Score: 64,
      winner: groups.A[4],
    },
    {
      id: "r2-ab6",
      player1: groups.A[5],
      player2: groups.B[5],
      player1Score: 61,
      player2Score: 72,
      winner: groups.B[5],
    },
    {
      id: "r2-cd1",
      player1: groups.C[0],
      player2: groups.D[0],
      player1Score: 69,
      player2Score: 58,
      winner: groups.C[0],
    },
    {
      id: "r2-cd2",
      player1: groups.C[1],
      player2: groups.D[1],
      player1Score: 60,
      player2Score: 73,
      winner: groups.D[1],
    },
    {
      id: "r2-cd3",
      player1: groups.C[2],
      player2: groups.D[2],
      player1Score: 74,
      player2Score: 63,
      winner: groups.C[2],
    },
    {
      id: "r2-cd4",
      player1: groups.C[3],
      player2: groups.D[3],
      player1Score: 62,
      player2Score: 77,
      winner: groups.D[3],
    },
    {
      id: "r2-cd5",
      player1: groups.C[4],
      player2: groups.D[4],
      player1Score: 78,
      player2Score: 66,
      winner: groups.C[4],
    },
    {
      id: "r2-cd6",
      player1: groups.C[5],
      player2: groups.D[5],
      player1Score: 65,
      player2Score: 71,
      winner: groups.D[5],
    },
  ];

  const round3Matches: MatchResult[] = [
    {
      id: "r3-1",
      player1: groups.A[0],
      player2: groups.B[5],
      player1Score: 75,
      player2Score: 69,
      winner: groups.A[0],
    },
    {
      id: "r3-2",
      player1: groups.A[1],
      player2: groups.B[2],
      player1Score: 70,
      player2Score: 66,
      winner: groups.A[1],
    },
    {
      id: "r3-3",
      player1: groups.A[2],
      player2: groups.B[1],
      player1Score: 64,
      player2Score: 72,
      winner: groups.B[1],
    },
    {
      id: "r3-4",
      player1: groups.A[3],
      player2: groups.B[0],
      player1Score: 73,
      player2Score: 68,
      winner: groups.A[3],
    },
    {
      id: "r3-5",
      player1: groups.C[0],
      player2: groups.D[5],
      player1Score: 71,
      player2Score: 60,
      winner: groups.C[0],
    },
    {
      id: "r3-6",
      player1: groups.C[1],
      player2: groups.D[3],
      player1Score: 63,
      player2Score: 74,
      winner: groups.D[3],
    },
    {
      id: "r3-7",
      player1: groups.C[2],
      player2: groups.D[1],
      player1Score: 77,
      player2Score: 65,
      winner: groups.C[2],
    },
    {
      id: "r3-8",
      player1: groups.C[4],
      player2: groups.D[0],
      player1Score: 62,
      player2Score: 76,
      winner: groups.D[0],
    },
  ];

  const round4Matches: MatchResult[] = [
    {
      id: "r4-1",
      player1: groups.A[0],
      player2: groups.D[0],
      player1Score: 76,
      player2Score: 70,
      winner: groups.A[0],
    },
    {
      id: "r4-2",
      player1: groups.A[1],
      player2: groups.C[2],
      player1Score: 72,
      player2Score: 66,
      winner: groups.A[1],
    },
    {
      id: "r4-3",
      player1: groups.B[1],
      player2: groups.D[3],
      player1Score: 68,
      player2Score: 74,
      winner: groups.D[3],
    },
    {
      id: "r4-4",
      player1: groups.A[3],
      player2: groups.C[0],
      player1Score: 71,
      player2Score: 69,
      winner: groups.A[3],
    },
  ];

  const round5Matches: MatchResult[] = [
    {
      id: "r5-1",
      player1: groups.A[0],
      player2: groups.A[1],
      player1Score: 74,
      player2Score: 70,
      winner: groups.A[0],
    },
    {
      id: "r5-2",
      player1: groups.A[3],
      player2: groups.D[3],
      player1Score: 72,
      player2Score: 68,
      winner: groups.A[3],
    },
  ];

  const round6Match: MatchResult[] = [
    {
      id: "r6-1",
      player1: groups.A[0],
      player2: groups.A[3],
      player1Score: 79,
      player2Score: 74,
      winner: groups.A[0],
    },
  ];

  return {
    groups,
    rounds: [
      {
        id: "round-1",
        title: "Round 1",
        subtitle: "League • Group matches",
        type: "League",
        matches: round1Matches,
        standings: [
          {
            group: "A",
            players: [
              { name: groups.A[0], points: 14, status: "qualified" },
              { name: groups.A[1], points: 11, status: "qualified" },
              { name: groups.A[2], points: 10, status: "qualified" },
              { name: groups.A[3], points: 8, status: "qualified" },
              { name: groups.A[4], points: 7, status: "qualified" },
              { name: groups.A[5], points: 5, status: "qualified" },
              { name: groups.A[6], points: 3, status: "eliminated" },
            ],
          },
          {
            group: "B",
            players: [
              { name: groups.B[0], points: 12, status: "qualified" },
              { name: groups.B[1], points: 11, status: "qualified" },
              { name: groups.B[2], points: 10, status: "qualified" },
              { name: groups.B[3], points: 9, status: "qualified" },
              { name: groups.B[4], points: 8, status: "qualified" },
              { name: groups.B[5], points: 6, status: "qualified" },
              { name: groups.B[6], points: 2, status: "eliminated" },
            ],
          },
          {
            group: "C",
            players: [
              { name: groups.C[0], points: 13, status: "qualified" },
              { name: groups.C[1], points: 11, status: "qualified" },
              { name: groups.C[2], points: 9, status: "qualified" },
              { name: groups.C[3], points: 8, status: "qualified" },
              { name: groups.C[4], points: 7, status: "qualified" },
              { name: groups.C[5], points: 6, status: "qualified" },
              { name: groups.C[6], points: 1, status: "eliminated" },
            ],
          },
          {
            group: "D",
            players: [
              { name: groups.D[0], points: 12, status: "qualified" },
              { name: groups.D[1], points: 10, status: "qualified" },
              { name: groups.D[2], points: 9, status: "qualified" },
              { name: groups.D[3], points: 8, status: "qualified" },
              { name: groups.D[4], points: 7, status: "qualified" },
              { name: groups.D[5], points: 6, status: "qualified" },
              { name: groups.D[6], points: 2, status: "eliminated" },
            ],
          },
        ],
      },
      {
        id: "round-2",
        title: "Round 2",
        subtitle: "League • Adjacent groups",
        type: "League",
        matches: round2Matches,
        standings: [
          {
            group: "A",
            players: [
              { name: groups.A[0], points: 16, status: "qualified" },
              { name: groups.A[1], points: 13, status: "qualified" },
              { name: groups.A[2], points: 12, status: "qualified" },
              { name: groups.A[3], points: 10, status: "qualified" },
              { name: groups.A[4], points: 8, status: "eliminated" },
              { name: groups.A[5], points: 7, status: "eliminated" },
            ],
          },
          {
            group: "B",
            players: [
              { name: groups.B[0], points: 15, status: "qualified" },
              { name: groups.B[1], points: 13, status: "qualified" },
              { name: groups.B[2], points: 11, status: "qualified" },
              { name: groups.B[3], points: 10, status: "qualified" },
              { name: groups.B[4], points: 8, status: "eliminated" },
              { name: groups.B[5], points: 6, status: "eliminated" },
            ],
          },
          {
            group: "C",
            players: [
              { name: groups.C[0], points: 14, status: "qualified" },
              { name: groups.C[1], points: 12, status: "qualified" },
              { name: groups.C[2], points: 11, status: "qualified" },
              { name: groups.C[3], points: 10, status: "qualified" },
              { name: groups.C[4], points: 8, status: "eliminated" },
              { name: groups.C[5], points: 6, status: "eliminated" },
            ],
          },
          {
            group: "D",
            players: [
              { name: groups.D[0], points: 15, status: "qualified" },
              { name: groups.D[1], points: 13, status: "qualified" },
              { name: groups.D[2], points: 11, status: "qualified" },
              { name: groups.D[3], points: 10, status: "qualified" },
              { name: groups.D[4], points: 7, status: "eliminated" },
              { name: groups.D[5], points: 5, status: "eliminated" },
            ],
          },
        ],
      },
      {
        id: "round-3",
        title: "Round 3",
        subtitle: "Knockout • Best of 3",
        type: "Knockout",
        matches: round3Matches,
      },
      {
        id: "round-4",
        title: "Round 4",
        subtitle: "Quarterfinals • Best of 3",
        type: "Knockout",
        matches: round4Matches,
      },
      {
        id: "round-5",
        title: "Round 5",
        subtitle: "Semifinals • Best of 3",
        type: "Knockout",
        matches: round5Matches,
      },
      {
        id: "round-6",
        title: "Round 6",
        subtitle: "Final • Best of 3",
        type: "Knockout",
        matches: round6Match,
      },
    ],
  };
};

export const tournaments: Tournament[] = [
  {
    id: "city-championship",
    name: "City Championship",
    type: "Singles",
    date: "12 Aug 2026",
    members: tournamentMembers,
  },
  {
    id: "night-shift-classic",
    name: "Night Shift Classic",
    type: "Doubles",
    date: "19 Aug 2026",
    members: tournamentMembers,
  },
  {
    id: "green-room-open",
    name: "Green Room Open",
    type: "Singles",
    date: "02 Sep 2026",
    members: tournamentMembers,
  },
  {
    id: "club-cup",
    name: "Club Cup",
    type: "Doubles",
    date: "16 Sep 2026",
    members: tournamentMembers,
  },
  {
    id: "harbour-showdown",
    name: "Harbour Showdown",
    type: "Singles",
    date: "30 Sep 2026",
    members: tournamentMembers,
  },
];

export const tournamentFixtures: Record<string, TournamentFixture> = {
  "city-championship": buildFixture(),
  "night-shift-classic": buildFixture(),
  "green-room-open": buildFixture(),
  "club-cup": buildFixture(),
  "harbour-showdown": buildFixture(),
};

export function getTournamentFixture(id: string): TournamentFixture {
  return tournamentFixtures[id] ?? tournamentFixtures["city-championship"];
}

export const contactInfo = {
  address: "42 Green Lane, Eastside District",
  phone: "+44 20 5555 0188",
  email: "hello@snookersyndicate.co",
  hours: "Mon-Sat: 10:00 - 21:00, Sun: 11:00 - 18:00",
};
