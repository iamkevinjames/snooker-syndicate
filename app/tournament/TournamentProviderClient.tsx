"use client";

import { ReactNode } from "react";
import { TournamentProvider } from "./context/TournamentContext";

export default function TournamentProviderClient({
  children,
}: {
  children: ReactNode;
}) {
  return <TournamentProvider>{children}</TournamentProvider>;
}
