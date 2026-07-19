"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import Loader from "../components/Loader";

interface NavigationLoadingContextValue {
  showNavigationLoader: (label?: string) => void;
  hideNavigationLoader: () => void;
}

const NavigationLoadingContext =
  createContext<NavigationLoadingContextValue | null>(null);

export function NavigationLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [loaderLabel, setLoaderLabel] = useState("Loading...");
  const [isVisible, setIsVisible] = useState(false);

  const showNavigationLoader = useCallback((label = "Loading...") => {
    setLoaderLabel(label);
    setIsVisible(true);
  }, []);

  const hideNavigationLoader = useCallback(() => {
    setIsVisible(false);
  }, []);

  const value = useMemo(
    () => ({ showNavigationLoader, hideNavigationLoader }),
    [hideNavigationLoader, showNavigationLoader],
  );

  return (
    <NavigationLoadingContext.Provider value={value}>
      {children}
      {isVisible ? (
        <div className="no-print fixed inset-0 z-[100] flex items-center justify-center bg-[#07110a]/92 px-4 backdrop-blur-sm">
          <Loader label={loaderLabel} className="text-white" />
        </div>
      ) : null}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const context = useContext(NavigationLoadingContext);
  if (!context) {
    throw new Error(
      "useNavigationLoading must be used within NavigationLoadingProvider",
    );
  }

  return context;
}
