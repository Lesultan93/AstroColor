import { describe, expect, it } from 'vitest';
import { sampleImmeuble, sampleT3 } from '../model/sample';
import { buildPlansPdf, buildingBounds, chooseScale, dimensionChain } from './pdf';

describe('export PDF', () => {
  it('retient le 1/50 quand le bâtiment tient sur un A3', () => {
    expect(chooseScale(buildingBounds(sampleImmeuble()))).toBe(50);
  });

  it('passe au 1/100 pour un grand bâtiment', () => {
    expect(chooseScale({ minX: 0, minY: 0, maxX: 30, maxY: 12 })).toBe(100);
  });

  it('fusionne les arêtes alignées dans la chaîne de cotes', () => {
    expect(dimensionChain([4, 0, 4.005, 7.07, 0])).toEqual([0, 4, 7.07]);
  });

  it('produit une planche par niveau occupé', async () => {
    const doc = await buildPlansPdf(sampleImmeuble());
    expect(doc.getNumberOfPages()).toBe(3);
    const single = await buildPlansPdf(sampleT3());
    expect(single.getNumberOfPages()).toBe(1);
  });
});
