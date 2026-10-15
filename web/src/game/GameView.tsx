import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLeaderboard } from "@freegamestore/games";
import {
  HAPTICS,
  ParticleLayer,
  ScorePop,
  prefersReducedMotion,
  useHaptics,
  useShake,
  type ParticleLayerHandle,
} from "../feel";
import { Celebration } from "../feel/Celebration";
import { COMMON_URL, loadWordlist, VALIDATION_URL } from "../words/wordlist";
import { buildBoard, BOARD_SIZE } from "./board";
import { dailyPuzzle, getPracticeLetters, utcDate } from "./daily";
import { Helpers } from "./HelpersPanel";
import { HoneycombBoard } from "./HoneycombBoard";
import { keyAction } from "./keyboard";
import { submitScore } from "./leaderboard";
import { getRank } from "./ranks";
import { loadProgress, saveProgress } from "./saves";
import { useHexaSpell, type WordLists } from "./useHexaSpell";

/** The platform leaderboard's id for this game. */
const GAME_ID = "hexaspell";
/** Until there is a sign-in name to use, scores are filed under this. */
const PLAYER_NAME = "Player";
/** Confetti colours for a pangram burst. */
const PALETTE = ["#facc15", "#2563eb", "#16a34a", "#dc2626", "#9333ea"];

type Mode = "daily" | "practice";

interface Pop {
  id: number;
  points: number;
  x: number;
  y: number;
}

interface Burst {
  id: string;
  label: string;
}

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
  const { appendLetter, deleteLetter, clearInput, submitWord } = game;
  const rank = getRank(game.score);

  // Feel kit: haptics always; pops, bursts and shakes only when motion is allowed.
  const haptics = useHaptics();
  const inputRef = useRef<HTMLDivElement>(null);
  const shake = useShake(inputRef);
  const boardRef = useRef<HTMLDivElement>(null);
  const particles = useRef<ParticleLayerHandle>(null);
  const [pops, setPops] = useState<Pop[]>([]);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const nextId = useRef(0);
  const seenAccepted = useRef(game.accepted?.id ?? 0);
  const seenRejections = useRef(game.rejections);
  const seenRank = useRef(rank);

  const removePop = useCallback((id: number) => setPops((p) => p.filter((x) => x.id !== id)), []);
  const removeBurst = useCallback((id: string) => setBursts((b) => b.filter((x) => x.id !== id)), []);

  // A word was accepted: pop its points, and celebrate a pangram or a rank-up.
  useEffect(() => {
    const accepted = game.accepted;
    if (!accepted || accepted.id === seenAccepted.current) return;
    seenAccepted.current = accepted.id;
    haptics.pulse(HAPTICS.clear);
    const rankNow = getRank(game.score);
    const rankedUp = rankNow !== seenRank.current;
    seenRank.current = rankNow;
    if (prefersReducedMotion()) return;

    const board = boardRef.current;
    const x = (board?.clientWidth ?? 0) / 2;
    const y = (board?.clientHeight ?? 0) / 2;
    const id = ++nextId.current;
    setPops((p) => [...p, { id, points: accepted.points, x, y }]);

    const labels = [accepted.pangram ? "Pangram!" : null, rankedUp ? `Rank up: ${rankNow}` : null].filter(Boolean);
    if (accepted.pangram) {
      particles.current?.burst(x, y, PALETTE, { count: 70, speed: [220, 520], size: [4, 8], life: 1.3 });
    }
    if (labels.length > 0) setBursts((b) => [...b, { id: `burst-${id}`, label: labels.join(" · ") }]);
  }, [game.accepted, game.score, haptics]);

  // A rejected word shakes the typed letters. Under reduced motion the shake does nothing.
  useEffect(() => {
    if (game.rejections === seenRejections.current) return;
    seenRejections.current = game.rejections;
    shake();
  }, [game.rejections, shake]);

  // Daily progress is saved as words are found. Practice is never saved.
  useEffect(() => {
    if (mode !== "daily" || game.found.length === 0) return;
    saveProgress(date, { score: game.score, rank: getRank(game.score), foundWords: game.found });
  }, [mode, date, game.found, game.score]);

  // Physical keyboard. A focused button or summary keeps its own Enter and Space.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target instanceof HTMLElement ? e.target : null;
      const native = target !== null && (target.tagName === "BUTTON" || target.tagName === "SUMMARY");
      if (native && (e.key === "Enter" || e.key === " ")) return;

      const action = keyAction(e.key, e);
      if (!action) return;
      e.preventDefault();
      if (action.type === "append") appendLetter(action.letter);
      else if (action.type === "delete") deleteLetter();
      else if (action.type === "clear") clearInput();
      else submitWord();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [appendLetter, deleteLetter, clearInput, submitWord]);

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
        ref={inputRef}
        className="min-h-10 text-2xl font-bold tracking-widest"
        aria-label="Typed letters"
        style={{ color: game.input ? "var(--ink)" : "var(--muted)" }}
      >
        {game.input || "Type or tap letters"}
      </div>

      <div ref={boardRef} className="relative" style={{ width: "min(300px, 80vw)" }}>
        <HoneycombBoard cells={cells} onCellClick={appendLetter} />
        <ParticleLayer ref={particles} />
        {pops.map((p) => (
          <ScorePop key={p.id} points={p.points} x={p.x} y={p.y} onDone={() => removePop(p.id)} />
        ))}
      </div>
      {bursts.map((b) => (
        <Celebration key={b.id} id={b.id} label={b.label} onDone={removeBurst} />
      ))}

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

      <Helpers puzzle={game.puzzle} lists={lists} date={date} />

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
