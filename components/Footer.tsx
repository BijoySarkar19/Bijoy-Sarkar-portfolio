import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { socialLinks } from "@/lib/portfolio-data";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { EmailLink } from "@/components/ui/EmailLink";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="section-wrap">
        <div className="footer-main">
          <div className="footer-identity">
            <Link className="brand-lockup" href="/#home" aria-label="Bijoy Sarkar, return to top"><span className="brand-mark">BS</span><span className="brand-name">Bijoy Sarkar<small>Software Engineer &amp; AI Developer</small></span></Link>
            <p>Building intelligent systems and full-stack solutions.</p>
          </div>
          <div>
            <h2 className="footer-heading">Navigate</h2>
            <div className="footer-links"><Link href="/#home">Home</Link><Link href="/#about">About</Link><Link href="/#projects">Projects</Link><Link href="/#resume">Resume</Link><Link href="/#games">Games</Link><Link href="/#contact">Contact</Link></div>
          </div>
          <div>
            <h2 className="footer-heading">Find me online</h2>
            <div className="social-links">
              {socialLinks.map(({ label, href, icon }) => <a className="social-link" href={href} key={label} target="_blank" rel="noopener noreferrer" aria-label={`${label} profile`}><SocialIcon name={icon} size={15} /></a>)}
            </div>
            <EmailLink className="footer-email" email="bijoysarkar7252@gmail.com" />
          </div>
        </div>
        <div className="footer-bottom"><span>© 2026 Bijoy Sarkar. All rights reserved.</span><span>Built with curiosity and care.</span></div>
      </div>
    </footer>
  );
}
