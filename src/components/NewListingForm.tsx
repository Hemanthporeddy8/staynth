"use client";

import { useState } from "react";
import { createProperty } from "@/lib/actions";
import { ImageDrop } from "@/components/ImageDrop";
import { STAY_TYPES } from "@/lib/stay-types";

export function NewListingForm() {
  const [cover, setCover] = useState("");
  const [gallery, setGallery] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    try {
      formData.set("coverImage", cover);
      formData.set("images", [cover, ...gallery].filter(Boolean).join(","));
      const result = await createProperty(formData);
      if (result?.ok && result.id) {
        window.location.href = `/dashboard/properties/${result.id}`;
        return;
      }
      if (result && !result.ok) {
        setError(result.error);
        setPending(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not create listing.";
      setError(message);
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="space-y-5 rounded-3xl bg-white p-6 ring-1 ring-ink/8">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Listing title
          <input
            name="title"
            required
            placeholder="Palm Court Suite"
            className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
          />
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Tagline
          <input
            name="tagline"
            placeholder="Pool villa with a courtyard"
            className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
          />
        </label>
      </div>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        Description
        <textarea
          name="description"
          rows={4}
          placeholder="What should a guest know before they walk in?"
          className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Stay type
          <select
            name="type"
            className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
          >
            {STAY_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Listing
          <select
            name="listingType"
            className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
          >
            <option value="rent">Rent / stay</option>
            <option value="sale">For sale</option>
          </select>
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Price (INR)
          <input
            name="price"
            type="number"
            min={0}
            defaultValue={5000}
            className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
          />
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          City
          <input
            name="city"
            required
            placeholder="Goa"
            className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
          />
        </label>
        <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          State
          <input
            name="state"
            placeholder="Goa"
            className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
          />
        </label>
      </div>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        Address
        <input
          name="address"
          placeholder="Street, neighbourhood"
          className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["bedrooms", "Beds", "2"],
          ["bathrooms", "Baths", "2"],
          ["maxGuests", "Guests", "4"],
          ["areaSqft", "Sq.ft", "1200"],
        ].map(([name, label, value]) => (
          <label key={name} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            {label}
            <input
              name={name}
              type="number"
              min={0}
              defaultValue={value}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
            />
          </label>
        ))}
      </div>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        Amenities (comma separated)
        <input
          name="amenities"
          defaultValue="Wifi, Parking, 360° tour, View in plan"
          className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
        />
      </label>
      <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        Owner / host name
        <input
          name="hostName"
          placeholder="Your name or hotel brand"
          className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
        />
      </label>

      <ImageDrop
        label="Cover photo (optional)"
        hint="Skip this if you want — we use a placeholder until you add one"
        kind="photo"
        preview={cover}
        onUploaded={setCover}
      />
      <ImageDrop
        label="Extra gallery photo"
        hint="Optional — add another still photo"
        kind="photo"
        onUploaded={(url) => setGallery((current) => [...current, url])}
      />
      {gallery.length ? (
        <div className="flex gap-2">
          {gallery.map((src) => (
            <img key={src} src={src} alt="" className="h-16 w-20 rounded-xl object-cover" />
          ))}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl bg-terracotta/10 p-4 text-sm text-terracotta ring-1 ring-terracotta/20">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-white cursor-pointer hover:bg-terracotta-dark transition shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {pending ? "Publishing…" : "Create listing & open studio"}
      </button>
    </form>
  );
}
