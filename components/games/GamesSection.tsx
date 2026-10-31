import { Gamepad2 } from "lucide-react";
import { MemoryMatchGame, NumberMergeGame } from "@/components/games/PortfolioGames";

export interface GamesSectionProps {
  gamesTitle?: string;
  gamesSubtitle?: string;
}

export function GamesSection({
  gamesTitle = "Take a break. Play a little.",
  gamesSubtitle = "Two quick games, built for the keyboard and touch. Come back whenever you are ready.",
}: GamesSectionProps = {}) {
  const parts = gamesTitle.split(/\.\s+/);
  const line1 = parts[0] ? `${parts[0]}.` : gamesTitle;
  const line2 = parts.slice(1).join(". ");

  return (
    <section className="section games-section" id="games" aria-labelledby="games-title">
      <div className="section-wrap">
        <div className="section-heading-row" data-reveal>
          <div>
            <p className="section-kicker">
              <Gamepad2 size={14} /> A small intermission
            </p>
            <h2 className="section-title" id="games-title">
              {line1}
              {line2 && (
                <>
                  <br />
                  <span className="accent">{line2}</span>
                </>
              )}
            </h2>
          </div>
          <p className="section-heading-aside">{gamesSubtitle}</p>
        </div>
        <div className="games-grid">
          <NumberMergeGame />
          <MemoryMatchGame />
        </div>
      </div>
    </section>
  );
}
