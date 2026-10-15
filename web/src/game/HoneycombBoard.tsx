import { BOARD_SIZE, hexPoints, type HexCell } from "./board";

interface HoneycombBoardProps {
  cells: HexCell[];
  onCellClick: (letter: string) => void;
}

/** Gap between neighbouring hexes, as a fraction of the radius. */
const INSET = 0.94;

export function HoneycombBoard({ cells, onCellClick }: HoneycombBoardProps) {
  return (
    <svg
      viewBox={`0 0 ${BOARD_SIZE} ${BOARD_SIZE}`}
      className="w-full max-w-[300px]"
      role="group"
      aria-label="Letters"
    >
      {cells.map((cell) => (
        <g
          key={cell.letter}
          className="hex"
          role="button"
          tabIndex={0}
          aria-label={`Letter ${cell.letter}`}
          onClick={() => onCellClick(cell.letter)}
          onKeyDown={(e) => {
            // Space enters the letter. Enter is left to the window handler, which submits.
            if (e.key !== " ") return;
            e.preventDefault();
            onCellClick(cell.letter);
          }}
        >
          <polygon
            points={hexPoints(cell, cell.r * INSET)}
            style={{ fill: cell.isCentre ? "#facc15" : "var(--paper)" }}
          />
          <text
            x={cell.cx}
            y={cell.cy}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={cell.r * 0.7}
            fontWeight={700}
            style={{
              fontFamily: "Manrope, sans-serif",
              fill: cell.isCentre ? "#1a1a1a" : "var(--ink)",
              pointerEvents: "none",
            }}
          >
            {cell.letter}
          </text>
        </g>
      ))}
    </svg>
  );
}
