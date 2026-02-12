/**
 * Global Specialty Context
 * Manages which specialty is currently active across the entire app.
 * 
 * ARCHITECTURE RULE:
 * - Configurações > Clínica enables MULTIPLE specialties
 * - But the system operates with ONE active specialty at a time
 * - This context holds that single active specialty
 */

import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useEnabledSpecialties, type EnabledSpecialty } from "./useEnabledSpecialties";
import { filterOfficialSpecialties } from "@/constants/officialSpecialties";

interface GlobalSpecialtyContextValue {
  /** The ID of the currently active specialty */
  activeSpecialtyId: string | null;
  /** The full active specialty object */
  activeSpecialty: EnabledSpecialty | null;
  /** The name of the active specialty */
  activeSpecialtyName: string | null;
  /** All enabled official specialties for this clinic */
  enabledSpecialties: EnabledSpecialty[];
  /** Whether only one specialty is enabled (hides dropdown) */
  isSingleSpecialty: boolean;
  /** Change the active specialty */
  setActiveSpecialtyId: (id: string) => void;
}

const GlobalSpecialtyContext = createContext<GlobalSpecialtyContextValue>({
  activeSpecialtyId: null,
  activeSpecialty: null,
  activeSpecialtyName: null,
  enabledSpecialties: [],
  isSingleSpecialty: false,
  setActiveSpecialtyId: () => {},
});

export function useGlobalSpecialty() {
  return useContext(GlobalSpecialtyContext);
}

export { GlobalSpecialtyContext };

const STORAGE_KEY = "yesclin:activeSpecialtyId";

/**
 * Provider that manages the global active specialty state.
 * Wraps the app layout.
 * 
 * Behavior:
 * - Defaults to the first official active specialty
 * - Persists selection in localStorage across sessions
 * - Falls back if stored specialty becomes inactive
 * - Exposes full specialty object and name for convenience
 */
export function GlobalSpecialtyProvider({ children }: { children: ReactNode }) {
  const { data: rawSpecialties = [] } = useEnabledSpecialties();
  const specialties = useMemo(() => filterOfficialSpecialties(rawSpecialties), [rawSpecialties]);

  const [activeId, setActiveId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  });

  // Ensure stored value is still valid; fall back to first available
  useEffect(() => {
    if (specialties.length === 0) return;
    const isValid = specialties.some((s) => s.id === activeId);
    if (!isValid) {
      const fallback = specialties[0].id;
      setActiveId(fallback);
      try { localStorage.setItem(STORAGE_KEY, fallback); } catch { /* ignore */ }
    }
  }, [specialties, activeId]);

  const setActiveSpecialtyId = useCallback((id: string) => {
    setActiveId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const value = useMemo((): GlobalSpecialtyContextValue => {
    const active = specialties.find((s) => s.id === activeId) || specialties[0] || null;
    return {
      activeSpecialtyId: active?.id || null,
      activeSpecialty: active,
      activeSpecialtyName: active?.name || null,
      enabledSpecialties: specialties,
      isSingleSpecialty: specialties.length <= 1,
      setActiveSpecialtyId,
    };
  }, [activeId, specialties, setActiveSpecialtyId]);

  return (
    <GlobalSpecialtyContext.Provider value={value}>
      {children}
    </GlobalSpecialtyContext.Provider>
  );
}
