"use client";

import { useEffect } from "react";
import { playCyberClick } from "@/lib/audio";

export function InteractiveAudioProvider({ soundEnabled = true }: { soundEnabled?: boolean }) {
  useEffect(() => {
    if (!soundEnabled) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const interactive = target.closest("button, a, input[type='button'], input[type='submit'], .button, .nav-link, .tag, .admin-link, .filter-chip, .game-cell, .game-btn");
      if (interactive) {
        // Defer synthesis to the next microtick so the click handler terminates in <1ms without thread blocking
        setTimeout(() => {
          playCyberClick();
        }, 0);
      }
    }

    document.addEventListener("click", handleClick, { capture: true, passive: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [soundEnabled]);

  return null;
}
