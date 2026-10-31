import { BrainCircuit, Code2, Database, Fingerprint, Languages, Layers, Smartphone, Terminal, type LucideIcon } from "lucide-react";
import { skillGroups as fallbackSkillGroups } from "@/lib/portfolio-data";

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

import { UpcomingNotice } from "@/components/ui/UpcomingNotice";

export function Skills({ skillGroups }: { skillGroups?: SkillGroupDisplayItem[] }) {
  const items = skillGroups !== undefined ? skillGroups : fallbackSkillGroups;

  return (
    <section className="section skills-section" id="skills" aria-labelledby="skills-title">
      <div className="section-wrap">
        <div className="section-heading-row" data-reveal>
          <div><p className="section-kicker">Technical toolkit</p><h2 className="section-title" id="skills-title">A broad stack.<br /><span className="accent">A builder&apos;s mindset.</span></h2></div>
          <p className="section-heading-aside">Tools are only useful when they fit the job. I keep learning across product engineering, intelligent systems, and secure software.</p>
        </div>
        {items.length > 0 ? (
          <div className="skills-grid">
            {items.map(({ title, note, icon, skills }) => {
              const IconComponent = typeof icon === "function" ? icon : (iconMap[icon] || Terminal);
              return (
                <article className="skill-card" key={title} data-reveal>
                  <div className="skill-card-top">
                    <IconComponent size={20} strokeWidth={1.8} className="accent" />
                  </div>
                  <h3>{title}</h3>
                  <p>{note}</p>
                  <div className="skill-tags">{skills.map((skill) => <span className="skill-pill" key={skill}>{skill}</span>)}</div>
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
