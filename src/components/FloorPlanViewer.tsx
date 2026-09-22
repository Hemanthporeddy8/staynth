"use client";

import { useState } from "react";
import { Eye, X } from "lucide-react";
import type { PlanHotspot, Room } from "@/db/schema";
import { PanoramaViewer } from "@/components/PanoramaViewer";

type Hotspot = PlanHotspot & { room?: Room | null };

export function FloorPlanViewer({
  imageUrl,
  name,
  hotspots,
}: {
  imageUrl: string;
  name: string;
  hotspots: Hotspot[];
}) {
  const [active, setActive] = useState<Hotspot | null>(null);

  return (
    <div>
      <div className="relative overflow-hidden rounded-3xl bg-sand ring-1 ring-ink/10">
        <img src={imageUrl} alt={name} className="block w-full select-none" />
        {hotspots.map((spot) => (
          <button
            key={spot.id}
            type="button"
            onClick={() => setActive(spot)}
            style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
          >
            <span className="hotspot-pulse absolute inset-0 rounded-full bg-terracotta" />
            <span className="relative grid h-11 w-11 place-items-center rounded-full bg-terracotta text-white shadow-lg ring-4 ring-white/80">
              <Eye className="h-4 w-4" />
            </span>
            <span className="absolute left-1/2 top-12 -translate-x-1/2 whitespace-nowrap rounded-full bg-ink px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper opacity-0 shadow-lg transition group-hover:opacity-100">
              Look inside · {spot.label}
            </span>
          </button>
        ))}
      </div>

      {active?.room ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-5xl overflow-hidden rounded-3xl bg-ink shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 text-paper">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gold">360° room view</p>
                <p className="font-display text-2xl">{active.room.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setActive(null)}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[70vh]">
              <PanoramaViewer src={active.room.panoramaUrl} caption={active.room.description} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
