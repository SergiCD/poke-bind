/** Refresh a Spanish-only snapshot. A failed request aborts before replacing data. */
import { mkdir, writeFile, rename } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../src/data/', import.meta.url));
const base = 'https://api.tcgdex.net/v2/es';
async function request(path) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(`${base}/${path}`, { signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      if (attempt === 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

const allSets = await request('sets');
const details = [];
let cursor = 0;
// Keep concurrency low: the public community service is not a bulk scraping target.
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (cursor < allSets.length) {
      const brief = allSets[cursor++];
      details.push(await request(`sets/${encodeURIComponent(brief.id)}`));
    }
  }),
);
const today = new Date().toISOString().slice(0, 10);
const physical = details.filter(
  (set) => set.serie?.id !== 'tcgp' && (!set.releaseDate || set.releaseDate <= today),
);
physical.sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
const sets = physical.map((set) => ({
  id: set.id,
  name: set.name,
  logo: set.logo,
  symbol: set.symbol,
  series: set.serie?.name ?? 'Otras colecciones',
  releaseDate: set.releaseDate,
  total: set.cardCount.total,
  official: set.cardCount.official,
  available: set.cards.length,
  withImage: set.cards.filter((card) => card.image).length,
  promo: /promo/i.test(set.name),
}));
const cards = physical.flatMap((set) =>
  set.cards.map((card) => ({
    id: card.id,
    name: card.name,
    localId: card.localId,
    image: card.image,
    setId: set.id,
    setName: set.name,
  })),
);
const featuredIds = [
  'sv03.5-166',
  'sv03.5-167',
  'sv03.5-198',
  'sv03.5-168',
  'sv03.5-169',
  'sv03.5-199',
  'sv03.5-170',
  'sv03.5-171',
  'sv03.5-200',
  'sv03.5-173',
  'sv03.5-172',
  'sv03.5-203',
];
const featured = [];
for (const id of featuredIds) {
  const card = await request(`cards/${id}`);
  // Prices are not a feature of this application and go stale independently.
  delete card.pricing;
  delete card.variants_detailed;
  featured.push(card);
}
const snapshot = {
  source: base,
  syncedAt: new Date().toISOString(),
  language: 'es',
  coverage: {
    sets: sets.length,
    cards: cards.length,
    withImage: cards.filter((card) => card.image).length,
    declaredCards: sets.reduce((sum, set) => sum + set.total, 0),
    excluded: details
      .filter((set) => !physical.includes(set))
      .map((set) => ({
        id: set.id,
        reason: set.serie?.id === 'tcgp' ? 'digital-pocket' : 'unreleased',
      })),
    officialVerification: false,
  },
  sets,
  cards,
  featured,
};
await mkdir(root, { recursive: true });
await writeFile(`${root}catalog.json.tmp`, JSON.stringify(snapshot));
await rename(`${root}catalog.json.tmp`, `${root}catalog.json`);
console.log(JSON.stringify(snapshot.coverage, null, 2));
