/** Pure HexaSpell rules: puzzle generation, word validation, scoring and shuffling. */

/** The six outer letters, in board order. */
export type Outer = [string, string, string, string, string, string];

/** A puzzle: seven distinct uppercase letters. Every word must use the centre letter. */
export interface PuzzleConfig {
  centre: string;
  outer: Outer;
}

export const MIN_WORD_LENGTH = 4;
export const PANGRAM_BONUS = 7;
/** With a word list, generatePuzzle keeps trying until a puzzle has at least this many answers. */
export const MIN_ANSWERS = 15;
const PUZZLE_ATTEMPTS = 200;
const VOWELS = "AEIOU";
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

type Rng = () => number;

function hashSeed(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32: a small seeded PRNG, so the same seed always gives the same puzzle. */
function seededRng(seed: string): Rng {
  let state = hashSeed(seed);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeRng(seed?: string): Rng {
  return seed === undefined ? Math.random : seededRng(seed);
}

function pick<T>(items: readonly T[], rng: Rng): T {
  return items[Math.floor(rng() * items.length)]!;
}

function shuffled<T>(items: readonly T[], rng: Rng): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const held = out[i]!;
    out[i] = out[j]!;
    out[j] = held;
  }
  return out;
}

function asOuter(letters: readonly string[]): Outer {
  if (letters.length !== 6) throw new Error(`Expected 6 outer letters, got ${letters.length}`);
  return letters as Outer;
}

function normalise(word: string): string {
  return word.trim().toUpperCase();
}

export function letterSet(config: PuzzleConfig): Set<string> {
  return new Set([config.centre, ...config.outer]);
}

function fitsPuzzle(word: string, letters: ReadonlySet<string>, centre: string): boolean {
  const w = normalise(word);
  return w.length >= MIN_WORD_LENGTH && w.includes(centre) && [...w].every((l) => letters.has(l));
}

/** At least four letters, uses the centre letter, and uses only the puzzle's letters. */
export function isValidWord(word: string, config: PuzzleConfig): boolean {
  return fitsPuzzle(word, letterSet(config), config.centre);
}

/** A valid word that uses all seven letters. */
export function isPangram(word: string, config: PuzzleConfig): boolean {
  return isValidWord(word, config) && new Set(normalise(word)).size === letterSet(config).size;
}

/** 4-letter words score 1; longer words score their length; a pangram adds PANGRAM_BONUS. */
export function scoreWord(word: string, config: PuzzleConfig): number {
  if (!isValidWord(word, config)) return 0;
  const length = normalise(word).length;
  const base = length === MIN_WORD_LENGTH ? 1 : length;
  return base + (isPangram(word, config) ? PANGRAM_BONUS : 0);
}

/** How many words in the list are answers to this puzzle. */
export function countAnswers(config: PuzzleConfig, words: ReadonlySet<string>): number {
  const letters = letterSet(config);
  let count = 0;
  for (const word of words) if (fitsPuzzle(word, letters, config.centre)) count++;
  return count;
}

/** Puts the letters in a random order around a random centre. */
function puzzleFrom(letters: readonly string[], rng: Rng): PuzzleConfig {
  const centre = pick(letters, rng);
  return { centre, outer: asOuter(shuffled(letters.filter((l) => l !== centre), rng)) };
}

/** Seven distinct letters with at least one vowel. Used only when there is no word list. */
function randomLetters(rng: Rng): string[] {
  const vowel = pick([...VOWELS], rng);
  const rest = shuffled([...ALPHABET].filter((l) => l !== vowel), rng).slice(0, 6);
  return [vowel, ...rest];
}

/** A word of seven or more lowercase letters with exactly seven distinct letters. */
function isPangramCandidate(word: string): boolean {
  return /^[a-z]{7,}$/.test(word) && new Set(word).size === 7;
}

/**
 * Builds a puzzle. Given a word list, the letters come from a real pangram in it, so the
 * puzzle always has at least one pangram, and the puzzle is kept only if it has at least
 * MIN_ANSWERS answers. Without a word list, the letters are random (with a vowel).
 * The same seed always gives the same puzzle.
 */
export function generatePuzzle(seed?: string, words?: ReadonlySet<string>): PuzzleConfig {
  const rng = makeRng(seed);
  if (!words) return puzzleFrom(randomLetters(rng), rng);

  const sources = [...words].filter(isPangramCandidate);
  if (sources.length === 0) throw new Error("Word list has no pangram candidates");

  let best: { config: PuzzleConfig; answers: number } | null = null;
  for (let attempt = 0; attempt < PUZZLE_ATTEMPTS; attempt++) {
    const letters = [...new Set(pick(sources, rng).toUpperCase())];
    const config = puzzleFrom(letters, rng);
    const answers = countAnswers(config, words);
    if (answers >= MIN_ANSWERS) return config;
    if (!best || answers > best.answers) best = { config, answers };
  }
  return best!.config;
}

/** Same centre and outer letters, in a new random order. */
export function shuffle(config: PuzzleConfig, rng: Rng = Math.random): PuzzleConfig {
  return { centre: config.centre, outer: asOuter(shuffled(config.outer, rng)) };
}
