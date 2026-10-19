import {
  EPS,
  area,
  doorLinks,
  neighbors,
  openingLine,
  overlapLength,
  roomsOverlap,
  sideLength,
  stairGeometry,
} from '../model/geometry';
import type { Plan, Room } from '../model/types';
import { ROOM_TYPES, SOURCES, type SourceId } from './catalog';

export type Severity = 'error' | 'warning' | 'info';

export interface Issue {
  ruleId: string;
  severity: Severity;
  message: string;
  source: SourceId;
  roomId?: string;
  openingId?: string;
}

export interface PlanMetrics {
  habitableArea: number;
  habitableVolume: number;
  glazingArea: number;
  glazingRatio: number;
}

const fmt = (v: number, digits = 2) => v.toFixed(digits).replace('.', ',');
const m = (v: number) => `${fmt(v)} m`;
const m2 = (v: number) => `${fmt(v)} m²`;
const cm = (v: number) => `${fmt(v * 100, 1)} cm`;

export function metrics(plan: Plan): PlanMetrics {
  const habitableArea = plan.rooms
    .filter((r) => ROOM_TYPES[r.type].habitable)
    .reduce((s, r) => s + area(r), 0);
  const glazingArea = plan.rooms
    .flatMap((r) => r.openings)
    .filter((o) => o.kind !== 'porte')
    .reduce((s, o) => s + o.width * o.height, 0);
  return {
    habitableArea,
    habitableVolume: habitableArea * plan.ceilingHeight,
    glazingArea,
    glazingRatio: habitableArea > 0 ? glazingArea / habitableArea : 0,
  };
}

type Rule = (plan: Plan, push: (i: Issue) => void) => void;

const ceilingRule: Rule = (plan, push) => {
  const h = plan.ceilingHeight;
  if (h < 2.2 - EPS) {
    push({
      ruleId: 'hsp-decence',
      severity: 'error',
      message: `Hauteur sous plafond ${m(h)} : la pièce principale de 9 m² doit avoir au moins 2,20 m (sinon un volume ≥ 20 m³).`,
      source: 'DECENCE',
    });
  }
  if (h < 2.5 - EPS) {
    push({
      ruleId: 'hsp-neuf',
      severity: 'warning',
      message: `Hauteur sous plafond ${m(h)} < 2,50 m exigés en construction neuve.`,
      source: 'CCH',
    });
  }
};

const geometryRules: Rule = (plan, push) => {
  const rooms = plan.rooms;
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      if (roomsOverlap(rooms[i], rooms[j])) {
        push({
          ruleId: 'chevauchement',
          severity: 'error',
          message: `« ${rooms[i].name} » chevauche « ${rooms[j].name} ».`,
          source: 'MODELE',
          roomId: rooms[i].id,
        });
      }
    }
  }
  for (const r of rooms) {
    const bySide = new Map<string, { from: number; to: number; id: string }[]>();
    for (const o of r.openings) {
      const len = sideLength(r, o.side);
      if (o.offset < -EPS || o.offset + o.width > len + EPS) {
        push({
          ruleId: 'ouverture-hors-mur',
          severity: 'error',
          message: `${r.name} : l’ouverture côté ${o.side} dépasse le mur (${m(o.offset + o.width)} pour ${m(len)}).`,
          source: 'MODELE',
          roomId: r.id,
          openingId: o.id,
        });
      }
      if (o.sill + o.height > plan.ceilingHeight + EPS) {
        push({
          ruleId: 'ouverture-trop-haute',
          severity: 'error',
          message: `${r.name} : allège + hauteur (${m(o.sill + o.height)}) dépasse la hauteur sous plafond.`,
          source: 'MODELE',
          roomId: r.id,
          openingId: o.id,
        });
      }
      const line = openingLine(r, o);
      const list = bySide.get(o.side) ?? [];
      for (const other of list) {
        if (overlapLength(line.from, line.to, other.from, other.to) > EPS) {
          push({
            ruleId: 'ouvertures-superposees',
            severity: 'error',
            message: `${r.name} : deux ouvertures se superposent côté ${o.side}.`,
            source: 'MODELE',
            roomId: r.id,
            openingId: o.id,
          });
        }
      }
      list.push({ from: line.from, to: line.to, id: o.id });
      bySide.set(o.side, list);
    }
  }
};

