"use client";

import { useEffect, useRef, useState } from "react";
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles,
  SwitchCamera,
  Video,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  convertSinglePanoTo360,
  stitchCubeToPano,
  uploadImage,
  type CubeFace,
} from "@/lib/client-image";

type CameraMode = "4sides" | "sweep" | "6cube" | "single";

interface FaceDef {
  id: CubeFace;
  label: string;
  hint: string;
  optional?: boolean;
}

const FACES_4_SIDES: FaceDef[] = [
  { id: "front", label: "Front Wall", hint: "Stand in the center. Face the first wall." },
  { id: "right", label: "Right Wall", hint: "Turn 90° to your right. Capture wall 2." },
  { id: "back", label: "Back Wall", hint: "Turn 90° right again. Opposite wall 3." },
  { id: "left", label: "Left Wall", hint: "Turn 90° right. Last wall 4." },
  { id: "top", label: "Ceiling", hint: "Optional: Point straight up at ceiling.", optional: true },
  { id: "bottom", label: "Floor", hint: "Optional: Point straight down at floor.", optional: true },
];

const FACES_6_CUBE: FaceDef[] = [
  { id: "front", label: "Front Wall", hint: "Stand still. Point at the front wall." },
  { id: "right", label: "Right Wall", hint: "Turn 90° right. Don't walk." },
  { id: "back", label: "Back Wall", hint: "Turn around. Opposite the first wall." },
  { id: "left", label: "Left Wall", hint: "Turn 90° again. Last wall." },
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
  const sweepCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nativePanoRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const [mode, setMode] = useState<CameraMode>("4sides");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [zoom, setZoom] = useState(1);
  const [isShutterFlashing, setIsShutterFlashing] = useState(false);

  // Sweep Pano state
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepProgress, setSweepProgress] = useState(0);

  // Cube / 4-wall state
  const [current, setCurrent] = useState(0);
  const [shots, setShots] = useState<Partial<Record<CubeFace, string>>>({});
  const blobsRef = useRef<Partial<Record<CubeFace, Blob>>>({});

  const faceList = mode === "6cube" ? FACES_6_CUBE : FACES_4_SIDES;
  const activeFace = faceList[current] || faceList[0];

  const requiredFaces = faceList.filter((f) => !f.optional);
  const requiredTaken = requiredFaces.filter((f) => shots[f.id]).length;
  const canStitch = requiredTaken === requiredFaces.length;

  function stopCamera() {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setLive(false);
    setIsSweeping(false);
  }

  async function applyHardwareZoom(value: number) {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const caps = track.getCapabilities ? (track.getCapabilities() as any) : null;
      if (caps?.zoom) {
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
      setError("Camera not available in this browser. Please use your phone or upload a ready 360 photo.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: nextFacing },
          width: { ideal: 3840, min: 1280 },
          height: { ideal: 2160, min: 720 },
          frameRate: { ideal: 30 },
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
      setError("Please allow camera permission so you can capture 360° views.");
      setLive(false);
    }
  }

  useEffect(() => () => stopCamera(), []);

  function handleZoomChange(nextZoom: number) {
    const clamped = Math.min(2.5, Math.max(0.5, Number(nextZoom.toFixed(1))));
    setZoom(clamped);
    void applyHardwareZoom(clamped);
  }

  function toggleFullScreen() {
    if (!isFullScreen) {
      setIsFullScreen(true);
      try {
        if (document.documentElement.requestFullscreen) {
          void document.documentElement.requestFullscreen().catch(() => {});
        }
      } catch {}
      if (!live) void startCamera();
    } else {
      setIsFullScreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          void document.exitFullscreen().catch(() => {});
        }
      } catch {}
    }
  }

  async function finishPano() {
    const blobs = blobsRef.current;
    if (!blobs.front || !blobs.right || !blobs.back || !blobs.left) {
      setError("Please capture Front, Right, Back, and Left walls first.");
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

  // Real sweep panorama live recording
  function startSweepPano() {
    const video = videoRef.current;
    const canvas = sweepCanvasRef.current;
    if (!video || !canvas || !live) {
      void startCamera();
      return;
    }

    const outW = 2048;
    const outH = 1024;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill background with soft neutral room gradient
    const grad = ctx.createLinearGradient(0, 0, 0, outH);
    grad.addColorStop(0, "#ece8df");
    grad.addColorStop(0.3, "#dfdbd2");
    grad.addColorStop(0.7, "#423d38");
    grad.addColorStop(1, "#282522");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, outW, outH);

    setIsSweeping(true);
    setSweepProgress(0);
    setStatus("Pan slowly 360° around the room from left to right…");

    const startTime = performance.now();
    const duration = 10000; // 10 second sweep
    let lastX = 0;

    function renderSweep(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      setSweepProgress(Math.round(progress * 100));

      const currentX = Math.round(progress * outW);
      const sliceW = Math.max(2, currentX - lastX);

      if (sliceW > 0 && currentX <= outW) {
        const vw = video?.videoWidth || 1920;
        const vh = video?.videoHeight || 1080;
        // Take center vertical slice from video
        const srcW = Math.max(1, Math.round(vw * 0.05));
        const srcX = Math.round((vw - srcW) / 2);

        // Map vertically to eye level (leaving ceiling/floor bands)
        const targetH = Math.round(outH * 0.75);
        const targetY = Math.round(outH * 0.125);

        ctx?.drawImage(video!, srcX, 0, srcW, vh, lastX, targetY, sliceW, targetH);
        lastX = currentX;
      }

      if (progress < 1 && isSweeping) {
        animFrameRef.current = requestAnimationFrame(renderSweep);
      } else {
        void finishSweepPano();
      }
    }

    animFrameRef.current = requestAnimationFrame(renderSweep);
  }

  async function finishSweepPano() {
    setIsSweeping(false);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    const canvas = sweepCanvasRef.current;
    if (!canvas) return;

    setBusy(true);
    setStatus("Processing 360° panorama…");
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.9)
      );
      if (!blob) throw new Error("Sweep capture failed.");
      const converted = await convertSinglePanoTo360(blob);
      const url = await uploadImage(converted, "pano");
      onUploaded(url);
      stopCamera();
      setIsFullScreen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sweep panorama failed.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  // High resolution anti-blur still capture
  async function snap() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !live) {
      setError("Open camera first.");
      return;
    }

    // Trigger visual shutter flash
    setIsShutterFlashing(true);
    setTimeout(() => setIsShutterFlashing(false), 150);

    let blob: Blob | null = null;

    // Check if hardware ImageCapture API is available for crystal-clear non-blurry still photos
    const track = streamRef.current?.getVideoTracks()[0];
    if (typeof (window as any).ImageCapture === "function" && track) {
      try {
        const capturer = new (window as any).ImageCapture(track);
        blob = await capturer.takePhoto({ imageWidth: 2560, imageHeight: 1440 });
      } catch {}
    }

    // Fallback: draw directly from video stream at full uncompressed resolution
    if (!blob) {
      const vw = video.videoWidth || 1920;
      const vh = video.videoHeight || 1080;

      // In Single Photo mode, capture full frame
      if (mode === "single") {
        setBusy(true);
        setStatus("Processing high-res panorama…");
        try {
          canvas.width = vw;
          canvas.height = vh;
          const ctx = canvas.getContext("2d");
          if (!ctx) return;
          ctx.drawImage(video, 0, 0, vw, vh);
          const rawBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
          );
          if (!rawBlob) throw new Error("Could not capture photo.");
          const converted = await convertSinglePanoTo360(rawBlob);
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

      // 4-Sides / 6-Cube Capture:
      // When zoomed out (e.g. 0.5x), take the MAXIMUM available width to cover entire walls from left to right!
      const targetSize = 1024;
      canvas.width = targetSize;
      canvas.height = targetSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const zoomFactor = Math.max(0.5, zoom);
      const cropW = Math.min(vw, Math.round(Math.min(vw, vh) / zoomFactor));
      const cropH = Math.min(vh, Math.round(Math.min(vw, vh) / zoomFactor));
      const sx = Math.max(0, Math.round((vw - cropW) / 2));
      const sy = Math.max(0, Math.round((vh - cropH) / 2));

      ctx.drawImage(video, sx, sy, cropW, cropH, 0, 0, targetSize, targetSize);
      blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((value) => resolve(value), "image/jpeg", 0.92)
      );
    }

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
      setStatus("All 4 walls captured! Click 'Stitch 360°' below or snap optional ceiling/floor.");
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
        mode === "single" || mode === "sweep"
          ? await convertSinglePanoTo360(file)
          : file;
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
    setIsSweeping(false);
  }

  return (
    <div className="space-y-3">
      {/* Mode Selector Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          360° Capture mode
        </span>
        <div className="flex flex-wrap gap-1 rounded-full bg-paper-2 p-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("4sides");
              resetCapture();
            }}
            className={`rounded-full px-3 py-1 font-medium transition cursor-pointer ${
              mode === "4sides" ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            4 Walls (Quick)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("sweep");
              resetCapture();
            }}
            className={`rounded-full px-3 py-1 font-medium transition cursor-pointer ${
              mode === "sweep" ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            Sweep Pano 360°
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("single");
              resetCapture();
            }}
            className={`rounded-full px-3 py-1 font-medium transition cursor-pointer ${
              mode === "single" ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            Single / Phone Pano
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("6cube");
              resetCapture();
            }}
            className={`rounded-full px-3 py-1 font-medium transition cursor-pointer ${
              mode === "6cube" ? "bg-ink text-paper shadow-sm" : "text-ink-soft hover:text-ink"
            }`}
          >
            All 6 Directions
          </button>
        </div>
      </div>

      {/* =========================================================================
          MAIN VIEWFINDER CONTAINER (True Full-Screen on Demand + Large Normal View)
         ========================================================================= */}
      <div
        className={
          isFullScreen
            ? "fixed inset-0 z-[9999] h-[100dvh] w-screen bg-black overflow-hidden select-none flex flex-col justify-between"
            : "relative overflow-hidden rounded-3xl bg-ink shadow-lg"
        }
      >
        {/* Shutter flash animation overlay */}
        {isShutterFlashing ? (
          <div className="pointer-events-none absolute inset-0 z-50 bg-white/70 animate-out fade-out duration-150" />
        ) : null}

        {/* Video feed (Fills 100% of the screen in full-screen) */}
        <div className={`relative ${isFullScreen ? "absolute inset-0 h-full w-full z-0" : "h-96 md:h-[420px] w-full"} overflow-hidden bg-black`}>
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
            <img src={preview} alt="360 view ready" className="h-full w-full object-cover" />
          ) : null}

          {!live && !preview ? (
            <button
              type="button"
              onClick={() => void startCamera()}
              className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-sand cursor-pointer"
            >
              <span className="grid h-20 w-20 place-items-center rounded-full bg-terracotta shadow-[0_0_0_10px_rgba(194,77,29,0.3)] transition hover:scale-105">
                <Camera className="h-9 w-9 text-white" />
              </span>
              <span className="text-lg font-semibold text-paper">Open dedicated camera</span>
              <span className="max-w-sm text-center text-xs text-sand/70">
                {mode === "4sides"
                  ? "Stand in center and turn 90° for each of the 4 walls. Ceiling & floor are auto-filled!"
                  : mode === "sweep"
                  ? "Tap Start Sweep and pan your camera around the room to paint a live 360°."
                  : mode === "single"
                  ? "Take a wide panorama or use your phone's built-in Panorama camera."
                  : "Capture all 6 directions: 4 walls, ceiling, and floor."}
              </span>
            </button>
          ) : null}

          {/* Orientation Reticle / Horizon Guide */}
          {live ? (
            <div className="pointer-events-none absolute inset-0 grid place-items-center z-10">
              <div className="h-48 w-48 rounded-full border border-dashed border-white/40" />
              <div className="absolute h-0.5 w-16 bg-white/60" />
              <div className="absolute h-16 w-0.5 bg-white/60" />
            </div>
          ) : null}
        </div>

        {/* TOP FLOATING CONTROLS */}
        {live ? (
          <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            {/* Direction / Mode Badge */}
            <div className="rounded-full bg-black/60 px-4 py-1.5 backdrop-blur-md text-white border border-white/15">
              {mode === "sweep" ? (
                <p className="text-xs font-bold text-gold">
                  {isSweeping ? `Sweeping 360°: ${sweepProgress}%` : "Sweep Mode Ready"}
                </p>
              ) : mode === "single" ? (
                <p className="text-xs font-bold text-gold">Single Photo Panorama</p>
              ) : (
                <p className="text-xs font-bold text-gold">
                  {activeFace.label} {activeFace.optional ? "(Optional)" : `(${requiredTaken}/${requiredFaces.length})`}
                </p>
              )}
            </div>

            {/* Top Right Action Icons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void startCamera(facing === "environment" ? "user" : "environment")}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/15 hover:bg-black/80 cursor-pointer"
                title="Flip camera"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={toggleFullScreen}
                className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/15 hover:bg-black/80 cursor-pointer"
                title={isFullScreen ? "Exit full screen" : "Dedicated full screen"}
              >
                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </button>
            </div>
          </div>
        ) : null}

        {/* SWEEP PROGRESS BAR OVERLAY */}
        {isSweeping ? (
          <div className="relative z-20 mx-6 rounded-2xl bg-black/70 p-3 text-center backdrop-blur-md border border-white/20">
            <p className="text-xs font-semibold text-white">Pan slowly around 360° from left to right…</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full bg-terracotta transition-all duration-100 ease-linear"
                style={{ width: `${sweepProgress}%` }}
              />
            </div>
          </div>
        ) : null}

        {/* BOTTOM FLOATING CONTROLS (Zoom Bar + Shutter + Thumbnails) */}
        {live ? (
          <div className="relative z-20 flex flex-col items-center gap-3 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
            {/* Zoom Controls Pill (Positioned right above shutter) */}
            <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-1.5 backdrop-blur-md border border-white/15 text-white">
              <button
                type="button"
                onClick={() => handleZoomChange(zoom - 0.2)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
                title="Zoom out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <div className="flex gap-1.5 text-xs font-semibold">
                {[0.5, 1, 1.5, 2].map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => handleZoomChange(z)}
                    className={`rounded-full px-2.5 py-0.5 transition cursor-pointer ${
                      zoom === z ? "bg-terracotta text-white font-bold" : "bg-white/10 text-white/70 hover:bg-white/20"
                    }`}
                  >
                    {z === 0.5 ? "0.5x Wide" : `${z}x`}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => handleZoomChange(zoom + 0.2)}
                className="p-1 text-white/80 hover:text-white cursor-pointer"
                title="Zoom in"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
            </div>

            {/* Shutter Button Row */}
            <div className="flex items-center justify-center gap-8">
              {mode !== "single" && mode !== "sweep" ? (
                <button
                  type="button"
                  onClick={() => {
                    const prevIdx = (current - 1 + faceList.length) % faceList.length;
                    setCurrent(prevIdx);
                  }}
                  className="rounded-full bg-white/15 p-3 text-white backdrop-blur-md hover:bg-white/25 cursor-pointer"
                  title="Previous wall"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              ) : null}

              {/* Primary Shutter Button */}
              {mode === "sweep" ? (
                <button
                  type="button"
                  onClick={() => (isSweeping ? void finishSweepPano() : startSweepPano())}
                  disabled={busy}
                  className="group relative grid h-20 w-20 place-items-center rounded-full bg-white ring-4 ring-terracotta transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xl"
                  title={isSweeping ? "Stop & Process" : "Start Sweep"}
                >
                  {busy ? (
                    <Loader2 className="h-8 w-8 animate-spin text-ink" />
                  ) : isSweeping ? (
                    <span className="h-8 w-8 rounded-md bg-terracotta" />
                  ) : (
                    <span className="h-16 w-16 rounded-full bg-terracotta group-hover:bg-terracotta-dark transition flex items-center justify-center text-white">
                      <Video className="h-7 w-7" />
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void snap()}
                  disabled={busy}
                  className="group relative grid h-20 w-20 place-items-center rounded-full bg-white ring-4 ring-terracotta transition hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shadow-2xl"
                  aria-label="Capture photo"
                >
                  {busy ? (
                    <Loader2 className="h-8 w-8 animate-spin text-ink" />
                  ) : (
                    <span className="h-16 w-16 rounded-full bg-terracotta group-hover:bg-terracotta-dark transition flex items-center justify-center text-white">
                      <Camera className="h-7 w-7" />
                    </span>
                  )}
                </button>
              )}

              {mode !== "single" && mode !== "sweep" ? (
                <button
                  type="button"
                  onClick={() => {
                    const nextIdx = (current + 1) % faceList.length;
                    setCurrent(nextIdx);
                  }}
                  className="rounded-full bg-white/15 p-3 text-white backdrop-blur-md hover:bg-white/25 cursor-pointer"
                  title="Next wall"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : null}
            </div>

            {/* Bottom thumbnail strip in full screen */}
            {mode !== "single" && mode !== "sweep" ? (
              <div className="flex max-w-md items-center justify-center gap-1.5 overflow-x-auto py-1">
                {faceList.map((face, index) => (
                  <button
                    key={face.id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    className={`relative flex h-12 w-16 flex-col items-center justify-center overflow-hidden rounded-xl border-2 transition cursor-pointer ${
                      current === index ? "border-terracotta ring-2 ring-terracotta/50" : "border-white/20"
                    }`}
                  >
                    {shots[face.id] ? (
                      <img src={shots[face.id]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[9px] font-bold uppercase text-white/80">{face.label.split(" ")[0]}</span>
                    )}
                    {shots[face.id] ? (
                      <span className="absolute bottom-1 right-1 grid h-3.5 w-3.5 place-items-center rounded-full bg-forest text-[8px] text-white">
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
                    className="rounded-xl bg-terracotta px-3 py-2 text-xs font-bold text-white shadow-lg hover:bg-terracotta-dark cursor-pointer"
                  >
                    Stitch 360°
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={sweepCanvasRef} className="hidden" />

      {/* Normal mode tiles (below viewfinder) */}
      {!isFullScreen && mode !== "single" && mode !== "sweep" ? (
        <div className="grid grid-cols-6 gap-2">
          {faceList.map((face, index) => (
            <button
              key={face.id}
              type="button"
              onClick={() => {
                setCurrent(index);
                if (!live) void startCamera();
              }}
              className={`group relative overflow-hidden rounded-2xl border-2 transition cursor-pointer ${
                current === index ? "border-terracotta ring-2 ring-terracotta/30" : "border-ink/10 hover:border-ink/30"
              }`}
            >
              {shots[face.id] ? (
                <img src={shots[face.id]} alt="" className="h-14 w-full object-cover" />
              ) : (
                <div className="flex h-14 flex-col items-center justify-center bg-paper p-1 text-center">
                  <span className="text-[10px] font-bold uppercase text-ink">{face.label}</span>
                  {face.optional ? <span className="text-[8px] text-ink-soft">Optional</span> : null}
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

      {/* Action buttons bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => void (live ? stopCamera() : startCamera())}
          className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-ink-soft transition cursor-pointer"
        >
          <Camera className="h-4 w-4" />
          {live ? "Stop camera" : preview ? "Reshoot room" : "Open camera"}
        </button>

        <button
          type="button"
          onClick={toggleFullScreen}
          className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-semibold text-ink ring-1 ring-ink/10 hover:bg-paper-2 transition cursor-pointer"
        >
          <Maximize2 className="h-4 w-4" />
          Full screen camera
        </button>

        {canStitch && mode !== "single" && mode !== "sweep" ? (
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

        {/* Native phone panorama trigger */}
        <button
          type="button"
          onClick={() => nativePanoRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-sand shadow-sm hover:bg-forest-soft transition cursor-pointer"
          title="Opens your smartphone's built-in panorama camera"
        >
          <Zap className="h-4 w-4" />
          Phone's Native Pano
        </button>

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-paper px-4 py-2 text-sm font-medium text-ink ring-1 ring-ink/10 hover:bg-paper-2 transition cursor-pointer"
        >
          <ImagePlus className="h-4 w-4" />
          Upload 360 / Pano file
        </button>

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

      {/* Hidden inputs for uploading ready 360 or phone panorama */}
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
        ref={nativePanoRef}
        type="file"
        accept="image/*"
        capture="environment"
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
          ✓ 360° virtual tour ready! Enter a room name and click "Save 360° room" below.
        </p>
      ) : (
        <p className="text-xs text-ink-soft">
          {mode === "4sides"
            ? "Turn 90° for each of the 4 walls. Ceiling and floor are auto-synthesized for a complete 360° view."
            : mode === "sweep"
            ? "Tap Start Sweep and pan smoothly around the room to create a continuous 360° tour."
            : mode === "single"
            ? "Take a wide panorama or click 'Phone's Native Pano' to use your device's built-in Panorama camera."
            : "Capture all 6 directions to stitch a spherical cube map."}
        </p>
      )}
    </div>
  );
}
