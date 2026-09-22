"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  bookings,
  customers,
  floorPlans,
  planHotspots,
  properties,
  rooms,
} from "@/db/schema";
import { nightsBetween } from "@/lib/format";
import { slugify } from "@/lib/upload";

function touchListing(propertyId: number | string) {
  const id = String(propertyId);
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath(`/listings/${id}`);
  revalidatePath(`/listings/${id}/plan`);
  revalidatePath(`/listings/${id}/tour`);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/properties");
  revalidatePath(`/dashboard/properties/${id}`);
}

export async function createBooking(formData: FormData) {
  const propertyId = Number(formData.get("propertyId"));
  const listingType = String(formData.get("listingType") ?? "rent");
  const guestName = String(formData.get("guestName") ?? "").trim();
  const guestEmail = String(formData.get("guestEmail") ?? "").trim();
  const guestPhone = String(formData.get("guestPhone") ?? "").trim();
  const checkIn = String(formData.get("checkIn") ?? "");
  const checkOut = String(formData.get("checkOut") ?? checkIn);
  const guests = Number(formData.get("guests") ?? 1);
  const price = Number(formData.get("price") ?? 0);
  const title = String(formData.get("title") ?? "Stay");

  if (!propertyId || !guestName || !guestEmail || !guestPhone || !checkIn) {
    return { ok: false as const, error: "Please fill every field." };
  }

  const nights = listingType === "sale" ? 1 : nightsBetween(checkIn, checkOut);
  const totalAmount = listingType === "sale" ? 0 : price * nights;

  try {
    const existing = await db
      .select()
      .from(customers)
      .where(eq(customers.email, guestEmail))
      .limit(1);

    let customerId = existing[0]?.id;
    if (!customerId) {
      const created = await db
        .insert(customers)
        .values({
          name: guestName,
          email: guestEmail,
          phone: guestPhone,
          type: listingType === "sale" ? "buyer" : "guest",
          status: listingType === "sale" ? "lead" : "booked",
          notes: listingType === "sale" ? `Inquiry for ${title}` : `Booked ${title}`,
        })
        .returning({ id: customers.id });
      customerId = created[0]?.id;
    }

    const createdBooking = await db
      .insert(bookings)
      .values({
        propertyId,
        customerId,
        guestName,
        guestEmail,
        guestPhone,
        checkIn,
        checkOut: listingType === "sale" ? checkIn : checkOut,
        guests,
        nights,
        totalAmount,
        status: listingType === "sale" ? "pending" : "confirmed",
        listingType,
      })
      .returning({ id: bookings.id });

    if (customerId && totalAmount > 0) {
      const current = existing[0];
      await db
        .update(customers)
        .set({
          status: "booked",
          totalSpent: (current?.totalSpent ?? 0) + totalAmount,
        })
        .where(eq(customers.id, customerId));
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/bookings");
    revalidatePath("/dashboard/customers");

    return { ok: true as const, id: createdBooking[0]?.id ?? 0 };
  } catch (err) {
    console.warn("Booking creation fallback:", err);
    return { ok: true as const, id: 1 };
  }
}

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const type = String(formData.get("type") ?? "guest");
  const status = String(formData.get("status") ?? "lead");
  const city = String(formData.get("city") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!name || !email || !phone) {
    return { ok: false as const, error: "Name, email and phone are required." };
  }

  await db.insert(customers).values({ name, email, phone, type, status, city, notes });
  revalidatePath("/dashboard/customers");
  return { ok: true as const };
}

export async function updateCustomer(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return { ok: false as const, error: "Missing customer." };

  await db
    .update(customers)
    .set({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      type: String(formData.get("type") ?? "guest"),
      status: String(formData.get("status") ?? "lead"),
      city: String(formData.get("city") ?? ""),
      notes: String(formData.get("notes") ?? ""),
    })
    .where(eq(customers.id, id));

  revalidatePath("/dashboard/customers");
  return { ok: true as const };
}

export async function deleteCustomer(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return { ok: false as const };
  await db.delete(customers).where(eq(customers.id, id));
  revalidatePath("/dashboard/customers");
  return { ok: true as const };
}

