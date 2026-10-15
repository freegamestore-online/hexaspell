import { useEffect, useMemo, useState } from "react";
import { useLeaderboard } from "@freegamestore/games";
import { COMMON_URL, loadWordlist, VALIDATION_URL } from "../words/wordlist";
import { buildBoard, BOARD_SIZE } from "./board";
import { dailyPuzzle, getPracticeLetters, utcDate } from "./daily";
import { HoneycombBoard } from "./HoneycombBoard";
import { submitScore } from "./leaderboard";
import { getRank } from "./ranks";
import { loadProgress, saveProgress } from "./saves";
import { useHexaSpell, type WordLists } from "./useHexaSpell";

/** The platform leaderboard's id for this game. */
const GAME_ID = "hexaspell";
/** Until there is a sign-in name to use, scores are filed under this. */
const PLAYER_NAME = "Player";

type Mode = "daily" | "practice";

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

/** Chooses daily or practice. Each choice starts a fresh session, keyed by its round. */
function Game({ lists }: { lists: WordLists }) {
  const [session, setSession] = useState<{ mode: Mode; round: number }>({ mode: "daily", round: 0 });
  const button = {
    border: "1px solid var(--line-strong)",
    background: session.mode === "daily" ? "var(--accent-soft)" : "var(--panel)",
    color: "var(--ink)",
  };

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSession({ mode: "daily", round: 0 })}
          aria-pressed={session.mode === "daily"}
          className="rounded-full px-3 py-1 text-sm font-semibold"
          style={button}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() =>
            setSession((s) => ({ mode: "practice", round: s.mode === "practice" ? s.round + 1 : 1 }))
          }
          aria-pressed={session.mode === "practice"}
          className="rounded-full px-3 py-1 text-sm font-semibold"
          style={button}
        >
          {session.mode === "practice" ? "New practice" : "Practice"}
        </button>
      </div>
      <Play key={`${session.mode}-${session.round}`} lists={lists} mode={session.mode} />
    </div>
  );
}

function Play({ lists, mode }: { lists: WordLists; mode: Mode }) {
  // Read once per session: the day's puzzle and any saved progress for it.
  const [start] = useState(() => {
    const date = utcDate();
    return mode === "daily"
      ? { date, puzzle: dailyPuzzle(date, lists.answers), save: loadProgress(date) }
      : { date, puzzle: getPracticeLetters(lists.answers), save: null };
  });
  const { date, puzzle, save } = start;
  const game = useHexaSpell(lists, {
    puzzle,
    initial: save ? { found: save.foundWords, score: save.score } : undefined,
  });
  const cells = useMemo(() => buildBoard(puzzle, BOARD_SIZE, BOARD_SIZE), [puzzle]);
  const { submitScore: submitToPlatform } = useLeaderboard(GAME_ID);
  const [finished, setFinished] = useState<string | null>(null);
  const { appendLetter, deleteLetter, submitWord } = game;
  const rank = getRank(game.score);

  // Daily progress is saved as words are found. Practice is never saved.
  useEffect(() => {
    if (mode !== "daily" || game.found.length === 0) return;
    saveProgress(date, { score: game.score, rank: getRank(game.score), foundWords: game.found });
  }, [mode, date, game.found, game.score]);

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

  // Finishing sends the day's result to the local leaderboard and the platform one.
  // A malformed or failed submit is dropped quietly.
  function finish() {
    const result = submitScore({ date, playerName: PLAYER_NAME, score: game.score, rank });
    if (!result.ok) return;
    submitToPlatform(game.score).catch(() => undefined);
    setFinished(`Saved to the leaderboard: ${rank}, ${game.score} pts`);
  }

  const button = {
    border: "1px solid var(--line-strong)",
    background: "var(--panel)",
    color: "var(--ink)",
  };

  return (
    <>
      <div className="flex gap-4 font-semibold" style={{ color: "var(--muted)" }}>
        <span>Score {game.score}</span>
        <span>{rank}</span>
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

      {mode === "daily" && (
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={finish}
            disabled={game.found.length === 0}
            className="rounded-full px-4 py-1 text-sm font-semibold disabled:opacity-40"
            style={button}
          >
            Finish today
          </button>
          {finished && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {finished}
            </p>
          )}
        </div>
      )}

      {game.found.length > 0 && (
        <ul className="flex flex-wrap justify-center gap-2 max-h-24 overflow-y-auto text-sm">
          {game.found.map((word) => (
            <li key={word} className="rounded-full px-2 py-1" style={{ background: "var(--accent-soft)" }}>
              {word}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
