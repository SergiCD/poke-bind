'use client';
import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Grip, Plus, Sparkles } from 'lucide-react';
import type { Binder } from '@/lib/workspace';
import type { CardBrief, CardDetail } from '@/lib/types';
import { CardArt } from './card-art';

interface Props {
  binder: Binder;
  cards: Record<string, CardBrief>;
  details: CardDetail[];
  owned: string[];
  editable: boolean;
  arranging: boolean;
  onOpen: (card: CardBrief, slot: number) => void;
  onAdd: (slot: number) => void;
  onMove: (from: number, to: number) => void;
  onAddPage: () => void;
}

export function BinderView({
  binder,
  cards,
  details,
  owned,
  editable,
  arranging,
  onOpen,
  onAdd,
  onMove,
  onAddPage,
}: Props) {
  const [page, setPage] = useState(0);
  const [mobile, setMobile] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [loadedDetails, setLoadedDetails] = useState<Record<string, CardDetail>>({});
  const capacity = binder.columns ** 2;
  const pages = binder.slots.length / capacity;
  useEffect(() => {
    const media = matchMedia('(max-width: 760px)');
    const changed = () => {
      setMobile(media.matches);
      setPage(0);
    };
    changed();
    media.addEventListener('change', changed);
    return () => media.removeEventListener('change', changed);
  }, []);
  useEffect(() => {
    setPage(0);
    setSelected(null);
  }, [binder.id, binder.columns]);
  useEffect(() => {
    if (!arranging) setSelected(null);
  }, [arranging]);
  const visiblePages = mobile ? [page] : [page, page + 1].filter((p) => p < pages);
  const step = mobile ? 1 : 2;
  const visibleIds = binder.slots
    .slice(page * capacity, (page + step) * capacity)
    .filter(Boolean)
    .join(',');
  useEffect(() => {
    const controller = new AbortController();
    const missing = [
      ...new Set(
        visibleIds
          .split(',')
          .filter((id) => id && !loadedDetails[id] && !details.some((card) => card.id === id)),
      ),
    ];
    let cursor = 0;
    // Fetch metadata only for visible pockets, with two requests at a time.
    void Promise.all(
      Array.from({ length: Math.min(2, missing.length) }, async () => {
        while (cursor < missing.length && !controller.signal.aborted) {
          const id = missing[cursor++];
          try {
            const response = await fetch(`/api/cards/${encodeURIComponent(id)}`, {
              signal: controller.signal,
            });
            if (!response.ok) continue;
            const data = await response.json();
            if (!controller.signal.aborted) setLoadedDetails((old) => ({ ...old, [id]: data }));
          } catch {
            /* Missing detail never prevents moving or removing a card. */
          }
        }
      }),
    );
    return () => controller.abort();
    // loadedDetails is a cache, not a trigger to restart the current request queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleIds, details]);
  const selectSlot = (index: number) => {
    if (!editable) return;
    if (arranging) {
      if (selected === null) {
        if (binder.slots[index]) setSelected(index);
      } else {
        onMove(selected, index);
        setSelected(null);
      }
      return;
    }
    const card = cards[binder.slots[index] ?? ''];
    if (card) onOpen(card, index);
    else if (!binder.slots[index]) onAdd(index);
  };
  return (
    <>
      <div className={`binder-stage color-${binder.color}`}>
        <div className={`binder-book ${visiblePages.length === 1 ? 'single-page' : ''}`}>
          {visiblePages.map((p, side) => (
            <section className="binder-page" key={p} aria-label={`Página ${p + 1}`}>
              <div className="page-caption">
                <span>PÁGINA {String(p + 1).padStart(2, '0')}</span>
                <span>
                  {binder.slots.slice(p * capacity, (p + 1) * capacity).filter(Boolean).length} /{' '}
                  {capacity}
                </span>
              </div>
              <div className={`pockets columns-${binder.columns}`}>
                {binder.slots.slice(p * capacity, (p + 1) * capacity).map((id, slot) => {
                  const index = p * capacity + slot;
                  const card = id ? cards[id] : null;
                  const detail = id
                    ? (loadedDetails[id] ?? details.find((item) => item.id === id))
                    : undefined;
                  return (
                    <button
                      key={index}
                      disabled={!editable}
                      className={`pocket ${id ? 'filled' : 'empty'} ${selected === index ? 'selected' : ''}`}
                      aria-label={
                        card
                          ? `${card.name}, posición ${index + 1}${owned.includes(card.id) ? ', conseguida' : ', pendiente'}`
                          : `Añadir carta en posición ${index + 1}`
                      }
                      draggable={arranging && !!id && editable}
                      onDragStart={(event) => {
                        event.dataTransfer.setData('text/plain', String(index));
                      }}
                      onDragOver={(event) => {
                        if (arranging) event.preventDefault();
                      }}
                      onDrop={(event) => {
                        if (!arranging || !editable) return;
                        event.preventDefault();
                        const raw = event.dataTransfer.getData('text/plain');
                        if (/^\d+$/.test(raw)) onMove(Number(raw), index);
                      }}
                      onClick={() => selectSlot(index)}
                    >
                      {card ? (
                        <>
                          <CardArt
                            image={card.image}
                            name={card.name}
                            holo={!!detail?.variants?.holo}
                          />
                          {owned.includes(card.id) && (
                            <span className="owned-mark">
                              <Check size={12} strokeWidth={3} />
                            </span>
                          )}
                          {arranging && (
                            <span className="move-mark">
                              <Grip size={16} />
                            </span>
                          )}
                        </>
                      ) : id ? (
                        <span className="empty-inner">Cargando carta…</span>
                      ) : (
                        <span className="empty-inner">
                          <Plus size={23} strokeWidth={1.5} />
                          <span>Añadir carta</span>
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {side === 0 && !mobile && visiblePages.length > 1 && (
                <div className="binder-spine" aria-hidden="true">
                  <i />
                  <i />
                  <i />
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
      <div className="binder-pagination">
        <button
          className="icon-button"
          disabled={page === 0}
          aria-label="Página anterior"
          onClick={() => setPage((p) => Math.max(0, p - step))}
        >
          <ChevronLeft size={20} />
        </button>
        <span>
          {mobile || page + 1 >= pages ? `Página ${page + 1}` : `Páginas ${page + 1}–${page + 2}`}{' '}
          <span className="muted">de {pages}</span>
        </span>
        <button
          className="icon-button"
          disabled={page + step >= pages}
          aria-label="Página siguiente"
          onClick={() => setPage((p) => p + step)}
        >
          <ChevronRight size={20} />
        </button>
        <button
          className="text-button add-page"
          disabled={!editable || binder.slots.length + capacity > 360}
          onClick={onAddPage}
        >
          <Plus size={16} /> Añadir página
        </button>
      </div>
      <p className="binder-tip">
        <Sparkles size={14} />
        {arranging
          ? selected === null
            ? 'Elige una carta para moverla. También puedes arrastrarla.'
            : 'Ahora elige su nuevo hueco. Las cartas intercambiarán posición.'
          : 'Cada carta tiene su historia. Toca una para verla de cerca.'}
      </p>
    </>
  );
}
