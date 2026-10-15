import { describe, expect, it } from "vitest";
import { memoryStore } from "../test/memoryStore";
import { LEADERBOARD_KEY, getLeaderboard, submitScore } from "./leaderboard";

const entry = (overrides: Partial<{ date: string; playerName: string; score: number; rank: string }> = {}) => ({
  date: "2026-10-16",
  playerName: "Player",
  score: 10,
  rank: "Good Start",
  ...overrides,
});

describe("leaderboard", () => {
  it("submits an entry and reads it back", () => {
    const store = memoryStore();
    expect(submitScore(entry(), store)).toEqual({ ok: true });
    expect(getLeaderboard(store)).toEqual([entry()]);
  });

  it("sorts by score, highest first, with equal scores putting the newer date first", () => {
    const store = memoryStore();
    submitScore(entry({ date: "2026-10-14", score: 30 }), store);
    submitScore(entry({ date: "2026-10-16", score: 50 }), store);
    submitScore(entry({ date: "2026-10-15", score: 30, playerName: "Other" }), store);
    expect(getLeaderboard(store).map((e) => [e.score, e.date])).toEqual([
      [50, "2026-10-16"],
      [30, "2026-10-15"],
      [30, "2026-10-14"],
    ]);
  });

  it("keeps one entry per player per day, at the higher score", () => {
    const store = memoryStore();
    submitScore(entry({ score: 20 }), store);
    submitScore(entry({ score: 35 }), store);
    submitScore(entry({ score: 12 }), store);
    expect(getLeaderboard(store)).toEqual([entry({ score: 35 })]);
  });

  it("rejects a malformed entry quietly, without throwing or saving it", () => {
    const store = memoryStore();
    const bad = [
      { ...entry(), date: "16/10/2026" },
      { ...entry(), playerName: "" },
      { ...entry(), score: -1 },
      { ...entry(), score: 1.5 },
      { ...entry(), rank: "" },
      null,
      "not an entry",
    ];
    for (const value of bad) {
      expect(submitScore(value as never, store)).toEqual({ ok: false, reason: "Invalid game" });
    }
    expect(getLeaderboard(store)).toEqual([]);
  });

  it("ignores malformed rows already in storage, and a malformed list reads as empty", () => {
    const store = memoryStore();
    store.setItem(LEADERBOARD_KEY, JSON.stringify([entry(), { date: "bad" }, 7]));
    expect(getLeaderboard(store)).toEqual([entry()]);
    store.setItem(LEADERBOARD_KEY, "{not json");
    expect(getLeaderboard(store)).toEqual([]);
  });

  it("works without storage, and never throws", () => {
    expect(submitScore(entry(), null)).toEqual({ ok: true });
    expect(getLeaderboard(null)).toEqual([]);
  });
});
