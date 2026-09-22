"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Eraser, MousePointer2, PlusSquare, RotateCcw, Upload } from "lucide-react";
import { uploadImage } from "@/lib/client-image";

type Kind = {
  id: string;
  label: string;
  fill: string;
  stroke: string;
};

type Room = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  kind: string;
};

const KINDS: Kind[] = [
  { id: "living", label: "Living", fill: "#f0e2c4", stroke: "#7a5a28" },
  { id: "bedroom", label: "Bedroom", fill: "#ecd3c4", stroke: "#8a4a32" },
  { id: "kitchen", label: "Kitchen", fill: "#d9e4c7", stroke: "#4d6a32" },
  { id: "bath", label: "Bath", fill: "#d4e4ee", stroke: "#2f5f78" },
  { id: "dining", label: "Dining", fill: "#efe0c8", stroke: "#7a5a28" },
  { id: "lobby", label: "Entry / lobby", fill: "#e7ddd0", stroke: "#5c5348" },
  { id: "balcony", label: "Balcony", fill: "#dcead8", stroke: "#3f6b45" },
  { id: "corridor", label: "Corridor", fill: "#e8e2d6", stroke: "#6a6258" },
  { id: "study", label: "Study", fill: "#e4d7ea", stroke: "#5a3d6e" },
  { id: "garden", label: "Garden", fill: "#cfe6c8", stroke: "#3c6b38" },
  { id: "pool", label: "Pool", fill: "#c8dff0", stroke: "#2a5f86" },
  { id: "other", label: "Other", fill: "#efe8dc", stroke: "#5c5348" },
];

const W = 1100;
const H = 720;
const GRID = 20;

