import 'server-only';
import snapshot from '@/data/catalog.json';
import official from '@/data/official-cards.json';
import type { CardBrief, CardDetail, Expansion } from './types';

// The full snapshot stays on the server; clients only receive the requested page.
export const officialById = new Map(official.cards.map((card) => [card.id, card]));
export const cards: CardBrief[] = snapshot.cards.map((card) => ({
  ...card,
  ...(officialById.get(card.id) ?? {}),
}));
export const sets = snapshot.sets as Expansion[];
export const featured: CardDetail[] = snapshot.featured.map((card) => ({
  ...card,
  ...(officialById.get(card.id) ?? {}),
})) as CardDetail[];
export const coverage = {
  ...snapshot.coverage,
  syncedAt: snapshot.syncedAt,
  officialCards: official.cards.length,
};
export const cardById = new Map(cards.map((card) => [card.id, card]));

export function fold(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
