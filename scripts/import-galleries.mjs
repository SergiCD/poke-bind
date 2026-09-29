/** Rebuild the official image overlay from reviewed browser observations.
 * --refresh reads the public gallery HTML + JSON instead; any failed gallery aborts.
 * --verify-images checks every imported image before the atomic write.
 */
import { readFile, writeFile, rename } from 'node:fs/promises';
import {
  expandObservation,
  mergeOfficialCards,
  parseGalleryConfig,
  parseGalleryCategories,
} from './lib/gallery-parser.mjs';

const observations = JSON.parse(
  await readFile(new URL('./data/gallery-observations.json', import.meta.url), 'utf8'),
);
const catalog = JSON.parse(
  await readFile(new URL('../src/data/catalog.json', import.meta.url), 'utf8'),
);
const destination = new URL('../src/data/official-cards.json', import.meta.url);
const previous = JSON.parse(await readFile(destination, 'utf8'));
const imported = [];
const reports = [];
const live = new Map();

async function get(url, method = 'GET') {
  const response = await fetch(url, {
    method,
    redirect: 'error',
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}

try {
  for (const gallery of observations.galleries) {
    let cards;
    if (process.argv.includes('--refresh')) {
      if (!live.has(gallery.url)) {
        const config = parseGalleryConfig(await (await get(gallery.url)).text(), gallery.url);
        const categories = await (await get(config.jsonUrl)).json();
        live.set(gallery.url, parseGalleryCategories(categories, config));
      }
      const classic = gallery.setId === '30th-c';
      cards = live
        .get(gallery.url)
        .filter((card) => card.classic === classic)
        .map((card) => {
          const match = catalog.cards.find(
            (item) => item.setId === gallery.setId && Number(item.localId) === card.number,
          );
          if (!match) throw new Error(`Falta mapear ${gallery.setId}, carta ${card.number}.`);
          return { id: match.id, name: match.name, image: card.image, sourceUrl: gallery.url };
        });
      if (!cards.length) throw new Error(`Galería vacía: ${gallery.url}`);
    } else cards = expandObservation(gallery, catalog);
    imported.push(...cards);
    const current = catalog.cards.filter((card) => card.setId === gallery.setId);
    const ids = new Set(cards.map((card) => card.id));
    reports.push({
      setId: gallery.setId,
      officialImages: cards.length,
      retainedOutsideGallery: current.filter((card) => !ids.has(card.id)).map((card) => card.id),
    });
  }
  if (process.argv.includes('--verify-images')) {
    let cursor = 0;
    const failures = [];
    await Promise.all(
      Array.from({ length: 4 }, async () => {
        while (cursor < imported.length) {
          const card = imported[cursor++];
          try {
            const response = await get(card.image, 'HEAD');
            if (!response.headers.get('content-type')?.startsWith('image/'))
              throw new Error('La respuesta no es una imagen.');
          } catch (error) {
            failures.push(`${card.id}: ${error.message}`);
          }
        }
      }),
    );
    if (failures.length) throw new Error(failures.join('\n'));
  }
  const cards = mergeOfficialCards(previous.cards, imported);
  const output = {
    ...previous,
    verifiedAt: process.argv.includes('--refresh')
      ? new Date().toISOString().slice(0, 10)
      : observations.observedAt,
    cards,
  };
  const temp = new URL(`${destination.href}.tmp`);
  await writeFile(temp, JSON.stringify(output, null, 2) + '\n');
  await rename(temp, destination);
  console.log(
    JSON.stringify(
      { officialImages: imported.length, reports, pendingGalleries: observations.pending },
      null,
      2,
    ),
  );
} catch (error) {
  console.error(`No se ha modificado el catálogo: ${error.message}`);
  process.exitCode = 1;
}
