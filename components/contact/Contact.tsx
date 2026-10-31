import { ArrowUpRight, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { socialLinks as defaultSocialLinks } from "@/lib/portfolio-data";
import { SocialIcon, SocialIconName } from "@/components/ui/SocialIcon";
import { EmailLink } from "@/components/ui/EmailLink";

export interface SocialLinkItem {
  label: string;
  href: string;
  icon: SocialIconName;
}

export interface ContactProps {
  email?: string;
  location?: string;
  socialLinks?: SocialLinkItem[];
  contactTitle?: string;
  contactSubtitle?: string;
}

export function Contact({
  email = "bijoysarkar7252@gmail.com",
  location = "Agartala, Tripura, India",
  socialLinks = defaultSocialLinks,
  contactTitle = "Have a problem worth solving?",
  contactSubtitle = "For software roles, AI/ML work, or a project idea, send a note and tell me what you have in mind.",
}: ContactProps) {
  // Extract accent word (e.g. solving?)
  const words = contactTitle.split(" ");
  const lastWord = words.length > 1 ? words.pop() : "";
  const mainWords = words.join(" ");

  return (
    <section className="section contact-section" id="contact" aria-labelledby="contact-title">
      <div className="section-wrap contact-layout">
        <div className="contact-copy" data-reveal>
          <p className="section-kicker">Get in touch</p>
          <h2 className="section-title" id="contact-title">
            {mainWords} {lastWord && <span className="accent">{lastWord}</span>}
          </h2>
          <p>{contactSubtitle}</p>
          <div className="contact-details-list">
            <EmailLink className="contact-detail" email={email} />
            <a
              className="contact-detail"
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
              target="_blank"
              rel="noreferrer"
            >
              <MapPin size={15} /> {location} <ArrowUpRight size={13} />
            </a>
          </div>
          <div className="social-links contact-social-links" aria-label="Social media profiles">
            {socialLinks.map(({ label, href, icon }) => (
              <a
                className="social-link"
                href={href}
                key={label}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} profile`}
              >
                <SocialIcon name={icon} size={15} />
              </a>
            ))}
          </div>
        </div>
        <div data-reveal>
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
