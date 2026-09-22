import { desc } from "drizzle-orm";
import { db } from "@/db";
import { bookings, customers } from "@/db/schema";
import { CustomerManager } from "@/components/CustomerManager";

export const dynamic = "force-dynamic";

export default async function DashboardCustomersPage() {
  const rows = await db.select().from(customers).orderBy(desc(customers.createdAt));
  const allBookings = await db.select().from(bookings);

  const cards = rows.map((customer) => ({
    ...customer,
    createdAt: customer.createdAt.toISOString(),
    bookingCount: allBookings.filter((b) => b.customerId === customer.id).length,
  }));

  const leads = rows.filter((c) => c.status === "lead").length;
  const buyers = rows.filter((c) => c.type === "buyer").length;

  return (
    <main>
      <p className="text-xs uppercase tracking-[0.2em] text-gold">CRM</p>
      <h1 className="mt-2 font-display text-4xl">Customers</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Guests, buyers and inquiries — add notes, change status, or log a new lead from the front
        desk.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["People", String(rows.length)],
          ["Leads", String(leads)],
          ["Buyers", String(buyers)],
        ].map(([label, value]) => (
          <article key={label} className="rounded-2xl bg-white px-4 py-3 ring-1 ring-ink/8">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-soft">{label}</p>
            <p className="font-display text-2xl">{value}</p>
          </article>
        ))}
      </div>
      <CustomerManager customers={cards} />
    </main>
  );
}
