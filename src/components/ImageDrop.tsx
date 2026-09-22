"use client";

import { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/client-image";

export function ImageDrop({
  label,
  hint,
  kind = "photo",
  preview,
  onUploaded,
}: {
  label: string;
  hint: string;
  kind?: "photo" | "pano" | "plan";
  preview?: string;
  onUploaded: (url: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onChange(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const url = await uploadImage(file, kind);
      onUploaded(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <label className="block cursor-pointer">
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        {label}
      </span>
      <span className="mt-1 flex min-h-36 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink/20 bg-paper">
        {preview ? (
          <img src={preview} alt="" className="h-40 w-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 px-4 py-6 text-center text-sm text-ink-soft">
            {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
            {busy ? "Uploading…" : hint}
          </span>
        )}
      </span>
      <input
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => onChange(event.target.files?.[0])}
      />
      {error ? <span className="mt-1 block text-xs text-terracotta">{error}</span> : null}
    </label>
  );
}
