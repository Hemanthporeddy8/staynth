import type { ReactNode } from "react";
import { DashboardNav } from "@/components/DashboardNav";
import { ensureSeeded } from "@/db/seed";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  await ensureSeeded();
  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[230px_1fr] md:px-8">
      <DashboardNav />
      <div>{children}</div>
    </div>
  );
}
