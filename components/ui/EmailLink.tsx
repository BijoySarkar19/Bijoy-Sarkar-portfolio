"use client";

import { useState } from "react";
import { Mail, ArrowUpRight, Check, Copy } from "lucide-react";

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

  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=Hello%20Bijoy%20%E2%80%94%20Inquiry%20from%20Portfolio`;

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>) {
    // Attempt to copy address to clipboard for convenience
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(email).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2200);
      }).catch(() => {});
    }
  }

  return (
    <a
      className={className}
      href={gmailComposeUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      title="Click to open your inbox and compose an email to Bijoy (also copies address to clipboard)"
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
