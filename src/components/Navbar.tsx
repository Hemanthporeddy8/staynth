import Link from "next/link";
import { Compass } from "lucide-react";

export function Navbar() {
  return (
    <header className="nav-blur sticky top-0 z-40 border-b border-ink/8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-forest text-sand">
            <Compass className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <span className="font-display text-2xl tracking-tight text-ink">Aerio</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-ink-soft md:flex">
          <Link href="/listings" className="hover:text-ink">
            Stays
          </Link>
          <Link href="/listings?listingType=sale" className="hover:text-ink">
            Buy
          </Link>
          <Link href="/listings?tour=1" className="hover:text-ink">
            360° tours
          </Link>
          <Link href="/dashboard" className="hover:text-ink">
            Owner desk
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            href="/listings"
            className="hidden rounded-full px-4 py-2 text-sm font-medium text-ink-soft hover:text-ink sm:block"
          >
            Explore
          </Link>
          <Link
            href="/dashboard"
            className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-forest"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
