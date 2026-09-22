import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, View } from "lucide-react";
import { FloorPlanViewer } from "@/components/FloorPlanViewer";
import { getListingPlan } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propertyId = Number(id);
  const { property, plan, hotspots, rooms: propertyRooms } = await getListingPlan(propertyId);
  if (!property) notFound();

  if (!plan) {
    return (
      <main className="mx-auto max-w-2xl px-5 py-20 text-center">
        <div className="rounded-3xl bg-white p-8 ring-1 ring-ink/10 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Floor Plan</p>
          <h1 className="mt-2 font-display text-3xl">{property.title}</h1>
          <p className="mt-3 text-sm text-ink-soft">
            The owner has not uploaded a floor blueprint for this stay yet. You can still tour the rooms in immersive 360°!
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={`/listings/${property.id}/tour`}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-terracotta-dark transition cursor-pointer"
            >
              <View className="h-4 w-4" />
              Open 360° Room Tour
            </Link>
            <Link
              href={`/listings/${property.id}`}
              className="inline-flex items-center rounded-full bg-paper-2 px-5 py-2.5 text-sm font-medium text-ink ring-1 ring-ink/10 hover:bg-paper transition cursor-pointer"
            >
              Back to Listing
            </Link>
          </div>
        </div>
      </main>
    );
  }

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
