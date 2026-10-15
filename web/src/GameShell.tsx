// HexaSpell GameShell – scaffold (part 1)
import type { ReactNode } from "react";
import { ParticleLayer, ScorePop, useShake } from "./feel";
import { prefersReducedMotion } from "./motion/reducedMotion";

// Re-exported so screens reach the feel and motion modules through the shell.
export { ParticleLayer, ScorePop, useShake, prefersReducedMotion };

interface GameShellProps {
  children: ReactNode;
}

export default function GameShell({ children }: GameShellProps) {
  return <div className="game-shell">{children}</div>;
}
