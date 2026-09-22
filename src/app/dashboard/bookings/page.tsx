import { desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings, properties } from "@/db/schema";
import { formatINR } from "@/lib/format";
import { BookingStatusForm } from "@/components/BookingStatusForm";

export const dynamic = "force-dynamic";

export default async function DashboardBookingsPage() {
  const rows = await db.select().from(bookings).orderBy(desc(bookings.createdAt));
  const listingRows = await db.select().from(properties);
  const titles = Object.fromEntries(listingRows.map((p) => [p.id, p.title]));

  return (
    <main>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">Pipeline</p>
      <h1 className="mt-2 font-display text-4xl">Bookings</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Stays, site visits, and sale inquiries — update status as guests move through.
      </p>
      <div className="mt-6 overflow-hidden rounded-3xl bg-white ring-1 ring-ink/8">
        <table className="w-full text-left text-sm">
          <thead className="bg-paper text-[10px] uppercase tracking-[0.16em] text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">Guest</th>
              <th className="px-4 py-3 font-medium">Listing</th>
              <th className="px-4 py-3 font-medium">Dates</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-ink/8">
                <td className="px-4 py-3">
                  <p className="font-medium">{row.guestName}</p>
                  <p className="text-xs text-ink-soft">{row.guestEmail}</p>
                </td>
                <td className="px-4 py-3">
                  {titles[row.propertyId]}
                  <span className="block text-xs capitalize text-ink-soft">{row.listingType}</span>
                </td>
                <td className="px-4 py-3 text-xs">
                  {row.checkIn}
                  {row.listingType === "rent" ? ` → ${row.checkOut}` : ""}
                </td>
                <td className="px-4 py-3">{row.totalAmount ? formatINR(row.totalAmount) : "Visit"}</td>
                <td className="px-4 py-3">
                  <BookingStatusForm id={row.id} status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
