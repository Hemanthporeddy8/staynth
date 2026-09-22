import Link from "next/link";
import { NewListingForm } from "@/components/NewListingForm";

export default function NewPropertyPage() {
  return (
    <main>
      <Link href="/dashboard/properties" className="text-sm text-ink-soft hover:text-ink">
        ← My listings
      </Link>
      <p className="mt-4 text-xs uppercase tracking-[0.2em] text-gold">Owner studio</p>
      <h1 className="mt-2 font-display text-4xl">List a property</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Start with the stay or plot details and a cover photo. Next you’ll upload 360° rooms, the
        blueprint, and drop eyes on the map.
      </p>
      <ol className="mt-6 grid gap-3 sm:grid-cols-3">
        {[
          ["1", "List", "Name, price, city — cover photo optional"],
          ["2", "360°", "Camera: 6 directions, full 360°"],
          ["3", "Eyes", "Upload or draw a blueprint, then drop eyes"],
        ].map(([step, title, body]) => (
          <li key={step} className="rounded-2xl bg-white p-4 ring-1 ring-ink/8">
            <p className="text-[10px] uppercase tracking-[0.16em] text-gold">Step {step}</p>
            <p className="font-display text-xl">{title}</p>
            <p className="text-sm text-ink-soft">{body}</p>
          </li>
        ))}
      </ol>
      <div className="mt-6">
        <NewListingForm />
      </div>
    </main>
  );
}
