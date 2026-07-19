import { ReactNode } from "react";
import TournamentProviderClient from "./TournamentProviderClient";

export default function TournamentLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <TournamentProviderClient>{children}</TournamentProviderClient>;
}
