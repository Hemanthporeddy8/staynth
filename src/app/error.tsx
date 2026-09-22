"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <main className="mx-auto grid min-h-[60vh] max-w-xl place-items-center px-5 py-20 text-center">
      <div className="rounded-3xl bg-white p-8 ring-1 ring-ink/10 shadow-sm">
        <AlertTriangle className="mx-auto h-12 w-12 text-terracotta" />
        <p className="mt-3 text-xs font-semibold uppercase tracking-[0.2em] text-terracotta">Notice</p>
        <h1 className="mt-2 font-display text-3xl">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-soft">
          {error?.message || "A server or connection issue occurred."}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper cursor-pointer hover:bg-ink-soft transition"
          >
            <RotateCcw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-sand px-5 py-2.5 text-sm font-medium text-forest cursor-pointer hover:bg-sand/80 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
