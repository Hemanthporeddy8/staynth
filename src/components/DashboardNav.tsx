"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Building2,
  CalendarCheck,
  LayoutDashboard,
  Plus,
  Users,
} from "lucide-react";

const links = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/properties", label: "My listings", icon: Building2 },
  { href: "/dashboard/properties/new", label: "List a property", icon: Plus },
  { href: "/dashboard/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/guide", label: "How uploads work", icon: BookOpen },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <aside className="rounded-3xl bg-forest p-4 text-sand md:sticky md:top-24 md:h-fit">
      <p className="px-3 pt-2 text-[10px] uppercase tracking-[0.2em] text-gold">Owner desk</p>
      <nav className="mt-4 flex flex-wrap gap-1 md:flex-col">
        {links.map((link) => {
          const active =
            link.href === "/dashboard"
              ? pathname === "/dashboard"
              : link.href === "/dashboard/properties"
                ? pathname === "/dashboard/properties" ||
                  (/^\/dashboard\/properties\/\d+/.test(pathname) &&
                    !pathname.startsWith("/dashboard/properties/new"))
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-1 items-center gap-2 rounded-2xl px-3 py-2.5 text-sm ${
                active ? "bg-sand text-forest" : "text-sand/80 hover:bg-white/8"
              }`}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
