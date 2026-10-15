import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildWordlist } from "../words/wordlist";
import { buildBoard } from "./board";
import {
  MAX_ANSWERS,
  MIN_ANSWERS,
  checkWord,
  countAnswers,
  generatePuzzle,
  isPangram,
  isValidWord,
  scoreWord,
  shuffle,
  type PuzzleConfig,
} from "./engine";

// Centre R, outer A E I N S T. "NASTIER" uses all seven letters.
const PUZZLE: PuzzleConfig = { centre: "R", outer: ["A", "E", "I", "N", "S", "T"] };

describe("isValidWord", () => {
  it("accepts a word of four or more letters that uses the centre and only puzzle letters", () => {
    expect(isValidWord("rest", PUZZLE)).toBe(true);
    expect(isValidWord("STARE", PUZZLE)).toBe(true);
  });

  it("rejects words shorter than four letters", () => {
    expect(isValidWord("res", PUZZLE)).toBe(false);
    expect(isValidWord("ar", PUZZLE)).toBe(false);
  });

  it("rejects words that do not contain the centre letter", () => {
    expect(isValidWord("tins", PUZZLE)).toBe(false);
  });

  it("rejects words that use letters outside the seven", () => {
    expect(isValidWord("bear", PUZZLE)).toBe(false);
    expect(isValidWord("ratio", PUZZLE)).toBe(false);
  });
});

describe("checkWord", () => {
  const valid = new Set(["rest", "restrain"]);

  it("reports why a word is rejected, in order", () => {
    expect(checkWord("res", PUZZLE)).toBe("too-short");
    expect(checkWord("tins", PUZZLE)).toBe("missing-centre");
    expect(checkWord("bear", PUZZLE)).toBe("bad-letters");
    expect(checkWord("retina", PUZZLE, valid)).toBe("not-in-list");
  });

  it("accepts a word that is in the list, and the puzzle rules alone when no list is given", () => {
    expect(checkWord("REST", PUZZLE, valid)).toBe("ok");
    expect(checkWord("stare", PUZZLE)).toBe("ok");
  });

  it("accepts a valid bonus word that is outside the common answers", () => {
    const bonusOnly = new Set(["restrain"]);
    expect(checkWord("restrain", PUZZLE, bonusOnly)).toBe("ok");
  });
});

describe("isPangram", () => {
  it("is true only for a valid word that uses all seven letters", () => {
    expect(isPangram("nastier", PUZZLE)).toBe(true);
    expect(isPangram("restrain", PUZZLE)).toBe(true);
    expect(isPangram("stare", PUZZLE)).toBe(false);
    expect(isPangram("tins", PUZZLE)).toBe(false);
  });
});

describe("scoreWord", () => {
  it("scores a four-letter word at 1 point", () => {
    expect(scoreWord("rest", PUZZLE)).toBe(1);
  });

  it("scores a longer word at one point per letter", () => {
    expect(scoreWord("stare", PUZZLE)).toBe(5);
  });

  it("adds the pangram bonus of 7 to a pangram", () => {
    expect(scoreWord("nastier", PUZZLE)).toBe(7 + 7);
    expect(scoreWord("restrain", PUZZLE)).toBe(8 + 7);
  });

  it("scores an invalid word at 0", () => {
    expect(scoreWord("tins", PUZZLE)).toBe(0);
  });
});

describe("shuffle", () => {
  it("keeps the centre fixed and the outer letters as the same set", () => {
    const shuffled = shuffle(PUZZLE);
    expect(shuffled.centre).toBe("R");
    expect([...shuffled.outer].sort()).toEqual([...PUZZLE.outer].sort());
  });

  it("usually changes the order of the outer letters", () => {
    const orders = new Set(Array.from({ length: 20 }, () => shuffle(PUZZLE).outer.join("")));
    expect(orders.size).toBeGreaterThan(1);
  });
});

describe("buildBoard", () => {
  const cells = buildBoard(PUZZLE, 300, 300);

  it("returns seven cells with exactly one centre", () => {
    expect(cells).toHaveLength(7);
    expect(cells.filter((c) => c.isCentre)).toHaveLength(1);
  });

  it("puts the centre cell at the middle of the viewport", () => {
    const centre = cells.find((c) => c.isCentre)!;
    expect(centre.letter).toBe("R");
    expect(centre.cx).toBeCloseTo(150);
    expect(centre.cy).toBeCloseTo(150);
  });

  it("places the six outer hexes a touching distance from the centre", () => {
    const centre = cells.find((c) => c.isCentre)!;
    for (const cell of cells.filter((c) => !c.isCentre)) {
      const distance = Math.hypot(cell.cx - centre.cx, cell.cy - centre.cy);
      expect(distance).toBeCloseTo(Math.sqrt(3) * centre.r);
    }
  });

  it("keeps every hex inside the viewport", () => {
    const halfHeight = (Math.sqrt(3) / 2);
    for (const cell of cells) {
      expect(cell.cx - cell.r).toBeGreaterThanOrEqual(-1e-9);
      expect(cell.cx + cell.r).toBeLessThanOrEqual(300 + 1e-9);
      expect(cell.cy - halfHeight * cell.r).toBeGreaterThanOrEqual(-1e-9);
      expect(cell.cy + halfHeight * cell.r).toBeLessThanOrEqual(300 + 1e-9);
    }
  });
});

describe("generatePuzzle", () => {
  const answers = buildWordlist(readFileSync(join(process.cwd(), "public/wordlists/common.txt"), "utf8"));

  it("is deterministic for a given seed", () => {
    expect(generatePuzzle("daily-1", answers)).toEqual(generatePuzzle("daily-1", answers));
  });

  it("uses the 20–60 answer range from the issue", () => {
    expect(MIN_ANSWERS).toBe(20);
    expect(MAX_ANSWERS).toBe(60);
  });

  // Every generated puzzle must have a pangram and an answer count in range.
  it.each(Array.from({ length: 30 }, (_, i) => `seed-${i}`))(
    "builds a puzzle for %s with a pangram and 20–60 answers",
    (seed) => {
      const config = generatePuzzle(seed, answers);
      expect(new Set([config.centre, ...config.outer]).size).toBe(7);
      expect([...answers].some((w) => isPangram(w, config))).toBe(true);
      const count = countAnswers(config, answers);
      expect(count).toBeGreaterThanOrEqual(MIN_ANSWERS);
      expect(count).toBeLessThanOrEqual(MAX_ANSWERS);
    },
  );

  it("without a word list, still gives seven distinct letters with a vowel", () => {
    for (let i = 0; i < 20; i++) {
      const config = generatePuzzle(`seed-${i}`);
      const letters = [config.centre, ...config.outer];
      expect(new Set(letters).size).toBe(7);
      expect(letters.some((l) => "AEIOU".includes(l))).toBe(true);
    }
  });
});
