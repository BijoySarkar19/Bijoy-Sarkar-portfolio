"use client";

import { useState, useEffect } from "react";
import { Mail, ArrowUpRight, Check } from "lucide-react";

interface EmailLinkProps {
  email?: string;
  className?: string;
  showIcon?: boolean;
}

export function EmailLink({
  email = "bijoysarkar7252@gmail.com",
  className = "contact-detail",
  showIcon = true,
}: EmailLinkProps) {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const subject = "Hello Bijoy — Inquiry from Portfolio";
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}`;

  useEffect(() => {
    const checkIsMobile = () => {
      const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const isMobileUA = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
      const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || (Boolean(navigator.maxTouchPoints && navigator.maxTouchPoints > 0)));
      const isSmallViewport = typeof window !== "undefined" && window.innerWidth <= 900;
      setIsMobile(Boolean(isMobileUA || (isTouch && isSmallViewport)));
    };

    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, []);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // 1. Copy address to clipboard automatically so user always has it
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }).catch(() => {});
    }

    // 2. On Mobile & Tablets:
    // Directly navigate to mailto to open the native Gmail app / default email client
    if (isMobile) {
      e.preventDefault();
      window.location.href = mailtoUrl;
    }
    // 3. On Laptops & Desktops:
    // Let default browser navigation with target="_blank" open the Gmail Web compose tab
  }

  // Device-adaptive destination:
  // Mobile/Tablet -> mailto: directly triggers native Gmail app
  // Laptop/PC/Mac -> Gmail Web compose URL in a new browser tab
  const activeHref = isMobile ? mailtoUrl : gmailWebUrl;
  const activeTarget = isMobile ? undefined : "_blank";
  const activeRel = isMobile ? undefined : "noopener noreferrer";

  return (
    <a
      className={className}
      href={activeHref}
      target={activeTarget}
      rel={activeRel}
      onClick={handleClick}
      title={
        isMobile
          ? "Tap to open Gmail app and compose directly to Bijoy (also copies address to clipboard)"
          : "Click to open Gmail inbox in browser and compose directly to Bijoy (also copies address to clipboard)"
      }
    >
      {showIcon && <Mail size={className.includes("footer") ? 13 : 15} />}
      <span>{email}</span>
      {copied ? (
        <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, color: "#4ade80", marginLeft: 4 }}>
          <Check size={11} /> Copied!
        </span>
      ) : (
        <ArrowUpRight size={className.includes("footer") ? 12 : 13} />
      )}
    </a>
  );
}
