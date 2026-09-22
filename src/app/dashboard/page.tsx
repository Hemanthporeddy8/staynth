import Link from "next/link";
import { formatINR } from "@/lib/format";
import { getDashboardStats } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const stats = await getDashboardStats();
  const allBookings = stats.recentBookings;
  const allProperties = stats.properties;
  const revenue = stats.revenue;
  const confirmed = allBookings.filter((row) => row.status === "confirmed").length;
  const leads = stats.customersCount;
  const propertyTitle = Object.fromEntries(allProperties.map((p) => [p.id, p.title]));
  const recent = stats.recentBookings.slice(0, 6);

  return (
    <main>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Overview</p>
      <h1 className="mt-2 font-display text-4xl">Owner desk</h1>
      <p className="mt-2 text-sm text-ink-soft">
        List a property, upload 360° rooms and a blueprint, drop eyes, then manage guests.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Revenue logged", formatINR(revenue)],
          ["Bookings", String(allBookings.length)],
          ["Confirmed stays", String(confirmed)],
          ["Open leads", String(leads)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
            <p className="mt-2 font-display text-3xl">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl">Latest activity</h2>
            <Link href="/dashboard/bookings" className="text-sm text-terracotta">
              All bookings
            </Link>
          </div>
          <ul className="mt-4 divide-y divide-ink/8">
            {recent.map((row) => (
              <li key={row.id} className="flex items-center justify-between py-3 text-sm">
                <span>
                  <span className="font-medium">{row.guestName}</span>
                  <span className="block text-xs text-ink-soft">
                    {propertyTitle[row.propertyId]} · {row.checkIn}
                  </span>
                </span>
                <span className="rounded-full bg-paper px-2 py-1 text-[11px] uppercase tracking-wider">
                  {row.status}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl bg-forest p-6 text-sand">
          <h2 className="font-display text-2xl">List · 360° · eyes</h2>
          <p className="mt-2 text-sm leading-6 text-sand/75">
            Create a listing, upload one 360° photo per room, then upload the floor or plot map
            and click to place eyes. Guests tap an eye and stand in that room.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              href="/dashboard/properties/new"
              className="inline-flex rounded-full bg-sand px-4 py-2 text-sm font-medium text-forest"
            >
              List a property
            </Link>
            <Link
              href="/dashboard/guide"
              className="inline-flex rounded-full bg-white/10 px-4 py-2 text-sm"
            >
              How uploads work
            </Link>
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.16em] text-gold">
            {allProperties.length} live listings · {stats.customersCount} customers
          </p>
        </section>
      </div>
    </main>
  );
}
