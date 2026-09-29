import { NextResponse } from 'next/server';
import { cardById, featured, officialById } from '@/lib/catalog';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!cardById.has(id))
    return NextResponse.json({ error: 'Carta no encontrada.' }, { status: 404 });
  const verified = officialById.get(id);
  const local = featured.find((card) => card.id === id);
  if (verified && local) return NextResponse.json(local);
  try {
    const response = await fetch(`https://api.tcgdex.net/v2/es/cards/${encodeURIComponent(id)}`, {
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Provider unavailable');
    const card = await response.json();
    delete card.pricing;
    delete card.variants_detailed;
    return NextResponse.json({ ...card, ...(verified ?? {}) });
  } catch {
    const fallback = featured.find((card) => card.id === id);
    if (fallback) return NextResponse.json(fallback);
    return NextResponse.json(
      { error: 'No se ha podido cargar la ficha. Vuelve a intentarlo.' },
      { status: 502 },
    );
  }
}
