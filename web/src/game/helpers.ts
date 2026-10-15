/** Free helpers for a puzzle: pure calculations over its answers. Nothing here costs anything. */
import { checkWord, type PuzzleConfig } from "./engine";

/** Every answer to the puzzle in the list, sorted. */
export function answersFor(puzzle: PuzzleConfig, answers: ReadonlySet<string>): string[] {
  return [...answers]
    .filter((w) => checkWord(w, puzzle) === "ok")
    .map((w) => w.toUpperCase())
    .sort();
}

export interface HintGrid {
  /** Word lengths across the top, from the shortest answer to the longest. */
  lengths: number[];
  /** One row per first letter, sorted. `counts[i]` is the answers of `lengths[i]` long. */
  rows: { letter: string; counts: number[]; total: number }[];
  total: number;
}

/** Counts answers by first letter and by length. Lengths and letters with no answers are left out. */
export function hintGrid(answers: readonly string[]): HintGrid {
  if (answers.length === 0) return { lengths: [], rows: [], total: 0 };
  const lengths = [...new Set(answers.map((w) => w.length))].sort((a, b) => a - b);
  const byLetter = new Map<string, number[]>();
  for (const word of answers) {
    const letter = word[0]!;
    const counts = byLetter.get(letter) ?? lengths.map(() => 0);
    counts[lengths.indexOf(word.length)]! += 1;
    byLetter.set(letter, counts);
  }
  const rows = [...byLetter.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([letter, counts]) => ({ letter, counts, total: counts.reduce((s, n) => s + n, 0) }));
  return { lengths, rows, total: answers.length };
}

/** Every two-letter start that begins at least one answer, sorted. */
export function twoLetterStarts(answers: readonly string[]): string[] {
  return [...new Set(answers.filter((w) => w.length >= 2).map((w) => w.slice(0, 2)))].sort();
}
