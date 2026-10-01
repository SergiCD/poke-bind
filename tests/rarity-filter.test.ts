import assert from 'node:assert/strict';
import test from 'node:test';
import catalog from '../src/data/catalog.json';
import index from '../src/data/rarity-index.json';
import { matchesRarity, rarityLabel, rarityOptions, UNKNOWN_RARITY } from '../src/lib/rarity-filter';

test('el índice cubre todas las cartas importadas, con rarezas exactas', () => {
  const indexed = index.cards as Record<string, string>;
  assert.equal(Object.keys(indexed).length, catalog.cards.length);
  assert.ok(catalog.cards.every((card) => indexed[card.id]));
  assert.equal(indexed['sv03.5-166'], 'Rara Ilustración');
  assert.equal(indexed['sv03.5-198'], 'Rara Ilustración Especial');
});

test('el filtro distingue rarezas parecidas y conserva cartas sin clasificar', () => {
  const cards = [
    { id: 'a', name: 'A', localId: '1', setId: 's', setName: 'S', rarity: 'Holo Rara V' },
    { id: 'b', name: 'B', localId: '2', setId: 's', setName: 'S', rarity: 'Holo Rara VMAX' },
    { id: 'c', name: 'C', localId: '3', setId: 's', setName: 'S' },
  ];
  assert.deepEqual(cards.filter((card) => matchesRarity(card, 'Holo Rara V')).map((card) => card.id), ['a']);
  assert.deepEqual(cards.filter((card) => matchesRarity(card, UNKNOWN_RARITY)).map((card) => card.id), ['c']);
  assert.equal(rarityOptions(cards).unknown, 1);
  assert.equal(rarityLabel('Uncommon'), 'Poco común');
});
