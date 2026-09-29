import { PokeBind } from '@/components/pokebind';
import { cards, featured, sets, coverage } from '@/lib/catalog';

export default function Page() {
  const featuredIds = new Set(featured.map((card) => card.id));
  return (
    <PokeBind
      initialCards={cards.filter((card) => featuredIds.has(card.id))}
      featured={featured}
      sets={sets}
      coverage={coverage}
    />
  );
}
