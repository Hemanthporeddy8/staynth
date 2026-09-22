import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, View } from "lucide-react";
import { db } from "@/db";
import { floorPlans, planHotspots, properties, rooms } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { FloorPlanViewer } from "@/components/FloorPlanViewer";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureSeeded();
  const { id } = await params;
  const propertyId = Number(id);
  const property = (
    await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1)
  )[0];
  if (!property) notFound();

  const plan = (
    await db.select().from(floorPlans).where(eq(floorPlans.propertyId, propertyId)).limit(1)
  )[0];
  if (!plan) notFound();

  const propertyRooms = await db.select().from(rooms).where(eq(rooms.propertyId, propertyId));
  const spots = await db.select().from(planHotspots).where(eq(planHotspots.floorPlanId, plan.id));
  const roomMap = Object.fromEntries(propertyRooms.map((room) => [room.id, room]));

  const hotspots = spots.map((spot) => ({
    ...spot,
    room: spot.roomId ? roomMap[spot.roomId] ?? null : null,
  }));

  return (
    <main className="mx-auto max-w-6xl px-5 py-8 md:px-8">
      <Link
        href={`/listings/${property.id}`}
        className="inline-flex items-center gap-2 text-sm text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to {property.title}
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-gold">View in plan</p>
      <h1 className="mt-2 font-display text-5xl">{plan.name}</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        {plan.description} Orange eyes were placed by the owner on this blueprint. Tap an eye to
        stand inside that room in 360°.
      </p>
      <div className="mt-8">
        <FloorPlanViewer imageUrl={plan.imageUrl} name={plan.name} hotspots={hotspots} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {propertyRooms.map((room) => (
          <Link
            key={room.id}
            href={`/listings/${property.id}/tour?room=${room.id}`}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-ink/10"
          >
            <View className="h-3.5 w-3.5 text-terracotta" />
            {room.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
