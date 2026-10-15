import { describe, expect, it } from "vitest";
import { getRank, RANKS, TOP_RANK } from "./ranks";

describe("getRank", () => {
  it("gives each tier at its threshold, and the tier below just under it", () => {
    RANKS.forEach((tier, i) => {
      expect(getRank(tier.minScore)).toBe(tier.name);
      if (i > 0) expect(getRank(tier.minScore - 1)).toBe(RANKS[i - 1]!.name);
    });
  });

  it("starts at Beginner, including for a negative score", () => {
    expect(getRank(0)).toBe("Beginner");
    expect(getRank(-5)).toBe("Beginner");
  });

  it("reaches the top rank at a fixed threshold, and stays there above it", () => {
    expect(TOP_RANK).toBe("Genius");
    expect(getRank(199)).toBe("Amazing");
    expect(getRank(200)).toBe("Genius");
    expect(getRank(10_000)).toBe("Genius");
  });

  it("has tier thresholds that rise", () => {
    for (let i = 1; i < RANKS.length; i++) {
      expect(RANKS[i]!.minScore).toBeGreaterThan(RANKS[i - 1]!.minScore);
    }
  });
});
