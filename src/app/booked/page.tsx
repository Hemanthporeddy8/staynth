import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default async function BookedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; title?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-2xl place-items-center px-5 py-16">
      <section className="w-full rounded-[2rem] bg-white p-10 text-center ring-1 ring-ink/8">
        <CheckCircle2 className="mx-auto h-12 w-12 text-forest" />
        <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">Confirmed</p>
        <h1 className="mt-2 font-display text-4xl">You’re on the list</h1>
        <p className="mt-3 text-ink-soft">
          {params.title
            ? `We logged your request for ${params.title}.`
            : "Your request is with the host."}{" "}
          Open the dashboard to manage it like a customer record.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/bookings" className="rounded-full bg-ink px-5 py-2.5 text-sm text-paper">
            View on dashboard
          </Link>
          <Link href="/listings" className="rounded-full bg-paper px-5 py-2.5 text-sm ring-1 ring-ink/10">
            Keep browsing
          </Link>
        </div>
      </section>
    </main>
  );
}
