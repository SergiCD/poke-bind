import { load } from 'cheerio';

/** Fail closed on protection pages, changed markup, missing fields or wrong language. */
export function parseOfficialCard(html, sourceUrl, id) {
  const url = new URL(sourceUrl);
  if (
    url.origin !== 'https://www.pokemon.com' ||
    !url.pathname.startsWith('/es/jcc-pokemon/cartas-pokemon/series/')
  ) {
    throw new Error('Solo se admiten fichas oficiales españolas de pokemon.com.');
  }
  if (/Incapsula|Request unsuccessful|Access Denied/i.test(html)) {
    throw new Error(
      'Pokémon ha bloqueado la petición automática. No se ha modificado el catálogo.',
    );
  }
  const $ = load(html);
  const name = $('h1').first().text().trim();
  // Image URLs are read from the source. Never synthesize them from an expansion code.
  const image = $('img[src*="/img/cards/web/"]').first().attr('src');
  if (
    !name ||
    !image ||
    !/^https:\/\/assets\.pokemon\.com\//.test(image) ||
    !image.includes('_ES_')
  ) {
    throw new Error(
      'La ficha no contiene una imagen española verificable. Revisa el HTML antes de importar.',
    );
  }
  const illustrator = $('a[href*="particularArtist="]').first().text().trim();
  return { id, name, image, sourceUrl: url.href, ...(illustrator ? { illustrator } : {}) };
}

/** Same Pokémon name is not enough: set and printed number must also match. */
export function verifyOfficialIdentity(sourceUrl, expected) {
  const match = new URL(sourceUrl).pathname.match(/\/series\/([^/]+)\/([^/]+)\/?$/);
  const aliases = { 'sv03.5': 'sv3pt5' };
  if (!match) throw new Error('La URL no identifica una carta.');
  const normalizeNumber = (value) =>
    /^\d+$/.test(value) ? String(Number(value)) : value.toUpperCase();
  if (
    (aliases[expected.setId] ?? expected.setId) !== match[1] ||
    normalizeNumber(expected.localId) !== normalizeNumber(match[2])
  ) {
    throw new Error('La expansión o el número no coinciden. Añade un mapeo explícito revisado.');
  }
}
