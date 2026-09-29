import { NextRequest, NextResponse } from 'next/server';
import { cards, cardById, fold, sets } from '@/lib/catalog';
import { z } from 'zod';

const querySchema = z.object({
  q: z.string().max(100).default(''),
  set: z.string().max(80).default(''),
  page: z.number().int().min(1).default(1),
  promo: z.boolean().default(false),
  ids: z.array(z.string().max(80)).max(50000).optional(),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Consulta no válida.' }, { status: 400 });
  }
  const parsed = querySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Consulta no válida.' }, { status: 400 });
  const { q, set, page, promo, ids } = parsed.data;
  const scope = ids ? new Set(ids) : null;
  const promos = new Set(sets.filter((item) => item.promo).map((item) => item.id));
  const filtered = cards.filter(
    (card) =>
      (!scope || scope.has(card.id)) &&
      (!set || card.setId === set) &&
      (!promo || promos.has(card.setId)) &&
      (!q || fold(`${card.name} ${card.localId} ${card.setName}`).includes(fold(q))),
  );
  return NextResponse.json({
    cards: filtered.slice((page - 1) * 48, page * 48),
    total: filtered.length,
    page,
    pages: Math.ceil(filtered.length / 48),
  });
}

export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const ids = params.get('ids');
  if (ids !== null) {
    const selected = ids
      .split(',')
      .slice(0, 360)
      .flatMap((id) => cardById.get(id) ?? []);
    return NextResponse.json({ cards: selected, total: selected.length });
  }
  const q = fold((params.get('q') ?? '').slice(0, 100));
  const set = params.get('set');
  const promos = new Set(sets.filter((item) => item.promo).map((item) => item.id));
  const filtered = cards.filter(
    (card) =>
      (!set || card.setId === set) &&
      (params.get('promo') !== 'true' || promos.has(card.setId)) &&
      (!q || fold(`${card.name} ${card.localId} ${card.setName}`).includes(q)),
  );
  const rawPage = Number(params.get('page') ?? 1);
  const page = Number.isFinite(rawPage) ? Math.max(1, Math.floor(rawPage)) : 1;
  const pageSize = 48;
  return NextResponse.json({
    cards: filtered.slice((page - 1) * pageSize, page * pageSize),
    total: filtered.length,
    page,
    pages: Math.ceil(filtered.length / pageSize),
  });
}
