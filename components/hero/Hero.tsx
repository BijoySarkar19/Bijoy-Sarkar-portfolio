import { ArrowDown, ArrowRight, MapPin, GraduationCap } from "lucide-react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { DEFAULT_DEGREES, type DegreeItem } from "@/lib/degrees";

export interface HeroProps {
  title?: string;
  subhead?: string;
  bio?: string;
  location?: string;
  locationMapUrl?: string;
  status?: string;
  githubUrl?: string;
  degrees?: DegreeItem[];
}

export function Hero({
  subhead = "Building intelligent systems and full-stack solutions.",
  bio = "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products.",
  location = "Agartala, Tripura, India",
  locationMapUrl,
  status = "Open to opportunities",
  githubUrl = "https://github.com/BijoySarkar19",
  degrees = DEFAULT_DEGREES,
}: HeroProps = {}) {
  const degreeList = Array.isArray(degrees) && degrees.length > 0 ? degrees : DEFAULT_DEGREES;
  const activeDegrees = degreeList.filter((d) => d && d.showOnHome !== false);
  const displayDegrees = activeDegrees.length > 0 ? activeDegrees : [DEFAULT_DEGREES[0]];

  const mapsUrl = locationMapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;

  return (
    <section className="hero section-wrap" id="home" aria-labelledby="hero-title">
      <div className="hero-content">
        <div className="hero-grid">
          <div className="hero-reveal">
            <p className="hero-intro">Hey, I&apos;m Bijoy Sarkar</p>
            <h1 className="hero-title" id="hero-title">
              <span>Software</span>
              <span className="hero-title-second">Engineer <em>&amp; AI</em></span>
              <span>Developer</span>
            </h1>
          </div>
          <div className="hero-summary hero-reveal" style={{ animationDelay: "110ms" }}>
            <h2>{subhead}</h2>
            <p>{bio}</p>
            <div className="hero-actions">
              <a className="button" href="#projects">
                View projects <span className="button-icon"><ArrowRight size={14} /></span>
              </a>
              <a className="button button-secondary" href={githubUrl} target="_blank" rel="noreferrer">
                GitHub <SocialIcon name="github" size={14} />
              </a>
            </div>
            <div className="hero-meta">
              <div>
                <a
                  className="hero-meta-link"
                  href={mapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  title="Open in Google Maps"
                >
                  <strong>
                    <MapPin size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "-2px" }} />
                    {location}
                  </strong>
                </a>
                <span>{status}</span>
              </div>
              {displayDegrees.map((deg) => (
                <div key={deg.id || deg.degree}>
                  {deg.link && deg.link.trim() !== "" ? (
                    <a
                      className="hero-meta-link"
                      href={deg.link}
                      target="_blank"
                      rel="noreferrer"
                      title={`Visit ${deg.institution}`}
                    >
                      <strong>
                        <GraduationCap size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "-2px" }} />
                        {deg.institution}
                      </strong>
                    </a>
                  ) : (
                    <span className="hero-meta-link">
                      <strong>
                        <GraduationCap size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "-2px" }} />
                        {deg.institution}
                      </strong>
                    </span>
                  )}
                  <span>{deg.degree}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="hero-bottom hero-reveal" style={{ animationDelay: "220ms" }}>
          <a className="hero-scroll" href="#about">
            <span className="scroll-dot"><ArrowDown size={13} /></span>Scroll to explore
          </a>
        </div>
      </div>
    </section>
  );
}
