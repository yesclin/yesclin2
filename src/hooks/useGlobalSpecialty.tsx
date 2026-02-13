/**
 * Global Specialty Context
 * 
 * FULLY DERIVED — No local state, no localStorage.
 * The active specialty is computed from enabled specialties (React Query).
 * Changes in Configurações > Clínica invalidate the cache → automatic re-render.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useEnabledSpecialties, type EnabledSpecialty } from "./useEnabledSpecialties";
import { filterOfficialSpecialties } from "@/constants/officialSpecialties";

interface GlobalSpecialtyContextValue {
  /** All enabled official specialties for this clinic */
  enabledSpecialties: EnabledSpecialty[];
  /** Whether only one specialty is enabled */
  isSingleSpecialty: boolean;
}

const GlobalSpecialtyContext = createContext<GlobalSpecialtyContextValue>({
  enabledSpecialties: [],
  isSingleSpecialty: false,
});

export function useGlobalSpecialty() {
  return useContext(GlobalSpecialtyContext);
}

export { GlobalSpecialtyContext };

/**
 * Provider that exposes enabled specialties from the DB (via React Query).
 * No state, no localStorage, no manual selection.
 * The Prontuário derives the effective specialty from this list + appointment.
 */
export function GlobalSpecialtyProvider({ children }: { children: ReactNode }) {
  const { data: rawSpecialties = [] } = useEnabledSpecialties();
  const specialties = useMemo(() => filterOfficialSpecialties(rawSpecialties), [rawSpecialties]);

  const value = useMemo((): GlobalSpecialtyContextValue => ({
    enabledSpecialties: specialties,
    isSingleSpecialty: specialties.length <= 1,
  }), [specialties]);

  return (
    <GlobalSpecialtyContext.Provider value={value}>
      {children}
    </GlobalSpecialtyContext.Provider>
  );
}
