"use client";

import { useMemo, useState } from "react";
import type { Customer } from "@/db/schema";
import { createCustomer, deleteCustomer, updateCustomer } from "@/lib/actions";
import { formatINR, initials } from "@/lib/format";

type Row = Omit<Customer, "createdAt"> & { bookingCount: number; createdAt: string };

export function CustomerManager({ customers }: { customers: Row[]; booked?: number }) {
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Row | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.city.toLowerCase().includes(q) ||
        c.type.toLowerCase().includes(q),
    );
  }, [customers, query]);

  async function onCreate(formData: FormData) {
    await createCustomer(formData);
  }

  async function onUpdate(formData: FormData) {
    await updateCustomer(formData);
    setEditing(null);
  }

  async function onDelete(formData: FormData) {
    await deleteCustomer(formData);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <form
        key={editing ? `edit-${editing.id}` : "create"}
        action={editing ? onUpdate : onCreate}
        className="rounded-3xl bg-white p-5 ring-1 ring-ink/8"
      >
        <p className="font-display text-2xl">{editing ? "Edit customer" : "New customer"}</p>
        {editing ? <input type="hidden" name="id" value={editing.id} /> : null}
        <div className="mt-4 grid gap-2">
          {[
            ["name", "Name", editing?.name ?? ""],
            ["email", "Email", editing?.email ?? ""],
            ["phone", "Phone", editing?.phone ?? ""],
            ["city", "City", editing?.city ?? ""],
          ].map(([name, label, value]) => (
            <label key={name} className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
              {label}
              <input
                name={name}
                defaultValue={value}
                required={name === "name" || name === "email" || name === "phone"}
                className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
              />
            </label>
          ))}
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Type
            <select
              name="type"
              defaultValue={editing?.type ?? "guest"}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="guest">Guest</option>
              <option value="buyer">Buyer</option>
              <option value="inquiry">Inquiry</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Status
            <select
              name="status"
              defaultValue={editing?.status ?? "lead"}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
            >
              <option value="lead">Lead</option>
              <option value="active">Active</option>
              <option value="booked">Booked</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </label>
          <label className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
            Notes
            <textarea
              name="notes"
              defaultValue={editing?.notes ?? ""}
              rows={3}
              className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm font-medium normal-case tracking-normal text-ink"
            />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button type="submit" className="rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white">
            {editing ? "Save changes" : "Add customer"}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-full bg-paper px-4 py-2 text-sm"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, city, type…"
          className="w-full rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-ink/10 outline-none"
        />
        <ul className="mt-4 space-y-2">
          {filtered.map((customer) => (
            <li key={customer.id} className="rounded-3xl bg-white p-4 ring-1 ring-ink/8">
              <div className="flex items-start gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-forest text-xs font-semibold text-sand">
                  {initials(customer.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{customer.name}</p>
                  <p className="text-xs text-ink-soft">
                    {customer.email} · {customer.phone}
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {customer.city || "—"} · {customer.type} · {customer.status} ·{" "}
                    {customer.bookingCount} bookings · {formatINR(customer.totalSpent)}
                  </p>
                  {customer.notes ? (
                    <p className="mt-2 text-sm leading-5 text-ink-soft">{customer.notes}</p>
                  ) : null}
                </div>
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setEditing(customer)}
                    className="rounded-full bg-paper px-3 py-1 text-xs"
                  >
                    Edit
                  </button>
                  <form action={onDelete}>
                    <input type="hidden" name="id" value={customer.id} />
                    <button type="submit" className="rounded-full px-3 py-1 text-xs text-clay">
                      Remove
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