const roomSizeRules: Rule = (plan, push) => {
  for (const r of plan.rooms) {
    const spec = ROOM_TYPES[r.type];
    const a = area(r);
    const width = Math.min(r.w, r.d);
    if (spec.minArea > 0 && a < spec.minArea - EPS) {
      push({
        ruleId: 'surface-min',
        severity: 'warning',
        message: `${r.name} : ${m2(a)} < ${m2(spec.minArea)} recommandés pour un(e) ${spec.label.toLowerCase()} (${spec.rationale}).`,
        source: 'NEUFERT',
        roomId: r.id,
      });
    } else if (spec.recommendedArea > 0 && a < spec.recommendedArea - EPS) {
      push({
        ruleId: 'surface-confort',
        severity: 'info',
        message: `${r.name} : ${m2(a)}, sous les ${m2(spec.recommendedArea)} de confort usuels.`,
        source: 'NEUFERT',
        roomId: r.id,
      });
    }
    if (spec.minWidth > 0 && width < spec.minWidth - EPS) {
      const pmrCorridor = plan.accessible && (r.type === 'degagement' || r.type === 'entree');
      push({
        ruleId: 'largeur-min',
        severity: pmrCorridor ? 'error' : 'warning',
        message: `${r.name} : largeur ${m(width)} < ${m(pmrCorridor ? 0.9 : spec.minWidth)}${pmrCorridor ? ' (circulation intérieure accessible)' : ` (${spec.rationale})`}.`,
        source: pmrCorridor ? 'PMR' : r.type === 'degagement' ? 'USAGE' : 'NEUFERT',
        roomId: r.id,
      });
    }
  }
};

const decenceRules: Rule = (plan, push) => {
  const principals = plan.rooms.filter((r) => ROOM_TYPES[r.type].principal);
  const hasDecentMain = principals.some(
    (r) =>
      (area(r) >= 9 - EPS && plan.ceilingHeight >= 2.2 - EPS) ||
      area(r) * plan.ceilingHeight >= 20 - EPS,
  );
  if (plan.rooms.length > 0 && (principals.length === 0 || !hasDecentMain)) {
    push({
      ruleId: 'piece-principale',
      severity: 'error',
      message:
        'Aucune pièce principale d’au moins 9 m² avec 2,20 m sous plafond (ou 20 m³) : le logement ne serait pas décent.',
      source: 'DECENCE',
    });
  }
  const has = (t: Room['type']) => plan.rooms.some((r) => r.type === t);
  if (plan.rooms.length > 0) {
    if (!has('cuisine')) {
      push({
        ruleId: 'equipement-cuisine',
        severity: 'warning',
        message: 'Aucune cuisine : un coin cuisine dans le séjour est admis, à matérialiser sur le plan.',
        source: 'DECENCE',
      });
    }
    if (!has('wc') && !plan.rooms.some((r) => r.type === 'sdb' && r.wcIncluded)) {
      push({
        ruleId: 'equipement-wc',
        severity: 'error',
        message: 'Aucun WC : un WC intérieur séparé de la cuisine et de la pièce des repas est requis.',
        source: 'DECENCE',
      });
    }
    if (!has('sdb')) {
      push({
        ruleId: 'equipement-toilette',
        severity: 'error',
        message: 'Aucune salle d’eau : un équipement pour la toilette corporelle est requis.',
        source: 'DECENCE',
      });
    }
  }
  if (plan.upperFloor) {
    for (const r of plan.rooms.filter((x) => x.type === 'terrasse')) {
      push({
        ruleId: 'garde-corps-terrasse',
        severity: 'warning',
        message: `${r.name} en étage : garde-corps de 1,00 m de hauteur de protection sur les rives.`,
        source: 'GARDE_CORPS',
        roomId: r.id,
      });
    }
  }
  for (const r of principals) {
    const lit = r.openings.some((o) => o.kind !== 'porte');
    if (!lit) {
      push({
        ruleId: 'eclairement-naturel',
        severity: 'error',
        message: `${r.name} : pièce principale sans fenêtre (éclairement naturel et ouvrant sur l’extérieur requis).`,
        source: 'DECENCE',
        roomId: r.id,
      });
    }
  }
};

