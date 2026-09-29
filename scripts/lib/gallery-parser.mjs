import { load } from 'cheerio';

export function assertGalleryUrl(value) {
  const url = new URL(value);
  if (
    url.origin !== 'https://tcg.pokemon.com' ||
    !/^\/es-es\/galleries\/[a-z0-9-]+\/$/.test(url.pathname)
  )
    throw new Error('Se requiere una galería oficial española.');
  return url;
}

/** Read the page configuration, never infer an expansion from its translated name.
 * The JSON path follows the official gallery.js loader. Protection pages are errors.
 */
export function parseGalleryConfig(html, sourceUrl) {
  const url = assertGalleryUrl(sourceUrl);
  if (/Incapsula|Request unsuccessful|Access Denied/i.test(html))
    throw new Error('La galería devuelve una página de protección.');
  const $ = load(html);
  const gallery = $('[data-controller="GalleryCards"]');
  if (gallery.length !== 1)
    throw new Error('Galería ausente o con múltiples versiones: necesita revisión.');
  const slug = gallery.attr('data-expansion');
  const code = gallery.attr('data-expansion-id');
  const directory = gallery.attr('data-expansion-asset-path') || 'expansions';
  if (
    slug !== url.pathname.split('/')[3] ||
    !/^[a-z0-9]+$/i.test(code ?? '') ||
    !/^[a-z-]+$/.test(directory)
  )
    throw new Error('La identidad de la galería no coincide con su URL.');
  const legacy = /^SV/i.test(code);
  return {
    slug,
    code,
    jsonUrl: new URL(
      `/assets/img/${directory}/${legacy ? code.toLowerCase() : slug}/cards/cards.json`,
      url,
    ).href,
    filters: $('button[data-filter]')
      .map((_, e) => $(e).attr('data-filter'))
      .get(),
  };
}

/** Union ALL categories. seeall can omit classic collections and special artwork. */
export function parseGalleryCategories(data, config) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw new Error('Listado de cartas no válido.');
  for (const filter of config.filters) {
    if (!Array.isArray(data[filter]) || !data[filter].length)
      throw new Error(`Falta la categoría ${filter}; no se acepta una importación parcial.`);
  }
  const cards = new Map();
  for (const [category, numbers] of Object.entries(data)) {
    if (!Array.isArray(numbers)) throw new Error('Categoría no válida.');
    for (const number of numbers) {
      if (!/^\d{1,3}$/.test(String(number)) || Number(number) < 1)
        throw new Error('Numeración no reconocida.');
      const classic = category === 'classic-collection';
      const image = `https://dz3we2x72f7ol.cloudfront.net/expansions/${config.slug}/es-es/${config.code}${classic ? '_Classic' : ''}_ES_${Number(number)}.png`;
      cards.set(image, { number: Number(number), classic, image });
    }
  }
  if (!cards.size) throw new Error('No hay cartas; se conservan los datos anteriores.');
  return [...cards.values()];
}

/** Expand only reviewed observations. An explicit set mapping prevents cross-set matches. */
export function expandObservation(gallery, catalog) {
  const url = assertGalleryUrl(gallery.url);
  const set = catalog.sets.find((set) => set.id === gallery.setId);
  if (!set) throw new Error(`Expansión desconocida: ${gallery.setId}`);
  const prefix = `https://dz3we2x72f7ol.cloudfront.net/expansions/${url.pathname.split('/')[3]}/es-es/`;
  if (
    !gallery.imageTemplate.startsWith(prefix) ||
    !/^[A-Za-z0-9]+(?:_Classic)?_ES_\{number\}\.png$/.test(
      gallery.imageTemplate.slice(prefix.length),
    )
  )
    throw new Error('Imagen ajena a la galería o al idioma español.');
  if (!gallery.filters?.length || !gallery.ranges?.length) throw new Error('Observación vacía.');
  const seen = new Set();
  const cards = [];
  for (const [first, last] of gallery.ranges) {
    if (
      !Number.isInteger(first) ||
      !Number.isInteger(last) ||
      first < 1 ||
      last < first ||
      last > 999
    )
      throw new Error('Rango no válido.');
    for (let number = first; number <= last; number++) {
      if (seen.has(number)) throw new Error('Número duplicado en la observación.');
      seen.add(number);
      const existing = catalog.cards.find(
        (card) => card.setId === set.id && Number(card.localId) === number,
      );
      // Do not fabricate names or printing IDs. Missing records require a reviewed mapping.
      if (!existing) throw new Error(`Falta mapear ${set.id}, carta ${number}.`);
      cards.push({
        id: existing.id,
        name: existing.name,
        image: gallery.imageTemplate.replace('{number}', String(number)),
        sourceUrl: gallery.url,
      });
    }
  }
  return cards;
}

export function mergeOfficialCards(previous, imported) {
  const merged = new Map(previous.map((card) => [card.id, card]));
  for (const card of imported) merged.set(card.id, { ...merged.get(card.id), ...card });
  return [...merged.values()];
}
