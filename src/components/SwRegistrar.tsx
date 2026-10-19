"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/cache";

/** Registers the service worker once, client-side. Drop this anywhere in the layout. */
export function SwRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);
  return null;
}
