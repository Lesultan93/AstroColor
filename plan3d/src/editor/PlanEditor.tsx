import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { area, levelOf, openingLine } from '../model/geometry';
import type { Opening, Plan, Room } from '../model/types';
import { OUTWARD, pieceRect, wallPieces } from '../model/walls';
import { ROOM_TYPES } from '../rules/catalog';
import type { Severity } from '../rules/engine';

const GRID = 0.05;
const SNAP_DISTANCE = 0.12;
const MIN_SIZE = 0.5;

type Corner = 'nw' | 'ne' | 'sw' | 'se';

type Drag =
  | { mode: 'move'; id: string; start: [number, number]; orig: Room }
  | { mode: 'resize'; id: string; corner: Corner; orig: Room }
  | { mode: 'pan'; start: [number, number]; orig: View };

interface View {
  scale: number;
  tx: number;
  ty: number;
}

interface Props {
  plan: Plan;
  activeLevel: number;
  selectedId: string | null;
  severityByRoom: Map<string, Severity>;
  onSelect: (id: string | null) => void;
  checkpoint: () => void;
  preview: (fn: (p: Plan) => Plan) => void;
}

const fmt = (v: number) => v.toFixed(2).replace('.', ',');
const snapGrid = (v: number) => Math.round(v / GRID) * GRID;

