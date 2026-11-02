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

export interface NavbarProps {
  gamesEnabled?: boolean;
  aboutEnabled?: boolean;
  projectsEnabled?: boolean;
  resumeEnabled?: boolean;
  contactEnabled?: boolean;
}

export function Navbar({
  gamesEnabled = true,
  aboutEnabled = true,
  projectsEnabled = true,
  resumeEnabled = true,
  contactEnabled = true,
}: NavbarProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);

  const navItems = items.filter((item) => {
    if (item.id === "about" && !aboutEnabled) return false;
    if (item.id === "projects" && !projectsEnabled) return false;
    if (item.id === "resume" && !resumeEnabled) return false;
    if (item.id === "games" && !gamesEnabled) return false;
    return true;
  });

  const activeItem = navItems.find((item) => item.id === active);
  const activeLabel = active === "contact" ? "Contact" : (activeItem?.label || "Home");
  const activeIndex = active === "contact" ? navItems.length + 1 : (navItems.findIndex((i) => i.id === active) + 1);
  const formattedIndex = activeIndex > 0 ? String(activeIndex).padStart(2, "0") : "01";

  useEffect(() => {
    if (!menuOpen) {
      const activeEl = document.activeElement as HTMLElement | null;
      if (activeEl && document.getElementById("mobile-navigation")?.contains(activeEl)) {
        activeEl.blur();
      }
    }
  }, [menuOpen]);

  useEffect(() => {
    // Track sections in order
    const trackedIds = ["home", ...navItems.map(({ id }) => id).filter((id) => id !== "home"), "contact"];

    let ticking = false;
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 12);

      // Top of page
      if (scrollY < 90) {
        setActive("home");
        return;
      }

      // Bottom of page: activate contact
      if (window.innerHeight + scrollY >= document.documentElement.scrollHeight - 60) {
        setActive("contact");
        return;
      }

      // Check section bounding rects with focal reading zone
      const focalOffset = 140;
      let currentSection = "";

      for (let i = trackedIds.length - 1; i >= 0; i--) {
        const id = trackedIds[i];
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= focalOffset && rect.bottom > focalOffset) {
          currentSection = id;
          break;
        }
      }

      // Resilient fallback if between sections
      if (!currentSection) {
        let minDistance = Infinity;
        for (const id of trackedIds) {
          const el = document.getElementById(id);
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const dist = Math.abs(rect.top - focalOffset);
          if (dist < minDistance && rect.bottom > 0) {
            minDistance = dist;
            currentSection = id;
          }
        }
      }

      if (currentSection) {
        setActive(currentSection);
      }
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [navItems]);

  function handleNavClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    const activeEl = document.activeElement as HTMLElement | null;
    if (activeEl && document.getElementById("mobile-navigation")?.contains(activeEl)) {
      activeEl.blur();
    }
    setMenuOpen(false);
    setActive(id);
    if (pathname === "/") {
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: "smooth", block: "start" });
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
          <span className="brand-mark brand-avatar">
            <img
              src="/avatar.png"
              alt="Bijoy Sarkar"
              width={32}
              height={32}
              className="brand-avatar-img"
            />
          </span>
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
            className={`button nav-cta${active === "contact" ? " is-active" : ""}`}
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
              <span className="brand-mark brand-avatar">
                <img
                  src="/avatar.png"
                  alt="Bijoy Sarkar"
                  width={32}
                  height={32}
                  className="brand-avatar-img"
                />
              </span>
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
