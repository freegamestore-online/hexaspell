import { useMemo, useState } from "react";
import { previousDate, dailyPuzzle } from "./daily";
import type { PuzzleConfig } from "./engine";
import { answersFor, hintGrid, twoLetterStarts } from "./helpers";
import type { WordLists } from "./useHexaSpell";

interface HelpersProps {
  puzzle: PuzzleConfig;
  lists: WordLists;
  /** The UTC date of the session, used to find yesterday's puzzle. */
  date: string;
}

/**
 * Three free helpers for the current puzzle: a hint grid, the two-letter starts, and
 * yesterday's answers. None of them is a purchase, and none is gated.
 */
export function Helpers({ puzzle, lists, date }: HelpersProps) {
  const answers = useMemo(() => answersFor(puzzle, lists.answers), [puzzle, lists.answers]);
  const grid = useMemo(() => hintGrid(answers), [answers]);
  const starts = useMemo(() => twoLetterStarts(answers), [answers]);
  const [yesterday, setYesterday] = useState<string[] | null>(null);

  const cell = { padding: "0.15rem 0.4rem", textAlign: "center" as const };

  return (
    <details className="w-full max-w-sm text-sm" style={{ color: "var(--ink)" }}>
      <summary className="cursor-pointer font-semibold" style={{ color: "var(--accent)" }}>
        Helpers (free)
      </summary>

      <div className="flex flex-col gap-4 pt-3">
        <section aria-labelledby="hint-grid-heading">
          <h2 id="hint-grid-heading" className="font-semibold">
            Hint grid
          </h2>
          {grid.total === 0 ? (
            <p style={{ color: "var(--muted)" }}>No answers for this puzzle.</p>
          ) : (
            <table className="mt-1 w-full border-collapse">
              <caption className="sr-only">Answers by first letter and length</caption>
              <thead>
                <tr>
                  <th scope="col" style={cell}>
                    Letter
                  </th>
                  {grid.lengths.map((n) => (
                    <th key={n} scope="col" style={cell}>
                      {n}
                    </th>
                  ))}
                  <th scope="col" style={cell}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {grid.rows.map((row) => (
                  <tr key={row.letter}>
                    <th scope="row" style={cell}>
                      {row.letter}
                    </th>
                    {row.counts.map((count, i) => (
                      <td key={grid.lengths[i]} style={cell}>
                        {count || "·"}
                      </td>
                    ))}
                    <td style={cell}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section aria-labelledby="starts-heading">
          <h2 id="starts-heading" className="font-semibold">
            Two-letter starts
          </h2>
          {starts.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No answers for this puzzle.</p>
          ) : (
            <ul className="mt-1 flex flex-wrap gap-1" aria-label="Two-letter starts">
              {starts.map((pair) => (
                <li key={pair} className="rounded-full px-2 py-0.5" style={{ background: "var(--accent-soft)" }}>
                  {pair}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="yesterday-heading">
          <h2 id="yesterday-heading" className="font-semibold">
            Yesterday&rsquo;s answers
          </h2>
          {yesterday === null ? (
            <button
              type="button"
              onClick={() => {
                const day = previousDate(date);
                setYesterday(answersFor(dailyPuzzle(day, lists.answers), lists.answers));
              }}
              className="mt-1 rounded-full px-3 py-1 font-semibold"
              style={{ border: "1px solid var(--line-strong)", background: "var(--panel)", color: "var(--ink)" }}
            >
              Reveal
            </button>
          ) : (
            <>
              <p className="mt-1" style={{ color: "var(--muted)" }}>
                {yesterday.length} answers
              </p>
              <ul className="flex flex-wrap gap-1 max-h-32 overflow-y-auto" aria-label="Yesterday's answers">
                {yesterday.map((word) => (
                  <li key={word} className="rounded-full px-2 py-0.5" style={{ background: "var(--panel)" }}>
                    {word}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </details>
  );
}
