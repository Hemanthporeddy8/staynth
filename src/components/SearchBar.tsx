"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Search } from "lucide-react";
import { STAY_TYPES } from "@/lib/stay-types";

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [listingType, setListingType] = useState("rent");
  const [stayType, setStayType] = useState("");
  const [guests, setGuests] = useState("2");

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (listingType) params.set("listingType", listingType);
    if (stayType) params.set("type", stayType);
    if (guests) params.set("guests", guests);
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`grid gap-2 rounded-2xl bg-white/90 p-2 shadow-[0_20px_50px_rgba(27,23,19,0.12)] ring-1 ring-ink/8 md:grid-cols-[1.2fr_0.9fr_1.1fr_0.7fr_auto] ${
        compact ? "" : "md:p-2.5"
      }`}
    >
      <label className="flex flex-col rounded-xl px-4 py-2.5 hover:bg-paper">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Where
        </span>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Mumbai, Goa, a hillside…"
          className="bg-transparent text-sm outline-none placeholder:text-ink/35"
        />
      </label>
      <label className="flex flex-col rounded-xl px-4 py-2.5 hover:bg-paper">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Intent
        </span>
        <select
          value={listingType}
          onChange={(e) => setListingType(e.target.value)}
          className="bg-transparent text-sm outline-none"
        >
          <option value="rent">Stay a few nights</option>
          <option value="sale">Buy a home or plot</option>
        </select>
      </label>
      <label className="flex flex-col rounded-xl px-4 py-2.5 hover:bg-paper">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Stay type
        </span>
        <select
          value={stayType}
          onChange={(e) => setStayType(e.target.value)}
          className="bg-transparent text-sm outline-none"
        >
          <option value="">Any stay</option>
          {STAY_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col rounded-xl px-4 py-2.5 hover:bg-paper">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Guests
        </span>
        <select
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
          className="bg-transparent text-sm outline-none"
        >
          <option value="1">1 guest</option>
          <option value="2">2 guests</option>
          <option value="4">4 guests</option>
          <option value="6">6+ guests</option>
        </select>
      </label>
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-terracotta px-5 py-3 text-sm font-semibold text-white hover:bg-terracotta-dark"
      >
        <Search className="h-4 w-4" />
        Search
      </button>
    </form>
  );
}
