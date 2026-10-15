import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildWordlist } from "../words/wordlist";
import { dailyPuzzle, previousDate } from "./daily";
import { answersFor, hintGrid, twoLetterStarts } from "./helpers";
import type { PuzzleConfig } from "./engine";

const PUZZLE: PuzzleConfig = { centre: "R", outer: ["A", "E", "I", "N", "S", "T"] };
const SMALL = new Set(["rest", "rent", "stare", "tear", "nastier", "tins", "bear"]);

describe("answersFor", () => {
  it("keeps only the words that answer the puzzle, uppercased and sorted", () => {
    expect(answersFor(PUZZLE, SMALL)).toEqual(["NASTIER", "RENT", "REST", "STARE", "TEAR"]);
  });
});

describe("hintGrid", () => {
  it("counts answers by first letter and by length", () => {
    const grid = hintGrid(["REST", "RENT", "STARE", "TEAR"]);
    expect(grid.lengths).toEqual([4, 5]);
    expect(grid.total).toBe(4);
    expect(grid.rows).toEqual([
      { letter: "R", counts: [2, 0], total: 2 },
      { letter: "S", counts: [0, 1], total: 1 },
      { letter: "T", counts: [1, 0], total: 1 },
    ]);
  });

  it("is empty when there are no answers", () => {
    expect(hintGrid([])).toEqual({ lengths: [], rows: [], total: 0 });
  });

  it("totals agree with the answer count", () => {
    const answers = answersFor(PUZZLE, SMALL);
    const grid = hintGrid(answers);
    expect(grid.rows.reduce((s, r) => s + r.total, 0)).toBe(answers.length);
  });
});

describe("twoLetterStarts", () => {
  it("lists each two-letter start once, sorted", () => {
    expect(twoLetterStarts(["REST", "RENT", "STARE", "TEAR"])).toEqual(["RE", "ST", "TE"]);
  });
});

describe("yesterday's answers", () => {
  const answers = buildWordlist(readFileSync(join(process.cwd(), "public/wordlists/common.txt"), "utf8"));

  it("steps back one UTC day, across a month boundary", () => {
    expect(previousDate("2026-10-16")).toBe("2026-10-15");
    expect(previousDate("2026-11-01")).toBe("2026-10-31");
    expect(previousDate("2026-01-01")).toBe("2025-12-31");
  });

  it("reproduces yesterday's daily puzzle answers from its date", () => {
    const yesterday = previousDate("2026-10-16");
    const first = answersFor(dailyPuzzle(yesterday, answers), answers);
    expect(first.length).toBeGreaterThan(0);
    expect(answersFor(dailyPuzzle(yesterday, answers), answers)).toEqual(first);
  });
});
