// Unités : mètres. Repère plan : x vers l'est, y vers le sud (comme un dessin à l'écran).
// Une pièce est un rectangle de dimensions INTÉRIEURES (hors murs) : c'est la base
// de calcul de la surface habitable.

export type RoomType =
  | 'sejour'
  | 'chambre'
  | 'cuisine'
  | 'sdb'
  | 'wc'
  | 'entree'
  | 'degagement'
  | 'bureau'
  | 'cellier'
  | 'escalier'
  | 'terrasse'
  | 'tremie';

/** Côté d'une pièce : N = haut (y min), S = bas, W = gauche (x min), E = droite. */
export type Side = 'N' | 'S' | 'E' | 'W';

/** 'baie' = passage libre sans menuiserie (cuisine ouverte, départ d'escalier…). */
export type OpeningKind = 'porte' | 'fenetre' | 'porte-fenetre' | 'baie';

export interface Opening {
  id: string;
  kind: OpeningKind;
  side: Side;
  /** Distance depuis le début du côté (ouest pour N/S, nord pour E/W). */
  offset: number;
  /** Largeur nominale. */
  width: number;
  height: number;
  /** Hauteur d'allège (0 pour une porte). */
  sill: number;
  /** Porte d'entrée du logement (porte palière / extérieure). */
  entrance?: boolean;
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  x: number;
  y: number;
  w: number;
  d: number;
  openings: Opening[];
  /** Niveau (0 = RDC). */
  level?: number;
  /** Logement d'appartenance ; vide = parties communes. */
  unit?: string;
  /** Salle d'eau intégrant le WC. */
  wcIncluded?: boolean;
  /** Escalier droit uniquement : nombre de hauteurs de marche. */
  steps?: number;
}

export interface Plan {
  name: string;
  /** Hauteur sous plafond. */
  ceilingHeight: number;
  /** Épaisseur du plancher (pour la hauteur d'étage des escaliers). */
  slabThickness: number;
  /** Nombre d'occupants prévus au programme. */
  occupants: number;
  /** Épaisseur des cloisons intérieures (écart entre deux pièces voisines). */
  partitionThickness: number;
  exteriorWallThickness: number;
  /** Logement neuf soumis aux règles d'accessibilité PMR. */
  accessible: boolean;
  /** Force le contrôle « en étage » pour un plan d'un seul niveau situé en étage. */
  upperFloor: boolean;
  /** Noms des niveaux, du bas vers le haut (index = Room.level). */
  levels: string[];
  rooms: Room[];
}
