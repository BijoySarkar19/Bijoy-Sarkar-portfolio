"use client";

import { useState } from "react";
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

  const subject = "Hello Bijoy — Inquiry from Portfolio";
  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // 1. Copy address to clipboard automatically so user always has it
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }).catch(() => {});
    }

    // 2. Direct native mail invocation:
    // On Android: triggers the native intent resolver to open the Gmail app / default email inbox.
    // On iOS (iPhone / iPad): triggers the native Apple Mail or Gmail app.
    // On Windows / Mac / Linux: triggers the OS native default mail app.
    // On Chromebook: Chrome OS routes mailto: directly to Gmail Web.
    const isMobileDevice = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobileDevice) {
      // Force direct navigation without creating an empty browser tab
      window.location.href = mailtoUrl;
    }
  }

  return (
    <a
      className={className}
      href={mailtoUrl}
      onClick={handleClick}
      title="Click to open your native email app (Gmail on Android, Mail on iOS/Mac/PC) and compose directly to Bijoy (also copies address to clipboard)"
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
