import type { CardDetail } from './types';

export type FoilStyle = 'standard' | 'illustration' | 'special' | 'gold' | 'prismatic';

export const foilStyleLabels: Record<FoilStyle, string> = {
  standard: 'Holo clásico',
  illustration: 'Ilustración',
  special: 'Ilustración especial',
  gold: 'Dorado',
  prismatic: 'Prismático',
};

/** Keep finish selection in one place so the binder and detail view agree. */
export function foilStyleFor(card?: Pick<CardDetail, 'rarity' | 'variants'>): FoilStyle | null {
  if (!card?.variants?.holo) return null;
  const rarity = (card.rarity ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/hiper|hyper|dorad|gold/.test(rarity)) return 'gold';
  if (/ilustracion especial|special illustration|sar|alternat|secreta/.test(rarity)) return 'special';
  if (/as tactico|ace spec|radiante|shiny|brillante|arcoiris|rainbow/.test(rarity)) return 'prismatic';
  if (/ilustracion|full art|ultra rara|galeria/.test(rarity)) return 'illustration';
  return 'standard';
}
