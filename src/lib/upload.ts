import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]);

export async function saveUpload(file: File) {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Please upload a JPG, PNG, or WebP image.");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("Image must be under 12MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.type === "image/png" ? ".png" : file.type === "image/webp" ? ".webp" : ".jpg";
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return `/uploads/${name}`;
}

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
  return `${base || "listing"}-${Date.now().toString(36)}`;
}