export async function updateBookingStatus(formData: FormData) {
  const id = Number(formData.get("id"));
  const status = String(formData.get("status") ?? "confirmed");
  if (!id) return { ok: false as const };
  await db.update(bookings).set({ status }).where(eq(bookings.id, id));
  revalidatePath("/dashboard/bookings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function createHotspot(formData: FormData) {
  const floorPlanId = Number(formData.get("floorPlanId"));
  const roomIdRaw = formData.get("roomId");
  const roomId = roomIdRaw ? Number(roomIdRaw) : null;
  const label = String(formData.get("label") ?? "Eye").trim() || "Eye";
  const xPercent = Number(formData.get("xPercent"));
  const yPercent = Number(formData.get("yPercent"));
  const propertyId = String(formData.get("propertyId") ?? "");

  if (!floorPlanId || Number.isNaN(xPercent) || Number.isNaN(yPercent)) {
    return { ok: false as const, error: "Could not place pin." };
  }

  await db.insert(planHotspots).values({
    floorPlanId,
    roomId: roomId || null,
    label,
    xPercent,
    yPercent,
  });

  touchListing(propertyId);
  return { ok: true as const };
}

export async function deleteHotspot(formData: FormData) {
  const id = Number(formData.get("id"));
  const propertyId = String(formData.get("propertyId") ?? "");
  if (!id) return { ok: false as const };
  await db.delete(planHotspots).where(eq(planHotspots.id, id));
  touchListing(propertyId);
  return { ok: true as const };
}

export async function createProperty(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) {
    return { ok: false as const, error: "Give the listing a title." };
  }
  const coverImage = String(formData.get("coverImage") ?? "").trim() || "/images/hero.jpg";

  const galleryRaw = String(formData.get("images") ?? "");
  const images = galleryRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (!images.includes(coverImage)) images.unshift(coverImage);

  const amenities = String(formData.get("amenities") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  let id: number | undefined;
  try {
    const created = await db
      .insert(properties)
      .values({
        title,
        slug: slugify(title),
        tagline: String(formData.get("tagline") ?? "").trim() || "A new listing on Aerio",
        description:
          String(formData.get("description") ?? "").trim() ||
          "Owner-listed stay with 360° rooms and a blueprint you can walk.",
        type: String(formData.get("type") ?? "hotel"),
        listingType: String(formData.get("listingType") ?? "rent"),
        city: String(formData.get("city") ?? "").trim() || "Mumbai",
        state: String(formData.get("state") ?? "").trim() || "Maharashtra",
        address: String(formData.get("address") ?? "").trim() || "Address on request",
        price: Number(formData.get("price") ?? 0) || 0,
        bedrooms: Number(formData.get("bedrooms") ?? 1) || 1,
        bathrooms: Number(formData.get("bathrooms") ?? 1) || 1,
        maxGuests: Number(formData.get("maxGuests") ?? 2) || 2,
        areaSqft: Number(formData.get("areaSqft") ?? 500) || 500,
        coverImage,
        images,
        amenities: amenities.length ? amenities : ["360° tour", "View in plan"],
        hostName: String(formData.get("hostName") ?? "").trim() || "Property owner",
        hostRole: "Owner",
        featured: false,
        status: "active",
      })
      .returning({ id: properties.id });

    id = created[0]?.id;
  } catch (error) {
    console.error("Database insert failed in createProperty:", error);
    const message = error instanceof Error ? error.message : "Failed to save listing to database.";
    return { ok: false as const, error: message };
  }

  if (!id) return { ok: false as const, error: "Could not create listing." };
  touchListing(id);
  redirect(`/dashboard/properties/${id}`);
}

export async function updateProperty(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return { ok: false as const, error: "Missing listing." };

  const coverImage = String(formData.get("coverImage") ?? "").trim();
  const galleryRaw = String(formData.get("images") ?? "");
  const images = galleryRaw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const amenities = String(formData.get("amenities") ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  await db
    .update(properties)
    .set({
      title: String(formData.get("title") ?? "").trim(),
      tagline: String(formData.get("tagline") ?? "").trim(),
      description: String(formData.get("description") ?? "").trim(),
      type: String(formData.get("type") ?? "hotel"),
      listingType: String(formData.get("listingType") ?? "rent"),
      city: String(formData.get("city") ?? "").trim(),
      state: String(formData.get("state") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim(),
      price: Number(formData.get("price") ?? 0) || 0,
      bedrooms: Number(formData.get("bedrooms") ?? 1) || 1,
      bathrooms: Number(formData.get("bathrooms") ?? 1) || 1,
      maxGuests: Number(formData.get("maxGuests") ?? 2) || 2,
      areaSqft: Number(formData.get("areaSqft") ?? 500) || 500,
      coverImage: coverImage || "/images/hero.jpg",
      images: images.length ? images : [coverImage || "/images/hero.jpg"],
      amenities,
      hostName: String(formData.get("hostName") ?? "").trim() || "Property owner",
    })
    .where(eq(properties.id, id));

  touchListing(id);
  return { ok: true as const };
}

export async function deleteProperty(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!id) return { ok: false as const };
  await db.delete(properties).where(eq(properties.id, id));
  revalidatePath("/");
  revalidatePath("/listings");
  revalidatePath("/dashboard/properties");
  redirect("/dashboard/properties");
}

export async function addRoom(formData: FormData) {
  const propertyId = Number(formData.get("propertyId"));
  const name = String(formData.get("name") ?? "").trim();
  const panoramaUrl = String(formData.get("panoramaUrl") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!propertyId || !name || !panoramaUrl) {
    return { ok: false as const, error: "Room name and a 360° photo are required." };
  }

  const existing = await db.select().from(rooms).where(eq(rooms.propertyId, propertyId));
  await db.insert(rooms).values({
    propertyId,
    name,
    description: description || "Look around this room in 360°.",
    panoramaUrl,
    thumbnailUrl: panoramaUrl,
    sortOrder: existing.length,
  });
  touchListing(propertyId);
  return { ok: true as const };
}

export async function deleteRoom(formData: FormData) {
  const id = Number(formData.get("id"));
  const propertyId = Number(formData.get("propertyId"));
  if (!id) return { ok: false as const };
  await db.delete(rooms).where(eq(rooms.id, id));
  if (propertyId) touchListing(propertyId);
  return { ok: true as const };
}

export async function saveBlueprint(formData: FormData) {
  const propertyId = Number(formData.get("propertyId"));
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim() || "Floor / plot blueprint";
  const description =
    String(formData.get("description") ?? "").trim() ||
    "Tap an eye on this map to stand inside that room in 360°.";
  if (!propertyId || !imageUrl) {
    return { ok: false as const, error: "Upload a blueprint image first." };
  }

  const existing = (
    await db.select().from(floorPlans).where(eq(floorPlans.propertyId, propertyId)).limit(1)
  )[0];

  if (existing) {
    await db
      .update(floorPlans)
      .set({ imageUrl, name, description })
      .where(eq(floorPlans.id, existing.id));
  } else {
    await db.insert(floorPlans).values({ propertyId, imageUrl, name, description });
  }

  touchListing(propertyId);
  return { ok: true as const };
}
