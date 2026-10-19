import { EPS, edgeLine, exteriorIntervals, neighbors, openingsOnSide } from './geometry';
import type { Plan, Room, Side } from './types';

export const SIDES: Side[] = ['N', 'E', 'S', 'W'];

/** Sens vers l'extérieur de la pièce pour chaque côté (+1 = coordonnée croissante). */
export const OUTWARD: Record<Side, 1 | -1> = { N: -1, S: 1, W: -1, E: 1 };

export interface WallPiece {
  side: Side;
  axis: 'h' | 'v';
  /** Coordonnée de la face intérieure du mur (bord de la pièce). */
  c: number;
  outward: 1 | -1;
  thickness: number;
  from: number;
  to: number;
  bottom: number;
  top: number;
  kind: 'plein' | 'allege' | 'linteau';
}

/**
 * Découpe les murs d'une pièce en blocs pleins, allèges et linteaux.
 * Chaque pièce porte la moitié de la cloison qui la sépare d'un voisin et
 * la totalité du mur de façade sur ses parties extérieures.
 */
export function wallPieces(plan: Plan, room: Room): WallPiece[] {
  const H = plan.ceilingHeight;
  const half = plan.partitionThickness / 2;
  const ext = plan.exteriorWallThickness;
  const pieces: WallPiece[] = [];

  for (const side of SIDES) {
    const edge = edgeLine(room, side);
    const intervals: { a: number; b: number; t: number }[] = [
      ...neighbors(plan, room, side).map((n) => ({ a: n.from, b: n.to, t: half })),
      ...exteriorIntervals(plan, room, side).map(([a, b]) => ({ a, b, t: ext })),
    ];
    const openings = openingsOnSide(plan, room, side);

    for (const { a: a0, b: b0, t } of intervals) {
      // Prolonge aux angles de la pièce pour fermer les coins.
      const a = Math.abs(a0 - edge.from) < EPS ? a0 - t : a0;
      const b = Math.abs(b0 - edge.to) < EPS ? b0 + t : b0;
      const base = { side, axis: edge.axis, c: edge.c, outward: OUTWARD[side], thickness: t };

      const cuts = openings
        .map(({ line, opening }) => ({
          from: Math.max(line.from, a0),
          to: Math.min(line.to, b0),
          sill: opening.sill,
          head: Math.min(H, opening.sill + opening.height),
        }))
        .filter((o) => o.to - o.from > EPS)
        .sort((x, y) => x.from - y.from);

      let cursor = a;
      for (const cut of cuts) {
        if (cut.from - cursor > EPS) {
          pieces.push({ ...base, from: cursor, to: cut.from, bottom: 0, top: H, kind: 'plein' });
        }
        if (cut.sill > EPS) {
          pieces.push({ ...base, from: cut.from, to: cut.to, bottom: 0, top: cut.sill, kind: 'allege' });
        }
        if (H - cut.head > EPS) {
          pieces.push({ ...base, from: cut.from, to: cut.to, bottom: cut.head, top: H, kind: 'linteau' });
        }
        cursor = Math.max(cursor, cut.to);
      }
      if (b - cursor > EPS) {
        pieces.push({ ...base, from: cursor, to: b, bottom: 0, top: H, kind: 'plein' });
      }
    }
  }
  return pieces;
}

/** Rectangle en plan (x, y, largeur, profondeur) occupé par un morceau de mur. */
export function pieceRect(p: WallPiece) {
  const near = p.c;
  const far = p.c + p.outward * p.thickness;
  const lo = Math.min(near, far);
  return p.axis === 'h'
    ? { x: p.from, y: lo, w: p.to - p.from, d: p.thickness }
    : { x: lo, y: p.from, w: p.thickness, d: p.to - p.from };
}
