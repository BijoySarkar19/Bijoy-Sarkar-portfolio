"use client";

import { useEffect, useState } from "react";

export default function Loading() {
  const [progress, setProgress] = useState(24);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 98) return 98;
        const increment = Math.floor(Math.random() * 9) + 4;
        return Math.min(prev + increment, 98);
      });
    }, 110);

    return () => clearInterval(timer);
  }, []);

  return (
    <main className="loading-screen" role="status" aria-label="Loading portfolio view">
      {/* Ambient cyber radial aura */}
      <div className="loading-ambient-aura" aria-hidden="true" />

      {/* Cyber Glassmorphic Centerpiece */}
      <div className="loading-card">
        {/* High-Tech Corner Brackets */}
        <span className="loading-corner corner-tl" aria-hidden="true" />
        <span className="loading-corner corner-tr" aria-hidden="true" />
        <span className="loading-corner corner-bl" aria-hidden="true" />
        <span className="loading-corner corner-br" aria-hidden="true" />

        {/* Kinetic Orbital Brand Core */}
        <div className="loading-core-wrap">
          <div className="loading-ring-outer" aria-hidden="true" />
          <div className="loading-ring-inner" aria-hidden="true" />
          <div className="loading-core-badge">
            <span className="loading-core-mark">BS</span>
          </div>
        </div>

        {/* Live Status Pill */}
        <div className="loading-status-pill">
          <span className="loading-status-dot" aria-hidden="true" />
          <span className="loading-status-text">SYSTEM INITIALIZING</span>
        </div>

        {/* Cyber Typography */}
        <h1 className="loading-heading">
          Loading <span className="loading-accent">the view.</span>
        </h1>

        <p className="loading-caption">
          Preparing intelligent systems &amp; engineering portfolio.
        </p>

        {/* Telemetry Progress Bar */}
        <div className="loading-telemetry-box">
          <div className="loading-telemetry-header">
            <span className="loading-telemetry-label">
              <span className="loading-cursor">&gt;</span> INITIALIZING PORTFOLIO
            </span>
            <span className="loading-telemetry-percent">{progress}%</span>
          </div>

          <div className="loading-track">
            <div
              className="loading-fill"
              style={{ width: `${progress}%` }}
            >
              <div className="loading-fill-glow" />
            </div>
          </div>
        </div>

        {/* Telemetry Footer Spec Chips */}
        <div className="loading-chips-row">
          <span className="loading-chip">
            <span className="loading-chip-bullet" /> AI &amp; ML
          </span>
          <span className="loading-chip-sep">/</span>
          <span className="loading-chip">
            <span className="loading-chip-bullet" /> FULL STACK
          </span>
          <span className="loading-chip-sep">/</span>
          <span className="loading-chip">
            <span className="loading-chip-bullet" /> SOFTWARE SYSTEMS
          </span>
        </div>
      </div>
    </main>
  );
}
