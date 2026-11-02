"use client";

import { useEffect } from "react";

/**
 * High-performance, hardware-accelerated scroll reveal handler.
 * Observes all elements marked with [data-reveal] and smoothly applies .is-revealed.
 * Works seamlessly across Chrome, Safari, Edge, Firefox, Android, and iOS.
 */
export function ScrollRevealHandler() {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (elements.length === 0) return;

    // Immediately reveal elements that are already within or above the viewport on initial load
    const viewportHeight = window.innerHeight;
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < viewportHeight * 0.92) {
        el.classList.add("is-revealed");
      }
    });

    // Observe remaining elements
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: "0px 0px -40px 0px",
        threshold: [0, 0.08, 0.15],
      }
    );

    elements.forEach((el) => {
      if (!el.classList.contains("is-revealed")) {
        observer.observe(el);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
