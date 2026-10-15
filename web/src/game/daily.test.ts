import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildWordlist } from "../words/wordlist";
import { dailyPuzzle, getPracticeLetters, isDateKey, utcDate } from "./daily";
import { isValidWord, letterSet } from "./engine";

const answers = buildWordlist(readFileSync(join(process.cwd(), "public/wordlists/common.txt"), "utf8"));

describe("utcDate", () => {
  it("gives the UTC calendar date, whatever the local time zone", () => {
    expect(utcDate(Date.UTC(2026, 9, 16, 23, 59, 59))).toBe("2026-10-16");
    expect(utcDate(Date.UTC(2026, 9, 17, 0, 0, 0))).toBe("2026-10-17");
  });
});

describe("isDateKey", () => {
  it("accepts YYYY-MM-DD only", () => {
    expect(isDateKey("2026-10-16")).toBe(true);
    expect(isDateKey("16/10/2026")).toBe(false);
    expect(isDateKey("2026-10-16T00:00")).toBe(false);
  });
});

describe("dailyPuzzle", () => {
  it("gives the same centre and outer letters for the same date every time", () => {
    expect(dailyPuzzle("2026-10-16", answers)).toEqual(dailyPuzzle("2026-10-16", answers));
  });

  it("can give different letters on a different date", () => {
    const dates = ["2026-10-16", "2026-10-17", "2026-10-18", "2026-10-19", "2026-10-20"];
    const sets = new Set(dates.map((d) => [...letterSet(dailyPuzzle(d, answers))].sort().join("")));
    expect(sets.size).toBeGreaterThan(1);
  });

  it("gives a playable puzzle: seven letters, and words to find", () => {
    const config = dailyPuzzle("2026-10-16", answers);
    expect(letterSet(config).size).toBe(7);
    expect([...answers].filter((w) => isValidWord(w, config)).length).toBeGreaterThan(0);
  });
});

describe("getPracticeLetters", () => {
  it("returns a valid random set when there is no seed", () => {
    const config = getPracticeLetters(answers);
    expect(letterSet(config).size).toBe(7);
  });

  it("gives the same set for the same seed", () => {
    expect(getPracticeLetters(answers, 42)).toEqual(getPracticeLetters(answers, 42));
  });
});
