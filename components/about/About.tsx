import { ArrowUpRight, GraduationCap } from "lucide-react";
import { experiences as fallbackExperiences } from "@/lib/portfolio-data";
import { UpcomingNotice } from "@/components/ui/UpcomingNotice";
import { DEFAULT_DEGREES, type DegreeItem } from "@/lib/degrees";

export interface ExperienceDisplayItem {
  period: string;
  role: string;
  organization: string;
  summary: string;
  tags: string[];
}

export interface AboutProps {
  experiences?: ExperienceDisplayItem[];
  degrees?: DegreeItem[];
  aboutTitle?: string;
  aboutBio?: string;
  aboutLead?: string;
}

export function About({
  experiences,
  degrees = DEFAULT_DEGREES,
  aboutTitle = "Engineering with purpose.",
  aboutBio = "B.Tech Computer Science and Engineering undergraduate at ICFAI University Tripura. I work across AI/ML, full-stack software, mobile apps, and cybersecurity.",
  aboutLead = "I turn complex requirements into clear, reliable software. I enjoy exploring the details, connecting the right tools, and shaping each idea into something people can use.",
}: AboutProps) {
  const items = experiences !== undefined ? experiences : fallbackExperiences;
  const degreeList = Array.isArray(degrees) && degrees.length > 0 ? degrees : DEFAULT_DEGREES;
  const activeDegrees = degreeList.filter((d) => d && d.showOnHome !== false);
  const primaryDegree = activeDegrees[0] || DEFAULT_DEGREES[0];

  // Extract expected completion year (e.g., from "2023 - 2027", completion is 2027)
  const matchYears = primaryDegree.period?.match(/\d{4}/g);
  const completionYear = matchYears && matchYears.length > 0 ? matchYears[matchYears.length - 1] : "2027";

  // Accentuate the last word of title if standard pattern
  const titleWords = aboutTitle.split(" ");
  const lastWord = titleWords.length > 1 ? titleWords.pop() : "";
  const startTitle = titleWords.join(" ");

  return (
    <section className="section about-section" id="about" aria-labelledby="about-title">
      <div className="section-wrap about-layout">
        <div className="about-statement" data-reveal>
          <p className="section-kicker">About me</p>
          <h2 className="section-title" id="about-title">
            {startTitle} {lastWord && <span className="accent">{lastWord}</span>}
          </h2>
          <p>{aboutBio}</p>
          <div className="metric-row">
            <div className="metric-card">
              <strong>15+</strong>
              <span>projects and experiments</span>
            </div>
            <div className="metric-card">
              <strong>{String(items.length).padStart(2, "0")}</strong>
              <span>internship experiences</span>
            </div>
            <div className="metric-card">
              <strong>{completionYear}</strong>
              <span>Expected {primaryDegree.degree?.split("·")?.[0]?.trim() || "B.Tech"} completion</span>
            </div>
          </div>
        </div>

        <div className="about-details" data-reveal>
          <p className="about-copy">{aboutLead}</p>
          {items.length > 0 ? (
            <div className="experience-list" aria-label="Experience timeline">
              {items.map((experience) => (
                <article className="experience-item" key={`${experience.organization}-${experience.role}`}>
                  <span className="experience-date">{experience.period}</span>
                  <div>
                    <div className="experience-title-row">
                      <h3>{experience.role}</h3>
                      <span>{experience.organization}</span>
                    </div>
                    <p>{experience.summary}</p>
                    <div className="tag-list">
                      {experience.tags.map((tag) => (
                        <span className="tag" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <UpcomingNotice area="work experiences" />
          )}

          {/* Academic Degrees & Credentials */}
          <div className="education-list" style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 22 }}>
            {activeDegrees.map((deg) => (
              <div className="education-line" key={deg.id || deg.degree}>
                <GraduationCap size={17} aria-hidden="true" />
                <span>
                  <strong>{deg.degree}</strong>
                  <small>
                    {deg.institution}
                    {deg.period ? ` · ${deg.period}` : ""}
                  </small>
                </span>
                {deg.link && deg.link !== "https://" && (
                  <a href={deg.link} target="_blank" rel="noreferrer" aria-label={`Visit ${deg.institution}`}>
                    <ArrowUpRight size={15} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