/** Aligne une arête sur les arêtes des autres pièces (alignement ou cloison mitoyenne). */
function snapEdge(value: number, edges: [number, number][], gap: number): number {
  let best = snapGrid(value);
  let bestDist = SNAP_DISTANCE;
  for (const [s, e] of edges) {
    for (const c of [s, e, e + gap, s - gap]) {
      const d = Math.abs(c - value);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
  }
  return Math.round(best * 1000) / 1000;
}

/** Position du coin haut-gauche après déplacement, en accrochant l'une ou l'autre arête. */
function snapMove(value: number, size: number, edges: [number, number][], gap: number): number {
  const lead = snapEdge(value, edges, gap);
  const trail = snapEdge(value + size, edges, gap) - size;
  return Math.abs(lead - value) <= Math.abs(trail - value) ? lead : trail;
}

function fitView(plan: Plan, width: number, height: number): View {
  if (plan.rooms.length === 0) return { scale: 60, tx: 60, ty: 60 };
  const minX = Math.min(...plan.rooms.map((r) => r.x)) - 1;
  const minY = Math.min(...plan.rooms.map((r) => r.y)) - 1;
  const maxX = Math.max(...plan.rooms.map((r) => r.x + r.w)) + 1;
  const maxY = Math.max(...plan.rooms.map((r) => r.y + r.d)) + 1;
  const scale = Math.min(width / (maxX - minX), height / (maxY - minY), 160);
  return {
    scale,
    tx: (width - (maxX - minX) * scale) / 2 - minX * scale,
    ty: (height - (maxY - minY) * scale) / 2 - minY * scale,
  };
}

function DoorSymbol({ room, o }: { room: Room; o: Opening }) {
  const line = openingLine(room, o);
  const inward = -OUTWARD[o.side];
  // Charnière au début de la baie, vantail ouvert à 90° vers l'intérieur de la pièce.
  const hinge = line.axis === 'h' ? [line.from, line.c] : [line.c, line.from];
  const closed = line.axis === 'h' ? [line.to, line.c] : [line.c, line.to];
  const open =
    line.axis === 'h' ? [line.from, line.c + inward * o.width] : [line.c + inward * o.width, line.from];
  const sweep = (line.axis === 'h') === (inward > 0) ? 1 : 0;
  return (
    <g className="door">
      <line x1={hinge[0]} y1={hinge[1]} x2={open[0]} y2={open[1]} />
      <path
        d={`M ${open[0]} ${open[1]} A ${o.width} ${o.width} 0 0 ${sweep} ${closed[0]} ${closed[1]}`}
        className="swing"
      />
    </g>
  );
}

function WindowSymbol({ room, o, depth }: { room: Room; o: Opening; depth: number }) {
  const line = openingLine(room, o);
  const out = OUTWARD[o.side];
  const offsets = [0, depth / 2, depth];
  return (
    <g className={o.kind === 'porte-fenetre' ? 'window french' : 'window'}>
      {offsets.map((k) =>
        line.axis === 'h' ? (
          <line key={k} x1={line.from} x2={line.to} y1={line.c + out * k} y2={line.c + out * k} />
        ) : (
          <line key={k} y1={line.from} y2={line.to} x1={line.c + out * k} x2={line.c + out * k} />
        ),
      )}
    </g>
  );
}

export function PlanEditor({ plan, activeLevel, selectedId, severityByRoom, onSelect, checkpoint, preview }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>({ scale: 60, tx: 40, ty: 40 });
  const [drag, setDrag] = useState<Drag | null>(null);
  const fitted = useRef(false);

  const fit = useCallback(() => {
    const el = svgRef.current;
    if (!el) return;
    const { width, height } = el.getBoundingClientRect();
    if (width > 0) setView(fitView(plan, width, height));
  }, [plan]);

  useLayoutEffect(() => {
    if (!fitted.current) {
      fitted.current = true;
      fit();
    }
  }, [fit]);

  // Zoom molette centré sur le curseur (listener non passif pour bloquer le défilement).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setView((v) => {
        const scale = Math.min(400, Math.max(10, v.scale * Math.exp(-e.deltaY * 0.0015)));
        const k = scale / v.scale;
        return { scale, tx: px - (px - v.tx) * k, ty: py - (py - v.ty) * k };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const toWorld = (e: { clientX: number; clientY: number }): [number, number] => {
    const rect = svgRef.current!.getBoundingClientRect();
    return [(e.clientX - rect.left - view.tx) / view.scale, (e.clientY - rect.top - view.ty) / view.scale];
  };

  const rooms = useMemo(() => plan.rooms.filter((r) => levelOf(r) === activeLevel), [plan.rooms, activeLevel]);
  // Niveau inférieur en filigrane, pour superposer escaliers, trémies et murs porteurs.
  const below = useMemo(() => plan.rooms.filter((r) => levelOf(r) === activeLevel - 1), [plan.rooms, activeLevel]);
  const pieces = useMemo(() => rooms.flatMap((r) => wallPieces(plan, r)), [plan, rooms]);

  const startMove = (e: React.PointerEvent, room: Room) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onSelect(room.id);
    checkpoint();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ mode: 'move', id: room.id, start: toWorld(e), orig: room });
  };

  const startResize = (e: React.PointerEvent, room: Room, corner: Corner) => {
    e.stopPropagation();
    checkpoint();
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ mode: 'resize', id: room.id, corner, orig: room });
  };

  const startPan = (e: React.PointerEvent) => {
    if (e.button === 0) onSelect(null);
    (e.target as Element).setPointerCapture(e.pointerId);
    setDrag({ mode: 'pan', start: [e.clientX, e.clientY], orig: view });
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drag) return;
    if (drag.mode === 'pan') {
      setView({
        ...drag.orig,
        tx: drag.orig.tx + e.clientX - drag.start[0],
        ty: drag.orig.ty + e.clientY - drag.start[1],
      });
      return;
    }
    const [wx, wy] = toWorld(e);
    const others = rooms.filter((r) => r.id !== drag.id);
    const xs = others.map((r) => [r.x, r.x + r.w] as [number, number]);
    const ys = others.map((r) => [r.y, r.y + r.d] as [number, number]);
    const gap = plan.partitionThickness;
    const o = drag.orig;
    let next: Room;
    if (drag.mode === 'move') {
      next = {
        ...o,
        x: snapMove(o.x + wx - drag.start[0], o.w, xs, gap),
        y: snapMove(o.y + wy - drag.start[1], o.d, ys, gap),
      };
    } else {
      let x0 = o.x;
      let y0 = o.y;
      let x1 = o.x + o.w;
      let y1 = o.y + o.d;
      if (drag.corner.includes('w')) x0 = Math.min(snapEdge(wx, xs, gap), x1 - MIN_SIZE);
      if (drag.corner.includes('e')) x1 = Math.max(snapEdge(wx, xs, gap), x0 + MIN_SIZE);
      if (drag.corner.includes('n')) y0 = Math.min(snapEdge(wy, ys, gap), y1 - MIN_SIZE);
      if (drag.corner.includes('s')) y1 = Math.max(snapEdge(wy, ys, gap), y0 + MIN_SIZE);
      next = { ...o, x: x0, y: y0, w: Math.round((x1 - x0) * 1000) / 1000, d: Math.round((y1 - y0) * 1000) / 1000 };
    }
    preview((p) => ({ ...p, rooms: p.rooms.map((r) => (r.id === drag.id ? next : r)) }));
  };

  const endDrag = () => setDrag(null);

  const handle = 8 / view.scale;
  const selected = rooms.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="editor">
      <svg
        ref={svgRef}
        className={drag?.mode === 'pan' ? 'panning' : ''}
        onPointerDown={startPan}
        onPointerMove={onMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <defs>
          <pattern id="grid-minor" width={0.5} height={0.5} patternUnits="userSpaceOnUse">
            <path d="M 0.5 0 L 0 0 0 0.5" className="grid-minor" />
          </pattern>
          <pattern id="grid-major" width={1} height={1} patternUnits="userSpaceOnUse">
            <rect width={1} height={1} fill="url(#grid-minor)" />
            <path d="M 1 0 L 0 0 0 1" className="grid-major" />
          </pattern>
        </defs>
        <g transform={`translate(${view.tx} ${view.ty}) scale(${view.scale})`}>
          <rect x={-200} y={-200} width={400} height={400} fill="url(#grid-major)" pointerEvents="none" />

          {below.map((r) => (
            <rect key={r.id} x={r.x} y={r.y} width={r.w} height={r.d} className={`ghost ${r.type}`} pointerEvents="none" />
          ))}

          {rooms.map((r) => {
            const sev = severityByRoom.get(r.id);
            return (
              <g key={r.id} className={`room ${r.id === selectedId ? 'selected' : ''} ${sev ?? ''}`}>
                <rect
                  x={r.x}
                  y={r.y}
                  width={r.w}
                  height={r.d}
                  fill={ROOM_TYPES[r.type].color}
                  className="floor"
                  onPointerDown={(e) => startMove(e, r)}
                />
                {r.type === 'escalier' && <StairHatch room={r} />}
                {r.type === 'tremie' && (
                  <path
                    d={`M ${r.x} ${r.y} L ${r.x + r.w} ${r.y + r.d} M ${r.x + r.w} ${r.y} L ${r.x} ${r.y + r.d}`}
                    className="void"
                    pointerEvents="none"
                  />
                )}
                <text x={r.x + r.w / 2} y={r.y + r.d / 2 - 0.14} className="label name" fontSize={0.26}>
                  {r.name}
                </text>
                <text x={r.x + r.w / 2} y={r.y + r.d / 2 + 0.16} className="label" fontSize={0.2}>
                  {fmt(area(r))} m²
                </text>
                <text x={r.x + r.w / 2} y={r.y + r.d / 2 + 0.4} className="label dim" fontSize={0.16}>
                  {fmt(r.w)} × {fmt(r.d)}
                </text>
              </g>
            );
          })}

          {pieces
            .filter((p) => p.kind === 'plein')
            .map((p, i) => {
              const rc = pieceRect(p);
              return <rect key={i} x={rc.x} y={rc.y} width={rc.w} height={rc.d} className="wall" />;
            })}

          {rooms.flatMap((r) =>
            r.openings.map((o) =>
              o.kind === 'baie' ? null : o.kind === 'porte' ? (
                <DoorSymbol key={o.id} room={r} o={o} />
              ) : (
                <WindowSymbol key={o.id} room={r} o={o} depth={plan.exteriorWallThickness} />
              ),
            ),
          )}

          {selected && (
            <g className="handles">
              <rect
                x={selected.x}
                y={selected.y}
                width={selected.w}
                height={selected.d}
                className="selection"
                pointerEvents="none"
              />
              {(['nw', 'ne', 'sw', 'se'] as Corner[]).map((c) => (
                <rect
                  key={c}
                  className={`handle ${c}`}
                  x={(c.includes('w') ? selected.x : selected.x + selected.w) - handle / 2}
                  y={(c.includes('n') ? selected.y : selected.y + selected.d) - handle / 2}
                  width={handle}
                  height={handle}
                  onPointerDown={(e) => startResize(e, selected, c)}
                />
              ))}
            </g>
          )}
        </g>
      </svg>
      <div className="editor-tools">
        <button onClick={fit} title="Recadrer sur le plan">Recadrer</button>
        <span className="scale-hint">Grille 0,50 m · aimantation 5 cm et cloisons</span>
      </div>
    </div>
  );
}

function StairHatch({ room }: { room: Room }) {
  const n = Math.max(2, room.steps ?? 16);
  const alongX = room.w >= room.d;
  const run = alongX ? room.w : room.d;
  const lines = Array.from({ length: n - 1 }, (_, i) => (run / (n - 1)) * (i + 1));
  return (
    <g className="stair" pointerEvents="none">
      {lines.map((k) =>
        alongX ? (
          <line key={k} x1={room.x + k} x2={room.x + k} y1={room.y} y2={room.y + room.d} />
        ) : (
          <line key={k} y1={room.y + k} y2={room.y + k} x1={room.x} x2={room.x + room.w} />
        ),
      )}
    </g>
  );
}
