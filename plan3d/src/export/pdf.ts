import type { jsPDF } from 'jspdf';
import { area, levelOf, openingLine } from '../model/geometry';
import type { Opening, Plan, Room } from '../model/types';
import { OUTWARD, pieceRect, wallPieces } from '../model/walls';
import { ROOM_TYPES } from '../rules/catalog';
import { metrics, unitsOf } from '../rules/engine';

// Planche A3 paysage, unités en millimètres.
const PAGE = { w: 420, h: 297 };
const MARGIN = 10;
const TITLE_H = 42;
/** Place réservée autour du dessin pour les chaînes de cotes. */
const DIM_SPACE = 22;
export const SCALES = [50, 100, 200] as const;

const fmt = (v: number, d = 2) => v.toFixed(d).replace('.', ',');

export interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Emprise du bâtiment, murs de façade compris (identique sur toutes les planches). */
export function buildingBounds(plan: Plan): Bounds {
  const t = plan.exteriorWallThickness;
  return {
    minX: Math.min(...plan.rooms.map((r) => r.x)) - t,
    minY: Math.min(...plan.rooms.map((r) => r.y)) - t,
    maxX: Math.max(...plan.rooms.map((r) => r.x + r.w)) + t,
    maxY: Math.max(...plan.rooms.map((r) => r.y + r.d)) + t,
  };
}

/** Plus grande échelle normalisée (1/50, 1/100, 1/200) qui tient sur la planche. */
export function chooseScale(b: Bounds): number {
  const availW = PAGE.w - 2 * MARGIN - 2 * DIM_SPACE;
  const availH = PAGE.h - 2 * MARGIN - TITLE_H - 2 * DIM_SPACE - 6;
  for (const s of SCALES) {
    const k = 1000 / s;
    if ((b.maxX - b.minX) * k <= availW && (b.maxY - b.minY) * k <= availH) return s;
  }
  return SCALES[SCALES.length - 1];
}

/**
 * Chaîne de cotes : coordonnées distinctes des arêtes des pièces le long d'un axe,
 * fusionnées à 1 cm près.
 */
export function dimensionChain(values: number[]): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const out: number[] = [];
  for (const v of sorted) if (!out.length || v - out[out.length - 1] > 0.01) out.push(v);
  return out;
}

interface Ctx {
  doc: jsPDF;
  /** Conversion plan (m) → page (mm). */
  X: (x: number) => number;
  Y: (y: number) => number;
  k: number;
}

function arcPoints(cx: number, cy: number, r: number, a0: number, a1: number, n = 16) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const a = a0 + ((a1 - a0) * i) / n;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  });
}

function polyline(doc: jsPDF, pts: readonly (readonly [number, number])[]) {
  for (let i = 1; i < pts.length; i++) doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]);
}

function drawDoor({ doc, X, Y }: Ctx, room: Room, o: Opening) {
  const line = openingLine(room, o);
  const inward = -OUTWARD[o.side];
  const [hx, hy] = line.axis === 'h' ? [line.from, line.c] : [line.c, line.from];
  const [ox, oy] =
    line.axis === 'h' ? [line.from, line.c + inward * o.width] : [line.c + inward * o.width, line.from];
  doc.setLineWidth(0.25);
  doc.line(X(hx), Y(hy), X(ox), Y(oy));
  // Arc de débattement entre le vantail ouvert et la position fermée.
  const aOpen = Math.atan2(oy - hy, ox - hx);
  const aClosed = line.axis === 'h' ? 0 : Math.PI / 2;
  let delta = aClosed - aOpen;
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;
  const pts = arcPoints(hx, hy, o.width, aOpen, aOpen + delta).map(([x, y]) => [X(x), Y(y)] as const);
  doc.setLineWidth(0.15);
  doc.setLineDashPattern([0.8, 0.8], 0);
  polyline(doc, pts);
  doc.setLineDashPattern([], 0);
}

function drawWindow({ doc, X, Y }: Ctx, room: Room, o: Opening, depth: number) {
  const line = openingLine(room, o);
  const out = OUTWARD[o.side];
  doc.setLineWidth(o.kind === 'porte-fenetre' ? 0.3 : 0.2);
  for (const k of [0, depth / 2, depth]) {
    const c = line.c + out * k;
    if (line.axis === 'h') doc.line(X(line.from), Y(c), X(line.to), Y(c));
    else doc.line(X(c), Y(line.from), X(c), Y(line.to));
  }
}

