import { z } from 'zod';

const cardId = z.string().min(1).max(80);
export const binderSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(60),
    columns: z.union([z.literal(2), z.literal(3)]),
    color: z.enum(['mint', 'blue', 'lilac', 'peach']),
    slots: z.array(cardId.nullable()).min(4).max(360),
  })
  .refine((b) => b.slots.length % b.columns ** 2 === 0, 'Las páginas deben estar completas.');

export const workspaceSchema = z
  .object({
    version: z.literal(1),
    binders: z.array(binderSchema).max(30),
    owned: z.array(cardId).max(50000),
    wishlist: z.array(cardId).max(50000),
  })
  .refine(
    (data) => new Set(data.binders.map((binder) => binder.id)).size === data.binders.length,
    'Cada binder debe tener un identificador único.',
  )
  .refine(
    (data) =>
      new Set(data.owned).size === data.owned.length &&
      new Set(data.wishlist).size === data.wishlist.length,
    'La colección y los deseos no deben contener identificadores duplicados.',
  );
export type Binder = z.infer<typeof binderSchema>;
export type Workspace = z.infer<typeof workspaceSchema>;

export function emptyWorkspace(): Workspace {
  return { version: 1, binders: [], owned: [], wishlist: [] };
}

/** An explicitly local example. No cards are marked as owned on the user's behalf. */
export function demoWorkspace(): Workspace {
  return {
    version: 1,
    binders: [
      {
        id: 'a89dd958-7f21-4b9d-a87f-cfa55453e38a',
        name: 'Favoritas de Kanto',
        columns: 3,
        color: 'mint',
        slots: [
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
          null,
          null,
          null,
          null,
          null,
          null,
        ],
      },
    ],
    owned: [],
    wishlist: [],
  };
}

/** Resize preserves every position, including intentional gaps, and appends blank pockets. */
export function resizeBinder(binder: Binder, columns: 2 | 3): Binder {
  const capacity = columns ** 2;
  const length = Math.ceil(binder.slots.length / capacity) * capacity;
  return {
    ...binder,
    columns,
    slots: [...binder.slots, ...Array(length - binder.slots.length).fill(null)],
  };
}

export function moveCard(binder: Binder, from: number, to: number): Binder {
  if (
    ![from, to].every(
      (index) => Number.isInteger(index) && index >= 0 && index < binder.slots.length,
    )
  )
    return binder;
  const slots = [...binder.slots];
  [slots[from], slots[to]] = [slots[to], slots[from]];
  return { ...binder, slots };
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}
