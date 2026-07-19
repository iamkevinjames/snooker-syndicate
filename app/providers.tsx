"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./context/AuthContext";
import TournamentProviderClient from "./tournament/TournamentProviderClient";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <TournamentProviderClient>{children}</TournamentProviderClient>
    </AuthProvider>
  );
}
