import { db } from "@/db";
import {
  bookings,
  customers,
  floorPlans,
  planHotspots,
  properties,
  reviews,
  rooms,
} from "@/db/schema";

const px = (id: number) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1600`;

export async function ensureSeeded() {
  const existing = await db.select({ id: properties.id }).from(properties).limit(1);
  if (existing.length > 0) return;

  await db.transaction(async (tx) => {
  const insertedProperties = await tx
    .insert(properties)
    .values([
      {
        title: "The Meridian Courtyard",
        slug: "meridian-courtyard-mumbai",
        tagline: "Lantern-lit courtyards in the heart of Bandra",
        description:
          "A 12-suite boutique stay wrapped around a reflecting pool. Every room is captured in 360°, so guests walk the courtyard, living suite, and bath before they book. Hosts pin those same views onto the uploaded floor plan.",
        type: "hotel",
        listingType: "rent",
        city: "Mumbai",
        state: "Maharashtra",
        address: "14 Chapel Road, Bandra West, Mumbai",
        price: 8900,
        bedrooms: 1,
        bathrooms: 1,
        maxGuests: 3,
        areaSqft: 680,
        rating: 4.92,
        reviewCount: 186,
        coverImage: px(33951871),
        images: [px(33951871), px(3011575), px(32334231), px(2725675), px(8082221)],
        amenities: ["Pool", "Breakfast", "Airport pickup", "Workspace", "360° tour", "Concierge"],
        hostName: "Ananya Kapoor",
        hostRole: "Hotelier",
        featured: true,
      },
      {
        title: "Palm Grove Villa",
        slug: "palm-grove-villa-goa",
        tagline: "Private pool villa under coconut canopy",
        description:
          "A four-bedroom tropical villa with a sunken living room opening onto the pool deck. Walk the plan, tap a View pin, and spin through each room in 360° — the same flow a guest would take from the gate to the master suite.",
        type: "villa",
        listingType: "rent",
        city: "Goa",
        state: "Goa",
        address: "Aguada Road, Candolim, Goa",
        price: 18500,
        bedrooms: 4,
        bathrooms: 4,
        maxGuests: 10,
        areaSqft: 4200,
        rating: 4.88,
        reviewCount: 94,
        coverImage: px(6875530),
        images: [px(6875530), px(6875519), px(36965360), px(28054852), px(7214450)],
        amenities: ["Private pool", "Chef on request", "Beach 8 min", "Garden", "Parking", "360° tour"],
        hostName: "Rafael D'Souza",
        hostRole: "Villa host",
        featured: true,
      },
      {
        title: "Skyline Residences",
        slug: "skyline-residences-bangalore",
        tagline: "A quiet penthouse above Indiranagar",
        description:
          "Floor-to-ceiling glass, a study nook, and a kitchen meant for long dinners. The uploaded apartment plan has View buttons on living, bedroom, kitchen and bath — each opening a true 360° capture.",
        type: "apartment",
        listingType: "rent",
        city: "Bangalore",
        state: "Karnataka",
        address: "12th Main, Indiranagar, Bengaluru",
        price: 4200,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 4,
        areaSqft: 1450,
        rating: 4.81,
        reviewCount: 128,
        coverImage: px(7045915),
        images: [px(7045915), px(30554297), px(6077368), px(7045303), px(7533852)],
        amenities: ["City view", "Kitchen", "Fast wifi", "Washer", "Workspace", "360° tour"],
        hostName: "Meera Iyer",
        hostRole: "Superhost",
        featured: true,
      },
      {
        title: "Suryagarh Heritage Estate",
        slug: "suryagarh-heritage-estate",
        tagline: "Sandstone plots with courtyard villas for sale",
        description:
          "A gated heritage estate outside Jaisalmer. Buyers inspect the site plan, tap any villa footprint, and stand inside the courtyard or living hall in 360° — no site visit required to shortlist a plot.",
        type: "plot",
        listingType: "sale",
        city: "Jaisalmer",
        state: "Rajasthan",
        address: "Sam Road, Jaisalmer",
        price: 8500000,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 8,
        areaSqft: 5400,
        rating: 4.97,
        reviewCount: 41,
        coverImage: px(33726143),
        images: [px(33726143), px(33681488), px(33726144), px(33726141)],
        amenities: ["Gated estate", "Clubhouse", "Lake view plots", "Title clear", "Site plan", "360° walkthrough"],
        hostName: "House of Rathore",
        hostRole: "Developer",
        featured: true,
      },
      {
        title: "Mistwood Lodge",
        slug: "mistwood-lodge-manali",
        tagline: "Cedar cabin above the Beas valley",
        description:
          "A two-bedroom cedar lodge with a wood stove and a wraparound deck. The floor plan pins open 360° captures of the living hall, loft bedroom and bath — useful when snow keeps guests from touring in person.",
        type: "cottage",
        listingType: "rent",
        city: "Manali",
        state: "Himachal Pradesh",
        address: "Old Manali Road, Manali",
        price: 6700,
        bedrooms: 2,
        bathrooms: 2,
        maxGuests: 5,
        areaSqft: 1180,
        rating: 4.86,
        reviewCount: 77,
        coverImage: px(17832881),
        images: [px(17832881), px(5897389), px(13633304), px(7746548)],
        amenities: ["Fireplace", "Mountain view", "Kitchen", "Parking", "Heating", "360° tour"],
        hostName: "Kabir Thakur",
        hostRole: "Lodge host",
        featured: false,
      },
      {
        title: "Naini Edge Cottage",
        slug: "naini-edge-cottage",
        tagline: "A timber house on the lake’s quieter shore",
        description:
          "Wake to mist on Naini Lake. The uploaded plan maps the deck, living room and bedroom; each View pin drops you into a 360° interior so the light and lake alignment are obvious before you book.",
        type: "cottage",
        listingType: "rent",
        city: "Nainital",
        state: "Uttarakhand",
        address: "Mallital, Nainital",
        price: 5400,
        bedrooms: 2,
        bathrooms: 1,
        maxGuests: 4,
        areaSqft: 980,
        rating: 4.79,
        reviewCount: 63,
        coverImage: px(26599273),
        images: [px(26599273), px(20079776), px(5016527), px(2725675)],
        amenities: ["Lake view", "Deck", "Kitchen", "Fireplace", "Kayak", "360° tour"],
        hostName: "Sana Bisht",
        hostRole: "Host",
        featured: false,
      },
      {
        title: "Indigo House Loft",
        slug: "indigo-house-loft-delhi",
        tagline: "A warehouse loft in Shahpur Jat",
        description:
          "Double-height living, a chef’s kitchen, and a sleeping loft. The plan is pinned with View buttons so remote guests can stand in the kitchen island and spin toward the mezzanine.",
        type: "apartment",
        listingType: "rent",
        city: "Delhi",
        state: "Delhi",
        address: "Shahpur Jat, New Delhi",
        price: 5100,
        bedrooms: 1,
        bathrooms: 2,
        maxGuests: 3,
        areaSqft: 1320,
        rating: 4.74,
        reviewCount: 52,
        coverImage: px(6077368),
        images: [px(6077368), px(7045303), px(8082197), px(7533852)],
        amenities: ["Loft", "Designer kitchen", "Workspace", "Fast wifi", "Washer", "360° tour"],
        hostName: "Dev Malhotra",
        hostRole: "Designer-host",
        featured: false,
      },
      {
        title: "Backwater View Plots",
        slug: "backwater-view-plots",
        tagline: "Waterside parcels with villa footprints",
        description:
          "Eight freehold plots along a quiet backwater. The selling plot map is uploaded by the developer; each villa pad has a View button that opens a 360° sample interior and jetty outlook.",
        type: "plot",
        listingType: "sale",
        city: "Alleppey",
        state: "Kerala",
        address: "Punnamada, Alappuzha",
        price: 4200000,
        bedrooms: 3,
        bathrooms: 3,
        maxGuests: 6,
        areaSqft: 3200,
        rating: 4.83,
        reviewCount: 19,
        coverImage: px(16588337),
        images: [px(16588337), px(36422828), px(5016527), px(6875531)],
        amenities: ["Water frontage", "Clear title", "Road access", "Club jetty", "Site plan", "360° walkthrough"],
        hostName: "Malabar Estates",
        hostRole: "Developer",
        featured: false,
      },
    ])
    .returning({ id: properties.id, slug: properties.slug });

  const bySlug = Object.fromEntries(insertedProperties.map((p) => [p.slug, p.id]));

  const roomRows = await tx
    .insert(rooms)
    .values([
      { propertyId: bySlug["meridian-courtyard-mumbai"], name: "Courtyard lobby", description: "Lanterns, water, and the arrival hall.", panoramaUrl: "/images/pano-lobby.jpg", thumbnailUrl: "/images/pano-lobby.jpg", sortOrder: 0 },
      { propertyId: bySlug["meridian-courtyard-mumbai"], name: "Living suite", description: "Evening light on the sitting room.", panoramaUrl: "/images/pano-living.jpg", thumbnailUrl: "/images/pano-living.jpg", sortOrder: 1 },
      { propertyId: bySlug["meridian-courtyard-mumbai"], name: "Bedroom", description: "King suite with linen and warm lamps.", panoramaUrl: "/images/pano-bedroom.jpg", thumbnailUrl: "/images/pano-bedroom.jpg", sortOrder: 2 },
      { propertyId: bySlug["meridian-courtyard-mumbai"], name: "Marble bath", description: "Freestanding tub and brass fittings.", panoramaUrl: "/images/pano-bathroom.jpg", thumbnailUrl: "/images/pano-bathroom.jpg", sortOrder: 3 },
      { propertyId: bySlug["palm-grove-villa-goa"], name: "Living pavilion", description: "Open living onto the pool deck.", panoramaUrl: "/images/pano-living.jpg", thumbnailUrl: "/images/pano-living.jpg", sortOrder: 0 },
      { propertyId: bySlug["palm-grove-villa-goa"], name: "Master bedroom", description: "Pool-facing master with linen drapes.", panoramaUrl: "/images/pano-bedroom.jpg", thumbnailUrl: "/images/pano-bedroom.jpg", sortOrder: 1 },
      { propertyId: bySlug["palm-grove-villa-goa"], name: "Kitchen", description: "Chef’s kitchen for long Goan lunches.", panoramaUrl: "/images/pano-kitchen.jpg", thumbnailUrl: "/images/pano-kitchen.jpg", sortOrder: 2 },
      { propertyId: bySlug["palm-grove-villa-goa"], name: "Bath", description: "Indoor-outdoor marble bath.", panoramaUrl: "/images/pano-bathroom.jpg", thumbnailUrl: "/images/pano-bathroom.jpg", sortOrder: 3 },
      { propertyId: bySlug["skyline-residences-bangalore"], name: "Living", description: "City lights through the glass wall.", panoramaUrl: "/images/pano-living.jpg", thumbnailUrl: "/images/pano-living.jpg", sortOrder: 0 },
      { propertyId: bySlug["skyline-residences-bangalore"], name: "Bedroom", description: "Quiet bedroom off the foyer.", panoramaUrl: "/images/pano-bedroom.jpg", thumbnailUrl: "/images/pano-bedroom.jpg", sortOrder: 1 },
      { propertyId: bySlug["skyline-residences-bangalore"], name: "Kitchen", description: "Galley kitchen with stone counters.", panoramaUrl: "/images/pano-kitchen.jpg", thumbnailUrl: "/images/pano-kitchen.jpg", sortOrder: 2 },
      { propertyId: bySlug["skyline-residences-bangalore"], name: "Bath", description: "Minimal marble bath.", panoramaUrl: "/images/pano-bathroom.jpg", thumbnailUrl: "/images/pano-bathroom.jpg", sortOrder: 3 },
      { propertyId: bySlug["suryagarh-heritage-estate"], name: "Courtyard villa", description: "Sandstone courtyard of Villa A.", panoramaUrl: "/images/pano-lobby.jpg", thumbnailUrl: "/images/pano-lobby.jpg", sortOrder: 0 },
      { propertyId: bySlug["suryagarh-heritage-estate"], name: "Living hall", description: "Sample interior of the sale villa.", panoramaUrl: "/images/pano-living.jpg", thumbnailUrl: "/images/pano-living.jpg", sortOrder: 1 },
      { propertyId: bySlug["suryagarh-heritage-estate"], name: "Clubhouse", description: "Estate clubhouse lounge.", panoramaUrl: "/images/pano-kitchen.jpg", thumbnailUrl: "/images/pano-kitchen.jpg", sortOrder: 2 },
      { propertyId: bySlug["mistwood-lodge-manali"], name: "Living hall", description: "Cedar hall with the wood stove.", panoramaUrl: "/images/pano-living.jpg", thumbnailUrl: "/images/pano-living.jpg", sortOrder: 0 },
      { propertyId: bySlug["mistwood-lodge-manali"], name: "Loft bedroom", description: "Loft under the pitched roof.", panoramaUrl: "/images/pano-bedroom.jpg", thumbnailUrl: "/images/pano-bedroom.jpg", sortOrder: 1 },
      { propertyId: bySlug["mistwood-lodge-manali"], name: "Bath", description: "Stone bath with mountain light.", panoramaUrl: "/images/pano-bathroom.jpg", thumbnailUrl: "/images/pano-bathroom.jpg", sortOrder: 2 },
      { propertyId: bySlug["naini-edge-cottage"], name: "Lake living", description: "Living room aligned to the water.", panoramaUrl: "/images/pano-living.jpg", thumbnailUrl: "/images/pano-living.jpg", sortOrder: 0 },
      { propertyId: bySlug["naini-edge-cottage"], name: "Bedroom", description: "Timber bedroom with lake light.", panoramaUrl: "/images/pano-bedroom.jpg", thumbnailUrl: "/images/pano-bedroom.jpg", sortOrder: 1 },
      { propertyId: bySlug["indigo-house-loft-delhi"], name: "Loft living", description: "Double-height living with city glass.", panoramaUrl: "/images/pano-living.jpg", thumbnailUrl: "/images/pano-living.jpg", sortOrder: 0 },
      { propertyId: bySlug["indigo-house-loft-delhi"], name: "Kitchen", description: "Island kitchen under the mezzanine.", panoramaUrl: "/images/pano-kitchen.jpg", thumbnailUrl: "/images/pano-kitchen.jpg", sortOrder: 1 },
      { propertyId: bySlug["indigo-house-loft-delhi"], name: "Sleeping loft", description: "The mezzanine bedroom.", panoramaUrl: "/images/pano-bedroom.jpg", thumbnailUrl: "/images/pano-bedroom.jpg", sortOrder: 2 },
      { propertyId: bySlug["backwater-view-plots"], name: "Villa pad interior", description: "Sample villa living for plot buyers.", panoramaUrl: "/images/pano-living.jpg", thumbnailUrl: "/images/pano-living.jpg", sortOrder: 0 },
      { propertyId: bySlug["backwater-view-plots"], name: "Jetty pavilion", description: "Shared jetty and club pavilion.", panoramaUrl: "/images/pano-lobby.jpg", thumbnailUrl: "/images/pano-lobby.jpg", sortOrder: 1 },
    ])
    .returning({ id: rooms.id, propertyId: rooms.propertyId, name: rooms.name });

  const roomBy = (propertyId: number, name: string) =>
    roomRows.find((r) => r.propertyId === propertyId && r.name === name)?.id ?? null;

  const planRows = await tx
    .insert(floorPlans)
    .values([
      { propertyId: bySlug["meridian-courtyard-mumbai"], name: "Suite plan — Level 1", imageUrl: "/images/floorplan-suite.jpg", description: "Tap a View pin to stand inside that room." },
      { propertyId: bySlug["palm-grove-villa-goa"], name: "Villa plan", imageUrl: "/images/floorplan-villa.jpg", description: "Pool deck, living pavilion, and bedrooms." },
      { propertyId: bySlug["skyline-residences-bangalore"], name: "Apartment plan", imageUrl: "/images/floorplan-apartment.jpg", description: "Foyer to glass living wall." },
      { propertyId: bySlug["suryagarh-heritage-estate"], name: "Estate plot map", imageUrl: "/images/floorplan-plot.jpg", description: "Villa footprints and clubhouse on the selling map." },
      { propertyId: bySlug["mistwood-lodge-manali"], name: "Lodge plan", imageUrl: "/images/floorplan-suite.jpg", description: "Hall, loft, and bath." },
      { propertyId: bySlug["naini-edge-cottage"], name: "Cottage plan", imageUrl: "/images/floorplan-apartment.jpg", description: "Deck-aligned living and bedroom." },
      { propertyId: bySlug["indigo-house-loft-delhi"], name: "Loft plan", imageUrl: "/images/floorplan-apartment.jpg", description: "Kitchen island under the sleeping loft." },
      { propertyId: bySlug["backwater-view-plots"], name: "Selling plot map", imageUrl: "/images/floorplan-plot.jpg", description: "Each pad opens a 360° sample interior." },
    ])
    .returning({ id: floorPlans.id, propertyId: floorPlans.propertyId });

  const planByProperty = Object.fromEntries(planRows.map((p) => [p.propertyId, p.id]));

  const m = bySlug["meridian-courtyard-mumbai"];
  const g = bySlug["palm-grove-villa-goa"];
  const b = bySlug["skyline-residences-bangalore"];
  const j = bySlug["suryagarh-heritage-estate"];
  const h = bySlug["mistwood-lodge-manali"];
  const n = bySlug["naini-edge-cottage"];
  const d = bySlug["indigo-house-loft-delhi"];
  const k = bySlug["backwater-view-plots"];

  await tx.insert(planHotspots).values([
    { floorPlanId: planByProperty[m], roomId: roomBy(m, "Courtyard lobby"), label: "Lobby", xPercent: 18, yPercent: 42 },
    { floorPlanId: planByProperty[m], roomId: roomBy(m, "Living suite"), label: "Living", xPercent: 46, yPercent: 38 },
    { floorPlanId: planByProperty[m], roomId: roomBy(m, "Bedroom"), label: "Bedroom", xPercent: 72, yPercent: 34 },
    { floorPlanId: planByProperty[m], roomId: roomBy(m, "Marble bath"), label: "Bath", xPercent: 78, yPercent: 62 },
    { floorPlanId: planByProperty[g], roomId: roomBy(g, "Living pavilion"), label: "Living", xPercent: 40, yPercent: 46 },
    { floorPlanId: planByProperty[g], roomId: roomBy(g, "Master bedroom"), label: "Master", xPercent: 68, yPercent: 30 },
    { floorPlanId: planByProperty[g], roomId: roomBy(g, "Kitchen"), label: "Kitchen", xPercent: 28, yPercent: 62 },
    { floorPlanId: planByProperty[g], roomId: roomBy(g, "Bath"), label: "Bath", xPercent: 74, yPercent: 58 },
    { floorPlanId: planByProperty[b], roomId: roomBy(b, "Living"), label: "Living", xPercent: 48, yPercent: 40 },
    { floorPlanId: planByProperty[b], roomId: roomBy(b, "Bedroom"), label: "Bedroom", xPercent: 72, yPercent: 32 },
    { floorPlanId: planByProperty[b], roomId: roomBy(b, "Kitchen"), label: "Kitchen", xPercent: 30, yPercent: 58 },
    { floorPlanId: planByProperty[b], roomId: roomBy(b, "Bath"), label: "Bath", xPercent: 76, yPercent: 64 },
    { floorPlanId: planByProperty[j], roomId: roomBy(j, "Courtyard villa"), label: "Villa A", xPercent: 32, yPercent: 38 },
    { floorPlanId: planByProperty[j], roomId: roomBy(j, "Living hall"), label: "Villa B", xPercent: 58, yPercent: 44 },
    { floorPlanId: planByProperty[j], roomId: roomBy(j, "Clubhouse"), label: "Clubhouse", xPercent: 48, yPercent: 68 },
    { floorPlanId: planByProperty[h], roomId: roomBy(h, "Living hall"), label: "Hall", xPercent: 42, yPercent: 44 },
    { floorPlanId: planByProperty[h], roomId: roomBy(h, "Loft bedroom"), label: "Loft", xPercent: 70, yPercent: 32 },
    { floorPlanId: planByProperty[h], roomId: roomBy(h, "Bath"), label: "Bath", xPercent: 76, yPercent: 60 },
    { floorPlanId: planByProperty[n], roomId: roomBy(n, "Lake living"), label: "Living", xPercent: 44, yPercent: 42 },
    { floorPlanId: planByProperty[n], roomId: roomBy(n, "Bedroom"), label: "Bedroom", xPercent: 70, yPercent: 36 },
    { floorPlanId: planByProperty[d], roomId: roomBy(d, "Loft living"), label: "Living", xPercent: 46, yPercent: 40 },
    { floorPlanId: planByProperty[d], roomId: roomBy(d, "Kitchen"), label: "Kitchen", xPercent: 28, yPercent: 58 },
    { floorPlanId: planByProperty[d], roomId: roomBy(d, "Sleeping loft"), label: "Loft", xPercent: 72, yPercent: 30 },
    { floorPlanId: planByProperty[k], roomId: roomBy(k, "Villa pad interior"), label: "Plot 3", xPercent: 36, yPercent: 40 },
    { floorPlanId: planByProperty[k], roomId: roomBy(k, "Jetty pavilion"), label: "Jetty", xPercent: 62, yPercent: 66 },
  ]);

  const insertedCustomers = await tx
    .insert(customers)
    .values([
      { name: "Priya Sharma", email: "priya.sharma@email.com", phone: "+91 98200 11420", type: "guest", status: "booked", city: "Mumbai", notes: "Prefers courtyard-facing suites. Repeat guest.", totalSpent: 26700 },
      { name: "Arjun Mehta", email: "arjun.mehta@email.com", phone: "+91 98111 33410", type: "buyer", status: "lead", city: "Delhi", notes: "Interested in Villa A at Suryagarh. Wants 360 walkthrough of courtyard.", totalSpent: 0 },
      { name: "Leah Fernandes", email: "leah.f@email.com", phone: "+91 98812 77621", type: "guest", status: "booked", city: "Goa", notes: "Family of 6. Requested chef for Saturday.", totalSpent: 55500 },
      { name: "Vikram Rao", email: "vikram.rao@email.com", phone: "+91 98450 22109", type: "guest", status: "active", city: "Bangalore", notes: "Works remotely. Needs desk and fast wifi.", totalSpent: 12600 },
      { name: "Nandini Joshi", email: "nandini.j@email.com", phone: "+91 94220 88014", type: "inquiry", status: "lead", city: "Pune", notes: "Asked for Alleppey plot sizes and title papers.", totalSpent: 0 },
      { name: "Omar Qureshi", email: "omar.q@email.com", phone: "+91 99001 45032", type: "guest", status: "completed", city: "Hyderabad", notes: "Loved the Manali lodge. Left a 5-star review.", totalSpent: 20100 },
      { name: "Sara Iqbal", email: "sara.iqbal@email.com", phone: "+91 98180 66721", type: "buyer", status: "active", city: "Jaipur", notes: "Second site visit scheduled after 360 tour.", totalSpent: 0 },
      { name: "Rohan Desai", email: "rohan.desai@email.com", phone: "+91 98700 19283", type: "guest", status: "booked", city: "Ahmedabad", notes: "Anniversary stay. Late checkout requested.", totalSpent: 17800 },
    ])
    .returning({ id: customers.id, email: customers.email });

  const customerId = (email: string) => insertedCustomers.find((c) => c.email === email)?.id ?? null;

  await tx.insert(bookings).values([
    { propertyId: m, customerId: customerId("priya.sharma@email.com"), guestName: "Priya Sharma", guestEmail: "priya.sharma@email.com", guestPhone: "+91 98200 11420", checkIn: "2026-04-12", checkOut: "2026-04-15", guests: 2, nights: 3, totalAmount: 26700, status: "confirmed", listingType: "rent" },
    { propertyId: g, customerId: customerId("leah.f@email.com"), guestName: "Leah Fernandes", guestEmail: "leah.f@email.com", guestPhone: "+91 98812 77621", checkIn: "2026-04-18", checkOut: "2026-04-21", guests: 6, nights: 3, totalAmount: 55500, status: "confirmed", listingType: "rent" },
    { propertyId: b, customerId: customerId("vikram.rao@email.com"), guestName: "Vikram Rao", guestEmail: "vikram.rao@email.com", guestPhone: "+91 98450 22109", checkIn: "2026-03-28", checkOut: "2026-03-31", guests: 1, nights: 3, totalAmount: 12600, status: "completed", listingType: "rent" },
    { propertyId: h, customerId: customerId("omar.q@email.com"), guestName: "Omar Qureshi", guestEmail: "omar.q@email.com", guestPhone: "+91 99001 45032", checkIn: "2026-02-10", checkOut: "2026-02-13", guests: 3, nights: 3, totalAmount: 20100, status: "completed", listingType: "rent" },
    { propertyId: n, customerId: customerId("rohan.desai@email.com"), guestName: "Rohan Desai", guestEmail: "rohan.desai@email.com", guestPhone: "+91 98700 19283", checkIn: "2026-04-22", checkOut: "2026-04-25", guests: 2, nights: 3, totalAmount: 16200, status: "pending", listingType: "rent" },
    { propertyId: j, customerId: customerId("arjun.mehta@email.com"), guestName: "Arjun Mehta", guestEmail: "arjun.mehta@email.com", guestPhone: "+91 98111 33410", checkIn: "2026-04-08", checkOut: "2026-04-08", guests: 2, nights: 1, totalAmount: 0, status: "pending", listingType: "sale" },
    { propertyId: d, customerId: customerId("priya.sharma@email.com"), guestName: "Priya Sharma", guestEmail: "priya.sharma@email.com", guestPhone: "+91 98200 11420", checkIn: "2026-05-02", checkOut: "2026-05-05", guests: 2, nights: 3, totalAmount: 15300, status: "confirmed", listingType: "rent" },
    { propertyId: k, customerId: customerId("nandini.j@email.com"), guestName: "Nandini Joshi", guestEmail: "nandini.j@email.com", guestPhone: "+91 94220 88014", checkIn: "2026-04-19", checkOut: "2026-04-19", guests: 1, nights: 1, totalAmount: 0, status: "pending", listingType: "sale" },
  ]);

  await tx.insert(reviews).values([
    { propertyId: m, author: "Priya Sharma", rating: 5, comment: "The 360 tour of the courtyard sold me. The suite looked exactly like the plan pins promised." },
    { propertyId: m, author: "Kabir Lal", rating: 5, comment: "Quiet, lantern-lit, and the bath is a dream. Staff left fruit after a late arrival." },
    { propertyId: g, author: "Leah Fernandes", rating: 5, comment: "Kids lived in the pool. Being able to spin through every room on the plan made the family yes easy." },
    { propertyId: b, author: "Vikram Rao", rating: 4, comment: "Desk, light, and a kitchen that actually works. Slight street noise after 11." },
    { propertyId: h, author: "Omar Qureshi", rating: 5, comment: "Woke to snow on the cedar roof. The loft 360 was accurate — bring wool socks." },
    { propertyId: n, author: "Anika Sen", rating: 5, comment: "Mist on the lake at 6am. The living-room pin on the plan is perfectly aligned to the water." },
    { propertyId: j, author: "Sara Iqbal", rating: 5, comment: "Stood in Villa A from my office. Title pack arrived the next morning." },
    { propertyId: d, author: "Dev’s guest", rating: 4, comment: "The loft is a looker. Stairs are steep — mentioned in the plan, still worth it." },
  ]);
  });
}
