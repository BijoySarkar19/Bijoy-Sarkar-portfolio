"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function ScrollEdgeEffects() {
  const pathname = usePathname();
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(false);
  const [pullTopIntensity, setPullTopIntensity] = useState(0);
  const [pullBottomIntensity, setPullBottomIntensity] = useState(0);

  useEffect(() => {
    if (pathname?.startsWith("/admin-admin")) return;

    function handleScroll() {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;
      const distanceFromBottom = scrollHeight - (scrollY + clientHeight);

      // Top effect active when within 35px of start
      setAtTop(scrollY < 35);

      // Bottom effect active when within 45px of bottom
      setAtBottom(distanceFromBottom < 45);
    }

    // Touch and wheel pull slide effects for fluid overscroll feeling
    let startY = 0;
    let isTouching = false;

    function handleTouchStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
      isTouching = true;
    }

    function handleTouchMove(e: TouchEvent) {
      if (!isTouching) return;
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - startY;
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // Sliding at top
      if (scrollY <= 0 && deltaY > 0) {
        const intensity = Math.min(1, deltaY / 140);
        setPullTopIntensity(intensity);
        const shell = document.querySelector(".site-shell") as HTMLElement | null;
        if (shell) {
          const offset = Math.min(40, Math.pow(deltaY, 0.72));
          shell.style.transition = "none";
          shell.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
      } else {
        setPullTopIntensity(0);
      }

      // Sliding at bottom
      if (scrollY + clientHeight >= scrollHeight - 2 && deltaY < 0) {
        const intensity = Math.min(1, Math.abs(deltaY) / 140);
        setPullBottomIntensity(intensity);
        const shell = document.querySelector(".site-shell") as HTMLElement | null;
        if (shell) {
          const offset = -Math.min(40, Math.pow(Math.abs(deltaY), 0.72));
          shell.style.transition = "none";
          shell.style.transform = `translate3d(0, ${offset}px, 0)`;
        }
      } else {
        setPullBottomIntensity(0);
      }
    }

    function handleTouchEnd() {
      isTouching = false;
      setPullTopIntensity(0);
      setPullBottomIntensity(0);
      const shell = document.querySelector(".site-shell") as HTMLElement | null;
      if (shell) {
        shell.style.transition = "transform 420ms cubic-bezier(0.16, 1, 0.3, 1)";
        shell.style.transform = "translate3d(0, 0, 0)";
      }
    }

    // Trackpad / Wheel rebound slide transition
    let wheelTimer: ReturnType<typeof setTimeout>;
    function handleWheel(e: WheelEvent) {
      const scrollY = window.scrollY || window.pageYOffset || 0;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      if (scrollY <= 0 && e.deltaY < 0) {
        const shell = document.querySelector(".site-shell") as HTMLElement | null;
        if (shell) {
          const offset = Math.min(28, Math.abs(e.deltaY) * 0.16);
          shell.style.transition = "transform 100ms ease-out";
          shell.style.transform = `translate3d(0, ${offset}px, 0)`;
          clearTimeout(wheelTimer);
          wheelTimer = setTimeout(() => {
            shell.style.transition = "transform 380ms cubic-bezier(0.16, 1, 0.3, 1)";
            shell.style.transform = "translate3d(0, 0, 0)";
          }, 120);
        }
      } else if (scrollY + clientHeight >= scrollHeight - 2 && e.deltaY > 0) {
        const shell = document.querySelector(".site-shell") as HTMLElement | null;
        if (shell) {
          const offset = -Math.min(28, Math.abs(e.deltaY) * 0.16);
          shell.style.transition = "transform 100ms ease-out";
          shell.style.transform = `translate3d(0, ${offset}px, 0)`;
          clearTimeout(wheelTimer);
          wheelTimer = setTimeout(() => {
            shell.style.transition = "transform 380ms cubic-bezier(0.16, 1, 0.3, 1)";
            shell.style.transform = "translate3d(0, 0, 0)";
          }, 120);
        }
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("wheel", handleWheel, { passive: true });

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("wheel", handleWheel);
      clearTimeout(wheelTimer);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin-admin")) return null;

  const topActive = atTop || pullTopIntensity > 0;
  const bottomActive = atBottom || pullBottomIntensity > 0;
  const topOpacity = topActive ? Math.max(0.75, pullTopIntensity) : 0;
  const bottomOpacity = bottomActive ? Math.max(0.8, pullBottomIntensity) : 0;

  return (
    <>
      {/* Top Starting Edge Slide Aura Effect */}
      <div
        className={`edge-effect-top${topActive ? " is-active" : ""}`}
        style={{
          opacity: topOpacity,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <div className="edge-effect-glow-top" />
        <div className="edge-effect-line-top" />
      </div>

      {/* Bottom Ending Edge Slide Aura Effect */}
      <div
        className={`edge-effect-bottom${bottomActive ? " is-active" : ""}`}
        style={{
          opacity: bottomOpacity,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <div className="edge-effect-glow-bottom" />
        <div className="edge-effect-line-bottom" />
      </div>
    </>
  );
}
