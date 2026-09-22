import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { BoxSelect, MapPin, Star, View } from "lucide-react";
import { db } from "@/db";
import { properties, reviews, rooms } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { BookingWidget } from "@/components/BookingWidget";
import { stayTypeLabel } from "@/lib/stay-types";

export const dynamic = "force-dynamic";

export default async function ListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureSeeded();
  const { id } = await params;
  const propertyId = Number(id);
  if (!propertyId) notFound();

  const property = (
    await db.select().from(properties).where(eq(properties.id, propertyId)).limit(1)
  )[0];
  if (!property) notFound();

  const propertyRooms = await db
    .select()
    .from(rooms)
    .where(eq(rooms.propertyId, propertyId));
  const propertyReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.propertyId, propertyId));

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <p className="text-xs uppercase tracking-[0.18em] text-gold">
        {stayTypeLabel(property.type)} · {property.listingType === "sale" ? "for sale" : "nightly stay"}
      </p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl md:text-6xl">{property.title}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-soft">
            <MapPin className="h-4 w-4" />
            {property.address}
            <span className="inline-flex items-center gap-1 text-ink">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              {property.rating.toFixed(2)} · {property.reviewCount} reviews
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/listings/${property.id}/tour`}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-paper"
          >
            <View className="h-4 w-4" />
            360° tour
          </Link>
          <Link
            href={`/listings/${property.id}/plan`}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2.5 text-sm font-medium text-white"
          >
            <BoxSelect className="h-4 w-4" />
            View in plan
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4 md:grid-rows-2">
        {property.images.slice(0, 5).map((src, index) => (
          <div
            key={src}
            className={`relative overflow-hidden ${
              index === 0 ? "min-h-[280px] md:col-span-2 md:row-span-2 md:min-h-[460px] rounded-l-3xl" : "min-h-[140px] hidden md:block"
            } ${index === 2 ? "rounded-tr-3xl" : ""} ${index === 4 ? "rounded-br-3xl" : ""}`}
          >
            {src.startsWith("http") ? (
              <Image src={src} alt="" fill className="object-cover" sizes="50vw" />
            ) : (
              <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="font-display text-3xl">{property.tagline}</p>
          <p className="mt-4 max-w-2xl text-base leading-7 text-ink-soft">{property.description}</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Rooms", `${property.bedrooms} bed`],
              ["Baths", `${property.bathrooms}`],
              ["Guests", `${property.maxGuests}`],
              ["Area", `${property.areaSqft.toLocaleString("en-IN")} sq.ft`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/8">
                <dt className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">{label}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
          </dl>

          <h2 className="mt-10 font-display text-3xl">Amenities</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {property.amenities.map((item) => (
              <li key={item} className="rounded-full bg-white px-3 py-1.5 text-sm ring-1 ring-ink/8">
                {item}
              </li>
            ))}
          </ul>

          <h2 className="mt-10 font-display text-3xl">Rooms you can stand in</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {propertyRooms.map((room) => (
              <Link
                key={room.id}
                href={`/listings/${property.id}/tour?room=${room.id}`}
                className="group overflow-hidden rounded-3xl bg-white ring-1 ring-ink/8"
              >
                <div className="relative h-36">
                  {room.thumbnailUrl.startsWith("http") ? (
                    <Image src={room.thumbnailUrl} alt={room.name} fill className="object-cover" />
                  ) : (
                    <img
                      src={room.thumbnailUrl}
                      alt={room.name}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-2 py-1 text-[10px] uppercase tracking-wider text-paper">
                    360°
                  </span>
                </div>
                <div className="p-4">
                  <p className="font-medium">{room.name}</p>
                  <p className="text-sm text-ink-soft">{room.description}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-10 rounded-3xl bg-forest p-6 text-sand">
            <p className="text-xs uppercase tracking-[0.18em] text-gold">Hosted by</p>
            <p className="mt-1 font-display text-3xl">{property.hostName}</p>
            <p className="text-sm text-sand/70">{property.hostRole}</p>
          </div>

          <h2 className="mt-10 font-display text-3xl">Guest notes</h2>
          <div className="mt-4 space-y-3">
            {propertyReviews.map((review) => (
              <article key={review.id} className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
                <p className="text-sm font-semibold">
                  {review.author} · {"★".repeat(review.rating)}
                </p>
                <p className="mt-2 text-sm leading-6 text-ink-soft">{review.comment}</p>
              </article>
            ))}
          </div>
        </div>
        <div className="lg:sticky lg:top-24 lg:h-fit">
          <BookingWidget
            property={{
              id: property.id,
              title: property.title,
              listingType: property.listingType,
              price: property.price,
              rating: property.rating,
              reviewCount: property.reviewCount,
              maxGuests: property.maxGuests,
            }}
          />
        </div>
      </div>
    </main>
  );
}
