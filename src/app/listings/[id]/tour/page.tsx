import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, BoxSelect } from "lucide-react";
import { db } from "@/db";
import { properties, rooms } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { TourStage } from "@/components/TourStage";

export const dynamic = "force-dynamic";

export default async function TourPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ room?: string }>;
}) {
  await ensureSeeded();
  const { id } = await params;
  const query = await searchParams;
  const propertyId = Number(id);
  const property = (
    await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1)
  )[0];
  if (!property) notFound();

  const propertyRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.propertyId, propertyId));
  if (propertyRooms.length === 0) notFound();

  const selected =
    propertyRooms.find((room) => String(room.id) === query.room) ?? propertyRooms[0];

  return (
    <main className="bg-ink text-paper">
      <div className="mx-auto max-w-7xl px-5 py-6 md:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/listings/${property.id}`}
            className="inline-flex items-center gap-2 text-sm text-sand/70 hover:text-paper"
          >
            <ArrowLeft className="h-4 w-4" />
            {property.title}
          </Link>
          <Link
            href={`/listings/${property.id}/plan`}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-3 py-1.5 text-sm"
          >
            <BoxSelect className="h-4 w-4" />
            Open plan
          </Link>
        </div>
        <h1 className="mt-4 font-display text-4xl">360° tour</h1>
        <p className="mt-1 text-sm text-sand/70">Drag to look around · scroll to zoom · switch rooms below</p>
      </div>
      <TourStage rooms={propertyRooms} activeId={selected.id} propertyId={property.id} />
    </main>
  );
}
