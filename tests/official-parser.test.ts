import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOfficialCard, verifyOfficialIdentity } from '../scripts/lib/official-parser.mjs';

const url = 'https://www.pokemon.com/es/jcc-pokemon/cartas-pokemon/series/sv3pt5/166';
test('a matching Pokémon name cannot overwrite a different printing', () => {
  assert.doesNotThrow(() => verifyOfficialIdentity(url, { setId: 'sv03.5', localId: '166' }));
  assert.throws(() => verifyOfficialIdentity(url, { setId: 'sv03.5', localId: '001' }));
  assert.throws(() => verifyOfficialIdentity(url, { setId: 'base1', localId: '166' }));
});
test('protection pages cannot become an empty successful import', () => {
  assert.throws(
    () => parseOfficialCard('<html>Request unsuccessful. Incapsula</html>', url, 'sv03.5-166'),
    /bloqueado/,
  );
});
test('official image is read verbatim; English artwork and external URLs are rejected', () => {
  const image =
    'https://assets.pokemon.com/static-assets/content-assets/cms2-es-es/img/cards/web/SV3PT5/SV3PT5_ES_166.png';
  const html = `<h1>Bulbasaur</h1><img src="${image}"><a href="?particularArtist=Yoriyuki">Yoriyuki Ikegami</a>`;
  const card = parseOfficialCard(html, url, 'sv03.5-166');
  assert.equal(card.image, image);
  assert.equal(card.illustrator, 'Yoriyuki Ikegami');
  assert.throws(() => parseOfficialCard(html.replace('_ES_', '_EN_'), url, 'sv03.5-166'));
  assert.throws(() => parseOfficialCard(html, 'https://other.example/card', 'sv03.5-166'));
});
