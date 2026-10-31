"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";

export function CustomScrollbar() {
  const pathname = usePathname();
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [indicatorText, setIndicatorText] = useState("0%");

  const isDraggingRef = useRef(false);
  const isHoveredRef = useRef(false);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Determine current active section for tooltip indicator
  const getSectionLabel = useCallback((percent: number) => {
    if (percent < 0.12) return "Home";
    if (percent < 0.28) return "About";
    if (percent < 0.44) return "Skills";
    if (percent < 0.65) return "Projects";
    if (percent < 0.82) return "Resume";
    if (percent < 0.94) return "Games";
    return "Contact";
  }, []);

  // Directly update thumb position via translate3d on compositor thread (0ms latency)
  const updateThumbPosition = useCallback(() => {
    // Never fight pointer during active dragging
    if (isDraggingRef.current) return;
    if (!trackRef.current || !thumbRef.current) return;

    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollHeight)) : 0;

    const trackHeight = trackRef.current.clientHeight;
    // Dynamic thumb height proportional to page height
    const ratio = window.innerHeight / Math.max(window.innerHeight + 1, document.documentElement.scrollHeight);
    const thumbHeight = Math.max(48, Math.min(trackHeight * ratio, trackHeight * 0.45));
    thumbRef.current.style.height = `${thumbHeight}px`;

    const travelDistance = Math.max(0, trackHeight - thumbHeight);
    const thumbY = progress * travelDistance;

    thumbRef.current.style.transform = `translate3d(0, ${thumbY}px, 0)`;

    if (tooltipRef.current) {
      tooltipRef.current.style.transform = `translate3d(0, ${thumbY}px, 0)`;
      const pct = Math.round(progress * 100);
      setIndicatorText(`${getSectionLabel(progress)} · ${pct}%`);
    }
  }, [getSectionLabel]);

  // Sync on scroll and resize, handling 1-second auto-hide
  useEffect(() => {
    function onScroll() {
      // Make visible on scroll
      setIsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

      hideTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current && !isHoveredRef.current) {
          setIsVisible(false);
        }
      }, 1000);

      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(updateThumbPosition);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateThumbPosition();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [updateThumbPosition]);

  // Hover handlers: keep visible while hovering, trigger 1-second timer on mouse leave
  const handleMouseEnter = useCallback(() => {
    isHoveredRef.current = true;
    setIsHovered(true);
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveredRef.current = false;
    setIsHovered(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current && !isHoveredRef.current) {
        setIsVisible(false);
      }
    }, 1000);
  }, []);

  // Pointer drag & click handling with immediate 1:1 hardware tracking
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDragging(true);
    setIsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const trackRect = track.getBoundingClientRect();
    const thumbHeight = thumb.clientHeight || 54;
    const travelDistance = Math.max(1, trackRect.height - thumbHeight);

    function applyScrollFromPointer(clientY: number) {
      const relativeY = clientY - trackRect.top - thumbHeight / 2;
      const clampedY = Math.min(Math.max(0, relativeY), travelDistance);
      const ratio = clampedY / travelDistance;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;

      // Update thumb position immediately
      thumb!.style.transform = `translate3d(0, ${clampedY}px, 0)`;
      if (tooltipRef.current) {
        tooltipRef.current.style.transform = `translate3d(0, ${clampedY}px, 0)`;
        const pct = Math.round(ratio * 100);
        setIndicatorText(`${getSectionLabel(ratio)} · ${pct}%`);
      }

      // Scroll window with zero lag
      window.scrollTo({
        top: ratio * maxScroll,
        behavior: "auto",
      });
    }

    applyScrollFromPointer(e.clientY);

    function onPointerMove(moveEvent: PointerEvent) {
      if (!isDraggingRef.current) return;
      applyScrollFromPointer(moveEvent.clientY);
    }

    function onPointerUp(upEvent: PointerEvent) {
      isDraggingRef.current = false;
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      updateThumbPosition();

      // Start 1-second auto-hide timeout after dragging completes
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current && !isHoveredRef.current) {
          setIsVisible(false);
        }
      }, 1000);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }, [getSectionLabel, updateThumbPosition]);

  if (pathname?.startsWith("/admin-admin")) return null;

  return (
    <aside
      ref={trackRef}
      className={`custom-scrollbar-track ${isVisible ? "is-visible" : ""} ${isDragging ? "is-dragging" : ""} ${isHovered ? "is-hovered" : ""}`}
      onPointerDown={handlePointerDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="scrollbar"
      aria-controls="main-content"
      aria-label="Interactive page scrollbar"
    >
      <div
        ref={thumbRef}
        className="custom-scrollbar-thumb"
      >
        <span className="custom-scrollbar-glow" />
        <span className="custom-scrollbar-grip" />
      </div>

      {/* Floating Section Tooltip */}
      <div
        ref={tooltipRef}
        className={`custom-scrollbar-tooltip ${isHovered || isDragging ? "is-visible" : ""}`}
        aria-hidden="true"
      >
        {indicatorText}
      </div>
    </aside>
  );
}
