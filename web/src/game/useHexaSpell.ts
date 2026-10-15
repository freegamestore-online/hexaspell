import { useCallback, useReducer } from "react";
import {
  checkWord,
  generatePuzzle,
  isPangram,
  letterSet,
  scoreWord,
  shuffle,
  type PuzzleConfig,
  type WordCheck,
} from "./engine";

/**
 * The lowercase word lists. `valid` is every accepted word (bonus words included); `answers`
 * is the common subset that puzzles are built from.
 */
export interface WordLists {
  valid: ReadonlySet<string>;
  answers: ReadonlySet<string>;
}

export interface HexaSpellState {
  puzzle: PuzzleConfig;
  found: string[];
  score: number;
  input: string;
  message: string;
}

const REJECTIONS: Record<Exclude<WordCheck, "ok">, string> = {
  "too-short": "Too short",
  "missing-centre": "Missing centre",
  "bad-letters": "Letters not in puzzle",
  "not-in-list": "Not in word list",
};

type Action =
  | { type: "append"; letter: string }
  | { type: "delete" }
  | { type: "submit"; valid: ReadonlySet<string> }
  | { type: "shuffle"; rng: () => number };

function reduce(state: HexaSpellState, action: Action): HexaSpellState {
  switch (action.type) {
    case "append": {
      const letter = action.letter.toUpperCase();
      if (!/^[A-Z]$/.test(letter) || !letterSet(state.puzzle).has(letter)) return state;
      return { ...state, input: state.input + letter };
    }
    case "delete":
      return { ...state, input: state.input.slice(0, -1) };
    case "submit": {
      const word = state.input.toUpperCase();
      const reject = (message: string): HexaSpellState => ({ ...state, input: "", message });
      const check = checkWord(word, state.puzzle, action.valid);
      if (check !== "ok") return reject(REJECTIONS[check]);
      if (state.found.includes(word)) return reject("Already found");

      const points = scoreWord(word, state.puzzle);
      const message = isPangram(word, state.puzzle)
        ? `+${points} pts ✨ PANGRAM!`
        : `+${points} pts 🎉`;
      return {
        ...state,
        found: [...state.found, word],
        score: state.score + points,
        input: "",
        message,
      };
    }
    case "shuffle":
      return { ...state, puzzle: shuffle(state.puzzle, action.rng) };
  }
}

export interface HexaSpellOptions {
  /** Play this board instead of a generated one. */
  puzzle?: PuzzleConfig;
  /** Restore a saved game's words and score. Read once, when the game starts. */
  initial?: { found: string[]; score: number };
}

/**
 * The HexaSpell game state. Words are checked against `lists.valid`, and generated puzzles
 * are built from `lists.answers`.
 */
export function useHexaSpell(lists: WordLists, options: HexaSpellOptions = {}) {
  const [state, dispatch] = useReducer(
    reduce,
    lists,
    (l): HexaSpellState => ({
      puzzle: options.puzzle ?? generatePuzzle(undefined, l.answers),
      found: options.initial?.found ?? [],
      score: options.initial?.score ?? 0,
      input: "",
      message: "",
    }),
  );

  const appendLetter = useCallback((letter: string) => dispatch({ type: "append", letter }), []);
  const deleteLetter = useCallback(() => dispatch({ type: "delete" }), []);
  const submitWord = useCallback(() => dispatch({ type: "submit", valid: lists.valid }), [lists.valid]);
  const shuffleBoard = useCallback(() => dispatch({ type: "shuffle", rng: Math.random }), []);

  return { ...state, appendLetter, deleteLetter, submitWord, shuffleBoard };
}
