import { generatePuzzle, type PuzzleConfig } from "./engine";

/** The UTC calendar date for a moment, such as "2026-10-16". It keys each day's saved progress. */
export function utcDate(timestampMs: number = Date.now()): string {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

export function isDateKey(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** The UTC date one day before `date`, such as "2026-10-15" for "2026-10-16". */
export function previousDate(date: string): string {
  return utcDate(Date.parse(`${date}T00:00:00Z`) - 86_400_000);
}

/** Today's puzzle for a UTC date. The same date always gives the same letters. */
export function dailyPuzzle(date: string, answers: ReadonlySet<string>): PuzzleConfig {
  return generatePuzzle(`daily:${date}`, answers);
}

/** A practice puzzle. Pass a seed to get the same letters again; leave it out for a random set. */
export function getPracticeLetters(answers: ReadonlySet<string>, seed?: number): PuzzleConfig {
  return generatePuzzle(seed === undefined ? undefined : `practice:${seed}`, answers);
}