function drawStair({ doc, X, Y }: Ctx, plan: Plan, r: Room) {
  const n = Math.max(2, r.steps ?? 16);
  const alongX = r.w >= r.d;
  const run = alongX ? r.w : r.d;
  doc.setLineWidth(0.15);
  for (let i = 1; i < n; i++) {
    const k = (run / (n - 1)) * i;
    if (alongX) doc.line(X(r.x + k), Y(r.y), X(r.x + k), Y(r.y + r.d));
    else doc.line(X(r.x), Y(r.y + k), X(r.x + r.w), Y(r.y + k));
  }
  // Ligne de foulée avec flèche dans le sens de la montée.
  const [x0, y0, x1, y1] = alongX
    ? [r.x + 0.1, r.y + r.d / 2, r.x + r.w - 0.15, r.y + r.d / 2]
    : [r.x + r.w / 2, r.y + 0.1, r.x + r.w / 2, r.y + r.d - 0.15];
  doc.setLineWidth(0.3);
  doc.line(X(x0), Y(y0), X(x1), Y(y1));
  const ang = Math.atan2(Y(y1) - Y(y0), X(x1) - X(x0));
  for (const s of [-1, 1]) {
    doc.line(X(x1), Y(y1), X(x1) - 2 * Math.cos(ang + s * 0.4), Y(y1) - 2 * Math.sin(ang + s * 0.4));
  }
  const h = (plan.ceilingHeight + plan.slabThickness) / n;
  doc.setFontSize(6);
  doc.text(`${n} h × ${fmt(h * 100, 1)} cm — montée`, X(x0) + (alongX ? 2 : 1.5), Y(y0) + (alongX ? -1 : 6), {
    angle: alongX ? 0 : -90,
  });
}

function drawDimension(
  { doc }: Ctx,
  axis: 'h' | 'v',
  positions: number[],
  at: number,
  toPage: (v: number) => number,
  labelSide: -1 | 1,
) {
  doc.setLineWidth(0.15);
  const p = positions.map(toPage);
  if (axis === 'h') doc.line(p[0], at, p[p.length - 1], at);
  else doc.line(at, p[0], at, p[p.length - 1]);
  for (const v of p) {
    // Trait d'attache et marque oblique à 45°.
    if (axis === 'h') {
      doc.line(v, at - 1.5, v, at + 1.5);
      doc.line(v - 1, at + 1, v + 1, at - 1);
    } else {
      doc.line(at - 1.5, v, at + 1.5, v);
      doc.line(at - 1, v + 1, at + 1, v - 1);
    }
  }
  doc.setFontSize(6.5);
  for (let i = 1; i < positions.length; i++) {
    const len = positions[i] - positions[i - 1];
    const mid = (p[i] + p[i - 1]) / 2;
    if (p[i] - p[i - 1] < 6) continue; // trop court pour une cote lisible (cloisons)
    const label = fmt(len);
    if (axis === 'h') doc.text(label, mid, at + labelSide * 1.2, { align: 'center', baseline: labelSide < 0 ? 'bottom' : 'top' });
    else doc.text(label, at + labelSide * 1.2, mid, { align: 'center', angle: 90, baseline: labelSide < 0 ? 'bottom' : 'top' });
  }
}

