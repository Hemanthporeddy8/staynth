"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/lib/actions";
import { formatINR, formatPrice, nightsBetween } from "@/lib/format";

type BookingProperty = {
  id: number;
  title: string;
  listingType: string;
  price: number;
  rating: number;
  reviewCount: number;
  maxGuests: number;
};

export function BookingWidget({ property }: { property: BookingProperty }) {
  const router = useRouter();
  const isSale = property.listingType === "sale";
  const [checkIn, setCheckIn] = useState("2026-04-20");
  const [checkOut, setCheckOut] = useState("2026-04-23");
  const [guests, setGuests] = useState(2);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const total = isSale ? 0 : nights * property.price;

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError("");
    const result = await createBooking(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/booked?id=${result.id}&title=${encodeURIComponent(property.title)}`);
  }

  return (
    <form
      action={onSubmit}
      className="rounded-3xl bg-white p-5 shadow-[0_20px_50px_rgba(27,23,19,0.08)] ring-1 ring-ink/8"
    >
      <p className="font-display text-3xl leading-none">
        {formatPrice(property.listingType, property.price)}
      </p>
      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-ink-soft">
        {isSale ? "Asking · schedule a walkthrough" : `${property.rating.toFixed(2)} · ${property.reviewCount} reviews`}
      </p>

      <input type="hidden" name="propertyId" value={property.id} />
      <input type="hidden" name="listingType" value={property.listingType} />
      <input type="hidden" name="price" value={property.price} />
      <input type="hidden" name="title" value={property.title} />

      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="rounded-2xl bg-paper px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          {isSale ? "Visit on" : "Check in"}
          <input
            type="date"
            name="checkIn"
            required
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-ink outline-none"
          />
        </label>
        {isSale ? (
          <label className="rounded-2xl bg-paper px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Party size
            <input
              type="number"
              name="guests"
              min={1}
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-ink outline-none"
            />
          </label>
        ) : (
          <label className="rounded-2xl bg-paper px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Check out
            <input
              type="date"
              name="checkOut"
              required
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-ink outline-none"
            />
          </label>
        )}
      </div>

      {!isSale ? (
        <label className="mt-2 block rounded-2xl bg-paper px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Guests
          <input
            type="number"
            name="guests"
            min={1}
            max={property.maxGuests}
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-ink outline-none"
          />
        </label>
      ) : null}

      <label className="mt-2 block rounded-2xl bg-paper px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        Full name
        <input
          name="guestName"
          required
          placeholder="Your name"
          className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <label className="mt-2 block rounded-2xl bg-paper px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        Email
        <input
          type="email"
          name="guestEmail"
          required
          placeholder="you@email.com"
          className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-ink outline-none"
        />
      </label>
      <label className="mt-2 block rounded-2xl bg-paper px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        Phone
        <input
          name="guestPhone"
          required
          placeholder="+91"
          className="mt-1 w-full bg-transparent text-sm font-medium normal-case tracking-normal text-ink outline-none"
        />
      </label>

      {!isSale ? (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-ink-soft">
            {formatINR(property.price)} × {nights} night{nights === 1 ? "" : "s"}
          </span>
          <span className="font-semibold">{formatINR(total)}</span>
        </div>
      ) : null}

      {error ? <p className="mt-3 text-sm text-terracotta">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 w-full rounded-full bg-terracotta py-3 text-sm font-semibold text-white hover:bg-terracotta-dark disabled:opacity-60"
      >
        {pending ? "Sending…" : isSale ? "Request a site visit" : "Reserve this stay"}
      </button>
      <p className="mt-3 text-center text-[11px] text-ink-soft">
        You will not be charged in this demo. The booking lands on the host dashboard.
      </p>
    </form>
  );
}
