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

    // Use synchronized 2D context to prevent compositor tearing/distortion on scroll initiation
    const context = canvasElement.getContext("2d", { alpha: false });
    if (!context) return;
    const canvas = canvasElement;
    const ctx = context;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const cache = new Map<number, HTMLImageElement>();
    const pending = new Map<number, HTMLImageElement>();
    const queue = new Set<number>();
    const root = document.documentElement;
    const maxCache = 50;
    const maxConcurrent = window.innerWidth < 700 ? 5 : 12;
    let activeLoads = 0;
    let currentFrame = 0;
    let targetFrame = 0;
    let lastDrawn = -1;
    let frameId = 0;
    let previousTime = 0;
    let width = 0;
    let height = 0;
    let alive = true;

    function updateAtmosphere(progress: number) {
      const rgb = progress < 0.52
        ? mixColor(BLACK, WARM_NAVY, progress / 0.52)
        : mixColor(WARM_NAVY, DEEP_EMBER, (progress - 0.52) / 0.48);
      root.style.setProperty("--ambient-rgb", rgb);
    }

    function resize() {
      const cap = window.innerWidth < 700 ? 1.5 : 2;
      const ratio = Math.min(window.devicePixelRatio || 1, cap);
      const rect = canvas.getBoundingClientRect();
      const cssWidth = rect.width || window.innerWidth;
      const cssHeight = rect.height || window.innerHeight;

      width = Math.round(cssWidth * ratio);
      height = Math.round(cssHeight * ratio);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
      }

      lastDrawn = -1;
      drawClosest();
    }

    function draw(index: number) {
      const image = cache.get(index);
      if (!image?.complete || !image.naturalWidth) return false;
      if (lastDrawn === index) return true;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Natural cover scale ensuring edge-to-edge coverage with zero distortion or black bars
      const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
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

      // 4-way clamp guaranteeing zero black bars while keeping head comfortably within viewport
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
      if (draw(wanted)) return;
      if (lastDrawn >= 0 && draw(lastDrawn)) return;
      for (let distance = 1; distance < FRAME_COUNT; distance += 1) {
        if (draw(wanted - distance) || draw(wanted + distance)) return;
      }
    }

    function trimCache() {
      if (cache.size <= maxCache) return;
      const keep = new Set([...cache.keys()]
        .sort((a, b) => Math.abs(a - currentFrame) - Math.abs(b - currentFrame))
        .slice(0, maxCache));
      for (const index of cache.keys()) if (!keep.has(index)) cache.delete(index);
    }

    function pump() {
      while (alive && activeLoads < maxConcurrent && queue.size > 0) {
        const next = [...queue].sort((a, b) => Math.abs(a - targetFrame) - Math.abs(b - targetFrame))[0];
        queue.delete(next);
        if (cache.has(next) || pending.has(next)) continue;

        const image = new Image();
        image.decoding = "async";
        pending.set(next, image);
        activeLoads += 1;
        image.onload = () => {
          if (!alive) return;
          pending.delete(next);
          activeLoads -= 1;
          cache.set(next, image);
          trimCache();
          drawClosest();
          pump();
        };
        image.onerror = () => {
          pending.delete(next);
          activeLoads -= 1;
          pump();
        };
        image.src = `${FRAME_DIRECTORY}/frame_${String(next + 1).padStart(4, "0")}.jpg`;
      }
    }

    function requestNear(center: number, behind = 4, ahead = 14) {
      const start = Math.max(0, Math.floor(center) - behind);
      const end = Math.min(FRAME_COUNT - 1, Math.ceil(center) + ahead);
      for (let index = start; index <= end; index += 1) {
        if (!cache.has(index) && !pending.has(index)) queue.add(index);
      }
      pump();
    }

    function updateScroll() {
      const scrollable = Math.max(1, root.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / scrollable));
      targetFrame = progress * (FRAME_COUNT - 1);
      updateAtmosphere(progress);
      requestNear(targetFrame, 6, 20);
    }

    function render(now: number) {
      if (!alive) return;
      const elapsed = previousTime ? Math.min(now - previousTime, 48) : 16;
      previousTime = now;
      const amount = 1 - Math.exp(-elapsed / 68);
      currentFrame += (targetFrame - currentFrame) * amount;
      if (Math.abs(targetFrame - currentFrame) < 0.012) currentFrame = targetFrame;
      requestNear(currentFrame);
      drawClosest();
      frameId = window.requestAnimationFrame(render);
    }

    window.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    resize();
    requestNear(0, 0, 20);
    updateScroll();
    frameId = window.requestAnimationFrame(render);

    return () => {
      alive = false;
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
