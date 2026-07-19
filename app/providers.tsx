"use client";

import { ReactNode } from "react";
import { AuthProvider } from "./context/AuthContext";
import { NavigationLoadingProvider } from "./context/NavigationLoadingContext";
import TournamentProviderClient from "./tournament/TournamentProviderClient";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <NavigationLoadingProvider>
        <TournamentProviderClient>{children}</TournamentProviderClient>
      </NavigationLoadingProvider>
    </AuthProvider>
  );
}
