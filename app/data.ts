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

export const contactInfo = {
  address: "42 Green Lane, Eastside District",
  phone: "+44 20 5555 0188",
  email: "hello@snookersyndicate.co",
  hours: "Mon-Sat: 10:00 - 21:00, Sun: 11:00 - 18:00",
};
