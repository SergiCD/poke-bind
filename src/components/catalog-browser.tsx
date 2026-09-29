'use client';
import { useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Heart, Search } from 'lucide-react';
import type { CardBrief, Expansion } from '@/lib/types';
import { CardArt } from './card-art';

interface Props {
  sets: Expansion[];
  owned: string[];
  wishlist: string[];
  ids?: string[];
  picking?: boolean;
  onSelect: (card: CardBrief) => void;
}
export function CatalogBrowser({ sets, owned, wishlist, ids, picking, onSelect }: Props) {
  const [q, setQ] = useState('');
  const [set, setSet] = useState('');
  const [promo, setPromo] = useState(false);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ cards: CardBrief[]; total: number; pages: number }>({
    cards: [],
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const expansion = sets.find((item) => item.id === set);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    const timer = setTimeout(async () => {
      try {
        const response = await fetch('/api/catalog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ q, set, promo, page, ids }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error();
        const next = await response.json();
        if (!controller.signal.aborted) {
          setResult(next);
          setLoading(false);
        }
      } catch {
        if (!controller.signal.aborted) {
          setError('No se ha podido cargar el catálogo.');
          setLoading(false);
        }
      }
    }, 180);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, set, promo, page, ids, attempt]);
  return (
    <div className="catalog-browser">
      <div className="catalog-filters">
        <label className="search-field">
          <Search size={19} />
          <input
            aria-label="Buscar cartas"
            placeholder="Busca un Pokémon, una carta…"
            maxLength={100}
            value={q}
            onChange={(event) => {
              setQ(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <select
          aria-label="Filtrar por expansión"
          value={set}
          onChange={(event) => {
            setSet(event.target.value);
            setPage(1);
          }}
        >
          <option value="">Todas las expansiones</option>
          {sets.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} · {item.id}
              {item.available === 0 ? ' · Pendiente de importar' : ''}
            </option>
          ))}
        </select>
        <label className="check-filter">
          <input
            type="checkbox"
            checked={promo}
            onChange={(event) => {
              setPromo(event.target.checked);
              setPage(1);
            }}
          />
          Solo promos
        </label>
      </div>
      {expansion &&
        (expansion.available < expansion.total || expansion.withImage < expansion.available) && (
          <p className="notice" role="status">
            {expansion.available === 0
              ? 'Esta expansión está registrada, pero sus cartas en español aún no están importadas.'
              : `${expansion.available} cartas catalogadas y ${expansion.withImage} con imagen. La cobertura de esta expansión es parcial.`}
          </p>
        )}
      {error ? (
        <div className="empty-state" role="alert">
          <p>{error}</p>
          <button className="button" onClick={() => setAttempt((n) => n + 1)}>
            Reintentar
          </button>
        </div>
      ) : (
        <>
          <p className="results-label" aria-live="polite">
            {loading
              ? 'Buscando cartas…'
              : `${result.total.toLocaleString('es-ES')} cartas${picking ? ' · Elige una para tu binder' : ''}`}
          </p>
          <div className={`catalog-grid ${loading ? 'is-loading' : ''}`} aria-busy={loading}>
            {result.cards.map((card) => (
              <button
                className="catalog-card"
                key={card.id}
                onClick={() => onSelect(card)}
                disabled={loading}
              >
                <div className="catalog-art">
                  <CardArt image={card.image} name={card.name} />
                  {owned.includes(card.id) && (
                    <span className="owned-mark">
                      <Check size={12} />
                    </span>
                  )}
                  {wishlist.includes(card.id) && (
                    <span className="wish-mark">
                      <Heart size={13} fill="currentColor" />
                    </span>
                  )}
                </div>
                <strong>{card.name}</strong>
                <span>
                  {card.setName} · {card.localId}
                </span>
              </button>
            ))}
          </div>
          {!loading && !result.cards.length && (
            <div className="empty-state">
              <Search size={30} />
              <h3>
                {expansion?.available === 0
                  ? 'Importación pendiente'
                  : 'No hay cartas por aquí… todavía'}
              </h3>
              <p>
                {expansion?.available === 0
                  ? 'No es un problema de tu búsqueda. Todavía falta una fuente española para esta expansión.'
                  : ids
                    ? 'Añade cartas desde el catálogo o desde tu binder.'
                    : 'Prueba con otro nombre o cambia los filtros.'}
              </p>
            </div>
          )}
          {result.pages > 1 && (
            <div className="binder-pagination">
              <button
                className="icon-button"
                aria-label="Resultados anteriores"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft />
              </button>
              <span>
                {page} / {result.pages}
              </span>
              <button
                className="icon-button"
                aria-label="Resultados siguientes"
                disabled={page >= result.pages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
