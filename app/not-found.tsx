import Link from "next/link";
import { ArrowLeft, ArrowRight, Gamepad2 } from "lucide-react";
import { MemoryMatchGame } from "@/components/games/PortfolioGames";

export default function NotFound() {
  return (
    <main className="page-message not-found-page">
      <div className="page-message-inner not-found-inner">
        <div className="not-found-copy">
          <p className="page-message-code">404 · SYSTEM PATH NOT FOUND</p>
          <h1>That route<br /><span className="accent">doesn&apos;t exist.</span></h1>
          <p>The page you&apos;re looking for could not be found. Return to the portfolio or browse the project index.</p>
          <div className="message-actions"><Link className="button" href="/"><ArrowLeft size={14} /> Return home</Link><Link className="button button-secondary" href="/projects">View projects <ArrowRight size={14} /></Link></div>
        </div>
        <div className="not-found-game"><p className="section-kicker"><Gamepad2 size={14} /> Detour unlocked</p><MemoryMatchGame compactMode /></div>
      </div>
    </main>
  );
}
