import Image from "next/image";
import Link from "next/link";
import { BoxSelect, MapPin, Star, View } from "lucide-react";
import type { Property } from "@/db/schema";
import { formatPrice } from "@/lib/format";
import { stayTypeLabel } from "@/lib/stay-types";

export function PropertyCard({ property }: { property: Property }) {
  return (
    <Link href={`/listings/${property.id}`} className="card-lift group block">
      <article className="overflow-hidden rounded-3xl bg-white ring-1 ring-ink/8">
        <div className="relative aspect-[4/3] overflow-hidden">
          {property.coverImage.startsWith("http") ? (
            <Image
              src={property.coverImage}
              alt={property.title}
              fill
              className="object-cover transition duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <img
              src={property.coverImage}
              alt={property.title}
              className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            />
          )}
          <div className="absolute left-3 top-3 flex gap-2">
            <span className="rounded-full bg-paper/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink">
              {property.listingType === "sale" ? "For sale" : "Stay"}
            </span>
            <span className="rounded-full bg-forest/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-sand">
              {stayTypeLabel(property.type)}
            </span>
          </div>
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-medium text-paper">
              <View className="h-3 w-3" />
              360°
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/80 px-2 py-1 text-[10px] font-medium text-paper">
              <BoxSelect className="h-3 w-3" />
              Plan
            </span>
          </div>
        </div>
        <div className="space-y-2.5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl leading-tight text-ink">{property.title}</h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-ink-soft">
                <MapPin className="h-3 w-3" />
                {property.city}, {property.state}
              </p>
            </div>
            <p className="flex items-center gap-1 text-sm font-semibold">
              <Star className="h-3.5 w-3.5 fill-gold text-gold" />
              {property.rating.toFixed(2)}
            </p>
          </div>
          <p className="line-clamp-2 text-sm leading-5 text-ink-soft">{property.tagline}</p>
          <p className="pt-1 text-sm">
            <span className="font-semibold text-ink">{formatPrice(property.listingType, property.price)}</span>
            {property.listingType === "rent" ? (
              <span className="text-ink-soft"> · {property.bedrooms} bed</span>
            ) : (
              <span className="text-ink-soft"> · {property.areaSqft.toLocaleString("en-IN")} sq.ft</span>
            )}
          </p>
        </div>
      </article>
    </Link>
  );
}
