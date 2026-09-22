"use client";

import { updateBookingStatus } from "@/lib/actions";

export function BookingStatusForm({ id, status }: { id: number; status: string }) {
  async function onChange(formData: FormData) {
    await updateBookingStatus(formData);
  }

  return (
    <form action={onChange}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={status}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="rounded-full bg-paper px-2 py-1 text-xs capitalize outline-none"
      >
        <option value="pending">pending</option>
        <option value="confirmed">confirmed</option>
        <option value="completed">completed</option>
        <option value="cancelled">cancelled</option>
      </select>
    </form>
  );
}
