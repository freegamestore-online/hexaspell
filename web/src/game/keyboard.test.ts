import { describe, expect, it } from "vitest";
import { keyAction } from "./keyboard";

describe("keyAction", () => {
  it("maps letters to an upper-case append, in either case", () => {
    expect(keyAction("r")).toEqual({ type: "append", letter: "R" });
    expect(keyAction("R")).toEqual({ type: "append", letter: "R" });
  });

  it("maps Enter to submit, Backspace to delete, and Escape to clear", () => {
    expect(keyAction("Enter")).toEqual({ type: "submit" });
    expect(keyAction("Backspace")).toEqual({ type: "delete" });
    expect(keyAction("Escape")).toEqual({ type: "clear" });
  });

  it("ignores other keys, digits and punctuation", () => {
    for (const key of ["Tab", "Shift", " ", "1", "-", "ArrowLeft"]) {
      expect(keyAction(key)).toBeNull();
    }
  });

  it("ignores key presses with a modifier, so shortcuts still work", () => {
    expect(keyAction("r", { ctrlKey: true })).toBeNull();
    expect(keyAction("Enter", { metaKey: true })).toBeNull();
    expect(keyAction("Backspace", { altKey: true })).toBeNull();
  });
});
