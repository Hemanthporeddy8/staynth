import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true });
  } catch (error: any) {
    const detail = {
      message: error?.message,
      causeMessage: error?.cause?.message,
      causeCode: error?.cause?.code,
      causeDetail: error?.cause?.detail,
      errno: error?.cause?.errno,
      syscall: error?.cause?.syscall,
      hostname: error?.cause?.hostname,
      address: error?.cause?.address,
      port: error?.cause?.port,
    };
    return Response.json({ ok: false, error: detail }, { status: 500 });
  }
}
