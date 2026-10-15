import { defaultStore, readJson, writeJson, type KeyValueStore } from "../lib/storage";
import { isDateKey, utcDate } from "./daily";

export const SAVE_PREFIX = "hexaspell.daily.";

/** Today's progress: the score, its rank, and the words found so far. */
export interface DailySave {
  date: string;
  score: number;
  rank: string;
  foundWords: string[];
}

function isSave(value: unknown): value is DailySave {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.date === "string" &&
    isDateKey(v.date) &&
    typeof v.score === "number" &&
    Number.isFinite(v.score) &&
    typeof v.rank === "string" &&
    Array.isArray(v.foundWords) &&
    v.foundWords.every((w) => typeof w === "string")
  );
}

/** Saves progress under the given UTC date. */
export function saveProgress(
  date: string,
  progress: Omit<DailySave, "date">,
  store: KeyValueStore | null = defaultStore(),
): void {
  writeJson(store, SAVE_PREFIX + date, { date, ...progress });
}

/** The saved progress for a date, or null if there is none or it is malformed. */
export function loadProgress(date: string, store: KeyValueStore | null = defaultStore()): DailySave | null {
  const saved = readJson<unknown>(store, SAVE_PREFIX + date);
  return isSave(saved) && saved.date === date ? saved : null;
}

/** Removes the saved progress for a date. Defaults to today (UTC). */
export function clearSave(
  date: string = utcDate(),
  store: KeyValueStore | null = defaultStore(),
): void {
  try {
    store?.removeItem(SAVE_PREFIX + date);
  } catch {
    // Storage unavailable: nothing was saved, so there is nothing to clear.
  }
}
