"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const FRAME_COUNT = 300;
const FRAME_DIRECTORY = "/frames";
const BLACK = [0, 0, 0] as const;
const WARM_NAVY = [14, 12, 24] as const;
const DEEP_EMBER = [28, 12, 6] as const;

function mixColor(from: readonly number[], to: readonly number[], amount: number) {
  return from.map((channel, index) => Math.round(channel + (to[index] - channel) * amount)).join(" ");
}

export function ScrollCanvas() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin-admin")) return;
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;

    // Use synchronized 2D context with desynchronized hint for low-latency rendering
    const context = canvasElement.getContext("2d", { alpha: false, desynchronized: true });
    if (!context) return;
    const canvas = canvasElement;
    const ctx = context;

    // Detect low-power or mobile environments to adapt resolution & decoding pipeline
    const isTouch = typeof window !== "undefined" && ("ontouchstart" in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0));
    const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 900;
    const hardwareConcurrency = typeof navigator !== "undefined" ? navigator.hardwareConcurrency || 4 : 4;
    const isLowPower = isTouch || isMobileScreen || hardwareConcurrency <= 6;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = isLowPower ? "low" : "medium";

    const cache = new Map<number, HTMLImageElement>();
    const pending = new Map<number, HTMLImageElement>();
    const queue = new Set<number>();
    const root = document.documentElement;

    // Concurrency tuned to device capability so network/CPU is never overloaded
    const maxConcurrent = isLowPower ? 3 : 6;

    let activeLoads = 0;
    let currentFrame = 0;
    let targetFrame = 0;
    let lastDrawn = -1;
    let lastRequestedCenter = -999;
    let frameId = 0;
    let isAnimating = false;
    let previousTime = 0;
    let width = 0;
    let height = 0;
    let alive = true;
    let idleTimer: NodeJS.Timeout | null = null;

    function updateAtmosphere(progress: number) {
      const rgb = progress < 0.52
        ? mixColor(BLACK, WARM_NAVY, progress / 0.52)
        : mixColor(WARM_NAVY, DEEP_EMBER, (progress - 0.52) / 0.48);
      root.style.setProperty("--ambient-rgb", rgb);
    }

    function resize() {
      // Clamped DPR prevents GPU fillrate thrashing on budget devices & high-res mobile displays
      const dpr = window.devicePixelRatio || 1;
      const cap = isLowPower ? 1.0 : Math.min(dpr, 1.35);
      const ratio = Math.max(0.85, Math.min(dpr, cap));

      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width || window.innerWidth;
      const cssHeight = rect.height || window.innerHeight;

      width = Math.round(cssWidth * ratio);
      height = Math.round(cssHeight * ratio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = isLowPower ? "low" : "medium";
      }

      lastDrawn = -1;
      drawClosest();
    }

    function draw(index: number) {
      const image = cache.get(index);
      if (!image?.complete || !image.naturalWidth) return false;
      if (lastDrawn === index) return true;

      // Cover scaling with zoom = 1.20 and 4-way clamped coordinates per Rule 2
      const zoom = 1.20;
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom;
      const imageWidth = Math.ceil(image.naturalWidth * scale);
      const imageHeight = Math.ceil(image.naturalHeight * scale);

      // Center horizontally on Bijoy's head (focal center X ≈ 42.2%, Y ≈ 23%)
      const isPortrait = width / height < 1.3;
      let dx = isPortrait
        ? Math.round(width / 2 - imageWidth * 0.422)
        : Math.round((width - imageWidth) / 2);

      // Preserve full head and facial framing on all screen aspect ratios
      let dy = isPortrait
        ? Math.round(height * 0.32 - imageHeight * 0.23)
        : Math.round(height * 0.35 - imageHeight * 0.23);

      // 4-way clamp guaranteeing zero black bars or edge gaps
      if (dx > 0) dx = 0;
      if (dx + imageWidth < width) dx = width - imageWidth;
      if (dy > 0) dy = 0;
      if (dy + imageHeight < height) dy = height - imageHeight;

      ctx.drawImage(image, dx, dy, imageWidth, imageHeight);
      lastDrawn = index;
      return true;
    }

    function drawClosest() {
      const wanted = Math.max(0, Math.min(FRAME_COUNT - 1, Math.round(currentFrame)));
      if (cache.has(wanted) && draw(wanted)) return;
      if (lastDrawn >= 0 && cache.has(lastDrawn) && draw(lastDrawn)) return;

      // Radiate search for the nearest loaded frame - check cache first to avoid math
      for (let distance = 1; distance < FRAME_COUNT; distance += 1) {
        const lower = wanted - distance;
        if (lower >= 0 && cache.has(lower) && draw(lower)) return;
        const upper = wanted + distance;
        if (upper < FRAME_COUNT && cache.has(upper) && draw(upper)) return;
      }
    }

    function scheduleIdlePreload() {
      if (!alive || activeLoads > 0 || queue.size > 0 || cache.size >= FRAME_COUNT) return;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!alive || activeLoads > 0 || queue.size > 0 || cache.size >= FRAME_COUNT) return;
        const missing: number[] = [];
        for (let i = 0; i < FRAME_COUNT; i++) {
          if (!cache.has(i) && !pending.has(i)) {
            missing.push(i);
          }
        }
        if (missing.length === 0) return;

        // Radiate outward from target frame
        missing.sort((a, b) => Math.abs(a - targetFrame) - Math.abs(b - targetFrame));
        const batch = Math.min(isLowPower ? 3 : 6, missing.length);
        for (let i = 0; i < batch; i++) {
          queue.add(missing[i]);
        }
        pump();
      }, 100);
    }

    function pump() {
      while (alive && activeLoads < maxConcurrent && queue.size > 0) {
        // Find queue item closest to target frame without heavy re-sorting
        let bestFrame = -1;
        let minDiff = Infinity;
        for (const f of queue) {
          const diff = Math.abs(f - targetFrame);
          if (diff < minDiff) {
            minDiff = diff;
            bestFrame = f;
          }
        }

        if (bestFrame === -1) break;
        queue.delete(bestFrame);
        if (cache.has(bestFrame) || pending.has(bestFrame)) continue;

        const next = bestFrame;
        const image = new Image();
        image.decoding = "async";
        pending.set(next, image);
        activeLoads += 1;

        const onFinished = () => {
          if (!alive) return;
          pending.delete(next);
          activeLoads -= 1;
          cache.set(next, image);
          drawClosest();
          pump();
        };

        image.onload = () => {
          if (!alive) return;
          if (!isLowPower && typeof image.decode === "function") {
            image.decode().then(onFinished).catch(onFinished);
          } else {
            onFinished();
          }
        };

        image.onerror = () => {
          pending.delete(next);
          activeLoads -= 1;
          pump();
        };

        image.src = `${FRAME_DIRECTORY}/frame_${String(next + 1).padStart(4, "0")}.jpg`;
      }

      if (queue.size === 0 && activeLoads === 0) {
        scheduleIdlePreload();
      }
    }

    function requestNear(center: number, behind = 6, ahead = 18) {
      if (Math.abs(center - lastRequestedCenter) < 0.6) return;
      lastRequestedCenter = center;

      const start = Math.max(0, Math.floor(center) - behind);
      const end = Math.min(FRAME_COUNT - 1, Math.ceil(center) + ahead);

      // On low power, prioritize immediate keyframe targets first
      for (let index = start; index <= end; index += 1) {
        if (!cache.has(index) && !pending.has(index)) queue.add(index);
      }
      pump();
    }

    function startAnimation() {
      if (!isAnimating && alive) {
        isAnimating = true;
        previousTime = 0;
        frameId = window.requestAnimationFrame(render);
      }
    }

    function updateScroll() {
      const scrollable = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / scrollable));
      targetFrame = progress * (FRAME_COUNT - 1);
      updateAtmosphere(progress);
      requestNear(targetFrame, isLowPower ? 4 : 8, isLowPower ? 14 : 26);
      startAnimation();
    }

    function render(now: number) {
      if (!alive) {
        isAnimating = false;
        return;
      }
      const elapsed = previousTime ? Math.min(now - previousTime, 48) : 16;
      previousTime = now;

      // Dynamic smoothing: faster convergence on low-power devices prevents frame lag backlog
      const smoothing = isLowPower ? 18 : 24;
      const amount = 1 - Math.exp(-elapsed / smoothing);
      currentFrame += (targetFrame - currentFrame) * amount;

      const diff = Math.abs(targetFrame - currentFrame);
      const settleThreshold = isLowPower ? 0.08 : 0.02;
      if (diff < settleThreshold) {
        currentFrame = targetFrame;
      }

      if (Math.abs(currentFrame - lastRequestedCenter) >= 3.5) {
        requestNear(currentFrame, isLowPower ? 3 : 5, isLowPower ? 8 : 16);
      }
      drawClosest();

      const wanted = Math.round(currentFrame);
      // Auto-sleep render loop when settled at target frame to save battery & GPU
      if (diff < settleThreshold && lastDrawn === wanted) {
        isAnimating = false;
        return;
      }

      frameId = window.requestAnimationFrame(render);
    }

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    resize();
    requestNear(0, 0, isLowPower ? 12 : 22);
    updateScroll();
    startAnimation();

    return () => {
      alive = false;
      isAnimating = false;
      if (idleTimer) clearTimeout(idleTimer);
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", resize);
      for (const image of pending.values()) {
        image.onload = null;
        image.onerror = null;
        image.src = "";
      }
      pending.clear();
      cache.clear();
      queue.clear();
      root.style.removeProperty("--ambient-rgb");
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin-admin")) return null;

  return <canvas className="scroll-canvas" ref={canvasRef} aria-hidden="true" />;
}
