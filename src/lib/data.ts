import { desc, eq, and, or, ilike, gte, sql } from "drizzle-orm";
import { db, getDatabaseUrl } from "@/db";
import { properties, rooms, floorPlans, planHotspots, customers, bookings, reviews } from "@/db/schema";
import { ensureSeeded } from "@/db/seed";
import {
  DEMO_PROPERTIES,
  DEMO_ROOMS,
  DEMO_FLOOR_PLANS,
  DEMO_HOTSPOTS,
  DEMO_CUSTOMERS,
  DEMO_BOOKINGS,
  DEMO_REVIEWS,
  PropertyData,
  RoomData,
  FloorPlanData,
} from "@/db/demo-data";

export async function getHomeProperties(): Promise<{
  featured: PropertyData[];
  more: PropertyData[];
}> {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const featured = await db
        .select()
        .from(properties)
        .where(eq(properties.featured, true))
        .orderBy(desc(properties.rating));
      const more = await db.select().from(properties).orderBy(desc(properties.rating));
      if (featured.length > 0 || more.length > 0) {
        return {
          featured: featured as unknown as PropertyData[],
          more: more as unknown as PropertyData[],
        };
      }
    } catch (err) {
      console.warn("DB query failed in getHomeProperties, using demo data fallback:", err);
    }
  }

  return {
    featured: DEMO_PROPERTIES.filter((p) => p.featured),
    more: DEMO_PROPERTIES,
  };
}

export async function getListings(params: {
  city?: string;
  listingType?: string;
  type?: string;
  guests?: string;
}): Promise<PropertyData[]> {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const filters = [];
      if (params.city) {
        filters.push(
          or(ilike(properties.city, `%${params.city}%`), ilike(properties.state, `%${params.city}%`))!
        );
      }
      if (params.listingType) filters.push(eq(properties.listingType, params.listingType));
      if (params.type) filters.push(eq(properties.type, params.type));
      if (params.guests) filters.push(gte(properties.maxGuests, Number(params.guests)));

      const rows = await db
        .select()
        .from(properties)
        .where(filters.length ? and(...filters) : sql`true`);

      if (rows.length > 0) {
        return rows as unknown as PropertyData[];
      }
    } catch (err) {
      console.warn("DB query failed in getListings, using demo data fallback:", err);
    }
  }

  let result = [...DEMO_PROPERTIES];
  if (params.city) {
    const c = params.city.toLowerCase();
    result = result.filter(
      (p) => p.city.toLowerCase().includes(c) || p.state.toLowerCase().includes(c)
    );
  }
  if (params.listingType) {
    result = result.filter((p) => p.listingType === params.listingType);
  }
  if (params.type) {
    result = result.filter((p) => p.type === params.type);
  }
  if (params.guests) {
    result = result.filter((p) => p.maxGuests >= Number(params.guests));
  }
  return result;
}

export async function getListingDetail(id: number) {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const property = (
        await db.select().from(properties).where(eq(properties.id, id)).limit(1)
      )[0];

      if (property) {
        const propertyRooms = await db.select().from(rooms).where(eq(rooms.propertyId, id));
        const propertyReviews = await db.select().from(reviews).where(eq(reviews.propertyId, id));
        return {
          property: property as unknown as PropertyData,
          rooms: propertyRooms as unknown as RoomData[],
          reviews: propertyReviews,
        };
      }
    } catch (err) {
      console.warn("DB query failed in getListingDetail, using demo data fallback:", err);
    }
  }

  const prop = DEMO_PROPERTIES.find((p) => p.id === id) ?? DEMO_PROPERTIES[0];
  const r = DEMO_ROOMS.filter((room) => room.propertyId === prop.id);
  const rev = DEMO_REVIEWS.filter((review) => review.propertyId === prop.id);

  return {
    property: prop,
    rooms: r.length > 0 ? r : DEMO_ROOMS.slice(0, 3),
    reviews: rev,
  };
}

