import { ArrowDown, ArrowRight, MapPin, GraduationCap } from "lucide-react";
import { SocialIcon } from "@/components/ui/SocialIcon";

export interface HeroProps {
  subhead?: string;
  bio?: string;
  location?: string;
  status?: string;
  githubUrl?: string;
}

export function Hero({
  subhead = "Building intelligent systems and full-stack solutions.",
  bio = "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products.",
  location = "Agartala, India",
  status = "Open to opportunities",
  githubUrl = "https://github.com/BijoySarkar19",
}: HeroProps = {}) {
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
                  href="https://www.google.com/maps/search/?api=1&query=Agartala%2C%20Tripura%2C%20India"
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>
                    <MapPin size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "-2px" }} />
                    {location}
                  </strong>
                </a>
                <span>{status}</span>
              </div>
              <div>
                <a
                  className="hero-meta-link"
                  href="https://www.iutripura.edu.in/"
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>
                    <GraduationCap size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "-2px" }} />
                    ICFAI University Tripura
                  </strong>
                </a>
                <span>B.Tech . Computer Science and Engineering</span>
              </div>
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
