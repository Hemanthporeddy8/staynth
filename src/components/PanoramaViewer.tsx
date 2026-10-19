"use client";

import { useEffect, useRef, useState } from "react";
import "@photo-sphere-viewer/core/index.css";

export function PanoramaViewer({
  src,
  caption,
  thumbnail,
  autoplay = false,
}: {
  src: string;
  caption?: string;
  /** Optional low-res thumbnail shown before the viewer boots */
  thumbnail?: string;
  /** If true, skip the splash and load immediately (used in studio preview) */
  autoplay?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(autoplay);
  const [loadingMsg, setLoadingMsg] = useState<"network" | "cache" | null>(null);

  useEffect(() => {
    if (!active) return;

    const container = containerRef.current;
    if (!container) return;

    let viewer: { destroy: () => void } | null = null;
    let cancelled = false;

    async function boot() {
      // Check SW cache
      let isCached = false;
      if ("caches" in window) {
        try {
          const cache = await caches.open("staynth-pano-v1");
          isCached = !!(await cache.match(src));
        } catch { /* fine */ }
      }
      setLoadingMsg(isCached ? "cache" : "network");

      const { Viewer } = await import("@photo-sphere-viewer/core");
      if (cancelled || !containerRef.current) return;

      viewer = new Viewer({
        container: containerRef.current,
        panorama: src,
        caption: caption ?? "Drag to look around · scroll to zoom",
        navbar: ["zoom", "move", "fullscreen", "caption"],
        defaultZoomLvl: 40,
        minFov: 30,
        maxFov: 90,
        loadingTxt: isCached ? "Loading from device cache…" : "Opening 360° view…",
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
      });

      setLoadingMsg(null);
    }

    boot().catch(() => setLoadingMsg(null));

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, [active, src, caption]);

  // ── Splash screen (shown before user taps play) ──────────────────────────
  if (!active) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {/* Blurred thumbnail */}
        {thumbnail ? (
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover scale-105 blur-sm opacity-70"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-ink/60 to-ink/90" />
        )}

        {/* Centre play button */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <button
            onClick={() => setActive(true)}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/40 transition hover:bg-white/25 hover:scale-105 active:scale-95"
            aria-label="Open 360° view"
          >
            {/* 360° icon */}
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-white" aria-hidden>
              <path d="M12 4C7.58 4 4 7.58 4 12s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm0 14.5c-3.59 0-6.5-2.91-6.5-6.5S8.41 5.5 12 5.5s6.5 2.91 6.5 6.5-2.91 6.5-6.5 6.5z" />
              <path d="M10 8.5v7l5.25-3.5z" />
            </svg>
          </button>
          <p className="rounded-full bg-black/40 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-sm">
            Tap to enter 360°
          </p>
        </div>
      </div>
    );
  }

  // ── Active viewer ────────────────────────────────────────────────────────
  return (
    <div className="relative h-full w-full">
      {loadingMsg === "cache" && (
        <div className="absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-green-600/90 px-2.5 py-1 text-[10px] font-semibold text-white shadow">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Cached on device
        </div>
      )}
      <div ref={containerRef} className="psv-host h-full w-full" />
    </div>
  );
}
