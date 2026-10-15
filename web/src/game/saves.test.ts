import { describe, expect, it } from "vitest";
import { memoryStore } from "../test/memoryStore";
import { SAVE_PREFIX, clearSave, loadProgress, saveProgress } from "./saves";

const PROGRESS = { score: 12, rank: "Good Start", foundWords: ["REST", "STARE"] };

describe("saves", () => {
  it("round-trips today's progress through the store", () => {
    const store = memoryStore();
    saveProgress("2026-10-16", PROGRESS, store);
    expect(loadProgress("2026-10-16", store)).toEqual({ date: "2026-10-16", ...PROGRESS });
  });

  it("returns null when there is no save for the date", () => {
    expect(loadProgress("2026-10-16", memoryStore())).toBeNull();
  });

  it("returns null for a different date, so yesterday's game does not carry over", () => {
    const store = memoryStore();
    saveProgress("2026-10-15", PROGRESS, store);
    expect(loadProgress("2026-10-16", store)).toBeNull();
  });

  it("returns null for malformed data, without throwing", () => {
    const store = memoryStore();
    store.setItem(SAVE_PREFIX + "2026-10-16", "{not json");
    expect(loadProgress("2026-10-16", store)).toBeNull();
    store.setItem(SAVE_PREFIX + "2026-10-16", JSON.stringify({ date: "2026-10-16", score: "x" }));
    expect(loadProgress("2026-10-16", store)).toBeNull();
  });

  it("clearSave removes the day's progress", () => {
    const store = memoryStore();
    saveProgress("2026-10-16", PROGRESS, store);
    clearSave("2026-10-16", store);
    expect(loadProgress("2026-10-16", store)).toBeNull();
  });

  it("does nothing when storage is unavailable", () => {
    expect(() => saveProgress("2026-10-16", PROGRESS, null)).not.toThrow();
    expect(loadProgress("2026-10-16", null)).toBeNull();
    expect(() => clearSave("2026-10-16", null)).not.toThrow();
  });
});
