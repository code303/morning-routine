import type { DayVariant } from './types';

/** Festes Startdatum der A/B-Zählung (SPEC: 2026-01-01). */
export const AB_EPOCH = { year: 2026, month: 1, day: 1 } as const;

const MS_PER_DAY = 86_400_000;

/** Kalendertage seit dem Startdatum – nur Jahr/Monat/Tag, unabhängig von Uhrzeit und Zeitumstellung. */
export function dayIndex(date: Date): number {
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  const epoch = Date.UTC(AB_EPOCH.year, AB_EPOCH.month - 1, AB_EPOCH.day);
  return Math.round((today - epoch) / MS_PER_DAY);
}

/** Gerader Tagesindex = A, ungerader = B. */
export function dayVariant(date: Date): DayVariant {
  return ((dayIndex(date) % 2) + 2) % 2 === 0 ? 'A' : 'B';
}