function snap(n: number) {
  return Math.round(n / GRID) * GRID;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function kindStyle(id: string) {
  return KINDS.find((item) => item.id === id) ?? KINDS[KINDS.length - 1];
}

function templates(): { name: string; rooms: Room[] }[] {
  return [
    {
      name: "1 BHK",
      rooms: [
        { id: uid(), x: 60, y: 60, w: 360, h: 280, label: "LIVING", kind: "living" },
        { id: uid(), x: 420, y: 60, w: 280, h: 240, label: "BEDROOM", kind: "bedroom" },
        { id: uid(), x: 60, y: 340, w: 220, h: 180, label: "KITCHEN", kind: "kitchen" },
        { id: uid(), x: 280, y: 340, w: 140, h: 120, label: "BATH", kind: "bath" },
        { id: uid(), x: 420, y: 300, w: 140, h: 80, label: "ENTRY", kind: "lobby" },
      ],
    },
    {
      name: "2 BHK",
      rooms: [
        { id: uid(), x: 80, y: 80, w: 340, h: 260, label: "LIVING", kind: "living" },
        { id: uid(), x: 420, y: 80, w: 240, h: 200, label: "BED 1", kind: "bedroom" },
        { id: uid(), x: 680, y: 80, w: 220, h: 200, label: "BED 2", kind: "bedroom" },
        { id: uid(), x: 80, y: 360, w: 220, h: 180, label: "KITCHEN", kind: "kitchen" },
        { id: uid(), x: 300, y: 360, w: 160, h: 140, label: "DINING", kind: "dining" },
        { id: uid(), x: 480, y: 300, w: 140, h: 120, label: "BATH", kind: "bath" },
      ],
    },
    {
      name: "Studio",
      rooms: [
        { id: uid(), x: 80, y: 80, w: 520, h: 360, label: "STUDIO", kind: "living" },
        { id: uid(), x: 600, y: 80, w: 160, h: 160, label: "BATH", kind: "bath" },
        { id: uid(), x: 600, y: 240, w: 160, h: 200, label: "KITCHEN", kind: "kitchen" },
      ],
    },
    {
      name: "Hostel",
      rooms: [
        { id: uid(), x: 60, y: 80, w: 200, h: 240, label: "DORM A", kind: "bedroom" },
        { id: uid(), x: 280, y: 80, w: 200, h: 240, label: "DORM B", kind: "bedroom" },
        { id: uid(), x: 500, y: 80, w: 200, h: 240, label: "DORM C", kind: "bedroom" },
        { id: uid(), x: 60, y: 340, w: 280, h: 160, label: "LOBBY", kind: "lobby" },
        { id: uid(), x: 360, y: 340, w: 160, h: 160, label: "BATH", kind: "bath" },
        { id: uid(), x: 540, y: 340, w: 160, h: 160, label: "KITCHEN", kind: "kitchen" },
      ],
    },
    {
      name: "Villa",
      rooms: [
        { id: uid(), x: 80, y: 80, w: 320, h: 240, label: "LIVING", kind: "living" },
        { id: uid(), x: 400, y: 80, w: 240, h: 200, label: "MASTER", kind: "bedroom" },
        { id: uid(), x: 660, y: 80, w: 200, h: 180, label: "GUEST", kind: "bedroom" },
        { id: uid(), x: 80, y: 340, w: 220, h: 180, label: "KITCHEN", kind: "kitchen" },
        { id: uid(), x: 300, y: 340, w: 140, h: 120, label: "BATH", kind: "bath" },
        { id: uid(), x: 460, y: 300, w: 400, h: 220, label: "POOL DECK", kind: "pool" },
      ],
    },
  ];
}

function hitRoom(rooms: Room[], x: number, y: number) {
  for (let i = rooms.length - 1; i >= 0; i -= 1) {
    const room = rooms[i];
    if (x >= room.x && x <= room.x + room.w && y >= room.y && y <= room.y + room.h) return room;
  }
  return null;
}

function drawPlan(
  ctx: CanvasRenderingContext2D,
  rooms: Room[],
  draft: Room | null,
  selectedId: string | null,
) {
  ctx.fillStyle = "#f4eee4";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "rgba(27,23,19,0.08)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += GRID) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += GRID) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  const all = draft ? [...rooms, draft] : rooms;
  for (const room of all) {
    const style = kindStyle(room.kind);
    ctx.fillStyle = style.fill;
    ctx.strokeStyle = room.id === selectedId ? "#c24d1d" : style.stroke;
    ctx.lineWidth = room.id === selectedId ? 4 : 2.5;
    ctx.fillRect(room.x, room.y, room.w, room.h);
    ctx.strokeRect(room.x + 1, room.y + 1, room.w - 2, room.h - 2);
    ctx.fillStyle = style.stroke;
    ctx.font = "600 16px Outfit, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(room.label, room.x + room.w / 2, room.y + room.h / 2 - 8);
    const ftW = Math.max(1, Math.round(room.w / GRID));
    const ftH = Math.max(1, Math.round(room.h / GRID));
    ctx.font = "12px Outfit, sans-serif";
    ctx.fillText(`${ftW} × ${ftH} ft`, room.x + room.w / 2, room.y + room.h / 2 + 12);
  }

  ctx.fillStyle = "#1b1713";
  ctx.font = "600 13px Outfit, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("AERIO  ·  DRAWN BLUEPRINT", 24, H - 28);
  ctx.fillText("1 square = 1 ft", 24, H - 12);

  ctx.save();
  ctx.translate(W - 50, H - 50);
  ctx.strokeStyle = "#1b1713";
  ctx.fillStyle = "#1b1713";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(0, -18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(-6, -8);
  ctx.lineTo(6, -8);
  ctx.closePath();
  ctx.fill();
  ctx.font = "700 11px Outfit, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("N", 0, -24);
  ctx.restore();
}

export function PlanCreator({ onReady }: { onReady: (url: string) => Promise<void> | void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [history, setHistory] = useState<Room[][]>([[]]);
  const [tool, setTool] = useState<"room" | "select" | "erase">("room");
  const [kind, setKind] = useState("living");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Room | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const dragRef = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  const selected = rooms.find((room) => room.id === selectedId) ?? null;

  const paint = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    drawPlan(ctx, rooms, draft, selectedId);
  }, [rooms, draft, selectedId]);

  useEffect(() => {
    paint();
  }, [paint]);

  function pushHistory(next: Room[]) {
    setHistory((current) => [...current.slice(-20), next]);
    setRooms(next);
  }

  function localPoint(event: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: snap(((event.clientX - rect.left) / rect.width) * W),
      y: snap(((event.clientY - rect.top) / rect.height) * H),
    };
  }

  function onPointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = localPoint(event);
    event.currentTarget.setPointerCapture(event.pointerId);
    if (tool === "erase") {
      const hit = hitRoom(rooms, point.x, point.y);
      if (hit) {
        pushHistory(rooms.filter((room) => room.id !== hit.id));
        setSelectedId(null);
      }
      return;
    }
    if (tool === "select") {
      const hit = hitRoom(rooms, point.x, point.y);
      setSelectedId(hit?.id ?? null);
      if (hit) dragRef.current = { id: hit.id, dx: point.x - hit.x, dy: point.y - hit.y };
      return;
    }
    startRef.current = point;
    setDraft({
      id: "draft",
      x: point.x,
      y: point.y,
      w: GRID,
      h: GRID,
      label: kindStyle(kind).label.toUpperCase(),
      kind,
    });
  }

  function onPointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    const point = localPoint(event);
    if (tool === "select" && dragRef.current) {
      const drag = dragRef.current;
      setRooms((current) =>
        current.map((room) =>
          room.id === drag.id
            ? { ...room, x: snap(point.x - drag.dx), y: snap(point.y - drag.dy) }
            : room,
        ),
      );
      return;
    }
    if (tool === "room" && startRef.current) {
      const start = startRef.current;
      const x = Math.min(start.x, point.x);
      const y = Math.min(start.y, point.y);
      const w = Math.max(GRID * 3, Math.abs(point.x - start.x));
      const h = Math.max(GRID * 3, Math.abs(point.y - start.y));
      setDraft({
        id: "draft",
        x,
        y,
        w,
        h,
        label: kindStyle(kind).label.toUpperCase(),
        kind,
      });
    }
  }

  function onPointerUp() {
    if (tool === "select") {
      if (dragRef.current) pushHistory(rooms);
      dragRef.current = null;
      return;
    }
    if (tool === "room" && draft && draft.w >= GRID * 3 && draft.h >= GRID * 3) {
      const created = { ...draft, id: uid() };
      pushHistory([...rooms, created]);
      setSelectedId(created.id);
    }
    setDraft(null);
    startRef.current = null;
  }

  async function saveDrawn() {
    if (rooms.length === 0) {
      setError("Draw at least one room, or start from a template.");
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    setError("");
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((value) => resolve(value), "image/png"),
      );
      if (!blob) throw new Error("Could not export the plan.");
      const url = await uploadImage(
        new File([blob], `blueprint-${Date.now()}.png`, { type: "image/png" }),
        "plan",
      );
      await onReady(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the plan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-ink/8">
      <p className="font-display text-2xl">Draw a blueprint</p>
      <p className="mt-2 text-sm text-ink-soft">
        No scanned plan? Sketch rooms on the grid. Drag to draw, name them, then save. Guests will
        see this map and tap eyes on it.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {templates().map((item) => (
          <button
            key={item.name}
            type="button"
            onClick={() => {
              pushHistory(item.rooms);
              setSelectedId(null);
            }}
            className="rounded-full bg-paper px-3 py-1.5 text-xs font-medium ring-1 ring-ink/10"
          >
            Start: {item.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {[
          { id: "room", label: "Draw room", icon: PlusSquare },
          { id: "select", label: "Move", icon: MousePointer2 },
          { id: "erase", label: "Erase", icon: Eraser },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTool(item.id as typeof tool)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                tool === item.id ? "bg-ink text-paper" : "bg-paper ring-1 ring-ink/10"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => {
            const previous = history[history.length - 2];
            if (!previous) return;
            setHistory((current) => current.slice(0, -1));
            setRooms(previous);
          }}
          className="inline-flex items-center gap-1.5 rounded-full bg-paper px-3 py-1.5 text-xs ring-1 ring-ink/10"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Undo
        </button>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {KINDS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setKind(item.id)}
            className={`rounded-full px-2.5 py-1 text-[11px] ${
              kind === item.id ? "ring-2 ring-ink" : "ring-1 ring-ink/10"
            }`}
            style={{ background: item.fill, color: item.stroke }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-ink/10">
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="block w-full cursor-crosshair touch-none bg-paper"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        />
      </div>

      {selected ? (
        <label className="mt-3 block text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          Selected room name
          <input
            value={selected.label}
            onChange={(event) => {
              const label = event.target.value.toUpperCase();
              setRooms((current) =>
                current.map((room) => (room.id === selected.id ? { ...room, label } : room)),
              );
            }}
            className="mt-1 w-full rounded-xl border border-ink/10 bg-paper px-3 py-2 text-sm text-ink"
          />
        </label>
      ) : (
        <p className="mt-3 text-xs text-ink-soft">
          Choose a room type, drag on the grid to draw it. Use Move to slide rooms. 1 square ≈ 1 ft.
        </p>
      )}

      {error ? <p className="mt-2 text-sm text-terracotta">{error}</p> : null}
      <button
        type="button"
        onClick={() => void saveDrawn()}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Upload className="h-4 w-4" />
        {busy ? "Saving plan…" : "Use this blueprint"}
      </button>
    </div>
  );
}
