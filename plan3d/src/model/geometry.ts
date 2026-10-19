import type { Opening, Plan, Room, Side } from './types';

export const EPS = 1e-6;
/** Tolérance au-delà de l'épaisseur de cloison pour considérer deux pièces voisines. */
export const ADJACENCY_TOLERANCE = 0.03;

export const round2 = (v: number) => Math.round(v * 100) / 100;
export const levelOf = (r: Room) => r.level ?? 0;
export const isGlazed = (o: Opening) => o.kind === 'fenetre' || o.kind === 'porte-fenetre';
export const sameLevel = (a: Room, b: Room) => levelOf(a) === levelOf(b);
/** Altitude du sol fini d'un niveau. */
export const elevation = (plan: Plan, level: number) => level * (plan.ceilingHeight + plan.slabThickness);
export const area = (r: Room) => r.w * r.d;
export const sideLength = (r: Room, s: Side) => (s === 'N' || s === 'S' ? r.w : r.d);
export const opposite: Record<Side, Side> = { N: 'S', S: 'N', E: 'W', W: 'E' };

/** Ligne d'un côté : axe 'h' (horizontale y = c) ou 'v' (verticale x = c), étendue [from, to]. */
export interface Line {
  axis: 'h' | 'v';
  c: number;
  from: number;
  to: number;
}

export function edgeLine(r: Room, s: Side): Line {
  switch (s) {
    case 'N':
      return { axis: 'h', c: r.y, from: r.x, to: r.x + r.w };
    case 'S':
      return { axis: 'h', c: r.y + r.d, from: r.x, to: r.x + r.w };
    case 'W':
      return { axis: 'v', c: r.x, from: r.y, to: r.y + r.d };
    case 'E':
      return { axis: 'v', c: r.x + r.w, from: r.y, to: r.y + r.d };
  }
}

/** Position d'une ouverture dans le repère du plan. */
export function openingLine(r: Room, o: Opening): Line {
  const e = edgeLine(r, o.side);
  return { ...e, from: e.from + o.offset, to: e.from + o.offset + o.width };
}

export const overlapLength = (a0: number, a1: number, b0: number, b1: number) =>
  Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

export function roomsOverlap(a: Room, b: Room): boolean {
  return (
    sameLevel(a, b) &&
    overlapLength(a.x, a.x + a.w, b.x, b.x + b.w) > EPS &&
    overlapLength(a.y, a.y + a.d, b.y, b.y + b.d) > EPS
  );
}

export const maxGap = (plan: Plan) => plan.partitionThickness + ADJACENCY_TOLERANCE;

export interface Neighbor {
  room: Room;
  from: number;
  to: number;
}

/** Pièces séparées de `room` par une simple cloison sur le côté `side`. */
export function neighbors(plan: Plan, room: Room, side: Side): Neighbor[] {
  const e = edgeLine(room, side);
  const gap = maxGap(plan);
  const out: Neighbor[] = [];
  for (const other of plan.rooms) {
    if (other.id === room.id || !sameLevel(other, room)) continue;
    const f = edgeLine(other, opposite[side]);
    // Le voisin doit être du bon côté (pas superposé) et à moins d'une cloison.
    const dist = side === 'N' || side === 'W' ? e.c - f.c : f.c - e.c;
    if (dist < -EPS || dist > gap) continue;
    const from = Math.max(e.from, f.from);
    const to = Math.min(e.to, f.to);
    if (to - from > EPS) out.push({ room: other, from, to });
  }
  return out;
}

export interface DoorLink {
  roomId: string;
  opening: Opening;
  /** Pièce desservie de l'autre côté ; null = extérieur / parties communes. */
  otherId: string | null;
}

/** Liaisons créées par les portes (une porte relie sa pièce hôte au voisin d'en face). */
export function doorLinks(plan: Plan): DoorLink[] {
  const links: DoorLink[] = [];
  for (const room of plan.rooms) {
    for (const o of room.openings) {
      if (o.kind === 'fenetre') continue;
      const span = openingLine(room, o);
      const n = neighbors(plan, room, o.side).find(
        (nb) => overlapLength(span.from, span.to, nb.from, nb.to) >= o.width - EPS,
      );
      links.push({ roomId: room.id, opening: o, otherId: n ? n.room.id : null });
    }
  }
  return links;
}

/** Ouvertures visibles sur un côté : celles de la pièce + celles des voisins sur la cloison commune. */
export function openingsOnSide(plan: Plan, room: Room, side: Side): { line: Line; opening: Opening }[] {
  const own = room.openings
    .filter((o) => o.side === side)
    .map((o) => ({ line: openingLine(room, o), opening: o }));
  const foreign = neighbors(plan, room, side).flatMap((nb) =>
    nb.room.openings
      .filter((o) => o.side === opposite[side])
      .map((o) => ({ line: openingLine(nb.room, o), opening: o }))
      .filter((x) => overlapLength(x.line.from, x.line.to, nb.from, nb.to) > EPS),
  );
  return [...own, ...foreign];
}

/** Segments d'un côté non couverts par un voisin (donc en façade). */
export function exteriorIntervals(plan: Plan, room: Room, side: Side): [number, number][] {
  const e = edgeLine(room, side);
  const covered = neighbors(plan, room, side)
    .map((n) => [n.from, n.to] as [number, number])
    .sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let cursor = e.from;
  for (const [a, b] of covered) {
    if (a - cursor > EPS) out.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (e.to - cursor > EPS) out.push([cursor, e.to]);
  return out;
}

/** Escalier droit : montée dans le sens de la plus grande dimension. */
export function stairGeometry(plan: Plan, r: Room) {
  const steps = Math.max(2, Math.round(r.steps ?? 16));
  const floorToFloor = plan.ceilingHeight + plan.slabThickness;
  const run = Math.max(r.w, r.d);
  const riser = floorToFloor / steps;
  // n hauteurs = n - 1 girons, la dernière marche étant le palier d'arrivée.
  const going = run / (steps - 1);
  return {
    steps,
    floorToFloor,
    riser,
    going,
    width: Math.min(r.w, r.d),
    blondel: 2 * riser + going,
    alongX: r.w >= r.d,
  };
}
