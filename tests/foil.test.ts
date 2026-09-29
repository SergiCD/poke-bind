import assert from 'node:assert/strict';
import test from 'node:test';
import { foilStyleFor } from '../src/lib/foil';

test('clasifica las cinco familias holo por rareza', () => {
  const variants = { holo: true };
  assert.equal(foilStyleFor({ rarity: 'Rara', variants }), 'standard');
  assert.equal(foilStyleFor({ rarity: 'Rara Ilustración', variants }), 'illustration');
  assert.equal(foilStyleFor({ rarity: 'Rara Ilustración Especial', variants }), 'special');
  assert.equal(foilStyleFor({ rarity: 'Mega Híper Rara', variants }), 'gold');
  assert.equal(foilStyleFor({ rarity: 'Rara AS TÁCTICO', variants }), 'prismatic');
});

test('no añade foil a una carta sin variante holo', () => {
  assert.equal(foilStyleFor({ rarity: 'Rara Ilustración Especial', variants: { holo: false } }), null);
  assert.equal(foilStyleFor(undefined), null);
});
