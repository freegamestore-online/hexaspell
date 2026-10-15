import { GameShell, GameTopbar, GameAuth, GameThemeToggle } from "@freegamestore/games";
import { GameView } from "./game/GameView";

export default function App() {
  return (
    <GameShell topbar={<GameTopbar title="Hexaspell" actions={<GameThemeToggle />} />}>
      <GameAuth />
      <GameView />
    </GameShell>
  );
}