function drawTitleBlock(doc: jsPDF, plan: Plan, levelName: string, scale: number, sheet: string) {
  const x = PAGE.w - MARGIN - 190;
  const y = PAGE.h - MARGIN - TITLE_H;
  doc.setLineWidth(0.4);
  doc.rect(x, y, 190, TITLE_H);
  doc.setLineWidth(0.2);
  doc.line(x + 120, y, x + 120, y + TITLE_H);
  doc.line(x, y + 16, x + 190, y + 16);
  doc.line(x + 120, y + 30, x + 190, y + 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(plan.name, x + 3, y + 6.5, { maxWidth: 114 });
  doc.setFontSize(14);
  doc.text(`Plan du ${levelName}`, x + 3, y + 13.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const notes = [
    'Cotes intérieures en mètres. Surfaces calculées sur cotes intérieures.',
    `Hauteur sous plafond ${fmt(plan.ceilingHeight)} m — cloisons ${fmt(plan.partitionThickness * 100, 0)} cm — façades ${fmt(plan.exteriorWallThickness * 100, 0)} cm.`,
    'Document d’étude non contractuel : à valider par un architecte et un bureau de contrôle.',
    'Référentiel : textes français et ergonomie Neufert (référence de pratique).',
  ];
  notes.forEach((n, i) => doc.text(n, x + 3, y + 21 + i * 4.6));

  const field = (label: string, value: string, fx: number, fy: number) => {
    doc.setFontSize(6);
    doc.setTextColor(110, 110, 110);
    doc.text(label, fx, fy);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.text(value, fx, fy + 4.5);
  };
  field('Échelle', `1/${scale}`, x + 123, y + 5);
  field('Format', 'A3', x + 158, y + 5);
  field('Date', new Date().toLocaleDateString('fr-FR'), x + 123, y + 20);
  field('Indice', 'A — esquisse', x + 158, y + 20);
  field('Planche', sheet, x + 123, y + 34);
  field('Établi avec', 'Plan3D', x + 158, y + 34);
}

function drawScaleBar(doc: jsPDF, scale: number, x: number, y: number) {
  const k = 1000 / scale;
  const step = scale <= 50 ? 1 : scale <= 100 ? 2 : 5;
  doc.setLineWidth(0.2);
  for (let i = 0; i < 5; i++) {
    if (i % 2 === 0) doc.setFillColor(0, 0, 0);
    else doc.setFillColor(255, 255, 255);
    doc.rect(x + i * step * k, y, step * k, 1.8, 'FD');
  }
  doc.setFontSize(6);
  for (let i = 0; i <= 5; i++) doc.text(String(i * step), x + i * step * k, y + 4.8, { align: 'center' });
  doc.text('m', x + 5 * step * k + 3, y + 4.8);
}

function drawAreaTable(doc: jsPDF, plan: Plan, rooms: Room[], x: number, y: number) {
  const units = unitsOf({ ...plan, rooms }).filter((u) => u.name);
  const rows: [string, string][] = units.length
    ? units.map((u) => [u.name, `${fmt(metrics({ ...plan, rooms: u.rooms }).habitableArea)} m²`])
    : [['Surface habitable', `${fmt(metrics({ ...plan, rooms }).habitableArea)} m²`]];
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.text('Surfaces habitables', x, y);
  doc.setFont('helvetica', 'normal');
  rows.forEach(([a, b], i) => {
    doc.text(a, x, y + 4.5 + i * 4);
    doc.text(b, x + 70, y + 4.5 + i * 4, { align: 'right' });
  });
}

/** Dessine la planche d'un niveau. */
function drawLevel(doc: jsPDF, plan: Plan, level: number, scale: number, b: Bounds, sheet: string) {
  const k = 1000 / scale;
  const drawW = (b.maxX - b.minX) * k;
  const drawH = (b.maxY - b.minY) * k;
  const areaH = PAGE.h - 2 * MARGIN - TITLE_H - 6;
  const ox = (PAGE.w - drawW) / 2;
  const oy = MARGIN + (areaH - drawH) / 2;
  const ctx: Ctx = { doc, k, X: (x) => ox + (x - b.minX) * k, Y: (y) => oy + (y - b.minY) * k };
  const { X, Y } = ctx;
  const rooms = plan.rooms.filter((r) => levelOf(r) === level);

  doc.setLineWidth(0.5);
  doc.rect(MARGIN, MARGIN, PAGE.w - 2 * MARGIN, PAGE.h - 2 * MARGIN);

  // Sols : blanc ; parties communes légèrement grisées.
  for (const r of rooms) {
    const shared = rooms.some((x) => x.unit?.trim()) && !r.unit?.trim();
    const g = shared ? 242 : 255;
    doc.setFillColor(g, g, g);
    doc.rect(X(r.x), Y(r.y), r.w * k, r.d * k, 'F');
    if (r.type === 'tremie') {
      doc.setLineWidth(0.15);
      doc.line(X(r.x), Y(r.y), X(r.x + r.w), Y(r.y + r.d));
      doc.line(X(r.x + r.w), Y(r.y), X(r.x), Y(r.y + r.d));
    }
  }

  // Murs coupés en poché noir, allèges en trait fin.
  doc.setFillColor(30, 30, 30);
  for (const r of rooms) {
    for (const p of wallPieces(plan, r)) {
      const rc = pieceRect(p);
      if (p.kind === 'plein' && p.top > 1.0 + 1e-6) doc.rect(X(rc.x), Y(rc.y), rc.w * k, rc.d * k, 'F');
      else if (p.kind === 'plein') {
        // Garde-corps / muret bas : contour seul.
        doc.setLineWidth(0.25);
        doc.rect(X(rc.x), Y(rc.y), rc.w * k, rc.d * k, 'S');
      }
    }
  }

  for (const r of rooms) {
    if (r.type === 'escalier') drawStair(ctx, plan, r);
    for (const o of r.openings) {
      if (o.kind === 'porte') drawDoor(ctx, r, o);
      else if (o.kind !== 'baie') drawWindow(ctx, r, o, plan.exteriorWallThickness);
    }
  }

  // Désignations : nom, surface, dimensions.
  for (const r of rooms) {
    if (r.type === 'tremie') continue;
    const cx = X(r.x + r.w / 2);
    const cy = Y(r.y + r.d / 2);
    const small = Math.min(r.w, r.d) * k < 14;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(small ? 5.5 : 7.5);
    doc.text(r.name, cx, cy - (small ? 1 : 2), { align: 'center', maxWidth: r.w * k - 2 });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(small ? 5 : 6.5);
    if (r.type === 'escalier') continue;
    const label = ROOM_TYPES[r.type].habitable ? `${fmt(area(r))} m²` : ROOM_TYPES[r.type].label;
    doc.text(label, cx, cy + 1.5, { align: 'center' });
    if (!small) doc.text(`${fmt(r.w)} × ${fmt(r.d)}`, cx, cy + 4.5, { align: 'center' });
  }

  // Chaînes de cotes : partielles (arêtes des pièces) puis totale, en haut et à gauche.
  if (rooms.length) {
    // Cotes partielles prises sur les pièces en façade (haut et gauche), comme sur un plan d'exécution.
    const minX = Math.min(...rooms.map((r) => r.x));
    const minY = Math.min(...rooms.map((r) => r.y));
    const front = rooms.filter((r) => r.y <= minY + 0.01);
    const side = rooms.filter((r) => r.x <= minX + 0.01);
    const xs = dimensionChain([...front.flatMap((r) => [r.x, r.x + r.w]), ...rooms.flatMap((r) => [r.x, r.x + r.w]).filter((v, _, all) => v === Math.min(...all) || v === Math.max(...all))]);
    const ys = dimensionChain([...side.flatMap((r) => [r.y, r.y + r.d]), ...rooms.flatMap((r) => [r.y, r.y + r.d]).filter((v, _, all) => v === Math.min(...all) || v === Math.max(...all))]);
    const top = Y(b.minY);
    const left = X(b.minX);
    drawDimension(ctx, 'h', xs, top - 7, X, -1);
    drawDimension(ctx, 'h', [xs[0], xs[xs.length - 1]], top - 15, X, -1);
    drawDimension(ctx, 'v', ys, left - 7, Y, -1);
    drawDimension(ctx, 'v', [ys[0], ys[ys.length - 1]], left - 15, Y, -1);
  }

  const by = PAGE.h - MARGIN - TITLE_H;
  drawScaleBar(doc, scale, MARGIN + 5, by + 4);
  drawAreaTable(doc, plan, rooms, MARGIN + 5, by + 15);
  drawTitleBlock(doc, plan, plan.levels[level] ?? `niveau ${level}`, scale, sheet);
}

/** Génère le dossier de plans : une planche A3 par niveau occupé. */
export async function buildPlansPdf(plan: Plan): Promise<jsPDF> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });
  const levels = plan.levels.map((_, i) => i).filter((i) => plan.rooms.some((r) => levelOf(r) === i));
  const b = plan.rooms.length ? buildingBounds(plan) : { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  const scale = chooseScale(b);
  doc.setProperties({ title: `${plan.name} — plans`, creator: 'Plan3D' });
  if (levels.length === 0) levels.push(0);
  levels.forEach((level, i) => {
    if (i > 0) doc.addPage('a3', 'landscape');
    drawLevel(doc, plan, level, scale, b, `${i + 1}/${levels.length}`);
  });
  return doc;
}

/** Fichier PDF prêt à enregistrer. */
export async function plansPdfBlob(plan: Plan): Promise<Blob> {
  const doc = await buildPlansPdf(plan);
  return doc.output('blob');
}
