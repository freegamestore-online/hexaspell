import { useCallback, useReducer } from "react";
import {
  MIN_WORD_LENGTH,
  generatePuzzle,
  isPangram,
  letterSet,
  scoreWord,
  shuffle,
  type PuzzleConfig,
} from "./engine";

export interface HexaSpellState {
  puzzle: PuzzleConfig;
  found: string[];
  score: number;
  input: string;
  message: string;
}

type Action =
  | { type: "append"; letter: string }
  | { type: "delete" }
  | { type: "submit"; words: ReadonlySet<string> }
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
      if (word.length < MIN_WORD_LENGTH) return reject("Too short");
      if (!word.includes(state.puzzle.centre)) return reject("Missing centre");
      if (state.found.includes(word)) return reject("Already found");
      if (!action.words.has(word.toLowerCase())) return reject("Not in word list");

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

/**
 * The HexaSpell game state. `words` is the lowercase word list that answers are checked
 * against. Pass `puzzle` to play a fixed board instead of a generated one.
 */
export function useHexaSpell(
  words: ReadonlySet<string>,
  options: { puzzle?: PuzzleConfig } = {},
) {
  const [state, dispatch] = useReducer(
    reduce,
    words,
    (w): HexaSpellState => ({
      puzzle: options.puzzle ?? generatePuzzle(undefined, w),
      found: [],
      score: 0,
      input: "",
      message: "",
    }),
  );

  const appendLetter = useCallback((letter: string) => dispatch({ type: "append", letter }), []);
  const deleteLetter = useCallback(() => dispatch({ type: "delete" }), []);
  const submitWord = useCallback(() => dispatch({ type: "submit", words }), [words]);
  const shuffleBoard = useCallback(() => dispatch({ type: "shuffle", rng: Math.random }), []);

  return { ...state, appendLetter, deleteLetter, submitWord, shuffleBoard };
}
