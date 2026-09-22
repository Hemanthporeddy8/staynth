import Image from "next/image";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { BoxSelect, Compass, MapPinned, View } from "lucide-react";
import { db } from "@/db";
import { properties } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import { PropertyCard } from "@/components/PropertyCard";
import { SearchBar } from "@/components/SearchBar";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await ensureSeeded();
  const featured = await db
    .select()
    .from(properties)
    .where(eq(properties.featured, true))
    .orderBy(desc(properties.rating));
  const more = await db.select().from(properties).orderBy(desc(properties.rating));

  return (
    <main>
      <section className="relative mx-auto max-w-7xl px-5 pb-8 pt-8 md:px-8 md:pt-12">
        <div className="grid items-end gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-terracotta">
              Stays · plots · 360° interiors
            </p>
            <h1 className="mt-4 font-display text-[clamp(2.8rem,7vw,5.6rem)] leading-[0.92] tracking-tight text-ink">
              See the room
              <span className="block italic text-forest">before you stay.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-7 text-ink-soft">
              Aerio is a marketplace like Airbnb and OYO — with a street-view for interiors.
              Hosts upload a floor or plot map, drop View pins, and guests spin through every
              room in 360°.
            </p>
            <div className="mt-8">
              <SearchBar />
            </div>
            <div className="mt-6 flex flex-wrap gap-2 text-xs text-ink-soft">
              {["Mumbai", "Goa", "Bangalore", "Jaisalmer", "Manali"].map((city) => (
                <Link
                  key={city}
                  href={`/listings?city=${city}`}
                  className="rounded-full bg-white px-3 py-1.5 ring-1 ring-ink/10 hover:bg-sand"
                >
                  {city}
                </Link>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-[2rem] shadow-[0_30px_80px_rgba(27,23,19,0.22)]">
              <Image
                src="/images/hero.jpg"
                alt="Lantern-lit boutique courtyard"
                width={1600}
                height={1060}
                className="h-[420px] w-full object-cover md:h-[520px]"
                priority
              />
            </div>
            <div className="absolute -bottom-6 left-6 right-6 grid grid-cols-3 gap-2 rounded-2xl bg-white/95 p-3 text-center text-[11px] shadow-xl ring-1 ring-ink/8 md:text-xs">
              <div>
                <View className="mx-auto mb-1 h-4 w-4 text-terracotta" />
                Drag 360°
              </div>
              <div>
                <BoxSelect className="mx-auto mb-1 h-4 w-4 text-terracotta" />
                View in plan
              </div>
              <div>
                <MapPinned className="mx-auto mb-1 h-4 w-4 text-terracotta" />
                Pin any room
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-20 max-w-7xl px-5 md:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Featured</p>
            <h2 className="mt-2 font-display text-4xl md:text-5xl">Walk in before you book</h2>
          </div>
          <Link href="/listings" className="text-sm font-medium text-terracotta hover:underline">
            All listings
          </Link>
        </div>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-24 grid max-w-7xl gap-6 px-5 md:grid-cols-3 md:px-8">
        {[
          {
            icon: Compass,
            title: "360° like street view",
            body: "Stand in the lobby, spin to the pool, then hop into the suite. Each panorama is captured per room.",
          },
          {
            icon: BoxSelect,
            title: "View in plan",
            body: "Hosts upload the selling plot or hotel floor map and drop a View button on every room. Guests tap to enter.",
          },
          {
            icon: MapPinned,
            title: "A desk for hosts",
            body: "Manage guests, buyers, bookings and the pins on your plan from one dashboard.",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-3xl bg-white p-6 ring-1 ring-ink/8">
            <item.icon className="h-6 w-6 text-terracotta" />
            <h3 className="mt-4 font-display text-2xl">{item.title}</h3>
            <p className="mt-2 text-sm leading-6 text-ink-soft">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="mx-auto mt-24 max-w-7xl px-5 md:px-8">
        <h2 className="font-display text-4xl">More places with a plan</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {more.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      </section>
    </main>
  );
}
