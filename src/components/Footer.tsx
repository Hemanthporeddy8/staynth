import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/10 bg-forest text-sand">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-4 md:px-8">
        <div className="md:col-span-2">
          <p className="font-display text-3xl">Aerio</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-sand/75">
            Book a night or buy a plot after you have stood in the room. Hosts upload a plan,
            drop View pins, and open a 360° interior — like street view, for stays.
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Discover</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-sand/80">
            <Link href="/listings">All stays</Link>
            <Link href="/listings?type=hostel">Hostels</Link>
            <Link href="/listings?type=homestay">Homestays</Link>
            <Link href="/listings?type=villa">Villas</Link>
            <Link href="/listings?listingType=sale">Plots for sale</Link>
            <Link href="/dashboard">Owner desk</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-gold">Cities</p>
          <div className="mt-4 flex flex-col gap-2 text-sm text-sand/80">
            <Link href="/listings?city=Mumbai">Mumbai</Link>
            <Link href="/listings?city=Goa">Goa</Link>
            <Link href="/listings?city=Bangalore">Bangalore</Link>
            <Link href="/listings?city=Jaisalmer">Jaisalmer</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-sand/10 px-5 py-5 text-center text-xs text-sand/50">
        Aerio · every stay, every angle · demo marketplace
      </div>
    </footer>
  );
}
