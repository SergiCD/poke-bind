/** Import an observed official card URL or a locally saved copy of that same page.
 * Usage: npm run catalog:official -- <existing-card-id> <official-url> [saved.html]
 * Automated protection is a hard stop, not a reason to overwrite verified data.
 */
import { readFile, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { parseOfficialCard, verifyOfficialIdentity } from './lib/official-parser.mjs';

const [id, sourceUrl, savedHtml] = process.argv.slice(2);
const path = fileURLToPath(new URL('../src/data/official-cards.json', import.meta.url));
try {
  if (!id || !sourceUrl)
    throw new Error('Uso: npm run catalog:official -- <id> <url-oficial> [ficha.html]');
  const url = new URL(sourceUrl);
  if (
    url.origin !== 'https://www.pokemon.com' ||
    !url.pathname.startsWith('/es/jcc-pokemon/cartas-pokemon/series/')
  )
    throw new Error('URL oficial española no válida.');
  const catalog = JSON.parse(
    await readFile(new URL('../src/data/catalog.json', import.meta.url), 'utf8'),
  );
  const expected = catalog.cards.find((card) => card.id === id);
  if (!expected)
    throw new Error(
      'El identificador debe existir en el catálogo. Añade un mapeo revisado antes de crear nuevas cartas.',
    );
  verifyOfficialIdentity(sourceUrl, expected);
  let html;
  if (savedHtml) html = await readFile(savedHtml, 'utf8');
  else {
    const response = await fetch(sourceUrl, {
      signal: AbortSignal.timeout(20000),
      redirect: 'error',
    });
    if (!response.ok)
      throw new Error(
        `Pokémon respondió HTTP ${response.status}; no se ha modificado el catálogo.`,
      );
    html = await response.text();
  }
  const card = parseOfficialCard(html, sourceUrl, id);
  if (card.name.toLowerCase() !== expected.name.toLowerCase())
    throw new Error('El nombre no coincide con el identificador. Revisa el mapeo manualmente.');
  const snapshot = JSON.parse(await readFile(path, 'utf8'));
  const existing = snapshot.cards.findIndex((item) => item.id === id);
  if (existing >= 0) snapshot.cards[existing] = { ...snapshot.cards[existing], ...card };
  else snapshot.cards.push(card);
  snapshot.verifiedAt = new Date().toISOString().slice(0, 10);
  await writeFile(`${path}.tmp`, JSON.stringify(snapshot, null, 2) + '\n');
  await rename(`${path}.tmp`, path);
  console.log(`Importada ficha oficial: ${card.name} (${id}).`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
