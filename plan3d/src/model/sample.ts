import { ROOM_TYPES } from '../rules/catalog';
import type { Opening, OpeningKind, Plan, Room, RoomType, Side } from './types';

let counter = 0;
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const OPENING_DEFAULTS: Record<OpeningKind, Omit<Opening, 'id' | 'side' | 'offset'>> = {
  porte: { kind: 'porte', width: 0.83, height: 2.04, sill: 0 },
  fenetre: { kind: 'fenetre', width: 1.2, height: 1.35, sill: 0.95 },
  'porte-fenetre': { kind: 'porte-fenetre', width: 1.4, height: 2.15, sill: 0 },
  baie: { kind: 'baie', width: 0.9, height: 2.2, sill: 0 },
};

export function makeOpening(kind: OpeningKind, side: Side, offset: number, patch: Partial<Opening> = {}): Opening {
  return { id: uid('o'), side, offset, ...OPENING_DEFAULTS[kind], ...patch };
}

export function makeRoom(type: RoomType, x: number, y: number, patch: Partial<Room> = {}): Room {
  const spec = ROOM_TYPES[type];
  const [w, d] = spec.defaultSize;
  return {
    id: uid('r'),
    name: spec.label,
    type,
    x,
    y,
    w,
    d,
    openings: [],
    ...(type === 'escalier' ? { steps: 16 } : {}),
    ...patch,
  };
}

export const emptyPlan = (): Plan => ({
  name: 'Nouveau plan',
  ceilingHeight: 2.5,
  slabThickness: 0.2,
  occupants: 2,
  partitionThickness: 0.07,
  exteriorWallThickness: 0.2,
  accessible: true,
  upperFloor: false,
  levels: ['RDC'],
  rooms: [],
});

/** Appartement T3 (~78 m² SHAB), cotes intérieures, cloisons de 7 cm. */
export function sampleT3(): Plan {
  const rooms: Room[] = [
    makeRoom('sejour', 0, 0, {
      name: 'Séjour',
      w: 5.5,
      d: 4.6,
      openings: [
        makeOpening('porte-fenetre', 'N', 1.0, { width: 2.4 }),
        makeOpening('porte-fenetre', 'W', 1.6),
        makeOpening('porte', 'E', 3.3, { width: 0.93 }),
      ],
    }),
    makeRoom('cuisine', 5.57, 0, {
      name: 'Cuisine',
      w: 3.2,
      d: 2.8,
      openings: [makeOpening('fenetre', 'N', 1.1, { width: 1.0, height: 1.15, sill: 1.05 })],
    }),
    makeRoom('entree', 5.57, 2.87, {
      name: 'Entrée',
      w: 3.2,
      d: 1.73,
      openings: [
        makeOpening('porte', 'E', 0.4, { width: 0.93, entrance: true }),
        makeOpening('porte', 'N', 1.2),
        makeOpening('porte', 'S', 1.2, { width: 0.93 }),
      ],
    }),
    makeRoom('degagement', 0, 4.67, {
      name: 'Dégagement',
      w: 8.77,
      d: 1.0,
      openings: [
        makeOpening('porte', 'S', 1.2),
        makeOpening('porte', 'S', 4.1),
        makeOpening('porte', 'S', 5.8),
        makeOpening('porte', 'S', 7.4),
      ],
    }),
    makeRoom('chambre', 0, 5.74, {
      name: 'Chambre 1',
      w: 3.4,
      d: 3.6,
      openings: [makeOpening('fenetre', 'S', 1.0, { width: 1.4 })],
    }),
    makeRoom('sdb', 3.47, 5.74, {
      name: 'Salle d’eau',
      w: 2.2,
      d: 2.4,
      openings: [makeOpening('fenetre', 'S', 0.8, { width: 0.6, height: 0.6, sill: 1.6 })],
    }),
    makeRoom('wc', 5.74, 5.74, { name: 'WC', w: 0.95, d: 1.5 }),
    makeRoom('chambre', 6.76, 5.74, {
      name: 'Chambre 2',
      w: 3.0,
      d: 3.4,
      openings: [makeOpening('fenetre', 'S', 0.8, { width: 1.4 })],
    }),
  ];
  return { ...emptyPlan(), name: 'Appartement T3 — exemple', occupants: 4, rooms };
}

/** Symétrie d'axe vertical x = axis (logement droit = miroir du logement gauche). */
export function mirrorRooms(rooms: Room[], axis: number): Room[] {
  const flip: Record<Side, Side> = { N: 'N', S: 'S', E: 'W', W: 'E' };
  return rooms.map((r) => ({
    ...r,
    id: uid('r'),
    x: Math.round((2 * axis - r.x - r.w) * 1000) / 1000,
    openings: r.openings.map((o) => ({
      ...o,
      id: uid('o'),
      side: flip[o.side],
      offset: o.side === 'N' || o.side === 'S' ? Math.round((r.w - o.offset - o.width) * 1000) / 1000 : o.offset,
    })),
  }));
}

/** Copie de pièces vers un autre niveau, avec de nouveaux identifiants. */
export function copyToLevel(rooms: Room[], level: number, rename: (unit: string) => string = (u) => u): Room[] {
  return rooms.map((r) => ({
    ...r,
    id: uid('r'),
    level,
    unit: r.unit ? rename(r.unit) : r.unit,
    openings: r.openings.map((o) => ({ ...o, id: uid('o') })),
  }));
}

/**
 * Logement gauche du client (le droit est symétrique), en T2.
 * La pièce principale en L (7 × 6 m moins la salle d'eau) est redécoupée en
 * séjour 7 × 3 m, chambre 4 × 3 m et dégagement 3 × 1 m.
 * Hypothèse : cotes du croquis = cotes intérieures.
 */
