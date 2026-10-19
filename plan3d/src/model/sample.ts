import { ROOM_TYPES } from '../rules/catalog';
import type { Opening, OpeningKind, Plan, Room, RoomType, Side } from './types';

let counter = 0;
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${(counter++).toString(36)}`;

export const OPENING_DEFAULTS: Record<OpeningKind, Omit<Opening, 'id' | 'side' | 'offset'>> = {
  porte: { kind: 'porte', width: 0.83, height: 2.04, sill: 0 },
  fenetre: { kind: 'fenetre', width: 1.2, height: 1.35, sill: 0.95 },
  'porte-fenetre': { kind: 'porte-fenetre', width: 1.4, height: 2.15, sill: 0 },
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

/**
 * Immeuble R+2 du client — logement gauche (le logement droit est symétrique).
 * Proposition : la pièce principale en L (7 × 6 m moins la salle d'eau) est
 * redécoupée en séjour 7 × 3 m, chambre 4 × 3 m et dégagement 3 × 1 m.
 * Hypothèse : les cotes du croquis sont prises comme cotes intérieures.
 */
export function sampleImmeubleT2(level: 'RDC' | 'R+1'): Plan {
  const rooms: Room[] = [
    makeRoom('terrasse', 0, 0, {
      name: 'Terrasse',
      w: 4,
      d: 2,
      openings: [makeOpening('porte', 'E', 0.2, { width: 0.8 })],
    }),
    makeRoom('cuisine', 4.07, 0, {
      name: 'Cuisine',
      w: 3,
      d: 2,
      openings: [
        makeOpening('fenetre', 'N', 1.0, { width: 1.0, height: 1.15, sill: 1.05 }),
        makeOpening('porte', 'S', 2.0, { width: 0.83 }),
      ],
    }),
    makeRoom('sejour', 0, 2.07, {
      name: 'Séjour',
      w: 7.07,
      d: 3,
      openings: [
        makeOpening('porte-fenetre', 'N', 1.3, { width: 1.4 }),
        makeOpening('fenetre', 'W', 0.8, { width: 1.4 }),
        makeOpening('porte', 'E', 0.9, { width: 0.93, entrance: true }),
      ],
    }),
    makeRoom('chambre', 0, 5.14, {
      name: 'Chambre',
      w: 4,
      d: 3,
      openings: [
        makeOpening('fenetre', 'S', 1.3, { width: 1.4 }),
        makeOpening('porte', 'E', 0.1, { width: 0.83 }),
      ],
    }),
    makeRoom('degagement', 4.07, 5.14, {
      name: 'Dégagement',
      w: 3,
      d: 1,
      openings: [makeOpening('porte', 'N', 0.5, { width: 0.93 })],
    }),
    makeRoom('sdb', 4.07, 6.21, {
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
  return {
    ...emptyPlan(),
    name: `Immeuble R+2 — ${level}, logement gauche (T2 proposé)`,
    occupants: 3,
    upperFloor: level !== 'RDC',
    rooms,
  };
}

export const EXAMPLES: { id: string; label: string; build: () => Plan }[] = [
  { id: 't3', label: 'Appartement T3', build: sampleT3 },
  { id: 'immeuble-rdc', label: 'Immeuble R+2 — RDC, T2 proposé', build: () => sampleImmeubleT2('RDC') },
  { id: 'immeuble-r1', label: 'Immeuble R+2 — R+1, T2 proposé', build: () => sampleImmeubleT2('R+1') },
];
