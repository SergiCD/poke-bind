import assert from 'node:assert/strict';
import test from 'node:test';
import rarityIndex from '../src/data/rarity-index.json';
import { cardFinishFor, supportedRarities } from '../src/lib/foil';

test('las 29 rarezas catalogadas tienen perfiles visuales distintos', () => {
  const indexed = [...new Set(Object.values(rarityIndex.cards))];
  assert.equal(indexed.length, 29);
  assert.deepEqual([...supportedRarities].sort(), indexed.sort());
  const finishes = indexed.map((rarity) => cardFinishFor({ rarity }));
  assert.equal(new Set(finishes.map(({ family, hueA, hueB, angle, pitch }) =>
    `${family}/${hueA}/${hueB}/${angle}/${pitch}`)).size, indexed.length);
});

test('las variantes explícitas prevalecen sobre la rareza', () => {
  assert.equal(cardFinishFor({ rarity: 'Rara Ilustración Especial' }).holo, true);
  assert.equal(cardFinishFor({ rarity: 'Rara Ilustración Especial', variants: { holo: false } }).holo, false);
  assert.equal(cardFinishFor({ rarity: 'Común' }).holo, false);
  assert.equal(cardFinishFor({ rarity: 'Común', variants: { holo: true } }).holo, true);
});
