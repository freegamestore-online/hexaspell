import { useEffect, useMemo, useState } from "react";
import { COMMON_URL, loadWordlist, VALIDATION_URL } from "../words/wordlist";
import { buildBoard, BOARD_SIZE } from "./board";
import { HoneycombBoard } from "./HoneycombBoard";
import { useHexaSpell, type WordLists } from "./useHexaSpell";

/** Loads both word lists, then mounts the game once they are ready. */
export function GameView() {
  const [lists, setLists] = useState<WordLists | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    Promise.all([loadWordlist(VALIDATION_URL), loadWordlist(COMMON_URL)])
      .then(([valid, answers]) => live && setLists({ valid, answers }))
      .catch(() => live && setError("Could not load the word list."));
    return () => {
      live = false;
    };
  }, []);

  if (error) return <p style={{ color: "var(--error)" }}>{error}</p>;
  if (!lists) return <p style={{ color: "var(--muted)" }}>Loading…</p>;
  return <Game lists={lists} />;
}

function Game({ lists }: { lists: WordLists }) {
  const game = useHexaSpell(lists);
  const cells = useMemo(
    () => buildBoard(game.puzzle, BOARD_SIZE, BOARD_SIZE),
    [game.puzzle],
  );
  const { appendLetter, deleteLetter, submitWord } = game;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        submitWord();
      } else if (e.key === "Backspace") {
        e.preventDefault();
        deleteLetter();
      } else if (/^[a-z]$/i.test(e.key)) {
        appendLetter(e.key);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [appendLetter, deleteLetter, submitWord]);

  const button = {
    border: "1px solid var(--line-strong)",
    background: "var(--panel)",
    color: "var(--ink)",
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <div className="flex gap-4 font-semibold" style={{ color: "var(--muted)" }}>
        <span>Score {game.score}</span>
        <span>{game.found.length} words</span>
      </div>

      <p className="min-h-6 font-semibold" aria-live="polite" style={{ color: "var(--accent)" }}>
        {game.message}
      </p>

      <div
        className="min-h-10 text-2xl font-bold tracking-widest"
        aria-label="Typed letters"
        style={{ color: game.input ? "var(--ink)" : "var(--muted)" }}
      >
        {game.input || "Type or tap letters"}
      </div>

      <HoneycombBoard cells={cells} onCellClick={appendLetter} />

      <div className="flex gap-3">
        <button
          type="button"
          onClick={deleteLetter}
          className="rounded-full px-4 py-2 font-semibold"
          style={button}
        >
          Delete
        </button>
        <button
          type="button"
          onClick={game.shuffleBoard}
          className="rounded-full px-4 py-2 font-semibold"
          style={button}
        >
          Shuffle
        </button>
        <button
          type="button"
          onClick={submitWord}
          className="rounded-full px-4 py-2 font-semibold text-white"
          style={{ background: "var(--accent)" }}
        >
          Enter
        </button>
      </div>

      {game.found.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto text-sm">
          {game.found.map((word) => (
            <li key={word} className="rounded-full px-2 py-1" style={{ background: "var(--accent-soft)" }}>
              {word}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
