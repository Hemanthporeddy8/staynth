"use client";

import { useState } from "react";
import { Eye, Trash2 } from "lucide-react";
import type { PlanHotspot, Room } from "@/db/schema";
import { createHotspot, deleteHotspot } from "@/lib/actions";

type Hotspot = PlanHotspot & { room?: Room | null };

export function FloorPlanEditor({
  propertyId,
  floorPlanId,
  imageUrl,
  rooms,
  hotspots,
}: {
  propertyId: number;
  floorPlanId: number;
  imageUrl: string;
  rooms: Room[];
  hotspots: Hotspot[];
}) {
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [label, setLabel] = useState(rooms[0]?.name ?? "Eye");
  const [roomId, setRoomId] = useState(rooms[0]?.id ? String(rooms[0].id) : "");

  async function savePin(formData: FormData) {
    await createHotspot(formData);
    setDraft(null);
  }

  async function removePin(formData: FormData) {
    await deleteHotspot(formData);
  }

  function onPlanClick(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    setDraft({ x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
      <div>
        <p className="mb-3 text-sm text-ink-soft">
          Click the blueprint where a guest should look. That drop becomes an <b>eye</b>. Link it
          to a 360° room — when they tap the eye, they stand inside that room.
        </p>
        <div
          className="relative cursor-crosshair overflow-hidden rounded-3xl bg-sand ring-1 ring-ink/10"
          onClick={onPlanClick}
        >
          <img src={imageUrl} alt="Floor plan" className="pointer-events-none block w-full" />
          {hotspots.map((spot) => (
            <div
              key={spot.id}
              style={{ left: `${spot.xPercent}%`, top: `${spot.yPercent}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2"
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-terracotta text-white ring-4 ring-white shadow-lg">
                <Eye className="h-4 w-4" />
              </span>
              <span className="mt-1 block text-center text-[10px] font-semibold uppercase tracking-wider text-ink">
                {spot.label}
              </span>
            </div>
          ))}
          {draft ? (
            <span
              style={{ left: `${draft.x}%`, top: `${draft.y}%` }}
              className="absolute grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-forest text-sand ring-4 ring-gold"
            >
              <Eye className="h-4 w-4" />
            </span>
          ) : null}
        </div>
      </div>

      <aside className="space-y-5">
        <form action={savePin} className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
          <p className="font-display text-2xl">New eye</p>
          <input type="hidden" name="floorPlanId" value={floorPlanId} />
          <input type="hidden" name="propertyId" value={propertyId} />
          <input type="hidden" name="xPercent" value={draft?.x ?? ""} />
          <input type="hidden" name="yPercent" value={draft?.y ?? ""} />
          <label className="mt-4 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Label on the map
            <input
              name="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="mt-3 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Opens this 360° room
            <select
              name="roomId"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value);
                const room = rooms.find((item) => String(item.id) === e.target.value);
                if (room) setLabel(room.name);
              }}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
            >
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-3 text-xs text-ink-soft">
            {draft ? `Eye at ${draft.x}%, ${draft.y}%` : "Click the blueprint to place an eye."}
          </p>
          <button
            type="submit"
            disabled={!draft || rooms.length === 0}
            className="mt-4 w-full rounded-full bg-terracotta py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Save eye
          </button>
        </form>

        <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
          <p className="font-display text-2xl">Eyes on this plan</p>
          <ul className="mt-4 space-y-2">
            {hotspots.map((spot) => (
              <li
                key={spot.id}
                className="flex items-center justify-between rounded-2xl bg-paper px-3 py-2 text-sm"
              >
                <span>
                  {spot.label}
                  <span className="block text-[11px] text-ink-soft">
                    {spot.room?.name ?? "Unlinked"} · {spot.xPercent}%, {spot.yPercent}%
                  </span>
                </span>
                <form action={removePin}>
                  <input type="hidden" name="id" value={spot.id} />
                  <input type="hidden" name="propertyId" value={propertyId} />
                  <button type="submit" className="rounded-full p-2 text-clay hover:bg-sand">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
            {hotspots.length === 0 ? (
              <li className="text-sm text-ink-soft">No eyes yet — click the map.</li>
            ) : null}
          </ul>
        </div>
      </aside>
    </div>
  );
}
