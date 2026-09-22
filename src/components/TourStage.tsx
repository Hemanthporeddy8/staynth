"use client";

import Link from "next/link";
import type { Room } from "@/db/schema";
import { PanoramaViewer } from "@/components/PanoramaViewer";

export function TourStage({
  rooms,
  activeId,
  propertyId,
}: {
  rooms: Room[];
  activeId: number;
  propertyId: number;
}) {
  const active = rooms.find((room) => room.id === activeId) ?? rooms[0];

  return (
    <div>
      <div className="h-[68vh] min-h-[420px] w-full overflow-hidden bg-black">
        <PanoramaViewer
          key={active.id}
          src={active.panoramaUrl}
          caption={active.description}
        />
      </div>
      <div className="mx-auto flex max-w-7xl gap-3 overflow-x-auto px-5 py-5 md:px-8">
        {rooms.map((room) => {
          const selected = room.id === active.id;
          return (
            <Link
              key={room.id}
              href={`/listings/${propertyId}/tour?room=${room.id}`}
              className={`min-w-[180px] overflow-hidden rounded-2xl ring-2 ${
                selected ? "ring-gold" : "ring-white/10"
              }`}
            >
              <img src={room.thumbnailUrl} alt="" className="h-24 w-full object-cover" />
              <p className="bg-white/8 px-3 py-2 text-sm text-paper">{room.name}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
