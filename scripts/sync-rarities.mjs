/** Build a local rarity index from TCGdex's Spanish rarity and card endpoints. */
import { readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dataDir = fileURLToPath(new URL('../src/data/', import.meta.url));
const catalog = JSON.parse(await readFile(`${dataDir}catalog.json`, 'utf8'));
const known = new Set(catalog.cards.map((card) => card.id));
const base = 'https://api.tcgdex.net/v2/es';

async function request(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${base}/${path}`, { signal: AbortSignal.timeout(30_000) });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

const rarities = await request('rarities');
const byId = new Map();
let cursor = 0;
// Four workers keep requests modest and preserve atomic output on failure.
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (cursor < rarities.length) {
      const rarity = rarities[cursor++];
      // TCGdex defaults to substring matching: "Holo Rara V" also finds VMAX.
      const cards = await request(`cards?rarity=${encodeURIComponent(`eq:${rarity}`)}`);
      for (const card of cards) {
        if (!known.has(card.id)) continue;
        const previous = byId.get(card.id);
        if (previous && previous !== rarity)
          throw new Error(`Rareza contradictoria para ${card.id}: ${previous} / ${rarity}`);
        byId.set(card.id, rarity);
      }
    }
  }),
);

const index = {
  source: `${base}/rarities`,
  syncedAt: new Date().toISOString(),
  cards: Object.fromEntries([...byId].sort(([a], [b]) => a.localeCompare(b))),
};
await writeFile(`${dataDir}rarity-index.json.tmp`, JSON.stringify(index));
await rename(`${dataDir}rarity-index.json.tmp`, `${dataDir}rarity-index.json`);
console.log(`${byId.size} / ${known.size} cartas clasificadas`);
