import { PropertyCard } from "@/components/PropertyCard";
import { SearchBar } from "@/components/SearchBar";
import { STAY_TYPES } from "@/lib/stay-types";
import { getListings } from "@/lib/data";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ city?: string; listingType?: string; type?: string; guests?: string; tour?: string }>;
}) {
  const params = await searchParams;
  const rows = await getListings(params);
  const types = STAY_TYPES;

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 md:px-8">
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Catalogue</p>
      <h1 className="mt-2 font-display text-5xl">Find a stay or a plot</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Every listing ships with a 360° interior and a View-in-plan map. Filter by city, stay or
        sale.
      </p>
      <div className="mt-8">
        <SearchBar compact />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link
          href="/listings"
          className="rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-paper"
        >
          All
        </Link>
        {types.map((type) => (
          <Link
            key={type.value}
            href={`/listings?type=${type.value}`}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-ink/10 hover:bg-sand"
          >
            {type.label}
          </Link>
        ))}
        <Link
          href="/listings?listingType=sale"
          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium ring-1 ring-ink/10 hover:bg-sand"
        >
          For sale
        </Link>
      </div>
      <p className="mt-8 text-sm text-ink-soft">{rows.length} places</p>
      <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </main>
  );
}
