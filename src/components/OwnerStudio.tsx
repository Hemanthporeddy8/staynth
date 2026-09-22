"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, ImagePlus, Map, Trash2, View } from "lucide-react";
import type { FloorPlan, PlanHotspot, Property, Room } from "@/db/schema";
import {
  addRoom,
  deleteProperty,
  deleteRoom,
  saveBlueprint,
  updateProperty,
} from "@/lib/actions";
import { FloorPlanEditor } from "@/components/FloorPlanEditor";
import { ImageDrop } from "@/components/ImageDrop";
import { PanoCamera } from "@/components/PanoCamera";
import { PlanCreator } from "@/components/PlanCreator";
import { STAY_TYPES } from "@/lib/stay-types";

type Hotspot = PlanHotspot & { room?: Room | null };

const tabs = [
  { id: "details", label: "1. Listing" },
  { id: "rooms", label: "2. 360° rooms" },
  { id: "eyes", label: "3. Blueprint (Optional)" },
] as const;

export function OwnerStudio({
  property,
  rooms,
  plan,
  hotspots,
}: {
  property: Omit<Property, "createdAt">;
  rooms: Room[];
  plan: FloorPlan | null;
  hotspots: Hotspot[];
}) {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("details");
  const [cover, setCover] = useState(property.coverImage);
  const [gallery, setGallery] = useState<string[]>(property.images);
  const [message, setMessage] = useState("");
  const [panoUrl, setPanoUrl] = useState("");
  const [planUrl, setPlanUrl] = useState(plan?.imageUrl ?? "");
  const [planMode, setPlanMode] = useState<"upload" | "draw">(plan ? "upload" : "draw");

  async function onSaveDetails(formData: FormData) {
    formData.set("coverImage", cover);
    formData.set("images", gallery.join(","));
    const result = await updateProperty(formData);
    setMessage(result.ok ? "Listing details saved." : result.error);
  }

  async function onAddRoom(formData: FormData) {
    if (!panoUrl) {
      setMessage("Upload a 360° photo before saving the room.");
      return;
    }
    formData.set("panoramaUrl", panoUrl);
    const result = await addRoom(formData);
    if (result.ok) {
      setPanoUrl("");
      setMessage("360° room added! You can add another room below, or optionally add a blueprint in Step 3.");
    } else {
      setMessage(result.error);
    }
  }

  async function onDrawnPlan(url: string) {
    setPlanUrl(url);
    const formData = new FormData();
    formData.set("propertyId", String(property.id));
    formData.set("imageUrl", url);
    formData.set("name", "Drawn blueprint");
    formData.set("description", "Owner-drawn floor plan. Tap an eye to look inside.");
    const result = await saveBlueprint(formData);
    setMessage(result.ok ? "Drawn blueprint saved. Click a room to drop an eye." : result.error);
  }

  async function onSavePlan(formData: FormData) {
    if (!planUrl) {
      setMessage("Upload the blueprint or plot map first.");
      return;
    }
    formData.set("imageUrl", planUrl);
    const result = await saveBlueprint(formData);
    setMessage(result.ok ? "Blueprint saved. Click the map to drop eyes." : result.error);
  }

  async function onDeleteRoom(formData: FormData) {
    await deleteRoom(formData);
  }

  async function onDeleteListing(formData: FormData) {
    if (!window.confirm("Remove this listing from Aerio?")) return;
    await deleteProperty(formData);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full px-4 py-2 text-sm ${
              tab === item.id ? "bg-ink text-paper" : "bg-white ring-1 ring-ink/10"
            }`}
          >
            {item.label}
          </button>
        ))}
        <Link
          href={`/listings/${property.id}/plan`}
          className="rounded-full bg-terracotta px-4 py-2 text-sm text-white"
        >
          Preview guest plan
        </Link>
      </div>

      {message ? <p className="mt-4 text-sm text-forest">{message}</p> : null}

      {tab === "details" ? (
        <form action={onSaveDetails} className="mt-6 space-y-4 rounded-3xl bg-white p-6 ring-1 ring-ink/8">
          <input type="hidden" name="id" value={property.id} />
          <p className="font-display text-2xl">Listing details</p>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Title
              <input
                name="title"
                defaultValue={property.title}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Tagline
              <input
                name="tagline"
                defaultValue={property.tagline}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
          </div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Description
            <textarea
              name="description"
              rows={4}
              defaultValue={property.description}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Stay type
              <select
                name="type"
                defaultValue={property.type}
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
                defaultValue={property.listingType}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
              >
                <option value="rent">Rent</option>
                <option value="sale">Sale</option>
              </select>
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Price
              <input
                name="price"
                type="number"
                defaultValue={property.price}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              City
              <input
                name="city"
                defaultValue={property.city}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              State
              <input
                name="state"
                defaultValue={property.state}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
          </div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Address
            <input
              name="address"
              defaultValue={property.address}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <div className="grid gap-4 md:grid-cols-4">
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Beds
              <input name="bedrooms" type="number" defaultValue={property.bedrooms} className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink" />
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Baths
              <input name="bathrooms" type="number" defaultValue={property.bathrooms} className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink" />
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Guests
              <input name="maxGuests" type="number" defaultValue={property.maxGuests} className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink" />
            </label>
            <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Sq.ft
              <input name="areaSqft" type="number" defaultValue={property.areaSqft} className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink" />
            </label>
          </div>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Amenities
            <input
              name="amenities"
              defaultValue={property.amenities.join(", ")}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Owner name
            <input
              name="hostName"
              defaultValue={property.hostName}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
            />
          </label>
          <ImageDrop
            label="Cover photo (optional)"
            hint="Replace the card photo anytime"
            preview={cover}
            onUploaded={(url) => {
              setCover(url);
              setGallery((current) => [url, ...current.filter((item) => item !== url)]);
            }}
          />
          <ImageDrop
            label="Add a gallery photo"
            hint="Still photos of the facade, pool, rooms"
            onUploaded={(url) => setGallery((current) => [...current, url])}
          />
          <div className="flex flex-wrap gap-2">
            {gallery.map((src) => (
              <img key={src} src={src} alt="" className="h-16 w-20 rounded-xl object-cover" />
            ))}
          </div>
          <button type="submit" className="rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper">
            Save listing
          </button>
        </form>
      ) : null}

      {tab === "rooms" ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <form action={onAddRoom} className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
            <p className="font-display text-2xl">Add a 360° room</p>
            <p className="mt-2 text-sm text-ink-soft">
              Open the camera and shoot all 6 directions — front, right, back, left, ceiling, floor.
              We stitch them into a full 360° look-around. Repeat for every room.
            </p>
            <input type="hidden" name="propertyId" value={property.id} />
            <label className="mt-4 block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Room name
              <input
                name="name"
                required
                placeholder="Master bedroom"
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              Note for guests
              <input
                name="description"
                placeholder="Morning light, lake side"
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
              />
            </label>
            <div className="mt-3">
              <PanoCamera preview={panoUrl} onUploaded={setPanoUrl} />
            </div>
            <button
              type="submit"
              className="mt-4 w-full rounded-full bg-terracotta py-2.5 text-sm font-semibold text-white"
            >
              Save 360° room
            </button>
          </form>
          <div className="space-y-3">
            {rooms.map((room) => (
              <article key={room.id} className="flex gap-3 rounded-3xl bg-white p-3 ring-1 ring-ink/8">
                <img src={room.thumbnailUrl} alt="" className="h-20 w-28 rounded-2xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-ink-soft">{room.description}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-[11px] uppercase tracking-wider text-terracotta">
                    <View className="h-3 w-3" /> 360° ready
                  </p>
                </div>
                <form action={onDeleteRoom}>
                  <input type="hidden" name="id" value={room.id} />
                  <input type="hidden" name="propertyId" value={property.id} />
                  <button type="submit" className="rounded-full p-2 text-clay hover:bg-paper">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </article>
            ))}
            {rooms.length === 0 ? (
              <p className="rounded-3xl bg-white p-6 text-sm text-ink-soft ring-1 ring-ink/8">
                No 360° rooms yet. Upload at least one before placing eyes on the blueprint.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "eyes" ? (
        <div className="mt-6 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-amber-50 border border-amber-200 p-5 text-amber-950 shadow-sm">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-amber-800">
                Step 3 is completely optional
              </p>
              <p className="mt-1 text-sm text-amber-900/80">
                Don't have a floor plan or blueprint? You can skip this step anytime. Guests can still tour all your rooms in 360°!
              </p>
            </div>
            <Link
              href={`/listings/${property.id}`}
              className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-terracotta-dark transition cursor-pointer"
            >
              Skip & View Live Listing →
            </Link>
          </div>

          <section className="rounded-3xl bg-forest p-5 text-sand">
            <p className="text-[10px] uppercase tracking-[0.18em] text-gold">How step 3 works</p>
            <h2 className="mt-1 font-display text-2xl">Blueprint, then eyes</h2>
            <ol className="mt-3 space-y-2 text-sm leading-6 text-sand/80">
              <li>
                <b className="text-sand">1. Get a map.</b> Upload an architect drawing / plot map,
                or draw rooms on the grid if you don’t have one.
              </li>
              <li>
                <b className="text-sand">2. Save it.</b> That image becomes View in plan for
                guests.
              </li>
              <li>
                <b className="text-sand">3. Drop eyes.</b> Click a bedroom on the map, link it to
                that room’s 360°. Guests tap the eye and stand inside.
              </li>
            </ol>
          </section>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPlanMode("upload")}
              className={`rounded-full px-4 py-2 text-sm ${
                planMode === "upload" ? "bg-ink text-paper" : "bg-white ring-1 ring-ink/10"
              }`}
            >
              I have a plan — upload
            </button>
            <button
              type="button"
              onClick={() => setPlanMode("draw")}
              className={`rounded-full px-4 py-2 text-sm ${
                planMode === "draw" ? "bg-ink text-paper" : "bg-white ring-1 ring-ink/10"
              }`}
            >
              No plan — draw one
            </button>
          </div>

          {planMode === "draw" ? <PlanCreator onReady={onDrawnPlan} /> : null}

          {planMode === "upload" ? (
          <form action={onSavePlan} className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
            <p className="font-display text-2xl">Upload blueprint / plot map</p>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              Architect drawing, hotel floor, or selling plot map. JPG or PNG.
            </p>
            <input type="hidden" name="propertyId" value={property.id} />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Plan name
                <input
                  name="name"
                  defaultValue={plan?.name ?? "Level 1 blueprint"}
                  className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
              <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                Caption
                <input
                  name="description"
                  defaultValue={plan?.description ?? "Tap an eye to look inside that room."}
                  className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
                />
              </label>
            </div>
            <div className="mt-3">
              <ImageDrop
                label="Blueprint image"
                hint="Click to upload the floor or plot map"
                kind="plan"
                preview={planUrl}
                onUploaded={setPlanUrl}
              />
            </div>
            <button
              type="submit"
              className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-paper"
            >
              Save blueprint
            </button>
          </form>
          ) : null}

          {plan ? (
            rooms.length ? (
              <FloorPlanEditor
                propertyId={property.id}
                floorPlanId={plan.id}
                imageUrl={plan.imageUrl}
                rooms={rooms}
                hotspots={hotspots}
              />
            ) : (
              <p className="rounded-3xl bg-sand p-5 text-sm text-ink-soft">
                Add a 360° room first, then come back to drop eyes on this blueprint.
              </p>
            )
          ) : (
            <p className="rounded-3xl bg-sand p-5 text-sm text-ink-soft">
              Save a blueprint above, then click the map to place eyes.
            </p>
          )}
        </div>
      ) : null}

      <div className="mt-8 grid gap-3 rounded-3xl bg-forest p-5 text-sand sm:grid-cols-3">
        <p className="flex items-start gap-2 text-sm">
          <ImagePlus className="mt-0.5 h-4 w-4 text-gold" />
          Cover + stills sell the stay on the catalogue.
        </p>
        <p className="flex items-start gap-2 text-sm">
          <View className="mt-0.5 h-4 w-4 text-gold" />
          Each 360° upload becomes a room guests can spin through.
        </p>
        <p className="flex items-start gap-2 text-sm">
          <Eye className="mt-0.5 h-4 w-4 text-gold" />
          Eyes on the blueprint open that room — like street view on a map.
        </p>
      </div>
      <p className="mt-3 flex items-center gap-2 text-xs text-ink-soft">
        <Map className="h-3.5 w-3.5" />
        Guests tap View in plan on the public listing to see your eyes.
      </p>
      <form action={onDeleteListing} className="mt-6">
        <input type="hidden" name="id" value={property.id} />
        <button type="submit" className="text-xs text-clay hover:underline">
          Delete this listing
        </button>
      </form>
    </div>
  );
}
