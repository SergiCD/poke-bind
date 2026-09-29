'use client';
import { useEffect, useState } from 'react';
import { Check, Heart, Plus, Sparkles, Trash2 } from 'lucide-react';
import type { CardBrief, CardDetail } from '@/lib/types';
import { Modal } from './modal';
import { CardArt } from './card-art';
import { foilStyleFor } from '@/lib/foil';

export function CardDetailModal({
  card,
  initial,
  owned,
  wished,
  editable,
  onClose,
  onOwned,
  onWish,
  onAdd,
  onRemove,
}: {
  card: CardBrief;
  initial?: CardDetail;
  owned: boolean;
  wished: boolean;
  editable: boolean;
  onClose: () => void;
  onOwned: () => void;
  onWish: () => void;
  onAdd: () => void;
  onRemove?: () => void;
}) {
  const [detail, setDetail] = useState(initial);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (initial) return;
    const controller = new AbortController();
    setError('');
    fetch(`/api/cards/${encodeURIComponent(card.id)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then(setDetail)
      .catch(() => {
        if (!controller.signal.aborted)
          setError('La ficha no está disponible ahora. Puedes seguir organizando esta carta.');
      });
    return () => controller.abort();
  }, [card.id, initial, attempt]);
  const [holo, setHolo] = useState(true);
  return (
    <Modal title="Una carta, una historia" onClose={onClose} wide>
      <div className="card-detail">
        <div className="detail-art">
          <CardArt
            image={card.image}
            name={card.name}
            large
            holo={holo && !!detail?.variants?.holo}
            foilStyle={foilStyleFor(detail) ?? 'standard'}
          />
          {detail?.variants?.holo && (
            <button
              className="text-button"
              onClick={() => setHolo((value) => !value)}
              aria-pressed={holo}
            >
              <Sparkles size={16} /> Efecto holo {holo ? 'activado' : 'desactivado'}
            </button>
          )}
        </div>
        <div className="detail-info">
          <span className="eyebrow">{card.setName} · ESPAÑOL</span>
          <h2>{card.name}</h2>
          <p className="card-number">
            N.º {card.localId}
            {detail ? ` / ${detail.set.cardCount.official}` : ''}
          </p>
          {error ? (
            <div className="notice">
              <p>{error}</p>
              <button className="text-button" onClick={() => setAttempt((n) => n + 1)}>
                Reintentar ficha
              </button>
            </div>
          ) : !detail ? (
            <p role="status">Cargando ficha…</p>
          ) : (
            <>
              <div className="detail-badges">
                {detail.rarity && (
                  <span className="pill lavender">
                    <Sparkles size={13} />
                    {detail.rarity}
                  </span>
                )}
                {detail.hp && <span className="pill mint">{detail.hp} PS</span>}
                {detail.types?.map((type) => (
                  <span className="pill neutral" key={type}>
                    {type}
                  </span>
                ))}
              </div>
              <dl className="detail-facts">
                <div>
                  <dt>Ilustración</dt>
                  <dd>{detail.illustrator ?? 'Sin información'}</dd>
                </div>
                <div>
                  <dt>Etapa</dt>
                  <dd>{detail.stage ?? detail.category ?? 'Sin información'}</dd>
                </div>
              </dl>
              {detail.attacks?.map((attack, i) => (
                <div className="attack" key={i}>
                  <strong>
                    {attack.name}
                    <span>{attack.damage}</span>
                  </strong>
                  <p>{attack.effect}</p>
                </div>
              ))}
            </>
          )}
          <div className="detail-actions">
            <button
              className={`button ${owned ? 'primary' : 'secondary'}`}
              disabled={!editable}
              onClick={onOwned}
              aria-pressed={owned}
            >
              <Check size={18} />
              {owned ? 'La tengo' : 'Marcar como conseguida'}
            </button>
            <button
              className={`button ${wished ? 'pink' : 'secondary'}`}
              disabled={!editable}
              onClick={onWish}
              aria-pressed={wished}
            >
              <Heart size={18} fill={wished ? 'currentColor' : 'none'} />
              {wished ? 'En mis deseos' : 'Añadir a deseos'}
            </button>
            <button className="button secondary" disabled={!editable} onClick={onAdd}>
              <Plus size={18} />
              Añadir a un binder
            </button>
            {onRemove && (
              <button className="text-button danger" disabled={!editable} onClick={onRemove}>
                <Trash2 size={15} />
                Quitar de este hueco
              </button>
            )}
          </div>
          <p className="source-note">
            {card.sourceUrl ? (
              <>
                Imagen:{' '}
                <a href={card.sourceUrl} target="_blank" rel="noreferrer">
                  Pokémon oficial
                </a>
                . Metadatos complementarios: TCGdex.
              </>
            ) : (
              <>
                Datos e imágenes:{' '}
                <a href="https://tcgdex.dev" target="_blank" rel="noreferrer">
                  TCGdex
                </a>
                .
              </>
            )}{' '}
            El brillo es un efecto visual.
          </p>
        </div>
      </div>
    </Modal>
  );
}
