import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-5 py-20 text-center">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">404</p>
        <h1 className="mt-2 font-display text-5xl">This room is empty</h1>
        <p className="mt-3 text-ink-soft">The listing or page you wanted isn’t on the plan.</p>
        <Link href="/" className="mt-6 inline-flex rounded-full bg-ink px-5 py-2.5 text-sm text-paper">
          Back to Aerio
        </Link>
      </div>
    </main>
  );
}
