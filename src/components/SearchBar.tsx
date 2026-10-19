"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Clock, Search, X } from "lucide-react";
import { STAY_TYPES } from "@/lib/stay-types";
import {
  getSearchHistory,
  pushSearchHistory,
  clearSearchHistory,
  type SearchEntry,
} from "@/lib/cache";

export function SearchBar({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [city, setCity] = useState("");
  const [listingType, setListingType] = useState("rent");
  const [stayType, setStayType] = useState("");
  const [guests, setGuests] = useState("2");

  const [history, setHistory] = useState<SearchEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const cityRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function applyHistory(entry: SearchEntry) {
    setCity(entry.city);
    setListingType(entry.listingType);
    setStayType(entry.stayType);
    setGuests(entry.guests);
    setShowHistory(false);
    cityRef.current?.focus();
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (listingType) params.set("listingType", listingType);
    if (stayType) params.set("type", stayType);
    if (guests) params.set("guests", guests);

    // Persist to localStorage history
    if (city.trim()) {
      pushSearchHistory({ city: city.trim(), listingType, stayType, guests });
      setHistory(getSearchHistory());
    }

    setShowHistory(false);
    router.push(`/listings?${params.toString()}`);
  }

  const filteredHistory = city
    ? history.filter((h) => h.city.toLowerCase().startsWith(city.toLowerCase()))
    : history;

  return (
    <div className="relative" ref={dropdownRef}>
      <form
        onSubmit={onSubmit}
        className={`grid gap-2 rounded-2xl bg-white/90 p-2 shadow-[0_20px_50px_rgba(27,23,19,0.12)] ring-1 ring-ink/8 md:grid-cols-[1.2fr_0.9fr_1.1fr_0.7fr_auto] ${
          compact ? "" : "md:p-2.5"
        }`}
      >
        {/* City field with history trigger */}
        <label className="flex flex-col rounded-xl px-4 py-2.5 hover:bg-paper">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-soft">
            Where
          </span>
          <input
            ref={cityRef}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder="Mumbai, Goa, a hillside…"
            className="bg-transparent text-sm outline-none placeholder:text-ink/35"
            autoComplete="off"
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

      {/* ── Search History Dropdown ────────────────────────────────── */}
      {showHistory && filteredHistory.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-2xl border border-ink/8 bg-white shadow-xl">
          <div className="flex items-center justify-between px-4 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink-soft">
              Recent searches
            </p>
            <button
              type="button"
              onClick={() => {
                clearSearchHistory();
                setHistory([]);
                setShowHistory(false);
              }}
              className="flex items-center gap-1 rounded-full px-2 py-1 text-[11px] text-ink-soft hover:bg-paper"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          </div>
          <ul className="divide-y divide-ink/5 pb-2">
            {filteredHistory.map((entry, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => applyHistory(entry)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-paper"
                >
                  <Clock className="h-4 w-4 shrink-0 text-ink-soft" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{entry.city}</p>
                    <p className="text-[11px] text-ink-soft">
                      {entry.listingType === "rent" ? "Stay" : "Buy"} ·{" "}
                      {entry.guests} guest{Number(entry.guests) > 1 ? "s" : ""}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
