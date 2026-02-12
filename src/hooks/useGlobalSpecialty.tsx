/**
 * Global Specialty Context
 * Manages which specialty is currently active across the entire app.
 */

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useEnabledSpecialties } from "./useEnabledSpecialties";
import { filterOfficialSpecialties } from "@/constants/officialSpecialties";

interface GlobalSpecialtyContextValue {
  activeSpecialtyId: string | null;
  setActiveSpecialtyId: (id: string) => void;
}

const GlobalSpecialtyContext = createContext<GlobalSpecialtyContextValue>({
  activeSpecialtyId: null,
  setActiveSpecialtyId: () => {},
});

export function useGlobalSpecialty() {
  return useContext(GlobalSpecialtyContext);
}

export { GlobalSpecialtyContext };

/**
 * Provider that manages the global active specialty state.
 * Should wrap the app layout.
 * 
 * Behavior:
 * - Defaults to the first official active specialty
 * - Persists selection in sessionStorage for tab persistence
 * - If the stored specialty becomes inactive, falls back to the first available
 */
export function GlobalSpecialtyProvider({ children }: { children: ReactNode }) {
  const { data: rawSpecialties = [] } = useEnabledSpecialties();
  const specialties = filterOfficialSpecialties(rawSpecialties);

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem("yesclin:activeSpecialtyId");
    } catch {
      return null;
    }
  });

  // Ensure stored value is still valid
  useEffect(() => {
    if (specialties.length === 0) return;
    const isValid = specialties.some((s) => s.id === activeId);
    if (!isValid) {
      setActiveId(specialties[0].id);
    }
  }, [specialties, activeId]);

  const setActiveSpecialtyId = useCallback((id: string) => {
    setActiveId(id);
    try {
      sessionStorage.setItem("yesclin:activeSpecialtyId", id);
    } catch {
      // ignore
    }
  }, []);

  return (
    <GlobalSpecialtyContext.Provider value={{ activeSpecialtyId: activeId, setActiveSpecialtyId }}>
      {typeof children === "function" ? null : children}
    </GlobalSpecialtyContext.Provider>
  );
}