export async function getListingPlan(id: number) {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const property = (
        await db.select().from(properties).where(eq(properties.id, id)).limit(1)
      )[0];
      const plan = (
        await db.select().from(floorPlans).where(eq(floorPlans.propertyId, id)).limit(1)
      )[0] ?? null;

      if (property) {
        const propertyRooms = await db.select().from(rooms).where(eq(rooms.propertyId, id));
        const spots = plan
          ? await db.select().from(planHotspots).where(eq(planHotspots.floorPlanId, plan.id))
          : [];
        const roomMap = Object.fromEntries(propertyRooms.map((room) => [room.id, room]));
        const hotspots = spots.map((spot) => ({
          ...spot,
          room: spot.roomId ? roomMap[spot.roomId] ?? null : null,
        }));
        return {
          property: property as unknown as PropertyData,
          plan: plan as unknown as FloorPlanData | null,
          hotspots,
          rooms: propertyRooms as unknown as RoomData[],
        };
      }
    } catch (err) {
      console.warn("DB query failed in getListingPlan, using demo data fallback:", err);
    }
  }

  const prop = DEMO_PROPERTIES.find((p) => p.id === id) ?? DEMO_PROPERTIES[0];
  const plan = DEMO_FLOOR_PLANS.find((pl) => pl.propertyId === prop.id) ?? null;
  const propertyRooms = DEMO_ROOMS.filter((room) => room.propertyId === prop.id);
  const spots = plan ? DEMO_HOTSPOTS.filter((h) => h.floorPlanId === plan.id) : [];
  const roomMap = Object.fromEntries(propertyRooms.map((room) => [room.id, room]));
  const hotspots = spots.map((spot) => ({
    ...spot,
    room: spot.roomId ? roomMap[spot.roomId] ?? null : null,
  }));

  return {
    property: prop,
    plan,
    hotspots,
    rooms: propertyRooms,
  };
}

export async function getListingTour(id: number, roomIdQuery?: string) {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const property = (
        await db.select().from(properties).where(eq(properties.id, id)).limit(1)
      )[0];
      const propertyRooms = await db.select().from(rooms).where(eq(rooms.propertyId, id));

      if (property && propertyRooms.length > 0) {
        const selected =
          propertyRooms.find((room) => String(room.id) === roomIdQuery) ?? propertyRooms[0];
        return {
          property: property as unknown as PropertyData,
          rooms: propertyRooms as unknown as RoomData[],
          selected: selected as unknown as RoomData,
        };
      }
    } catch (err) {
      console.warn("DB query failed in getListingTour, using demo data fallback:", err);
    }
  }

  const prop = DEMO_PROPERTIES.find((p) => p.id === id) ?? DEMO_PROPERTIES[0];
  let propertyRooms = DEMO_ROOMS.filter((room) => room.propertyId === prop.id);
  if (propertyRooms.length === 0) {
    propertyRooms = DEMO_ROOMS.slice(0, 4);
  }
  const selected =
    propertyRooms.find((room) => String(room.id) === roomIdQuery) ?? propertyRooms[0];

  return {
    property: prop,
    rooms: propertyRooms,
    selected,
  };
}

export async function getDashboardStats() {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const props = await db.select().from(properties);
      const bks = await db.select().from(bookings).orderBy(desc(bookings.createdAt)).limit(10);
      const custs = await db.select().from(customers);
      const revenue = bks.reduce((acc, b) => acc + (b.totalAmount || 0), 0);

      return {
        propertiesCount: props.length,
        bookingsCount: bks.length,
        customersCount: custs.length,
        revenue,
        recentBookings: bks,
        properties: props,
      };
    } catch (err) {
      console.warn("DB query failed in getDashboardStats, using demo data fallback:", err);
    }
  }

  const revenue = DEMO_BOOKINGS.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  return {
    propertiesCount: DEMO_PROPERTIES.length,
    bookingsCount: DEMO_BOOKINGS.length,
    customersCount: DEMO_CUSTOMERS.length,
    revenue,
    recentBookings: DEMO_BOOKINGS,
    properties: DEMO_PROPERTIES,
  };
}

export async function getDashboardBookings() {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const bks = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
      const props = await db.select().from(properties);
      const propMap = Object.fromEntries(props.map((p) => [p.id, p]));
      const list = bks.map((b) => ({
        ...b,
        propertyTitle: propMap[b.propertyId]?.title ?? "Property",
      }));
      return list;
    } catch (err) {
      console.warn("DB query failed in getDashboardBookings, using demo fallback:", err);
    }
  }

  const propMap = Object.fromEntries(DEMO_PROPERTIES.map((p) => [p.id, p]));
  return DEMO_BOOKINGS.map((b) => ({
    ...b,
    propertyTitle: propMap[b.propertyId]?.title ?? "Property",
  }));
}

export async function getDashboardCustomers() {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const custs = await db.select().from(customers).orderBy(desc(customers.createdAt));
      return custs;
    } catch (err) {
      console.warn("DB query failed in getDashboardCustomers, using demo fallback:", err);
    }
  }
  return DEMO_CUSTOMERS;
}

export async function getDashboardProperties() {
  if (getDatabaseUrl()) {
    try {
      await ensureSeeded();
      const props = await db.select().from(properties).orderBy(desc(properties.createdAt));
      return props;
    } catch (err) {
      console.warn("DB query failed in getDashboardProperties, using demo fallback:", err);
    }
  }
  return DEMO_PROPERTIES;
}
