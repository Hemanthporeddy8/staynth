"use client";

import { useEffect, useRef } from "react";
import "@photo-sphere-viewer/core/index.css";

export function PanoramaViewer({
  src,
  caption,
}: {
  src: string;
  caption?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let viewer: { destroy: () => void; setPanorama: (url: string) => Promise<unknown> } | null =
      null;
    let cancelled = false;

    async function boot() {
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
        loadingTxt: "Opening 360° view…",
        touchmoveTwoFingers: false,
        mousewheelCtrlKey: false,
      });
    }

    boot().catch(() => {
      /* viewer will show its own error surface */
    });

    return () => {
      cancelled = true;
      viewer?.destroy();
    };
  }, [src, caption]);

  return <div ref={containerRef} className="psv-host h-full w-full" />;
}
