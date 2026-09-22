"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Loader2, RotateCcw, SwitchCamera } from "lucide-react";
import { stitchCubeToPano, uploadImage, type CubeFace } from "@/lib/client-image";

const FACES: { id: CubeFace; label: string; hint: string }[] = [
  { id: "front", label: "Front", hint: "Stand still. Point at the far wall." },
  { id: "right", label: "Right", hint: "Turn 90° right. Don’t walk." },
  { id: "back", label: "Back", hint: "Turn around. Opposite the first wall." },
  { id: "left", label: "Left", hint: "Turn 90° again. Last wall." },
  { id: "top", label: "Ceiling", hint: "Point the camera straight up." },
  { id: "bottom", label: "Floor", hint: "Point the camera straight down." },
];

export function PanoCamera({
  preview,
  onUploaded,
}: {
  preview?: string;
  onUploaded: (url: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [current, setCurrent] = useState(0);
  const [shots, setShots] = useState<Partial<Record<CubeFace, string>>>({});
  const blobsRef = useRef<Partial<Record<CubeFace, Blob>>>({});

  const taken = FACES.filter((face) => shots[face.id]).length;
  const active = FACES[current];

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }

  async function startCamera(nextFacing: "environment" | "user" = facing) {
    setError("");
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser has no camera API. Use a ready 360 file, or open on a phone.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }
      setFacing(nextFacing);
      setLive(true);
    } catch {
      setError("Allow the camera to capture every direction.");
      setLive(false);
    }
  }

  useEffect(() => () => stopCamera(), []);

  async function finishPano() {
    const blobs = blobsRef.current;
    if (FACES.some((face) => !blobs[face.id])) {
      setError("Capture all 6 directions first.");
      return;
    }
    setBusy(true);
    setStatus("Stitching a full 360°…");
    setError("");
    try {
      const pano = await stitchCubeToPano(blobs as Record<CubeFace, Blob>);
      const url = await uploadImage(pano, "pano");
      onUploaded(url);
      stopCamera();
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not build 360°.");
    } finally {
      setBusy(false);
    }
  }

  async function snap() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !live) {
      setError("Open the camera first.");
      return;
    }
    const vw = video.videoWidth || 1080;
    const vh = video.videoHeight || 1080;
    const size = Math.min(vw, vh);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, (vw - size) / 2, (vh - size) / 2, size, size, 0, 0, size, size);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9),
    );
    if (!blob) return;

    const face = active.id;
    blobsRef.current[face] = blob;
    const previewUrl = URL.createObjectURL(blob);
    setShots((currentShots) => {
      const previous = currentShots[face];
      if (previous) URL.revokeObjectURL(previous);
      return { ...currentShots, [face]: previewUrl };
    });

    const nextEmpty = FACES.findIndex((item, index) => index > current && !blobsRef.current[item.id]);
    const firstEmpty = FACES.findIndex((item) => !blobsRef.current[item.id]);
    if (nextEmpty >= 0) setCurrent(nextEmpty);
    else if (firstEmpty >= 0) setCurrent(firstEmpty);
    else await finishPano();
  }

  async function uploadReadyPano(file: File) {
    setBusy(true);
    setError("");
    try {
      const url = await uploadImage(file, "pano");
      onUploaded(url);
      stopCamera();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
        360° camera — all 6 directions
      </p>
      <div className="relative mt-1 overflow-hidden rounded-2xl bg-ink">
        <video
          ref={videoRef}
          className={`h-64 w-full object-cover ${live ? "block" : "hidden"}`}
          playsInline
          muted
          autoPlay
        />
        {!live && preview ? (
          <img src={preview} alt="Stitched 360" className="h-64 w-full object-cover" />
        ) : null}
        {!live && !preview ? (
          <button
            type="button"
            onClick={() => startCamera()}
            className="flex h-64 w-full flex-col items-center justify-center gap-3 text-sand"
          >
            <span className="grid h-16 w-16 place-items-center rounded-full bg-terracotta shadow-[0_0_0_8px_rgba(194,77,29,0.25)]">
              <Camera className="h-7 w-7" />
            </span>
            <span className="text-sm font-medium">Open camera for a full 360°</span>
            <span className="px-6 text-center text-xs text-sand/60">
              Six shots: front, right, back, left, ceiling, floor. We stitch them into one look-around.
            </span>
          </button>
        ) : null}

        {live ? (
          <>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="h-40 w-40 rounded-full border border-white/35" />
            </div>
            <div className="absolute left-3 right-3 top-3 rounded-2xl bg-ink/70 px-3 py-2 text-paper backdrop-blur-sm">
              <p className="text-[10px] uppercase tracking-[0.16em] text-gold">
                {taken} / 6 · {active.label}
              </p>
              <p className="text-sm">{active.hint}</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-ink/85 to-transparent px-4 py-3">
              <button
                type="button"
                onClick={() => startCamera(facing === "environment" ? "user" : "environment")}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-paper"
                aria-label="Flip camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={snap}
                disabled={busy}
                className="grid h-16 w-16 place-items-center rounded-full bg-white ring-4 ring-terracotta disabled:opacity-50"
                aria-label="Capture this direction"
              >
                {busy ? (
                  <Loader2 className="h-6 w-6 animate-spin text-ink" />
                ) : (
                  <span className="h-12 w-12 rounded-full bg-terracotta" />
                )}
              </button>
              <button
                type="button"
                onClick={stopCamera}
                className="grid h-10 w-10 place-items-center rounded-full bg-white/15 text-paper"
                aria-label="Close camera"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : null}
      </div>
      <canvas ref={canvasRef} className="hidden" />

      <div className="mt-3 grid grid-cols-6 gap-1.5">
        {FACES.map((face, index) => (
          <button
            key={face.id}
            type="button"
            onClick={() => {
              setCurrent(index);
              if (!live) void startCamera();
            }}
            className={`overflow-hidden rounded-xl ring-2 ${
              current === index ? "ring-terracotta" : "ring-transparent"
            }`}
          >
            {shots[face.id] ? (
              <img src={shots[face.id]} alt={face.label} className="h-12 w-full object-cover" />
            ) : (
              <span className="flex h-12 items-center justify-center bg-paper text-[9px] uppercase tracking-wider text-ink-soft">
                {face.label}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => startCamera()}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper"
        >
          <Camera className="h-4 w-4" />
          {preview ? "Reshoot 360°" : "Open camera"}
        </button>
        {taken === 6 ? (
          <button
            type="button"
            onClick={() => void finishPano()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Stitch 360°
          </button>
        ) : null}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm ring-1 ring-ink/10"
        >
          <ImagePlus className="h-4 w-4" />
          Ready-made 360 file
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void uploadReadyPano(file);
          event.target.value = "";
        }}
      />
      {status ? (
        <p className="mt-2 flex items-center gap-2 text-xs text-ink-soft">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> {status}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-terracotta">{error}</p> : null}
      {preview && !live ? (
        <p className="mt-2 text-xs text-forest">Full 360° ready — name the room and save.</p>
      ) : (
        <p className="mt-2 text-xs text-ink-soft">
          Tap a direction tile to recapture it. After all six, we stitch front/right/back/left/up/down
          into one look-around.
        </p>
      )}
    </div>
  );
}