const programmeRules: Rule = (plan, push) => {
  const { habitableArea, glazingArea, glazingRatio } = metrics(plan);
  const n = Math.max(0, Math.round(plan.occupants));
  if (n > 0) {
    const required = 14 * Math.min(n, 4) + 10 * Math.max(0, n - 4);
    if (habitableArea < required - EPS) {
      push({
        ruleId: 'surface-par-habitant',
        severity: 'warning',
        message: `Surface habitable ${m2(habitableArea)} < ${m2(required)} requis pour ${n} occupant(s) (14 m²/hab. jusqu’à 4, puis 10 m²).`,
        source: 'CCH',
      });
    }
  }
  if (habitableArea > 0 && glazingRatio < 1 / 6 - EPS) {
    push({
      ruleId: 'surface-vitree',
      severity: 'warning',
      message: `Surface de baies ${m2(glazingArea)} = ${fmt(glazingRatio * 100, 1)} % de la SHAB, sous le minimum de 1/6 (${m2(habitableArea / 6)}).`,
      source: 'RT2012',
    });
  }
};

const openingRules: Rule = (plan, push) => {
  const links = doorLinks(plan);
  for (const r of plan.rooms) {
    for (const o of r.openings) {
      if (o.kind === 'porte' || o.kind === 'porte-fenetre') {
        if (o.height < 2.0 - EPS) {
          push({
            ruleId: 'hauteur-porte',
            severity: 'warning',
            message: `${r.name} : porte de ${m(o.height)} de haut, sous les 2,04 m d’un bloc-porte standard.`,
            source: 'USAGE',
            roomId: r.id,
            openingId: o.id,
          });
        }
      }
      if (o.kind === 'porte') {
        const min = o.entrance ? (plan.accessible ? 0.9 : 0.8) : plan.accessible ? 0.8 : 0.73;
        if (o.width < min - EPS) {
          push({
            ruleId: o.entrance ? 'largeur-porte-entree' : 'largeur-porte',
            severity: plan.accessible ? 'error' : 'warning',
            message: `${r.name} : porte ${o.entrance ? 'd’entrée ' : ''}de ${cm(o.width)} < ${cm(min)}${plan.accessible ? ' (largeur nominale, logement accessible)' : ' (bloc-porte courant minimal)'}.`,
            source: plan.accessible ? 'PMR' : 'USAGE',
            roomId: r.id,
            openingId: o.id,
          });
        }
      }
      // Une baie donnant sur une pièce voisine (ex. terrasse) n'expose pas au vide.
      const facesRoom = neighbors(plan, r, o.side).some((nb) => {
        const span = openingLine(r, o);
        return overlapLength(span.from, span.to, nb.from, nb.to) > EPS;
      });
      if (plan.upperFloor && o.kind !== 'porte' && o.sill < 1.0 - EPS && !facesRoom) {
        push({
          ruleId: 'garde-corps',
          severity: 'warning',
          message: `${r.name} : allège à ${m(o.sill)} en étage — prévoir un garde-corps (hauteur de protection 1,00 m).`,
          source: 'GARDE_CORPS',
          roomId: r.id,
          openingId: o.id,
        });
      }
    }
  }

  // Accès : chaque pièce (hors escalier) doit être desservie par au moins une porte.
  const served = new Set<string>();
  for (const l of links) {
    served.add(l.roomId);
    if (l.otherId) served.add(l.otherId);
  }
  for (const r of plan.rooms) {
    if (r.type === 'escalier') continue;
    if (!served.has(r.id)) {
      push({
        ruleId: 'acces-piece',
        severity: 'warning',
        message: `${r.name} : aucune porte ne dessert cette pièce.`,
        source: 'USAGE',
        roomId: r.id,
      });
    }
  }
  const entrances = links.filter((l) => l.opening.entrance);
  if (plan.rooms.length > 0 && entrances.length === 0) {
    push({
      ruleId: 'porte-entree',
      severity: 'warning',
      message: 'Aucune porte d’entrée définie (cocher « porte d’entrée » sur la porte palière).',
      source: 'USAGE',
    });
  }

  // WC communiquant directement avec la cuisine ou la pièce des repas.
  const byId = new Map(plan.rooms.map((r) => [r.id, r]));
  for (const l of links) {
    if (!l.otherId) continue;
    const pair = [byId.get(l.roomId)!, byId.get(l.otherId)!];
    const wc = pair.find((r) => r.type === 'wc');
    const meal = pair.find((r) => r.type === 'cuisine' || r.type === 'sejour');
    if (wc && meal) {
      push({
        ruleId: 'wc-cuisine',
        severity: 'error',
        message: `${wc.name} communique directement avec « ${meal.name} » : un sas ou dégagement est requis.`,
        source: 'RSD',
        roomId: wc.id,
        openingId: l.opening.id,
      });
    }
  }
};

