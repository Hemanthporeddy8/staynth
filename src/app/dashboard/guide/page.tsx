import Link from "next/link";
import { Eye, ImagePlus, Map, View } from "lucide-react";

export default function OwnerGuidePage() {
  return (
    <main>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">How it works</p>
      <h1 className="mt-2 font-display text-4xl">From upload to an eye</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">
        Aerio is built like Airbnb/OYO, plus a street-view for interiors. The owner uploads three
        things. Guests never upload — they only look and book.
      </p>

      <ol className="mt-8 space-y-4">
        <li className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold">
            <ImagePlus className="h-4 w-4" /> Step 1 · List the property
          </p>
          <h2 className="mt-2 font-display text-2xl">Cover photo + details</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Owner desk → <b>List a property</b>. Fill name, city, rent or sale, price. Click the
            dashed box and pick a photo from your computer (building, villa, plot). That file is
            compressed in the browser, sent to <code>/api/upload</code>, saved on the server as
            <code> /uploads/…</code>, and stored on the listing in Postgres. It becomes the card
            image on the public catalogue.
          </p>
        </li>
        <li className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold">
            <View className="h-4 w-4" /> Step 2 · 360° rooms
          </p>
          <h2 className="mt-2 font-display text-2xl">One panorama per room</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Open the listing studio → <b>2. 360° rooms</b>. Name the room (Living, Bedroom, Bath)
            and upload a panoramic photo. Ideal: a 360 camera equirectangular JPG. A wide phone
            panorama still works. Each upload is a <b>room</b> row linked to the property, with
            <code> panoramaUrl</code> pointing at the file. Guests drag to look around in the
            Photo Sphere viewer — same idea as Google Street View.
          </p>
        </li>
        <li className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold">
            <Map className="h-4 w-4" /> Step 3 · Blueprint
          </p>
          <h2 className="mt-2 font-display text-2xl">Floor plan or selling plot map</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Studio → <b>3. Blueprint + eyes</b>. Upload the architect drawing, hotel floor map, or
            the selling plot layout. That image is the background guests see on{" "}
            <b>View in plan</b>.
          </p>
        </li>
        <li className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-gold">
            <Eye className="h-4 w-4" /> Step 4 · Eyes
          </p>
          <h2 className="mt-2 font-display text-2xl">Click the map, link a 360°</h2>
          <p className="mt-2 text-sm leading-6 text-ink-soft">
            Click where the bedroom is on the blueprint. An eye appears. Choose which 360° room it
            opens. Save. We store the eye as x/y percentages on the image plus the room id. When a
            guest taps that eye, the 360° of that room fills the screen. Move an eye by deleting
            and placing again.
          </p>
        </li>
      </ol>

      <div className="mt-8 rounded-3xl bg-forest p-6 text-sand">
        <p className="font-display text-2xl">Guest path</p>
        <p className="mt-2 text-sm leading-6 text-sand/80">
          Catalogue → listing → <b>View in plan</b> or <b>360° tour</b>. Eyes pulse on the
          blueprint. Tap one → look around. Book or request a site visit. That lands on your
          customer dashboard.
        </p>
        <Link
          href="/dashboard/properties/new"
          className="mt-5 inline-flex rounded-full bg-sand px-4 py-2 text-sm font-medium text-forest"
        >
          List a property now
        </Link>
      </div>
    </main>
  );
}
