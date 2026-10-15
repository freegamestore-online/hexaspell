import { GameShell, GameTopbar, GameAuth } from "@freegamestore/games";
import { GameView } from "./game/GameView";

export default function App() {
  return (
    <GameShell topbar={<GameTopbar title="Hexaspell" />}>
      <GameAuth />
      <GameView />
    </GameShell>
  );
}
