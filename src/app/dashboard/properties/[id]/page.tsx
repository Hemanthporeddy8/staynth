import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { floorPlans, planHotspots, properties, rooms } from "@/db/schema";
import { OwnerStudio } from "@/components/OwnerStudio";

export const dynamic = "force-dynamic";

export default async function PropertyStudioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propertyId = Number(id);
  const property = (
    await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1)
  )[0];
  if (!property) notFound();

  const plan = (
    await db.select().from(floorPlans).where(eq(floorPlans.propertyId, propertyId)).limit(1)
  )[0] ?? null;
  const propertyRooms = await db.select().from(rooms).where(eq(rooms.propertyId, propertyId));
  const spots = plan
    ? await db.select().from(planHotspots).where(eq(planHotspots.floorPlanId, plan.id))
    : [];
  const roomMap = Object.fromEntries(propertyRooms.map((room) => [room.id, room]));
  const hotspots = spots.map((spot) => ({
    ...spot,
    room: spot.roomId ? roomMap[spot.roomId] ?? null : null,
  }));

  const { createdAt: _createdAt, ...listing } = property;

  return (
    <main>
      <Link href="/dashboard/properties" className="text-sm text-ink-soft hover:text-ink">
        ← My listings
      </Link>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">Owner studio</p>
      <h1 className="mt-2 font-display text-4xl">{property.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Upload 360° rooms, the floor or plot blueprint, then click the map to place eyes. Guests
        tap an eye and look around that room.
      </p>
      <div className="mt-6">
        <OwnerStudio property={listing} rooms={propertyRooms} plan={plan} hotspots={hotspots} />
      </div>
    </main>
  );
}
