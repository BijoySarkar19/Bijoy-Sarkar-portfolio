"use client";

import { useEffect, useState } from "react";
import { Sparkles, Mail, X, Gift, ArrowRight } from "lucide-react";

interface BirthdayCelebrationProps {
  contactEmail?: string;
}

export function BirthdayCelebration({ contactEmail = "bijoysarkar7252@gmail.com" }: BirthdayCelebrationProps) {
  const [isActive, setIsActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [age, setAge] = useState(21);

  useEffect(() => {
    // Check IST (Asia/Kolkata) time
    try {
      const now = new Date();
      const istDateParts = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        month: "numeric",
        day: "numeric",
        year: "numeric",
      }).formatToParts(now);

      const month = Number(istDateParts.find((p) => p.type === "month")?.value);
      const day = Number(istDateParts.find((p) => p.type === "day")?.value);
      const year = Number(istDateParts.find((p) => p.type === "year")?.value);

      // Check query param for admin testing/preview
      const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const isPreview = urlParams?.get("birthdayPreview") === "true";

      // Active only on 19 October (month 10, day 19) in IST
      const isBirthdayToday = isPreview || (month === 10 && day === 19);

      if (isBirthdayToday) {
        // Calculate age: born 19 Oct 2005
        const calculatedAge = year - 2005;
        setAge(calculatedAge > 0 ? calculatedAge : 21);
        setIsActive(true);

        const dismissed = sessionStorage.getItem("bijoy_bday_dismissed_v1");
        if (!dismissed) {
          // Open with a gentle cinematic delay
          const timer = setTimeout(() => setIsOpen(true), 1200);
          return () => clearTimeout(timer);
        }
      }
    } catch (e) {
      console.error("Birthday check error:", e);
    }
  }, []);

  if (!isActive) return null;

  function handleDismiss() {
    setIsOpen(false);
    sessionStorage.setItem("bijoy_bday_dismissed_v1", "true");
  }

  // Pre-filled direct email compose URI
  const subject = encodeURIComponent(`Happy Birthday Bijoy! 🎂`);
  const body = encodeURIComponent(
    `Hi Bijoy,\n\nWishing you a very Happy Birthday! May this year bring you continued growth, innovative engineering projects, and great success.\n\nBest regards,\n`
  );

  const gmailWebComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
    contactEmail
  )}&su=${subject}&body=${body}`;

  const mailtoFallback = `mailto:${contactEmail}?subject=${subject}&body=${body}`;

  function handleWishClick(e: React.MouseEvent) {
    e.preventDefault();
    // Open Gmail web compose in a new tab, fallback to mailto if blocked
    const win = window.open(gmailWebComposeUrl, "_blank", "noopener,noreferrer");
    if (!win || win.closed || typeof win.closed === "undefined") {
      window.location.href = mailtoFallback;
    }
    handleDismiss();
  }

  return (
    <>
      {/* Mini Persistent Celebration Chip in Corner */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="birthday-floating-chip"
          aria-label="Open Birthday message"
        >
          <span className="birthday-sparkle-dot">✨</span>
          <span className="birthday-chip-text">
            Today is Bijoy&apos;s Birthday! <strong style={{ color: "var(--orange)" }}>Turned {age}</strong>
          </span>
          <Gift size={13} className="birthday-chip-icon" />
        </button>
      )}

      {/* Main Professional Birthday Announcement Modal */}
      {isOpen && (
        <div className="birthday-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="bday-title">
          <div className="birthday-modal-card">
            {/* Top decorative aura */}
            <div className="birthday-card-aura" aria-hidden="true" />

            <button
              type="button"
              className="birthday-close-btn"
              onClick={handleDismiss}
              aria-label="Close celebration card"
            >
              <X size={16} />
            </button>

            <div className="birthday-badge-row">
              <span className="birthday-pill">
                <Sparkles size={12} style={{ color: "var(--orange)" }} />
                <span>19 October · Annual Celebration</span>
              </span>
            </div>

            <h2 className="birthday-title" id="bday-title">
              Celebrating Bijoy&apos;s <span className="accent">{age}th Birthday</span> Today!
            </h2>

            <p className="birthday-description">
              Thank you for visiting today! Bijoy is celebrating another year of building, engineering intelligent systems, and creating software that matters.
            </p>

            <div className="birthday-actions-row">
              <a
                href={gmailWebComposeUrl}
                onClick={handleWishClick}
                className="button birthday-wish-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Mail size={15} /> Send Birthday Wish
              </a>

              <button type="button" onClick={handleDismiss} className="button button-secondary birthday-explore-btn">
                Explore Portfolio <ArrowRight size={14} />
              </button>
            </div>

            <div className="birthday-card-footer">
              <span>Direct 1-click email opens your preferred composer</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
