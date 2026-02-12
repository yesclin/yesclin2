/**
 * YESCLIN OFFICIAL SPECIALTY WHITELIST
 * 
 * This is the SINGLE SOURCE OF TRUTH for all officially supported specialties.
 * NO other specialty should appear anywhere in the system.
 * 
 * This list is CLOSED and IMMUTABLE at the code level.
 * Any specialty not in this list must be blocked from:
 * - Activation in Configurações > Clínica
 * - Display in the header badge
 * - Agenda, Prontuário, Modelos, Procedimentos, Relatórios, Marketing
 * 
 * RULE: Yesclin is NOT an unlimited-specialty system.
 * It is a closed modular system with officially supported specialties.
 */

/**
 * The ONLY valid specialty names in Yesclin.
 * Used as a whitelist filter across the entire application.
 */
export const OFFICIAL_SPECIALTY_NAMES: readonly string[] = [
  "Clínica Geral",
  "Psicologia",
  "Nutrição",
  "Fisioterapia",
  "Pilates",
  "Estética / Harmonização Facial",
  "Odontologia",
  "Dermatologia",
  "Pediatria",
] as const;

/**
 * Check if a specialty name is in the official whitelist.
 * Case-insensitive comparison with trimming.
 */
export function isOfficialSpecialty(name: string): boolean {
  const normalized = name.trim().toLowerCase();
  return OFFICIAL_SPECIALTY_NAMES.some(
    (official) => official.toLowerCase() === normalized
  );
}

/**
 * Filter an array of specialties to only include official ones.
 * Generic to work with any object that has a `name` property.
 */
export function filterOfficialSpecialties<T extends { name: string }>(
  specialties: T[]
): T[] {
  return specialties.filter((s) => isOfficialSpecialty(s.name));
}
