import { describe, expect, it } from 'vitest';
import { doorLinks, stairGeometry } from '../model/geometry';
import { emptyPlan, makeOpening, makeRoom, sampleT3 } from '../model/sample';
import type { Plan } from '../model/types';
import { checkPlan, metrics } from './engine';

const ids = (plan: Plan) => checkPlan(plan).map((i) => i.ruleId);

describe('exemple T3', () => {
  it('ne contient aucune erreur bloquante hors accessibilité approchée', () => {
    const errors = checkPlan(sampleT3()).filter((i) => i.severity === 'error');
    expect(errors).toEqual([]);
  });

  it('calcule la surface habitable à partir des cotes intérieures', () => {
    const { habitableArea } = metrics(sampleT3());
    expect(habitableArea).toBeGreaterThan(70);
    expect(habitableArea).toBeLessThan(85);
  });

  it('relie les portes aux pièces voisines à travers la cloison', () => {
    const plan = sampleT3();
    const links = doorLinks(plan);
    const entrance = links.find((l) => l.opening.entrance);
    expect(entrance?.otherId).toBeNull();
    expect(links.filter((l) => l.otherId !== null).length).toBeGreaterThanOrEqual(6);
  });
});

describe('règles réglementaires', () => {
  it('signale une hauteur sous plafond indécente', () => {
    const plan = { ...sampleT3(), ceilingHeight: 2.1 };
    expect(ids(plan)).toContain('hsp-decence');
    expect(ids(plan)).toContain('hsp-neuf');
  });

  it('exige une pièce principale de 9 m²', () => {
    const plan: Plan = {
      ...emptyPlan(),
      rooms: [makeRoom('chambre', 0, 0, { w: 2.6, d: 3 })], // 7,8 m² × 2,50 = 19,5 m³
    };
    expect(ids(plan)).toContain('piece-principale');
  });

  it('accepte 20 m³ à défaut de 9 m²', () => {
    const plan: Plan = {
      ...emptyPlan(),
      ceilingHeight: 2.6,
      rooms: [makeRoom('chambre', 0, 0, { w: 2.8, d: 2.8 })],
    };
    expect(ids(plan)).not.toContain('piece-principale');
  });

  it('interdit un WC ouvrant sur la cuisine', () => {
    const plan: Plan = {
      ...emptyPlan(),
      rooms: [
        makeRoom('cuisine', 0, 0, { w: 3, d: 3 }),
        makeRoom('wc', 3.07, 0, { w: 1, d: 1.5, openings: [makeOpening('porte', 'W', 0.3, { width: 0.73 })] }),
      ],
    };
    expect(ids(plan)).toContain('wc-cuisine');
  });

  it('contrôle la largeur des portes en logement accessible', () => {
    const plan = sampleT3();
    plan.rooms[0].openings.push(makeOpening('porte', 'S', 0.2, { width: 0.73 }));
    const issue = checkPlan(plan).find((i) => i.ruleId === 'largeur-porte');
    expect(issue?.severity).toBe('error');
  });

  it('applique 14 m² par habitant', () => {
    const plan = { ...sampleT3(), occupants: 7 };
    expect(ids(plan)).toContain('surface-par-habitant');
  });
});

describe('géométrie', () => {
  it('détecte les chevauchements et les ouvertures hors mur', () => {
    const plan: Plan = {
      ...emptyPlan(),
      rooms: [
        makeRoom('sejour', 0, 0, { openings: [makeOpening('fenetre', 'N', 4.5)] }),
        makeRoom('chambre', 2, 2),
      ],
    };
    const found = ids(plan);
    expect(found).toContain('chevauchement');
    expect(found).toContain('ouverture-hors-mur');
  });
});

describe('escalier', () => {
  it('vérifie la formule de Blondel', () => {
    const plan: Plan = { ...emptyPlan(), rooms: [makeRoom('escalier', 0, 0, { w: 4.2, d: 0.9, steps: 16 })] };
    const g = stairGeometry(plan, plan.rooms[0]);
    expect(g.riser).toBeCloseTo(0.16875, 4);
    expect(g.blondel).toBeGreaterThanOrEqual(0.6);
    expect(g.blondel).toBeLessThanOrEqual(0.64);
    expect(ids(plan)).not.toContain('escalier-blondel');

    plan.rooms[0].w = 3;
    expect(ids(plan)).toContain('escalier-blondel');
  });
});
