import { BrainCircuit, Code2, Database, Fingerprint, Languages, Layers, Smartphone, Terminal, type LucideIcon } from "lucide-react";
import { skillGroups as fallbackSkillGroups } from "@/lib/portfolio-data";
import { UpcomingNotice } from "@/components/ui/UpcomingNotice";

const iconMap: Record<string, LucideIcon> = {
  Code2,
  BrainCircuit,
  Terminal,
  Smartphone,
  Database,
  Fingerprint,
  Languages,
  Layers,
};

export interface SkillGroupDisplayItem {
  title: string;
  note: string;
  icon: string | LucideIcon;
  skills: string[];
}

export interface SkillsProps {
  skillGroups?: SkillGroupDisplayItem[];
  skillsTitle?: string;
  skillsSubtitle?: string;
}

export function Skills({
  skillGroups,
  skillsTitle = "A broad stack. A builder's mindset.",
  skillsSubtitle = "Tools are only useful when they fit the job. I keep learning across product engineering, intelligent systems, and secure software.",
}: SkillsProps) {
  const items = skillGroups !== undefined ? skillGroups : fallbackSkillGroups;

  // Split title into two lines if it contains period or newline
  const parts = skillsTitle.split(/\.\s+/);
  const line1 = parts[0] ? `${parts[0]}.` : skillsTitle;
  const line2 = parts.slice(1).join(". ");

  return (
    <section className="section skills-section" id="skills" aria-labelledby="skills-title">
      <div className="section-wrap">
        <div className="section-heading-row" data-reveal>
          <div>
            <p className="section-kicker">Technical toolkit</p>
            <h2 className="section-title" id="skills-title">
              {line1}
              {line2 && (
                <>
                  <br />
                  <span className="accent">{line2}</span>
                </>
              )}
            </h2>
          </div>
          <p className="section-heading-aside">{skillsSubtitle}</p>
        </div>
        {items.length > 0 ? (
          <div className="skills-grid">
            {items.map(({ title, note, icon, skills }) => {
              const IconComponent = typeof icon === "function" ? icon : iconMap[icon as string] || Terminal;
              return (
                <article className="skill-card" key={title} data-reveal>
                  <div className="skill-card-top">
                    <IconComponent size={20} strokeWidth={1.8} className="accent" />
                  </div>
                  <h3>{title}</h3>
                  <p>{note}</p>
                  <div className="skill-tags">
                    {skills.map((skill) => (
                      <span className="skill-pill" key={skill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <UpcomingNotice area="technical skills & languages" />
        )}
      </div>
    </section>
  );
}
