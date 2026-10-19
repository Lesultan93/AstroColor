import type { RoomType } from '../model/types';

/**
 * Nature d'une source :
 * - reglementaire : texte opposable en France (référence de pratique au Gabon, non opposable de plein droit) ;
 * - norme : norme NF/DTU (contractuelle, rendue obligatoire par certains textes) ;
 * - usage : règle de l'art, ergonomie (Neufert) — recommandation, pas obligation ;
 * - modele : cohérence géométrique du dessin.
 */
export type SourceKind = 'reglementaire' | 'norme' | 'usage' | 'modele';

export interface Source {
  label: string;
  kind: SourceKind;
  /** Réserve à lever avant usage contractuel. */
  verify?: string;
}

export const SOURCES = {
  DECENCE: {
    label: 'Décret n° 2002-120 du 30 janvier 2002 (logement décent)',
    kind: 'reglementaire',
  },
  CCH: {
    label: 'Code de la construction et de l’habitation, ex-art. R.111-2',
    kind: 'reglementaire',
    verify: 'Code recodifié au 1er juillet 2022 : numéro d’article actuel à confirmer.',
  },
  PMR: {
    label: 'Arrêté du 24 décembre 2015 (accessibilité des logements neufs)',
    kind: 'reglementaire',
  },
  PMR_APPROX: {
    label: 'Arrêté du 24 décembre 2015 — contrôle approché',
    kind: 'reglementaire',
    verify:
      'Vérification simplifiée (dimensions minimales de la pièce) : le placement réel du lit, de la cuvette et des espaces d’usage doit être contrôlé sur plan.',
  },
  RSD: {
    label: 'Règlement sanitaire départemental type (circulaire du 9 août 1978)',
    kind: 'reglementaire',
    verify: 'Le RSD varie selon les départements.',
  },
  RT2012: {
    label: 'RT 2012 — arrêté du 26 octobre 2010, art. 20 (baies ≥ 1/6 de la SHAB)',
    kind: 'reglementaire',
    verify: 'Maintien de l’exigence sous la RE 2020 à confirmer.',
  },
  GARDE_CORPS: {
    label: 'NF P01-012 (dimensions des garde-corps)',
    kind: 'norme',
    verify: 'Hauteur réductible selon l’épaisseur de l’allège (0,90 m ou 0,80 m) : à vérifier au cas par cas.',
  },
  ELAN: {
    label: 'Loi ELAN du 23 novembre 2018 — ascenseur dans les logements collectifs neufs',
    kind: 'reglementaire',
    verify: 'Seuil (bâtiments de plus de deux étages, soit R+3) et date d’application à confirmer.',
  },
  NEUFERT: { label: 'Neufert, Les éléments des projets de construction', kind: 'usage' },
  BLONDEL: { label: 'Formule de Blondel : 2h + g = 60 à 64 cm', kind: 'usage' },
  USAGE: { label: 'Règle de l’art / usage professionnel', kind: 'usage' },
  MODELE: { label: 'Cohérence du modèle', kind: 'modele' },
} as const satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;

export interface RoomTypeSpec {
  label: string;
  color: string;
  /** Pièce principale au sens du décret décence (séjour, chambres). */
  principal: boolean;
  /** Compte dans la surface habitable (exclut escaliers, celliers/remises). */
  habitable: boolean;
  minArea: number;
  recommendedArea: number;
  minWidth: number;
  /** Justification des seuils minArea / minWidth. */
  rationale: string;
  defaultSize: [number, number];
}

// Seuils d'usage : ordres de grandeur Neufert / pratique courante en logement.
// Ce sont des recommandations (avertissements), sauf mention réglementaire dans le moteur.
export const ROOM_TYPES: Record<RoomType, RoomTypeSpec> = {
  sejour: {
    label: 'Séjour',
    color: '#e9c46a',
    principal: true,
    habitable: true,
    minArea: 16,
    recommendedArea: 20,
    minWidth: 3.2,
    rationale: 'Canapé + table 4 couverts + circulations (Neufert)',
    defaultSize: [5, 4.2],
  },
  chambre: {
    label: 'Chambre',
    color: '#8ecae6',
    principal: true,
    habitable: true,
    minArea: 9,
    recommendedArea: 11,
    minWidth: 2.6,
    rationale: 'Lit 1,40 m + passages latéraux de 0,60 m (Neufert)',
    defaultSize: [3.2, 3.4],
  },
  cuisine: {
    label: 'Cuisine',
    color: '#f4a261',
    principal: false,
    habitable: true,
    minArea: 5,
    recommendedArea: 8,
    minWidth: 1.5,
    rationale: 'Plan de travail 0,60 m + passage 0,90 m (implantation linéaire)',
    defaultSize: [3, 2.6],
  },
  sdb: {
    label: 'Salle d’eau / SdB',
    color: '#90e0ef',
    principal: false,
    habitable: true,
    minArea: 3,
    recommendedArea: 5,
    minWidth: 1.4,
    rationale: 'Receveur 0,80–0,90 m + lavabo + passage',
    defaultSize: [2.2, 2.2],
  },
  wc: {
    label: 'WC',
    color: '#bde0fe',
    principal: false,
    habitable: true,
    minArea: 1.1,
    recommendedArea: 1.5,
    minWidth: 0.8,
    rationale: 'Cuvette + dégagement frontal 0,60 m (usage)',
    defaultSize: [0.95, 1.5],
  },
  entree: {
    label: 'Entrée',
    color: '#d8e2dc',
    principal: false,
    habitable: true,
    minArea: 2,
    recommendedArea: 4,
    minWidth: 1.2,
    rationale: 'Débattement de porte + rangement (usage)',
    defaultSize: [2, 1.8],
  },
  degagement: {
    label: 'Dégagement',
    color: '#e5e5e5',
    principal: false,
    habitable: true,
    minArea: 0,
    recommendedArea: 0,
    minWidth: 0.9,
    rationale: 'Largeur de circulation 0,90 m',
    defaultSize: [4, 1],
  },
  bureau: {
    label: 'Bureau',
    color: '#cdb4db',
    principal: true,
    habitable: true,
    minArea: 7,
    recommendedArea: 9,
    minWidth: 2.2,
    rationale: 'Plan de travail 1,20 m + siège + recul (Neufert)',
    defaultSize: [3, 3],
  },
  cellier: {
    label: 'Cellier / rangement',
    color: '#c9c5ba',
    principal: false,
    habitable: false,
    minArea: 0,
    recommendedArea: 0,
    minWidth: 0,
    rationale: '',
    defaultSize: [1.5, 1.5],
  },
  escalier: {
    label: 'Escalier (droit)',
    color: '#a3a380',
    principal: false,
    habitable: false,
    minArea: 0,
    recommendedArea: 0,
    minWidth: 0.8,
    rationale: 'Largeur d’emmarchement 0,80 m (usage, maison individuelle)',
    defaultSize: [4.2, 0.9],
  },
  terrasse: {
    label: 'Terrasse / balcon',
    color: '#b7d7a8',
    principal: false,
    habitable: false,
    minArea: 0,
    recommendedArea: 0,
    minWidth: 0,
    rationale: '',
    defaultSize: [3, 2],
  },
  tremie: {
    label: 'Trémie / vide',
    color: '#f4f4f5',
    principal: false,
    habitable: false,
    minArea: 0,
    recommendedArea: 0,
    minWidth: 0,
    rationale: '',
    defaultSize: [1, 4],
  },
};

export const ROOM_TYPE_ORDER = Object.keys(ROOM_TYPES) as RoomType[];
