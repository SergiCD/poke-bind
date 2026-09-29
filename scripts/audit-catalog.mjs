/** Report source coverage without interpreting provider totals as Spanish releases. */
import { readFile, writeFile } from 'node:fs/promises';
const read = async (path) => JSON.parse(await readFile(new URL(path, import.meta.url), 'utf8'));
const catalog = await read('../src/data/catalog.json');
const official = await read('../src/data/official-cards.json');
const observations = await read('./data/gallery-observations.json');
const verified = new Map(official.cards.map((card) => [card.id, card]));
const cards = catalog.cards.map((card) => ({ ...card, ...verified.get(card.id) }));
const sets = catalog.sets.map((set) => {
  const entries = cards.filter((card) => card.setId === set.id);
  return {
    ...set,
    available: entries.length,
    withImage: entries.filter((card) => card.image).length,
    verified: entries.filter((card) => verified.has(card.id)).length,
  };
});
const empty = sets.filter((set) => set.available === 0);
const report = [
  '# Auditoría de cobertura del catálogo',
  '',
  `Observaciones oficiales: ${observations.observedAt}. Respaldo: ${catalog.syncedAt}.`,
  '',
  `- ${sets.length} colecciones registradas; ${empty.length} sin cartas españolas importadas.`,
  `- ${cards.length} cartas catalogadas; ${cards.filter((card) => !card.image).length} sin URL de imagen.`,
  `- ${verified.size} imágenes oficiales incorporadas. Tener URL no garantiza disponibilidad futura.`,
  '- Las galerías revisadas cubren Megaevolución y Escarlata y Púrpura; no resuelven el histórico ni todas las promos.',
  '',
  '## Galerías pendientes de acceso',
  '',
  'Las páginas o sus datos no cargaron cartas durante la revisión. Se conserva el respaldo; no se marca una importación vacía como correcta.',
  '',
  ...observations.pending.map(
    (slug) => `- [${slug}](https://tcg.pokemon.com/es-es/galleries/${slug}/)`,
  ),
  '',
  '## Cobertura por colección',
  '',
  'El total del proveedor es orientativo y puede incluir impresiones no disponibles en español. No equivale a un checklist oficial verificado.',
  '',
  '| Colección | ID | Cartas | Con imagen | Imagen oficial | Total proveedor |',
  '| --- | --- | ---: | ---: | ---: | ---: |',
  ...sets.map(
    (set) =>
      `| ${set.name} | ${set.id} | ${set.available} | ${set.withImage} | ${set.verified} | ${set.total} |`,
  ),
  '',
].join('\n');
await writeFile(new URL('../docs/auditoria-catalogo.md', import.meta.url), report);
console.log(
  `${empty.length} colecciones pendientes de importar. Informe: docs/auditoria-catalogo.md`,
);
