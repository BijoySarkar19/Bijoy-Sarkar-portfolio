import { Gamepad2 } from "lucide-react";
import { MemoryMatchGame, NumberMergeGame } from "@/components/games/PortfolioGames";

export function GamesSection() {
  return (
    <section className="section games-section" id="games" aria-labelledby="games-title">
      <div className="section-wrap">
        <div className="section-heading-row" data-reveal>
          <div><p className="section-kicker"><Gamepad2 size={14} /> A small intermission</p><h2 className="section-title" id="games-title">Take a break.<br /><span className="accent">Play a little.</span></h2></div>
          <p className="section-heading-aside">Two quick games, built for the keyboard and touch. Come back whenever you are ready.</p>
        </div>
        <div className="games-grid">
          <NumberMergeGame />
          <MemoryMatchGame />
        </div>
      </div>
    </section>
  );
}
