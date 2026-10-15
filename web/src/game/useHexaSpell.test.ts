import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { PuzzleConfig } from "./engine";
import { useHexaSpell } from "./useHexaSpell";

// Centre R, outer A E I N S T. "NASTIER" uses all seven letters.
const PUZZLE: PuzzleConfig = { centre: "R", outer: ["A", "E", "I", "N", "S", "T"] };
const WORDS: ReadonlySet<string> = new Set(["rest", "stare", "nastier", "restrain", "tins"]);

function setup() {
  return renderHook(() => useHexaSpell(WORDS, { puzzle: PUZZLE }));
}

function type(result: ReturnType<typeof setup>["result"], word: string) {
  for (const letter of word) act(() => result.current.appendLetter(letter));
}

describe("useHexaSpell", () => {
  it("appendLetter adds a puzzle letter to the input, and ignores letters outside the puzzle", () => {
    const { result } = setup();
    act(() => result.current.appendLetter("r"));
    act(() => result.current.appendLetter("a"));
    act(() => result.current.appendLetter("b"));
    expect(result.current.input).toBe("RA");
  });

  it("deleteLetter removes the last character", () => {
    const { result } = setup();
    type(result, "ra");
    act(() => result.current.deleteLetter());
    expect(result.current.input).toBe("R");
  });

  it("submitWord with a valid word increases the score and adds the word to found", () => {
    const { result } = setup();
    type(result, "rest");
    act(() => result.current.submitWord());
    expect(result.current.score).toBe(1);
    expect(result.current.found).toEqual(["REST"]);
    expect(result.current.message).toBe("+1 pts 🎉");
    expect(result.current.input).toBe("");
  });

  it("submitWord scores a pangram with the bonus and says so", () => {
    const { result } = setup();
    type(result, "nastier");
    act(() => result.current.submitWord());
    expect(result.current.score).toBe(14);
    expect(result.current.message).toBe("+14 pts ✨ PANGRAM!");
  });

  it("submitWord with a duplicate sets 'Already found' and does not score again", () => {
    const { result } = setup();
    type(result, "rest");
    act(() => result.current.submitWord());
    type(result, "rest");
    act(() => result.current.submitWord());
    expect(result.current.message).toBe("Already found");
    expect(result.current.score).toBe(1);
    expect(result.current.found).toHaveLength(1);
  });

  it("submitWord with a short word sets 'Too short'", () => {
    const { result } = setup();
    type(result, "res");
    act(() => result.current.submitWord());
    expect(result.current.message).toBe("Too short");
  });

  it("submitWord without the centre letter sets 'Missing centre'", () => {
    const { result } = setup();
    type(result, "tins");
    act(() => result.current.submitWord());
    expect(result.current.message).toBe("Missing centre");
  });

  it("submitWord with a word not in the list sets 'Not in word list'", () => {
    const { result } = setup();
    type(result, "retina");
    act(() => result.current.submitWord());
    expect(result.current.message).toBe("Not in word list");
    expect(result.current.score).toBe(0);
  });

  it("shuffleBoard keeps the same puzzle letters and changes the outer order", () => {
    const { result } = setup();
    const before = result.current.puzzle;
    let changed = false;
    for (let i = 0; i < 20 && !changed; i++) {
      act(() => result.current.shuffleBoard());
      changed = result.current.puzzle.outer.join("") !== before.outer.join("");
    }
    expect(result.current.puzzle.centre).toBe(before.centre);
    expect([...result.current.puzzle.outer].sort()).toEqual([...before.outer].sort());
    expect(changed).toBe(true);
  });
});
