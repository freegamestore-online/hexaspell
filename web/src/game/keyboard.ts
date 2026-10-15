/** What a key press means to the game. Shared by the physical keyboard handler. */
export type KeyAction =
  | { type: "append"; letter: string }
  | { type: "delete" }
  | { type: "submit" }
  | { type: "clear" };

export interface KeyModifiers {
  metaKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

/** Maps a key press to a game action. Returns null for keys the game does not use, and for shortcuts. */
export function keyAction(key: string, modifiers: KeyModifiers = {}): KeyAction | null {
  if (modifiers.metaKey || modifiers.ctrlKey || modifiers.altKey) return null;
  if (key === "Enter") return { type: "submit" };
  if (key === "Backspace") return { type: "delete" };
  if (key === "Escape") return { type: "clear" };
  if (/^[a-z]$/i.test(key)) return { type: "append", letter: key.toUpperCase() };
  return null;
}