function clientT2(unit: string, level: number): Room[] {
  const base = { level, unit };
  return [
    makeRoom('terrasse', 0, 0, {
      ...base,
      name: 'Terrasse',
      w: 4,
      d: 2,
      openings: [makeOpening('porte', 'E', 0.2, { width: 0.8 })],
    }),
    makeRoom('cuisine', 4.07, 0, {
      ...base,
      name: 'Cuisine',
      w: 3,
      d: 2,
      openings: [
        makeOpening('fenetre', 'N', 1.0, { width: 1.0, height: 1.15, sill: 1.05 }),
        makeOpening('porte', 'S', 2.0, { width: 0.83 }),
      ],
    }),
    makeRoom('sejour', 0, 2.07, {
      ...base,
      name: 'Séjour',
      w: 7.07,
      d: 3,
      openings: [
        makeOpening('porte-fenetre', 'N', 1.3, { width: 1.4 }),
        makeOpening('fenetre', 'W', 0.8, { width: 1.4 }),
        makeOpening('porte', 'E', 0.6, { width: 0.93, entrance: true }),
      ],
    }),
    makeRoom('chambre', 0, 5.14, {
      ...base,
      name: 'Chambre',
      w: 4,
      d: 3,
      openings: [
        makeOpening('fenetre', 'S', 1.3, { width: 1.4 }),
        makeOpening('porte', 'E', 0.1, { width: 0.83 }),
      ],
    }),
    makeRoom('degagement', 4.07, 5.14, {
      ...base,
      name: 'Dégagement',
      w: 3,
      d: 1,
      openings: [makeOpening('porte', 'N', 0.5, { width: 0.93 })],
    }),
    makeRoom('sdb', 4.07, 6.21, {
      ...base,
      name: 'Salle d’eau + WC',
      w: 3,
      d: 2,
      wcIncluded: true,
      openings: [
        makeOpening('porte', 'N', 2.0, { width: 0.83 }),
        makeOpening('fenetre', 'S', 1.2, { width: 0.6, height: 0.6, sill: 1.6 }),
      ],
    }),
  ];
}

/** Hall central de 2 m : palier, escalier droit 1,00 × 4,41 m et passage latéral. */
function clientHall(plan: { ceilingHeight: number }, level: number, top: boolean): Room[] {
  const x = 7.14;
  const H = plan.ceilingHeight;
  const rooms: Room[] = [
    level === 0
      ? makeRoom('entree', x, 0, {
          level,
          name: 'Porche',
          w: 2,
          d: 2,
          openings: [
            makeOpening('baie', 'N', 0.3, { width: 1.4, height: H }),
            makeOpening('porte', 'S', 0.3, { width: 1.4, height: 2.15 }),
          ],
        })
      : makeRoom('terrasse', x, 0, {
          level,
          name: 'Loggia commune',
          w: 2,
          d: 2,
          openings: [makeOpening('porte', 'S', 0.3, { width: 1.4, height: 2.15 })],
        }),
    makeRoom('degagement', x, 2.07, {
      level,
      name: 'Palier',
      w: 2,
      d: 1.66,
      openings: [makeOpening('baie', 'S', 1.07, { width: 0.93, height: H })],
    }),
    makeRoom('degagement', x + 1.07, 3.8, { level, name: 'Passage', w: 0.93, d: 4.41 }),
  ];
  if (top) {
    rooms.push(
      makeRoom('tremie', x, 3.8, {
        level,
        name: 'Trémie',
        w: 1,
        d: 4.41,
        openings: [makeOpening('baie', 'E', 0, { width: 4.41, height: H })],
      }),
    );
  } else {
    rooms.push(
      makeRoom('escalier', x, 3.8, {
        level,
        name: 'Escalier',
        w: 1,
        d: 4.41,
        steps: 16,
        openings: [
          makeOpening('baie', 'N', 0, { width: 1, height: H }),
          makeOpening('baie', 'E', 0, { width: 4.41, height: H }),
        ],
      }),
    );
  }
  return rooms;
}

/**
 * Immeuble R+2 du client : 2 logements T2 symétriques par niveau autour d'un
 * hall central. Hypothèse : le R+2 reprend l'aménagement des niveaux inférieurs.
 */
export function sampleImmeuble(): Plan {
  const plan: Plan = {
    ...emptyPlan(),
    name: 'Immeuble R+2 — 6 logements T2',
    occupants: 3,
    levels: ['RDC', 'R+1', 'R+2'],
  };
  const axis = (0 + 16.28) / 2;
  plan.rooms = plan.levels.flatMap((name, level) => {
    const left = clientT2(`${name} · Logement A`, level);
    const right = mirrorRooms(clientT2(`${name} · Logement B`, level), axis);
    return [...left, ...right, ...clientHall(plan, level, level === plan.levels.length - 1)];
  });
  return plan;
}

/** Un seul logement du client, isolé (contrôle d'un T2 hors bâtiment). */
export function sampleImmeubleT2(level: 'RDC' | 'R+1'): Plan {
  return {
    ...emptyPlan(),
    name: `Immeuble R+2 — ${level}, logement gauche (T2 proposé)`,
    occupants: 3,
    upperFloor: level !== 'RDC',
    rooms: clientT2('', 0).map((r) => ({ ...r, unit: undefined })),
  };
}

export const EXAMPLES: { id: string; label: string; build: () => Plan }[] = [
  { id: 't3', label: 'Appartement T3', build: sampleT3 },
  { id: 'immeuble', label: 'Immeuble R+2 complet (6 T2)', build: sampleImmeuble },
  { id: 'immeuble-r1', label: 'Immeuble R+2 — un T2 en étage', build: () => sampleImmeubleT2('R+1') },
];
