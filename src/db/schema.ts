import {
  boolean,
  integer,
  pgTable,
  real,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  tagline: text("tagline").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  listingType: text("listing_type").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  country: text("country").notNull().default("India"),
  address: text("address").notNull(),
  price: integer("price").notNull(),
  bedrooms: integer("bedrooms").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
  maxGuests: integer("max_guests").notNull().default(2),
  areaSqft: integer("area_sqft").notNull(),
  rating: real("rating").notNull().default(4.8),
  reviewCount: integer("review_count").notNull().default(0),
  coverImage: text("cover_image").notNull(),
  images: text("images").array().notNull(),
  amenities: text("amenities").array().notNull(),
  hostName: text("host_name").notNull(),
  hostRole: text("host_role").notNull().default("Host"),
  featured: boolean("featured").notNull().default(false),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  panoramaUrl: text("panorama_url").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const floorPlans = pgTable("floor_plans", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  description: text("description").notNull().default(""),
});

export const planHotspots = pgTable("plan_hotspots", {
  id: serial("id").primaryKey(),
  floorPlanId: integer("floor_plan_id")
    .notNull()
    .references(() => floorPlans.id, { onDelete: "cascade" }),
  roomId: integer("room_id").references(() => rooms.id, { onDelete: "set null" }),
  label: text("label").notNull(),
  xPercent: real("x_percent").notNull(),
  yPercent: real("y_percent").notNull(),
});

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  type: text("type").notNull().default("guest"),
  status: text("status").notNull().default("lead"),
  city: text("city").notNull().default(""),
  notes: text("notes").notNull().default(""),
  totalSpent: integer("total_spent").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const bookings = pgTable("bookings", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  guestName: text("guest_name").notNull(),
  guestEmail: text("guest_email").notNull(),
  guestPhone: text("guest_phone").notNull(),
  checkIn: text("check_in").notNull(),
  checkOut: text("check_out").notNull(),
  guests: integer("guests").notNull().default(1),
  nights: integer("nights").notNull().default(1),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("confirmed"),
  listingType: text("listing_type").notNull().default("rent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reviews = pgTable("reviews", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "cascade" }),
  author: text("author").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Property = typeof properties.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type FloorPlan = typeof floorPlans.$inferSelect;
export type PlanHotspot = typeof planHotspots.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Review = typeof reviews.$inferSelect;
