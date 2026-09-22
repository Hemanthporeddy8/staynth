export async function compressImage(file: File, maxWidth: number) {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxWidth / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), "image/jpeg", 0.86),
    );
    bitmap.close();
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export async function uploadImage(file: File, kind: "photo" | "pano" | "plan" = "photo") {
  const maxWidth = kind === "pano" ? 4096 : kind === "plan" ? 2400 : 1800;
  const prepared = await compressImage(file, maxWidth);
  const body = new FormData();
  body.append("file", prepared);
  const response = await fetch("/api/upload", { method: "POST", body });
  const data = (await response.json()) as { url?: string; error?: string };
  if (!response.ok || !data.url) {
    throw new Error(data.error ?? "Upload failed.");
  }
  return data.url;
}

export type CubeFace = "front" | "right" | "back" | "left" | "top" | "bottom";

async function blobToPixels(blob: Blob) {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Could not read photo.");
  }
  ctx.drawImage(bitmap, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  bitmap.close();
  return { data: image.data, w: canvas.width, h: canvas.height };
}

export async function stitchCubeToPano(faces: Partial<Record<CubeFace, Blob>>) {
  if (!faces.front || !faces.right || !faces.back || !faces.left) {
    throw new Error("Front, Right, Back, and Left walls are required.");
  }

  const loaded: Record<CubeFace, { data: Uint8ClampedArray; w: number; h: number }> = {
    front: await blobToPixels(faces.front),
    right: await blobToPixels(faces.right),
    back: await blobToPixels(faces.back),
    left: await blobToPixels(faces.left),
    top: faces.top
      ? await blobToPixels(faces.top)
      : createFallbackFace(
          [faces.front, faces.right, faces.back, faces.left],
          "top"
        ),
    bottom: faces.bottom
      ? await blobToPixels(faces.bottom)
      : createFallbackFace(
          [faces.front, faces.right, faces.back, faces.left],
          "bottom"
        ),
  };

  const outW = 2048;
  const outH = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not stitch 360°.");
  const out = ctx.createImageData(outW, outH);
  const dst = out.data;

  for (let y = 0; y < outH; y++) {
    const phi = Math.PI / 2 - (y / (outH - 1)) * Math.PI;
    const cosPhi = Math.cos(phi);
    const sinPhi = Math.sin(phi);
    for (let x = 0; x < outW; x++) {
      const theta = (x / (outW - 1)) * Math.PI * 2 - Math.PI;
      const dx = cosPhi * Math.sin(theta);
      const dy = sinPhi;
      const dz = cosPhi * Math.cos(theta);
      const ax = Math.abs(dx);
      const ay = Math.abs(dy);
      const az = Math.abs(dz);

      let face: CubeFace;
      let u = 0;
      let v = 0;
      if (ax >= ay && ax >= az) {
        if (dx > 0) {
          face = "right";
          u = (-dz / ax + 1) / 2;
          v = (-dy / ax + 1) / 2;
        } else {
          face = "left";
          u = (dz / ax + 1) / 2;
          v = (-dy / ax + 1) / 2;
        }
      } else if (ay >= ax && ay >= az) {
        if (dy > 0) {
          face = "top";
          u = (dx / ay + 1) / 2;
          v = (dz / ay + 1) / 2;
        } else {
          face = "bottom";
          u = (dx / ay + 1) / 2;
          v = (-dz / ay + 1) / 2;
        }
      } else if (dz > 0) {
        face = "front";
        u = (dx / az + 1) / 2;
        v = (-dy / az + 1) / 2;
      } else {
        face = "back";
        u = (-dx / az + 1) / 2;
        v = (-dy / az + 1) / 2;
      }

      const img = loaded[face];
      const sx = Math.min(img.w - 1, Math.max(0, (u * img.w) | 0));
      const sy = Math.min(img.h - 1, Math.max(0, (v * img.h) | 0));
      const si = (sy * img.w + sx) * 4;
      const di = (y * outW + x) * 4;
      dst[di] = img.data[si];
      dst[di + 1] = img.data[si + 1];
      dst[di + 2] = img.data[si + 2];
      dst[di + 3] = 255;
    }
  }

  ctx.putImageData(out, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((value) => resolve(value), "image/jpeg", 0.88)
  );
  if (!blob) throw new Error("Could not stitch 360°.");
  return new File([blob], `room-360-${Date.now()}.jpg`, { type: "image/jpeg" });
}

function createFallbackFace(
  _wallBlobs: (Blob | undefined)[],
  type: "top" | "bottom"
): { data: Uint8ClampedArray; w: number; h: number } {
  const w = 512;
  const h = 512;
  const data = new Uint8ClampedArray(w * h * 4);
  // Soft ceiling (warm off-white) or clean floor (warm stone neutral)
  const [r, g, b] = type === "top" ? [242, 240, 235] : [65, 60, 56];
  for (let i = 0; i < data.length; i += 4) {
    const yRatio = ((i / 4 / w) | 0) / h;
    const vignette = type === "top" ? 1 - yRatio * 0.08 : 0.9 + yRatio * 0.1;
    data[i] = Math.round(r * vignette);
    data[i + 1] = Math.round(g * vignette);
    data[i + 2] = Math.round(b * vignette);
    data[i + 3] = 255;
  }
  return { data, w, h };
}

export async function convertSinglePanoTo360(file: File | Blob): Promise<File> {
  const bitmap = await createImageBitmap(file);
  const targetW = 2048;
  const targetH = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not process single photo pano.");

  // If already close to 2:1 ratio (e.g. 1.8 to 2.2), draw direct
  const ratio = bitmap.width / bitmap.height;
  if (ratio >= 1.7 && ratio <= 2.3) {
    ctx.drawImage(bitmap, 0, 0, targetW, targetH);
  } else {
    // Fill background with soft neutral ceiling / floor gradient
    const grad = ctx.createLinearGradient(0, 0, 0, targetH);
    grad.addColorStop(0, "#f0ede6");
    grad.addColorStop(0.3, "#e2ded6");
    grad.addColorStop(0.7, "#423d38");
    grad.addColorStop(1, "#282522");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, targetW, targetH);

    // Fit image horizontally in the central eye-level band
    const drawH = Math.min(targetH, Math.round(targetW / ratio));
    const drawY = Math.round((targetH - drawH) / 2);
    ctx.drawImage(bitmap, 0, drawY, targetW, drawH);
  }
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9)
  );
  if (!blob) throw new Error("Could not convert panorama.");
  return new File([blob], `single-pano-${Date.now()}.jpg`, { type: "image/jpeg" });
}
