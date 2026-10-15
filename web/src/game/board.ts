/** Honeycomb geometry for HexaSpell: pure math, no React or DOM. */
import type { PuzzleConfig } from "./engine";

export interface HexCell {
  letter: string;
  cx: number;
  cy: number;
  isCentre: boolean;
  /** Circumradius: the distance from a hex's centre to its corners. */
  r: number;
}

/** The square board the game draws into, in SVG user units. */
export const BOARD_SIZE = 300;

const SQRT3 = Math.sqrt(3);

/**
 * Lays out one centre hex and six outer hexes, flat-top, centred in the viewport.
 * Outer hexes sit at 30°, 90°, … from the centre, √3·r away, so they touch the centre.
 */
export function buildBoard(config: PuzzleConfig, width: number, height: number): HexCell[] {
  // The cluster spans 5r across and 3√3·r down; take the radius that fits both.
  const r = Math.min(width / 5, height / (3 * SQRT3));
  const cx = width / 2;
  const cy = height / 2;
  const cells: HexCell[] = [{ letter: config.centre, cx, cy, isCentre: true, r }];
  config.outer.forEach((letter, i) => {
    const angle = ((30 + 60 * i) * Math.PI) / 180;
    cells.push({
      letter,
      cx: cx + SQRT3 * r * Math.cos(angle),
      cy: cy + SQRT3 * r * Math.sin(angle),
      isCentre: false,
      r,
    });
  });
  return cells;
}

/** SVG points of a flat-top hexagon with the given radius, for drawing a cell. */
export function hexPoints(cell: HexCell, radius: number = cell.r): string {
  return Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 3) * i;
    const x = cell.cx + radius * Math.cos(angle);
    const y = cell.cy + radius * Math.sin(angle);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
}
