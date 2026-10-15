import { defaultStore, readJson, writeJson, type KeyValueStore } from "../lib/storage";
import { isDateKey } from "./daily";

export const LEADERBOARD_KEY = "hexaspell.leaderboard";

/** One player's result for one UTC day. */
export interface LeaderboardEntry {
  date: string;
  playerName: string;
  score: number;
  rank: string;
}

export type SubmitResult = { ok: true } | { ok: false; reason: "Invalid game" };

function isEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.date === "string" &&
    isDateKey(v.date) &&
    typeof v.playerName === "string" &&
    v.playerName.trim() !== "" &&
    typeof v.score === "number" &&
    Number.isInteger(v.score) &&
    v.score >= 0 &&
    typeof v.rank === "string" &&
    v.rank !== ""
  );
}

/** The stored entries. Malformed ones are dropped, and a malformed list reads as empty. */
function readEntries(store: KeyValueStore | null): LeaderboardEntry[] {
  const raw = readJson<unknown>(store, LEADERBOARD_KEY);
  return Array.isArray(raw) ? raw.filter(isEntry) : [];
}

/**
 * Adds an entry and saves it. A player has one entry per UTC day, so a later, higher score
 * for the same day replaces the earlier one. A malformed entry is rejected quietly.
 */
export function submitScore(
  entry: LeaderboardEntry,
  store: KeyValueStore | null = defaultStore(),
): SubmitResult {
  try {
    if (!isEntry(entry)) return { ok: false, reason: "Invalid game" };
    const entries = readEntries(store);
    const index = entries.findIndex((e) => e.date === entry.date && e.playerName === entry.playerName);
    if (index === -1) entries.push(entry);
    else if (entries[index]!.score < entry.score) entries[index] = entry;
    writeJson(store, LEADERBOARD_KEY, entries);
    return { ok: true };
  } catch {
    return { ok: false, reason: "Invalid game" };
  }
}

/** Every entry, highest score first. Equal scores put the newer date first. */
export function getLeaderboard(store: KeyValueStore | null = defaultStore()): LeaderboardEntry[] {
  return [...readEntries(store)].sort((a, b) => b.score - a.score || b.date.localeCompare(a.date));
}
