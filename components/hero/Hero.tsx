import { ArrowDown, ArrowRight, MapPin, GraduationCap } from "lucide-react";
import { SocialIcon } from "@/components/ui/SocialIcon";
import type { DegreeItem } from "@/components/admin/SettingsManager";

export interface HeroProps {
  title?: string;
  subhead?: string;
  bio?: string;
  location?: string;
  status?: string;
  githubUrl?: string;
  degrees?: DegreeItem[];
}

export function Hero({
  subhead = "Building intelligent systems and full-stack solutions.",
  bio = "Computer Science undergraduate focused on AI/ML, secure software, and useful digital products.",
  location = "Agartala, Tripura, India",
  status = "Open to opportunities",
  githubUrl = "https://github.com/BijoySarkar19",
  degrees = [
    {
      id: "btech",
      degree: "B.Tech . Computer Science and Engineering",
      institution: "ICFAI University Tripura",
      link: "https://www.iutripura.edu.in/",
      period: "2023—expected 2027",
      showOnHome: true,
    },
  ],
}: HeroProps = {}) {
  const activeDegrees = degrees.filter((d) => d.showOnHome);
  const primaryDegree = activeDegrees[0] || {
    degree: "B.Tech . Computer Science and Engineering",
    institution: "ICFAI University Tripura",
    link: "https://www.iutripura.edu.in/",
  };

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
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
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
                  href={primaryDegree.link || "https://www.iutripura.edu.in/"}
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>
                    <GraduationCap size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "-2px" }} />
                    {primaryDegree.institution}
                  </strong>
                </a>
                <span>{primaryDegree.degree}</span>
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
