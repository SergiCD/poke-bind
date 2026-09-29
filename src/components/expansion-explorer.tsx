'use client';

import { useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import type { CardBrief, Expansion } from '@/lib/types';
import { CatalogBrowser } from './catalog-browser';

type SeriesGroup = { name: string; sets: Expansion[]; firstYear: number; lastYear: number };

// These three logo URLs come from the Spanish TCGdex series index. Other series
// deliberately use their name until a verified series logo is available.
const seriesLogos: Record<string, string> = {
  Megaevolución: 'https://assets.tcgdex.net/es/me/me01/logo',
  'Escarlata y Púrpura': 'https://assets.tcgdex.net/es/sv/sv01/logo',
  'Espada y Escudo': 'https://assets.tcgdex.net/es/swsh/swsh1/logo',
};

function groupExpansions(sets: Expansion[]): SeriesGroup[] {
  const groups = new Map<string, Expansion[]>();
  for (const set of sets) groups.set(set.series, [...(groups.get(set.series) ?? []), set]);
  return [...groups]
    .map(([name, items]) => {
      const years = items.flatMap((item) =>
        item.releaseDate ? [Number(item.releaseDate.slice(0, 4))] : [],
      );
      return {
        name,
        sets: [...items].sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')),
        firstYear: Math.min(...years),
        lastYear: Math.max(...years),
      };
    })
    .sort((a, b) => b.lastYear - a.lastYear || a.name.localeCompare(b.name, 'es'));
}

export function ExpansionExplorer({
  sets,
  owned,
  wishlist,
  onSelect,
}: {
  sets: Expansion[];
  owned: string[];
  wishlist: string[];
  onSelect: (card: CardBrief) => void;
}) {
  const [series, setSeries] = useState('');
  const [setId, setSetId] = useState('');
  const [searchAll, setSearchAll] = useState(false);
  const groups = groupExpansions(sets);
  const selectedGroup = groups.find((group) => group.name === series);
  const selectedSet = selectedGroup?.sets.find((item) => item.id === setId);

  const returnToSeries = () => {
    setSeries('');
    setSetId('');
    setSearchAll(false);
  };
  return (
    <section className="expansion-explorer" aria-label="Series y expansiones">
      <div className="expansion-path">
        <button onClick={returnToSeries} aria-current={!series && !searchAll ? 'page' : undefined}>
          Todas las series
        </button>
        {selectedGroup && (
          <>
            <span>/</span>
            <button onClick={() => setSetId('')} aria-current={!setId ? 'page' : undefined}>
              {selectedGroup.name}
            </button>
          </>
        )}
        {selectedSet && (
          <>
            <span>/</span>
            <strong>{selectedSet.name}</strong>
          </>
        )}
        {searchAll && (
          <>
            <span>/</span>
            <strong>Buscar cartas</strong>
          </>
        )}
      </div>

      {searchAll ? (
        <>
          <div className="explorer-section-heading">
            <h2>Buscar en todo el catálogo</h2>
          </div>
          <CatalogBrowser sets={sets} owned={owned} wishlist={wishlist} onSelect={onSelect} />
        </>
      ) : selectedSet ? (
        <>
          <div className="explorer-section-heading">
            <div>
              <span className="eyebrow">{selectedGroup?.name}</span>
              <h2>{selectedSet.name}</h2>
              <p>
                {selectedSet.available.toLocaleString('es-ES')} cartas catalogadas ·{' '}
                {selectedSet.withImage.toLocaleString('es-ES')} con imagen
              </p>
            </div>
          </div>
          <CatalogBrowser
            key={setId}
            sets={sets}
            initialSet={setId}
            hideSetFilter
            owned={owned}
            wishlist={wishlist}
            onSelect={onSelect}
          />
        </>
      ) : selectedGroup ? (
        <>
          <div className="explorer-section-heading">
            <h2>{selectedGroup.name}</h2>
            <p>
              {selectedGroup.sets.length}{' '}
              {selectedGroup.sets.length === 1 ? 'expansión' : 'expansiones'}
            </p>
          </div>
          <div className="expansion-grid">
            {selectedGroup.sets.map((item, index) => (
              <button className="expansion-tile" key={item.id} onClick={() => setSetId(item.id)}>
                <span className={`expansion-tile-art tone-${index % 6}`}>
                  <span aria-hidden="true">{item.name}</span>
                  {(item.logo || item.coverImage) && (
                    <img
                      className={item.logo ? 'expansion-logo' : 'expansion-cover-card'}
                      src={item.logo
                        ? (/\.(png|webp|jpe?g)$/i.test(item.logo) ? item.logo : `${item.logo}.png`)
                        : (item.coverImage && /\.(png|webp|jpe?g)$/i.test(item.coverImage)
                            ? item.coverImage
                            : `${item.coverImage}/low.webp`)}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        const image = event.currentTarget;
                        if (item.coverImage && !image.classList.contains('expansion-cover-card')) {
                          image.className = 'expansion-cover-card';
                          image.src = /\.(png|webp|jpe?g)$/i.test(item.coverImage)
                            ? item.coverImage
                            : `${item.coverImage}/low.webp`;
                        } else {
                          image.style.display = 'none';
                        }
                      }}
                    />
                  )}
                </span>
                <span className="expansion-tile-info">
                  <strong>{item.name}</strong>
                  <span>
                    {item.releaseDate
                      ? new Date(`${item.releaseDate}T12:00:00Z`).toLocaleDateString('es-ES', {
                          month: 'long',
                          year: 'numeric',
                          timeZone: 'UTC',
                        })
                      : 'Fecha por confirmar'}{' '}
                    · {item.available} cartas
                  </span>
                  {item.available === 0 && <em>Cartas pendientes de importar</em>}
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="explorer-section-heading">
            <div>
              <h2>Elige una serie</h2>
              <p>Todas las expansiones agrupadas por época.</p>
            </div>
            <button className="button secondary" onClick={() => setSearchAll(true)}>
              <Search size={17} /> Buscar cartas
            </button>
          </div>
          <div className="series-grid">
            {groups.map((group, index) => (
              <button
                className="series-tile"
                key={group.name}
                onClick={() => setSeries(group.name)}
              >
                <span className={`series-tile-art tone-${index % 6}`}>
                  <span aria-hidden="true">{group.name}</span>
                  {seriesLogos[group.name] && (
                    <img
                      src={`${seriesLogos[group.name]}.png`}
                      alt=""
                      loading="lazy"
                      onError={(event) => {
                        event.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                </span>
                <span className="series-tile-info">
                  <strong>{group.name}</strong>
                  <span>
                    {Number.isFinite(group.firstYear)
                      ? group.firstYear === group.lastYear
                        ? group.firstYear
                        : `${group.firstYear}–${group.lastYear}`
                      : 'Sin fecha'}{' '}
                    · {group.sets.length} {group.sets.length === 1 ? 'expansión' : 'expansiones'}
                  </span>
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
