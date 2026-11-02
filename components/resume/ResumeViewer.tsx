"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Download, ExternalLink, FileText, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { UpcomingNotice } from "@/components/ui/UpcomingNotice";
import { SocialIcon } from "@/components/ui/SocialIcon";

interface ResumeViewerProps {
  resumePath?: string | null;
  filename?: string | null;
  pages?: string[];
  pageCount?: number;
  resumeTitle?: string;
  resumeSubtitle?: string;
}

export function ResumeViewer({
  resumePath = "/Bijoy_Sarkar_CV.pdf",
  filename = "Bijoy_Sarkar_CV.pdf",
  pages = ["/cv-pages/page-1.png", "/cv-pages/page-2.png", "/cv-pages/page-3.png"],
  pageCount = 3,
  resumeTitle = "Experience in the details.",
  resumeSubtitle = "Education, internships, technical work, and the projects behind this portfolio—all in one place.",
}: ResumeViewerProps) {
  // Zoom level ranges strictly from 10% (0.10) to 500% (5.00), default 100% (1.00)
  const [zoom, setZoom] = useState(1);
  const [zoomInputStr, setZoomInputStr] = useState("100");
  const [isScrollVisible, setIsScrollVisible] = useState(true);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);

  const scrollHideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Apply zoom with strict clamping between 10% and 500%
  const setClampedZoom = useCallback((newZoom: number) => {
    const clamped = Math.max(0.1, Math.min(5.0, Math.round(newZoom * 100) / 100));
    setZoom(clamped);
    setZoomInputStr(String(Math.round(clamped * 100)));
  }, []);

  // Zoom buttons change by exactly 10%
  const handleZoomIn = () => setClampedZoom(zoom + 0.1);
  const handleZoomOut = () => setClampedZoom(zoom - 0.1);
  const handleZoomReset = () => setClampedZoom(1.0);

  // User typing in zoom percentage: numeric digits only
  function handleZoomInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digitsOnly = e.target.value.replace(/\D/g, "");
    setZoomInputStr(digitsOnly);
    const num = parseInt(digitsOnly, 10);
    if (!isNaN(num) && num >= 10 && num <= 500) {
      setZoom(num / 100);
    }
  }

  function commitZoomInput() {
    const num = parseInt(zoomInputStr, 10);
    if (isNaN(num) || num < 10) {
      setClampedZoom(0.1);
    } else if (num > 500) {
      setClampedZoom(5.0);
    } else {
      setClampedZoom(num / 100);
    }
  }

  // Update thumb position matching document viewport scroll
  const updateThumbPosition = useCallback(() => {
    if (isDraggingRef.current) return;
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !track || !thumb) return;

    const scrollRange = viewport.scrollHeight - viewport.clientHeight;
    const progress = scrollRange > 0 ? Math.min(1, Math.max(0, viewport.scrollTop / scrollRange)) : 0;
    const trackHeight = track.clientHeight;
    const ratio = viewport.clientHeight / Math.max(viewport.clientHeight + 1, viewport.scrollHeight);
    const thumbHeight = Math.max(44, Math.min(trackHeight * ratio, trackHeight * 0.45));
    thumb.style.height = `${thumbHeight}px`;

    const travelDistance = Math.max(0, trackHeight - thumbHeight);
    const thumbY = progress * travelDistance;
    thumb.style.transform = `translate3d(0, ${thumbY}px, 0)`;
  }, []);

  // Listen to viewport scroll events
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    function onScroll() {
      setIsScrollVisible(true);
      if (scrollHideTimerRef.current) clearTimeout(scrollHideTimerRef.current);
      scrollHideTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          setIsScrollVisible(true); // Keep accessible or subtle
        }
      }, 1500);

      updateThumbPosition();
    }

    viewport.addEventListener("scroll", onScroll, { passive: true });
    updateThumbPosition();

    return () => {
      viewport.removeEventListener("scroll", onScroll);
      if (scrollHideTimerRef.current) clearTimeout(scrollHideTimerRef.current);
    };
  }, [updateThumbPosition, zoom]);

  // Pointer drag & click-to-scroll handling for the custom scrollbar
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    isDraggingRef.current = true;
    setIsDraggingScroll(true);
    setIsScrollVisible(true);

    const viewport = viewportRef.current;
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!viewport || !track || !thumb) return;

    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    const trackRect = track.getBoundingClientRect();
    const thumbHeight = thumb.clientHeight || 44;
    const travelDistance = Math.max(1, trackRect.height - thumbHeight);

    function applyScrollFromPointer(clientY: number) {
      const relativeY = clientY - trackRect.top - thumbHeight / 2;
      const clampedY = Math.min(Math.max(0, relativeY), travelDistance);
      const ratio = clampedY / travelDistance;
      const maxScroll = viewport!.scrollHeight - viewport!.clientHeight;

      thumb!.style.transform = `translate3d(0, ${clampedY}px, 0)`;
      viewport!.scrollTop = ratio * maxScroll;
    }

    applyScrollFromPointer(e.clientY);

    function onPointerMove(moveEvent: PointerEvent) {
      if (!isDraggingRef.current) return;
      applyScrollFromPointer(moveEvent.clientY);
    }

    function onPointerUp(upEvent: PointerEvent) {
      isDraggingRef.current = false;
      setIsDraggingScroll(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(upEvent.pointerId);
      } catch {
        // ignore
      }
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
      updateThumbPosition();
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  }, [updateThumbPosition]);

  if (!resumePath) {
    return (
      <section className="section resume-section" id="resume" aria-labelledby="resume-title">
        <div className="section-wrap">
          <div className="resume-copy" data-reveal style={{ marginBottom: "2rem" }}>
            <p className="section-kicker">Resume</p>
            <h2 className="section-title" id="resume-title">
              {resumeTitle}
            </h2>
            <p>{resumeSubtitle}</p>
          </div>
          <UpcomingNotice area="curriculum vitae & resume credentials" />
        </div>
      </section>
    );
  }

  const currentPath = resumePath;
  const currentFilename = filename || "Bijoy_Sarkar_CV.pdf";

  return (
    <section className="section resume-section" id="resume" aria-labelledby="resume-title">
      <div className="section-wrap resume-layout">
        <div className="resume-copy" data-reveal>
          <p className="section-kicker">Resume</p>
          <h2 className="section-title" id="resume-title">
            {resumeTitle}
          </h2>
          <p>{resumeSubtitle}</p>

          <div className="resume-actions">
            <a className="button" href={currentPath} download={currentFilename}>
              Download CV <span className="button-icon"><Download size={13} /></span>
            </a>
            <a
              className="button button-secondary"
              href="https://github.com/BijoySarkar19/Bijoy_Sarkar_CV"
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub <span className="button-icon"><SocialIcon name="github" size={13} /></span>
            </a>
            <a
              className="button button-secondary"
              href={currentPath}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in new tab <span className="button-icon"><ExternalLink size={13} /></span>
            </a>
          </div>
        </div>

        <div className="resume-viewer" ref={viewerRef} data-reveal>
          {/* Header Bar: Displays filename and zoom controls in ONE place (Total page number removed) */}
          <div className="resume-viewer-head">
            <span>
              <FileText size={14} className="accent" /> {currentFilename}
            </span>

            <div className="resume-toolbar-controls">
              {/* Zoom Out Button: decreases by 10% */}
              <button
                type="button"
                className="resume-zoom-btn"
                onClick={handleZoomOut}
                disabled={zoom <= 0.1}
                aria-label="Zoom out CV by 10%"
                title="Zoom out (-10%)"
              >
                <ZoomOut size={13} />
              </button>

              {/* Editable Numeric Zoom Box (10% to 500%, automatic % display, numpad on phones/tablets) */}
              <div className="resume-zoom-input-box" title="Type custom zoom percentage (10% to 500%)">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={3}
                  value={zoomInputStr}
                  onChange={handleZoomInputChange}
                  onBlur={commitZoomInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitZoomInput();
                  }}
                  className="resume-zoom-input"
                  aria-label="Zoom percentage numerical value"
                />
                <span className="resume-zoom-unit">%</span>
              </div>

              {/* Zoom In Button: increases by 10% */}
              <button
                type="button"
                className="resume-zoom-btn"
                onClick={handleZoomIn}
                disabled={zoom >= 5.0}
                aria-label="Zoom in CV by 10%"
                title="Zoom in (+10%)"
              >
                <ZoomIn size={13} />
              </button>

              {/* Reset to 100% */}
              <button
                type="button"
                className="resume-zoom-btn"
                onClick={handleZoomReset}
                aria-label="Reset zoom to 100%"
                title="Reset zoom to 100%"
              >
                <RotateCcw size={12} />
              </button>
            </div>
          </div>

          {/* Fully Interactive Custom Glowing Orange Scrollbar (positioned relative to viewer, outside viewport) */}
          <aside
            ref={trackRef}
            className={`resume-scroll-track ${isScrollVisible ? "is-visible" : ""} ${isDraggingScroll ? "is-dragging" : ""}`}
            onPointerDown={handlePointerDown}
            role="scrollbar"
            aria-label="Interactive CV Document scrollbar"
          >
            <div ref={thumbRef} className="resume-scroll-thumb">
              <span className="thumb-grip" />
            </div>
          </aside>

          {/* Document Viewport */}
          <div className="resume-document-viewport" ref={viewportRef}>
            {/* Document Pages: Uniform thin 4-sided bezel-less framing */}
            <div
              className="resume-pages-container"
              style={{
                width: zoom === 1 ? "100%" : `${Math.round(zoom * 100)}%`,
                maxWidth: zoom <= 1 ? "100%" : "none",
              }}
            >
              {pages.map((pageSrc, index) => (
                <div key={pageSrc} className="resume-page-wrapper">
                  <img
                    src={pageSrc}
                    alt={`Bijoy Sarkar CV Page ${index + 1}`}
                    className="resume-page-img"
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
