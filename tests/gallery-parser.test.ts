import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  expandObservation,
  mergeOfficialCards,
  parseGalleryCategories,
  parseGalleryConfig,
} from '../scripts/lib/gallery-parser.mjs';

const url = 'https://tcg.pokemon.com/es-es/galleries/chaos-rising/';
const html =
  '<ul data-controller="GalleryCards" data-expansion="chaos-rising" data-expansion-id="SN54" data-expansion-asset-path="me-expansions"></ul><button data-filter="seeall"></button><button data-filter="special-art"></button>';

test('gallery identity comes from page attributes, not a translated expansion name', () => {
  const config = parseGalleryConfig(html, url);
  assert.equal(
    config.jsonUrl,
    'https://tcg.pokemon.com/assets/img/me-expansions/chaos-rising/cards/cards.json',
  );
  assert.throws(() => parseGalleryConfig(html, url.replace('chaos-rising', 'paldean-fates')));
  assert.throws(() => parseGalleryConfig('Request unsuccessful. Incapsula', url));
});

test('special categories add omitted cards and classic numbering remains separate', () => {
  const config = {
    slug: '30th-celebration',
    code: '2M6P',
    filters: ['seeall', 'special-art', 'classic-collection'],
  };
  const cards = parseGalleryCategories(
    { seeall: [1, 2], 'special-art': [2, 3], 'classic-collection': [1] },
    config,
  );
  assert.equal(cards.length, 4);
  assert.equal(cards.filter((card) => card.classic).length, 1);
  assert.throws(() => parseGalleryCategories({ seeall: [1] }, config));
});

test('reviewed observations cannot overwrite another set or use foreign artwork', () => {
  const catalog = {
    sets: [{ id: 'me04' }],
    cards: [{ id: 'me04-001', setId: 'me04', localId: '001', name: 'Carta' }],
  };
  const observation = {
    url,
    setId: 'me04',
    imageTemplate:
      'https://dz3we2x72f7ol.cloudfront.net/expansions/chaos-rising/es-es/SN54_ES_{number}.png',
    ranges: [[1, 1]],
    filters: ['seeall'],
  };
  assert.equal(expandObservation(observation, catalog)[0].id, 'me04-001');
  assert.throws(() => expandObservation({ ...observation, ranges: [[1, 2]] }, catalog));
  assert.throws(() =>
    expandObservation(
      { ...observation, imageTemplate: observation.imageTemplate.replace('es-es', 'en-us') },
      catalog,
    ),
  );
});

test('a smaller gallery never removes saved official cards or metadata', () => {
  const before = [
    { id: 'a', hp: 70, image: 'old' },
    { id: 'b', image: 'kept' },
  ];
  assert.deepEqual(mergeOfficialCards(before, [{ id: 'a', image: 'new' }]), [
    { id: 'a', hp: 70, image: 'new' },
    { id: 'b', image: 'kept' },
  ]);
  assert.equal(before[0].image, 'old');
});
