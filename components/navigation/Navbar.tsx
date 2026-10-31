"use client";

import { ArrowUpRight, Menu, X, ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const items = [
  { label: "Home", id: "home" },
  { label: "About", id: "about" },
  { label: "Projects", id: "projects" },
  { label: "Resume", id: "resume" },
  { label: "Games", id: "games" },
];

export function Navbar({ gamesEnabled = true }: { gamesEnabled?: boolean }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const navItems = items.filter((item) => gamesEnabled || item.id !== "games");

  useEffect(() => {
    if (!menuOpen) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && document.getElementById("mobile-navigation")?.contains(activeEl)) {
        activeEl.blur();
      }
    }
  }, [menuOpen]);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 12);
    update();
    window.addEventListener("scroll", update, { passive: true });

    const sections = navItems
      .map(({ id }) => document.getElementById(id))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-18% 0px -62% 0px", threshold: [0, 0.2, 0.5, 0.8] }
    );
    sections.forEach((section) => observer.observe(section));

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("keydown", closeOnEscape);
      observer.disconnect();
    };
  }, [navItems]);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl && document.getElementById("mobile-navigation")?.contains(activeEl)) {
      activeEl.blur();
    }
    setMenuOpen(false);
    if (pathname === "/") {
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth" });
        window.history.pushState(null, "", `#${id}`);
      }
    }
  }

  function closeMenu() {
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl && document.getElementById("mobile-navigation")?.contains(activeEl)) {
      activeEl.blur();
    }
    setMenuOpen(false);
    toggleButtonRef.current?.focus();
  }

  const sectionHref = (id: string) => `${pathname === "/" ? "" : "/"}#${id}`;

  if (pathname?.startsWith("/admin-admin")) return null;

  return (
    <header className={`navbar${scrolled ? " is-scrolled" : ""}`}>
      <div className="nav-inner">
        <Link
          className="brand-lockup"
          href={sectionHref("home")}
          aria-label="Bijoy Sarkar, home"
          onClick={(e) => handleNavClick(e as any, "home")}
        >
          <span className="brand-mark">BS</span>
          <span className="brand-name">
            Bijoy Sarkar<small>Software Engineer</small>
          </span>
        </Link>

        {/* Clean, executive desktop navigation */}
        <nav className="nav-links" aria-label="Main navigation">
          {navItems.map((item) => (
            <a
              key={item.id}
              className={`nav-link${active === item.id ? " is-active" : ""}`}
              href={sectionHref(item.id)}
              onClick={(e) => handleNavClick(e, item.id)}
            >
              {item.label}
            </a>
          ))}

          <a
            className="button"
            href={sectionHref("contact")}
            onClick={(e) => handleNavClick(e, "contact")}
          >
            Get in touch{" "}
            <span className="button-icon">
              <ArrowUpRight size={14} />
            </span>
          </a>
        </nav>

        {/* Mobile menu toggle */}
        <button
          ref={toggleButtonRef}
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        {/* Mobile Backdrop Overlay */}
        {menuOpen && (
          <div
            className="mobile-nav-backdrop"
            onClick={closeMenu}
            aria-hidden="true"
          />
        )}

        {/* Mobile Animated Cyber Card Drawer */}
        <nav
          id="mobile-navigation"
          className={`mobile-nav${menuOpen ? " is-open" : ""}`}
          aria-label="Mobile navigation"
          aria-hidden={!menuOpen ? "true" : undefined}
          inert={!menuOpen}
        >
          <div className="mobile-nav-header">
            <div className="mobile-nav-brand">
              <span className="brand-mark">BS</span>
              <span className="brand-name">
                Bijoy Sarkar<small>Software Engineer</small>
              </span>
            </div>
            <button
              type="button"
              className="mobile-nav-close"
              onClick={closeMenu}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mobile-nav-list">
            {navItems.map((item, idx) => (
              <a
                key={item.id}
                className={`mobile-nav-item${active === item.id ? " is-active" : ""}`}
                href={sectionHref(item.id)}
                onClick={(e) => handleNavClick(e, item.id)}
                style={{ animationDelay: `${idx * 45 + 50}ms` }}
              >
                <span className="mobile-nav-left">
                  <span className="mobile-nav-idx">0{idx + 1}</span>
                  <span className="mobile-nav-label">{item.label}</span>
                </span>
                <span className="mobile-nav-arrow">
                  <ChevronRight size={14} />
                </span>
              </a>
            ))}
          </div>

          <div className="mobile-nav-footer" style={{ animationDelay: `${navItems.length * 45 + 60}ms` }}>
            <a
              className="mobile-nav-cta button"
              href={sectionHref("contact")}
              onClick={(e) => handleNavClick(e, "contact")}
            >
              Get in touch <ArrowUpRight size={15} />
            </a>
          </div>
        </nav>
      </div>
    </header>
  );
}
