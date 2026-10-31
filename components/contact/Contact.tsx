import { ArrowUpRight, MapPin } from "lucide-react";
import { ContactForm } from "@/components/contact/ContactForm";
import { socialLinks } from "@/lib/portfolio-data";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { EmailLink } from "@/components/ui/EmailLink";

export function Contact() {
  return (
    <section className="section contact-section" id="contact" aria-labelledby="contact-title">
      <div className="section-wrap contact-layout">
        <div className="contact-copy" data-reveal>
          <p className="section-kicker">Get in touch</p>
          <h2 className="section-title" id="contact-title">Have a problem worth <span className="accent">solving?</span></h2>
          <p>For software roles, AI/ML work, or a project idea, send a note and tell me what you have in mind.</p>
          <div className="contact-details-list">
            <EmailLink className="contact-detail" email="bijoysarkar7252@gmail.com" />
            <a className="contact-detail" href="https://www.google.com/maps/search/?api=1&query=Agartala%2C%20Tripura%2C%20India" target="_blank" rel="noreferrer"><MapPin size={15} /> Agartala, Tripura, India <ArrowUpRight size={13} /></a>
          </div>
          <div className="social-links contact-social-links" aria-label="Social media profiles">
            {socialLinks.map(({ label, href, icon }) => <a className="social-link" href={href} key={label} target="_blank" rel="noopener noreferrer" aria-label={`${label} profile`}><SocialIcon name={icon} size={15} /></a>)}
          </div>
        </div>
        <div data-reveal><ContactForm /></div>
      </div>
    </section>
  );
}
