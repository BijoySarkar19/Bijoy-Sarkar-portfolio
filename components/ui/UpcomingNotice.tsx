import { Sparkles, Compass } from "lucide-react";

export function UpcomingNotice({
  area = "content",
  message,
}: {
  area?: string;
  message?: string;
}) {
  return (
    <div className="upcoming-container" role="status" aria-live="polite">
      <div className="upcoming-beacon">
        <span className="upcoming-pulse-ring" />
        <span className="upcoming-pulse-core">
          <Compass size={18} className="upcoming-icon" />
        </span>
      </div>
      <div className="upcoming-text-block">
        <span className="upcoming-kicker">
          <Sparkles size={11} /> Milestone in progress
        </span>
        <h3 className="upcoming-title">Upcoming on his way</h3>
        <p className="upcoming-desc">
          {message || `New ${area} is currently being prepared and will be published here soon.`}
        </p>
      </div>
    </div>
  );
}
