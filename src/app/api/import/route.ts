import { NextResponse } from 'next/server';
import { cardById } from '@/lib/catalog';
import { workspaceSchema } from '@/lib/workspace';

export async function POST(request: Request) {
  try {
    const data = workspaceSchema.parse(await request.json());
    const ids = [
      ...data.owned,
      ...data.wishlist,
      ...data.binders.flatMap((binder) => binder.slots.filter((id): id is string => !!id)),
    ];
    const missing = [...new Set(ids.filter((id) => !cardById.has(id)))];
    if (missing.length)
      return NextResponse.json(
        {
          error: `La copia contiene ${missing.length} cartas que no están en el catálogo actual. Conserva el archivo para revisarlas.`,
        },
        { status: 422 },
      );
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ error: 'La copia no tiene un formato válido.' }, { status: 400 });
  }
}
