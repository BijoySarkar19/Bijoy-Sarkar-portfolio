import { ArrowUpRight, GraduationCap } from "lucide-react";
import { experiences as fallbackExperiences } from "@/lib/portfolio-data";
import { UpcomingNotice } from "@/components/ui/UpcomingNotice";

export interface ExperienceDisplayItem {
  period: string;
  role: string;
  organization: string;
  summary: string;
  tags: string[];
}

export function About({ experiences }: { experiences?: ExperienceDisplayItem[] }) {
  const items = experiences !== undefined ? experiences : fallbackExperiences;

  return (
    <section className="section about-section" id="about" aria-labelledby="about-title">
      <div className="section-wrap about-layout">
        <div className="about-statement" data-reveal>
          <p className="section-kicker">About me</p>
          <h2 className="section-title" id="about-title">Engineering with <span className="accent">purpose.</span></h2>
          <p>B.Tech Computer Science and Engineering undergraduate at <a href="https://www.iutripura.edu.in" target="_blank" rel="noopener noreferrer" style={{ color: "var(--white)", textDecoration: "none" }}>ICFAI University Tripura</a>. I work across AI/ML, full-stack software, mobile apps, and cybersecurity.</p>
          <div className="metric-row">
            <div className="metric-card"><strong>15+</strong><span>projects and experiments</span></div>
            <div className="metric-card"><strong>{String(items.length).padStart(2, "0")}</strong><span>internship experiences</span></div>
            <div className="metric-card"><strong>2027</strong><span>Expected B.Tech completion</span></div>
          </div>
        </div>

        <div className="about-details" data-reveal>
          <p className="about-copy">I turn complex requirements into clear, reliable software. I enjoy exploring the details, connecting the right tools, and shaping each idea into something people can use.</p>
          {items.length > 0 ? (
            <div className="experience-list" aria-label="Experience timeline">
              {items.map((experience) => (
                <article className="experience-item" key={`${experience.organization}-${experience.role}`}>
                  <span className="experience-date">{experience.period}</span>
                  <div>
                    <div className="experience-title-row"><h3>{experience.role}</h3><span>{experience.organization}</span></div>
                    <p>{experience.summary}</p>
                    <div className="tag-list">{experience.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <UpcomingNotice area="work experiences" />
          )}
          <div className="education-line">
            <GraduationCap size={17} aria-hidden="true" />
            <span><strong>B.Tech · Computer Science &amp; Engineering</strong><small>ICFAI University Tripura · 2023—expected 2027</small></span>
            <a href="https://www.iutripura.edu.in/" target="_blank" rel="noreferrer" aria-label="Visit ICFAI University Tripura"><ArrowUpRight size={15} /></a>
          </div>
        </div>
      </div>
    </section>
  );
}
