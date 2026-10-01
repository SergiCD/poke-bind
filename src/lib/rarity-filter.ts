import type { CardBrief } from './types';

export const UNKNOWN_RARITY = '__unknown__';

const spanishLabels: Record<string, string> = {
  Uncommon: 'Poco común',
  'Shiny rare': 'Rara variocolor',
  'Shiny rare V': 'Rara variocolor V',
  'Shiny rare VMAX': 'Rara variocolor VMAX',
  'Futuristic Rare': 'Rara futurista',
  'Mega Attack Rare': 'Rara Megaataque',
  'Pikachu Rare': 'Rara Pikachu',
  'RGB Rare': 'Rara RGB',
  'Entrenador de arte completo': 'Entrenador de ilustración completa',
  'Ninguno': 'Sin rareza indicada',
};

export function rarityLabel(rarity: string) {
  return spanishLabels[rarity] ?? rarity;
}

export function matchesRarity(card: CardBrief, rarity: string) {
  return !rarity || (rarity === UNKNOWN_RARITY ? !card.rarity : card.rarity === rarity);
}

/** Options are computed before text/rarity filtering, so the selector stays stable. */
export function rarityOptions(cards: CardBrief[]) {
  const counts = new Map<string, number>();
  let unknown = 0;
  for (const card of cards) {
    if (card.rarity) counts.set(card.rarity, (counts.get(card.rarity) ?? 0) + 1);
    else unknown++;
  }
  return {
    rarities: [...counts]
      .sort(([a], [b]) => rarityLabel(a).localeCompare(rarityLabel(b), 'es'))
      .map(([name, count]) => ({ name, count })),
    unknown,
  };
}
