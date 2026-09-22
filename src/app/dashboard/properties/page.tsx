import Image from "next/image";
import Link from "next/link";
import { db } from "@/db";
import { floorPlans, properties, rooms } from "@/db/schema";
import { stayTypeLabel } from "@/lib/stay-types";

export const dynamic = "force-dynamic";

export default async function DashboardPropertiesPage() {
  const rows = await db.select().from(properties);
  const allRooms = await db.select().from(rooms);
  const allPlans = await db.select().from(floorPlans);

  return (
    <main>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Owner studio</p>
          <h1 className="mt-2 font-display text-4xl">My listings</h1>
          <p className="mt-2 text-sm text-ink-soft">
            Create a stay or plot, upload 360° rooms, drop a blueprint, then place eyes.
          </p>
        </div>
        <Link
          href="/dashboard/properties/new"
          className="rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white"
        >
          List a property
        </Link>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["Listings", String(rows.length)],
          ["360° rooms", String(allRooms.length)],
          ["Blueprints", String(allPlans.length)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/8">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
            <p className="font-display text-2xl">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {rows.map((property) => {
          const roomCount = allRooms.filter((room) => room.propertyId === property.id).length;
          const hasPlan = allPlans.some((plan) => plan.propertyId === property.id);
          return (
            <Link
              key={property.id}
              href={`/dashboard/properties/${property.id}`}
              className="flex items-center gap-4 rounded-3xl bg-white p-3 ring-1 ring-ink/8 hover:bg-sand/40"
            >
              <div className="relative h-20 w-28 overflow-hidden rounded-2xl bg-sand">
                {property.coverImage.startsWith("http") ? (
                  <Image src={property.coverImage} alt="" fill className="object-cover" />
                ) : (
                  <img src={property.coverImage} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl">{property.title}</p>
                <p className="text-sm text-ink-soft">
                  {property.city} · {property.listingType} · {stayTypeLabel(property.type)}
                </p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-ink-soft">
                  {roomCount} × 360° · {hasPlan ? "blueprint ready" : "no blueprint"}
                </p>
              </div>
              <span className="rounded-full bg-paper px-3 py-1 text-xs uppercase tracking-wider">
                Open studio
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
