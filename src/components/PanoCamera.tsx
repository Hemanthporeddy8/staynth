"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Expand,
  ImagePlus,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  SwitchCamera,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  convertSinglePanoTo360,
  stitchCubeToPano,
  uploadImage,
  type CubeFace,
} from "@/lib/client-image";

type CameraMode = "4sides" | "6cube" | "single";

interface FaceDef {
  id: CubeFace;
  label: string;
  hint: string;
  optional?: boolean;
}

const FACES_4_SIDES: FaceDef[] = [
  { id: "front", label: "Front", hint: "Wall 1: Stand in center. Point at first wall." },
  { id: "right", label: "Right", hint: "Wall 2: Turn 90° right. Don't walk." },
  { id: "back", label: "Back", hint: "Wall 3: Turn 90° right again. Opposite wall." },
  { id: "left", label: "Left", hint: "Wall 4: Turn 90° right. Last wall." },
  { id: "top", label: "Ceiling", hint: "Optional: Point straight up at ceiling.", optional: true },
  { id: "bottom", label: "Floor", hint: "Optional: Point straight down at floor.", optional: true },
];

const FACES_6_CUBE: FaceDef[] = [
  { id: "front", label: "Front", hint: "Stand still. Point at the far wall." },
  { id: "right", label: "Right", hint: "Turn 90° right. Don't walk." },
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
  const singleFileRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<CameraMode>("4sides");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [zoom, setZoom] = useState(1);
  const [hasHardwareZoom, setHasHardwareZoom] = useState(false);

  const [current, setCurrent] = useState(0);
  const [shots, setShots] = useState<Partial<Record<CubeFace, string>>>({});
  const blobsRef = useRef<Partial<Record<CubeFace, Blob>>>({});

  const faceList = mode === "6cube" ? FACES_6_CUBE : FACES_4_SIDES;
  const activeFace = faceList[current] || faceList[0];

  const requiredFaces = faceList.filter((f) => !f.optional);
  const requiredTaken = requiredFaces.filter((f) => shots[f.id]).length;
  const canStitch = requiredTaken === requiredFaces.length;

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
  }

  async function applyHardwareZoom(value: number) {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities ? (track.getCapabilities() as any) : null;
      if (caps?.zoom) {
        setHasHardwareZoom(true);
        const minZ = caps.zoom.min || 1;
        const maxZ = caps.zoom.max || 3;
        const targetZ = Math.min(maxZ, Math.max(minZ, value));
        await track.applyConstraints({ advanced: [{ zoom: targetZ } as any] });
      }
    } catch {}
  }

  async function startCamera(nextFacing: "environment" | "user" = facing) {
    setError("");
    stopCamera();
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser has no camera API. Open on a smartphone or upload a ready 360 photo.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 2560 },
          height: { ideal: 1440 },
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
      void applyHardwareZoom(zoom);
    } catch {
      setError("Please allow camera permissions to capture your rooms.");
      setLive(false);
    }
  }

  useEffect(() => () => stopCamera(), []);

  function handleZoomChange(nextZoom: number) {
    const clamped = Math.min(2.5, Math.max(0.5, Number(nextZoom.toFixed(1))));
    setZoom(clamped);
    void applyHardwareZoom(clamped);
  }

  async function finishPano() {
    const blobs = blobsRef.current;
    if (!blobs.front || !blobs.right || !blobs.back || !blobs.left) {
      setError("Capture all 4 walls (Front, Right, Back, Left) first.");
      return;
    }
    setBusy(true);
    setStatus("Stitching panoramic 360° tour…");
    setError("");
    try {
      const pano = await stitchCubeToPano(blobs);
      const url = await uploadImage(pano, "pano");
      onUploaded(url);
      stopCamera();
      setIsFullScreen(false);
      setStatus("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stitch 360°.");
    } finally {
      setBusy(false);
    }
  }

  async function snap() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !live) {
      setError("Open camera first.");
      return;
    }

    const vw = video.videoWidth || 1920;
    const vh = video.videoHeight || 1080;

    // In Single Photo mode, capture full frame directly
    if (mode === "single") {
      setBusy(true);
      setStatus("Converting photo to 360°…");
      try {
        canvas.width = vw;
        canvas.height = vh;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, vw, vh);
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
        );
        if (!blob) throw new Error("Could not capture photo.");
        const converted = await convertSinglePanoTo360(blob);
        const url = await uploadImage(converted, "pano");
        onUploaded(url);
        stopCamera();
        setIsFullScreen(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Single pano failed.");
      } finally {
        setBusy(false);
        setStatus("");
      }
      return;
    }

    // When zoom is < 1 (wide angle / zoom out), preserve entire sensor view width!
    // Rather than harsh square center-cropping, sample according to zoom scale
    const targetSize = 1024;
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Source crop coordinates influenced by digital zoom
    const zoomFactor = Math.max(0.5, zoom);
    const cropW = Math.min(vw, Math.round((Math.min(vw, vh) / zoomFactor)));
    const cropH = Math.min(vh, Math.round((Math.min(vw, vh) / zoomFactor)));
    const sx = Math.max(0, Math.round((vw - cropW) / 2));
    const sy = Math.max(0, Math.round((vh - cropH) / 2));

    ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, targetSize, targetSize);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((value) => resolve(value), "image/jpeg", 0.9)
    );
    if (!blob) return;

    const face = activeFace.id;
    blobsRef.current[face] = blob;
    const previewUrl = URL.createObjectURL(blob);
    setShots((prev) => {
      const old = prev[face];
      if (old) URL.revokeObjectURL(old);
      return { ...prev, [face]: previewUrl };
    });

    // Advance to next uncaptured wall
    const nextUnfilled = faceList.findIndex(
      (f, idx) => idx > current && !blobsRef.current[f.id] && !f.optional
    );
    const anyUnfilled = faceList.findIndex((f) => !blobsRef.current[f.id] && !f.optional);

    if (nextUnfilled >= 0) {
      setCurrent(nextUnfilled);
    } else if (anyUnfilled >= 0) {
      setCurrent(anyUnfilled);
    } else if (mode === "4sides") {
      // All 4 required walls captured!
      setStatus("All 4 walls captured! You can stitch now, or snap ceiling/floor.");
    } else if (mode === "6cube") {
      const nextAny = faceList.findIndex((f) => !blobsRef.current[f.id]);
      if (nextAny >= 0) setCurrent(nextAny);
      else await finishPano();
    }
  }

  async function uploadReadyPano(file: File) {
    setBusy(true);
    setStatus("Uploading 360° panorama…");
    setError("");
    try {
      const prepared =
        mode === "single" ? await convertSinglePanoTo360(file) : file;
      const url = await uploadImage(prepared, "pano");
      onUploaded(url);
      stopCamera();
      setIsFullScreen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  function resetCapture() {
    setShots({});
    blobsRef.current = {};
    setCurrent(0);
    setError("");
    setStatus("");
  }

  const cameraControls = (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3">
      {/* Zoom controls */}
      <div className="flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 backdrop-blur-md">
        <button
          type="button"
          onClick={() => handleZoomChange(zoom - 0.2)}
          className="text-white/80 hover:text-white"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <div className="flex gap-1 text-[11px] font-semibold text-white">
          {[0.5, 1, 1.5, 2].map((z) => (
            <button
              key={z}
              type="button"
              onClick={() => handleZoomChange(z)}
              className={`rounded-full px-2 py-0.5 transition ${
                zoom === z ? "bg-terracotta text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
            >
              {z === 0.5 ? "0.5x Wide" : `${z}x`}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => handleZoomChange(zoom + 0.2)}
          className="text-white/80 hover:text-white"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
      </div>

      {/* Full screen toggle */}
      <button
        type="button"
        onClick={() => setIsFullScreen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md hover:bg-black/80"
      >
        {isFullScreen ? (
          <>
            <Minimize2 className="h-3.5 w-3.5" /> Normal view
          </>
        ) : (
          <>
            <Maximize2 className="h-3.5 w-3.5" /> Full screen camera
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          360° Capture mode
        </span>
        <div className="flex gap-1 rounded-full bg-paper-2 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("4sides");
              resetCapture();
            }}
            className={`rounded-full px-3 py-1 font-medium transition ${
              mode === "4sides" ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            4 Sides (Quick)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("6cube");
              resetCapture();
            }}
            className={`rounded-full px-3 py-1 font-medium transition ${
              mode === "6cube" ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            All 6 Directions
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("single");
              resetCapture();
            }}
            className={`rounded-full px-3 py-1 font-medium transition ${
              mode === "single" ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            Single Photo Pano
          </button>
        </div>
      </div>

      {/* Main Viewfinder / Camera Container */}
      <div
        className={
          isFullScreen
            ? "fixed inset-0 z-50 flex flex-col bg-black text-white"
            : "relative overflow-hidden rounded-2xl bg-ink shadow-inner"
        }
      >
        {/* Fullscreen Header */}
        {isFullScreen ? (
          <div className="flex items-center justify-between border-b border-white/10 bg-black/80 px-4 py-3 backdrop-blur-md">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-gold">
                {mode === "4sides"
                  ? `4-Wall Pano (${requiredTaken}/4 walls)`
                  : mode === "6cube"
                  ? `6-Cube 360° (${requiredTaken}/6)`
                  : "Single Panorama Snap"}
              </p>
              <p className="text-sm font-semibold">{activeFace.hint}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsFullScreen(false)}
                className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
                title="Exit full screen"
              >
                <Minimize2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        ) : null}

        {/* Video feed */}
        <div className={`relative flex-1 ${isFullScreen ? "h-full" : "h-72"} overflow-hidden bg-black`}>
          <video
            ref={videoRef}
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "center center",
              transition: "transform 0.15s ease-out",
            }}
            className={`h-full w-full object-cover ${live ? "block" : "hidden"}`}
            playsInline
            muted
            autoPlay
          />

          {!live && preview ? (
            <img src={preview} alt="Room 360 preview" className="h-full w-full object-cover" />
          ) : null}

          {!live && !preview ? (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-sand"
            >
              <span className="grid h-16 w-16 place-items-center rounded-full bg-terracotta shadow-[0_0_0_8px_rgba(194,77,29,0.25)]">
                <Camera className="h-7 w-7 text-white" />
              </span>
              <span className="text-base font-semibold text-paper">Open camera</span>
              <span className="max-w-md text-center text-xs text-sand/70">
                {mode === "4sides"
                  ? "Stand in center and take 4 walls (Front, Right, Back, Left). Ceiling and floor are auto-filled!"
                  : mode === "6cube"
                  ? "Capture all 6 directions: 4 walls, ceiling, and floor."
                  : "Capture a single panoramic photo or upload a wide photo."}
              </span>
            </button>
          ) : null}

          {/* Active direction guidance banner overlay */}
          {live ? (
            <>
              {/* Orientation reticle */}
              <div className="pointer-events-none absolute inset-0 grid place-items-center">
                <div className="h-44 w-44 rounded-full border border-dashed border-white/40" />
                <div className="absolute h-0.5 w-12 bg-white/50" />
                <div className="absolute h-12 w-0.5 bg-white/50" />
              </div>

              {!isFullScreen ? (
                <div className="absolute left-3 right-3 top-3 flex items-center justify-between rounded-xl bg-ink/70 px-3 py-2 text-paper backdrop-blur-sm">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-gold">
                      {mode === "single"
                        ? "Single Take"
                        : `${activeFace.label} ${activeFace.optional ? "(Optional)" : ""}`}
                    </p>
                    <p className="text-xs">{activeFace.hint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsFullScreen(true)}
                    className="rounded-lg bg-white/10 p-1.5 text-white/80 hover:bg-white/20 hover:text-white"
                    title="Dedicated full screen camera"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </button>
                </div>
              ) : null}

              {/* Floating Camera Controls (Zoom, flip) */}
              <div className="absolute top-16 right-3 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void startCamera(facing === "environment" ? "user" : "environment")}
                  className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md hover:bg-black/80"
                  title="Flip camera"
                >
                  <SwitchCamera className="h-4 w-4" />
                </button>
              </div>

              {/* Shutter bar */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
                {cameraControls}

                <div className="mt-2 flex items-center justify-center gap-6">
                  <button
                    type="button"
                    onClick={() => {
                      const prevIdx = (current - 1 + faceList.length) % faceList.length;
                      setCurrent(prevIdx);
                    }}
                    className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
                    title="Previous direction"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void snap()}
                    disabled={busy}
                    className="group relative grid h-20 w-20 place-items-center rounded-full bg-white ring-4 ring-terracotta transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
                    aria-label="Capture photo"
                  >
                    {busy ? (
                      <Loader2 className="h-8 w-8 animate-spin text-ink" />
                    ) : (
                      <span className="h-16 w-16 rounded-full bg-terracotta group-hover:bg-terracotta-dark transition" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const nextIdx = (current + 1) % faceList.length;
                      setCurrent(nextIdx);
                    }}
                    className="rounded-full bg-white/10 p-2 text-white/80 hover:bg-white/20"
                    title="Next direction"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>

        {/* Fullscreen bottom tile preview bar */}
        {isFullScreen && mode !== "single" ? (
          <div className="border-t border-white/10 bg-black/80 p-3">
            <div className="mx-auto flex max-w-xl items-center justify-center gap-2">
              {faceList.map((face, index) => (
                <button
                  key={face.id}
                  type="button"
                  onClick={() => setCurrent(index)}
                  className={`relative flex h-14 w-20 flex-col items-center justify-center overflow-hidden rounded-xl border-2 transition ${
                    current === index
                      ? "border-terracotta ring-2 ring-terracotta/40"
                      : "border-white/20"
                  }`}
                >
                  {shots[face.id] ? (
                    <img src={shots[face.id]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-semibold uppercase text-white/70">
                      {face.label}
                    </span>
                  )}
                  {shots[face.id] ? (
                    <span className="absolute bottom-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-forest text-[9px] text-white">
                      ✓
                    </span>
                  ) : null}
                </button>
              ))}
              {canStitch ? (
                <button
                  type="button"
                  onClick={() => void finishPano()}
                  disabled={busy}
                  className="rounded-xl bg-terracotta px-4 py-3 text-xs font-bold text-white shadow-lg hover:bg-terracotta-dark"
                >
                  Stitch 360°
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* Normal mode tiles (below viewfinder) */}
      {!isFullScreen && mode !== "single" ? (
        <div className="grid grid-cols-6 gap-2">
          {faceList.map((face, index) => (
            <button
              key={face.id}
              type="button"
              onClick={() => {
                setCurrent(index);
                if (!live) void startCamera();
              }}
              className={`group relative overflow-hidden rounded-xl border-2 transition ${
                current === index
                  ? "border-terracotta ring-2 ring-terracotta/30"
                  : "border-ink/10 hover:border-ink/30"
              }`}
            >
              {shots[face.id] ? (
                <img src={shots[face.id]} alt="" className="h-14 w-full object-cover" />
              ) : (
                <div className="flex h-14 flex-col items-center justify-center bg-paper p-1 text-center">
                  <span className="text-[10px] font-bold uppercase text-ink">
                    {face.label}
                  </span>
                  {face.optional ? (
                    <span className="text-[8px] text-ink-soft">Opt</span>
                  ) : null}
                </div>
              )}
              {shots[face.id] ? (
                <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-forest text-[9px] text-white">
                  ✓
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => void (live ? stopCamera() : startCamera())}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-soft transition cursor-pointer"
        >
          <Camera className="h-4 w-4" />
          {live ? "Stop camera" : preview ? "Reshoot 360°" : "Open camera"}
        </button>

        {canStitch && mode !== "single" ? (
          <button
            type="button"
            onClick={() => void finishPano()}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2 text-sm font-bold text-white shadow-md hover:bg-terracotta-dark transition cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            Stitch & Build 360°
          </button>
        ) : null}

        {mode === "single" ? (
          <button
            type="button"
            onClick={() => singleFileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-terracotta px-4 py-2 text-sm font-semibold text-white shadow-md hover:bg-terracotta-dark transition cursor-pointer"
          >
            <ImagePlus className="h-4 w-4" />
            Upload single panorama
          </button>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 hover:bg-paper-2 transition cursor-pointer"
          >
            <ImagePlus className="h-4 w-4" />
            Ready-made 360 file
          </button>
        )}

        {Object.keys(shots).length > 0 ? (
          <button
            type="button"
            onClick={resetCapture}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs text-ink-soft hover:text-ink cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Clear shots
          </button>
        ) : null}
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

      <input
        ref={singleFileRef}
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
        <div className="flex items-center gap-2 rounded-xl bg-forest/10 p-3 text-xs font-medium text-forest">
          <Loader2 className="h-4 w-4 animate-spin" /> {status}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl bg-terracotta/10 p-3 text-xs text-terracotta ring-1 ring-terracotta/20">
          {error}
        </div>
      ) : null}

      {preview && !live ? (
        <p className="text-xs font-semibold text-forest">
          ✓ Full 360° ready! Name this room above and click "Save room".
        </p>
      ) : (
        <p className="text-xs text-ink-soft">
          {mode === "4sides"
            ? "Turn 90° for each wall (Front, Right, Back, Left). Ceiling and floor are automatically synthesized, or you can add them optionally!"
            : mode === "6cube"
            ? "Capture all 6 directions to stitch a spherical cube map."
            : "Snap or upload a wide angle or panoramic shot to create an instant 360° tour."}
        </p>
      )}
    </div>
  );
}
