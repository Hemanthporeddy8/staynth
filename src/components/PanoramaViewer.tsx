"use client";

import { useEffect, useRef, useState } from "react";
import "@photo-sphere-viewer/core/index.css";

export function PanoramaViewer({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loadingMsg, setLoadingMsg] = useState<"network" | "cache" | null>("network");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let viewer: { destroy: () => void; setPanorama: (url: string) => Promise<unknown> } | null =
      null;
    let cancelled = false;

    async function boot() {
      // Check if the Service Worker has this panorama cached already
      let isCached = false;
      if ("caches" in window) {
        try {
          const cache = await caches.open("staynth-pano-v1");
          const cached = await cache.match(src);
          if (cached) {
            isCached = true;
            setLoadingMsg("cache");
          }
        } catch {
          /* caches API not available — fine */
        }
      }
      if (!isCached) setLoadingMsg("network");

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
        // Show cache hint in loading text
        loadingTxt: isCached ? "Loading from device cache…" : "Opening 360° view…",
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
      });

      setLoadingMsg(null);
    }

    boot().catch(() => {
      setLoadingMsg(null);
      /* viewer will show its own error surface */
    });

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, [src, caption]);

  return (
    <div className="relative h-full w-full">
      {/* Cache indicator badge */}
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