const stairRules: Rule = (plan, push) => {
  for (const r of plan.rooms.filter((x) => x.type === 'escalier')) {
    const g = stairGeometry(plan, r);
    const base = { roomId: r.id };
    if (g.riser > 0.2 + EPS || g.riser < 0.15 - EPS) {
      push({
        ...base,
        ruleId: 'escalier-hauteur-marche',
        severity: 'warning',
        message: `${r.name} : hauteur de marche ${cm(g.riser)} hors de la plage 15–20 cm (confort usuel 16–18 cm).`,
        source: 'USAGE',
      });
    }
    if (g.blondel < 0.6 - EPS || g.blondel > 0.64 + EPS) {
      push({
        ...base,
        ruleId: 'escalier-blondel',
        severity: 'warning',
        message: `${r.name} : 2h + g = ${cm(g.blondel)} (h = ${cm(g.riser)}, g = ${cm(g.going)}), hors 60–64 cm. Ajuster le nombre de marches ou la longueur.`,
        source: 'BLONDEL',
      });
    }
    if (g.going < 0.21 - EPS) {
      push({
        ...base,
        ruleId: 'escalier-giron',
        severity: 'warning',
        message: `${r.name} : giron ${cm(g.going)} < 21 cm, escalier raide.`,
        source: 'USAGE',
      });
    }
  }
};

const accessibilityRules: Rule = (plan, push) => {
  if (!plan.accessible) return;
  const turning = 1.5;
  const minDim = (r: Room) => Math.min(r.w, r.d);
  const check = (type: Room['type'], label: string, needed: number) => {
    const list = plan.rooms.filter((r) => r.type === type);
    if (list.length === 0) return;
    if (!list.some((r) => minDim(r) >= needed - EPS)) {
      push({
        ruleId: `pmr-${type}`,
        severity: 'warning',
        message: `Aucun(e) ${label} ne permet a priori un cercle de giration de Ø ${m(turning)} hors équipements (plus petite dimension < ${m(needed)}).`,
        source: 'PMR_APPROX',
        roomId: list[0].id,
      });
    }
  };
  check('sdb', 'salle d’eau', turning);
  if (!plan.rooms.some((r) => r.type === 'sdb' && r.wcIncluded)) check('wc', 'WC', turning);
  // Chambre : lit 1,40 m + passage 0,90 m de part et d'autre ≈ 3,20 m.
  check('chambre', 'chambre', 3.2);
};

const RULES: Rule[] = [
  ceilingRule,
  geometryRules,
  roomSizeRules,
  decenceRules,
  programmeRules,
  openingRules,
  stairRules,
  accessibilityRules,
];

const ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

export function checkPlan(plan: Plan): Issue[] {
  const issues: Issue[] = [];
  for (const rule of RULES) rule(plan, (i) => issues.push(i));
  return issues.sort((a, b) => ORDER[a.severity] - ORDER[b.severity]);
}

export { SOURCES };
