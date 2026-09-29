'use client';

import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeftRight,
  BookOpen,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Cloud,
  Download,
  Heart,
  Layers,
  Leaf,
  Library,
  Plus,
  Settings2,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import type { CardBrief, CardDetail, Expansion } from '@/lib/types';
import { moveCard, resizeBinder, toggleId, workspaceSchema, type Binder } from '@/lib/workspace';
import { useWorkspace } from '@/hooks/use-workspace';
import { BinderView } from './binder-view';
import { BinderEditor } from './binder-editor';
import { Modal } from './modal';
import { CatalogBrowser } from './catalog-browser';
import { ExpansionExplorer } from './expansion-explorer';
import { CardDetailModal } from './card-detail';
import { AccountModal } from './account-modal';

type View = 'binders' | 'collection' | 'catalog' | 'wishlist';
type Coverage = {
  sets: number;
  cards: number;
  withImage: number;
  syncedAt: string;
  declaredCards: number;
  officialCards: number;
};
const navigation = [
  { id: 'binders', label: 'Mis binders', icon: BookOpen },
  { id: 'collection', label: 'Mi colección', icon: Layers },
  { id: 'catalog', label: 'Expansiones', icon: Library },
  { id: 'wishlist', label: 'Mis deseos', icon: Heart },
] as const;

export function PokeBind({
  initialCards,
  featured,
  sets,
  coverage,
}: {
  initialCards: CardBrief[];
  featured: CardDetail[];
  sets: Expansion[];
  coverage: Coverage;
}) {
  const { workspace, update, user, status, error, ready, reload } = useWorkspace();
  const [view, setView] = useState<View>('binders');
  const [activeId, setActiveId] = useState('');
  const binder = workspace.binders.find((item) => item.id === activeId) ?? workspace.binders[0];
  const [cache, setCache] = useState<Record<string, CardBrief>>(() =>
    Object.fromEntries(initialCards.map((card) => [card.id, card])),
  );
  const [arranging, setArranging] = useState(false);
  const [editor, setEditor] = useState<'new' | 'edit' | null>(null);
  const [picker, setPicker] = useState<number | null>(null);
  const [detail, setDetail] = useState<{ card: CardBrief; slot?: number } | null>(null);
  const [addToBinder, setAddToBinder] = useState<CardBrief | null>(null);
  const [account, setAccount] = useState(false);
  const [about, setAbout] = useState(false);
  const [deleteBinder, setDeleteBinder] = useState(false);
  const [toast, setToast] = useState('');
  const [importData, setImportData] = useState<ReturnType<typeof workspaceSchema.parse> | null>(
    null,
  );
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(timeout);
  }, [toast]);
  const binderCardIds = [...new Set(binder?.slots.filter((id): id is string => !!id) ?? [])].join(
    ',',
  );
  useEffect(() => {
    if (!binderCardIds) return;
    const controller = new AbortController();
    fetch(`/api/catalog?ids=${encodeURIComponent(binderCardIds)}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        const found = new Map<string, CardBrief>(
          data.cards.map((card: CardBrief) => [card.id, card]),
        );
        // Keep a removed catalog entry selectable, so its pocket can still be cleared.
        const entries = binderCardIds.split(',').map((id) => [
          id,
          found.get(id) ?? {
            id,
            name: 'Carta fuera del catálogo',
            localId: id,
            setId: '',
            setName: 'Sin información',
          },
        ]);
        setCache((old) => ({ ...old, ...Object.fromEntries(entries) }));
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setToast('No se han podido cargar algunas cartas. Vuelve a abrir el binder.');
      });
    return () => controller.abort();
  }, [binder?.id, binderCardIds]);
  function changeBinder(change: (current: Binder) => Binder) {
    if (!binder) return;
    update((previous) => ({
      ...previous,
      binders: previous.binders.map((item) => (item.id === binder.id ? change(item) : item)),
    }));
  }
  function exportCollection() {
    const blob = new Blob([JSON.stringify(workspace, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pokebind-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const collected = binder?.slots.filter((id) => id && workspace.owned.includes(id)).length ?? 0;
  const placed = binder?.slots.filter(Boolean).length ?? 0;
  const currentNav = navigation.find((item) => item.id === view)!;
  const saveText =
    status === 'loading'
      ? 'Abriendo colección…'
      : status === 'saving'
        ? 'Guardando…'
        : status === 'saved'
          ? 'Guardado en tu cuenta'
          : status === 'error'
            ? 'Guardado pendiente'
            : 'Guardado en este dispositivo';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a href="/" className="brand" aria-label="PokeBind, inicio">
          <span className="brand-icon">
            <BookOpen size={25} />
            <i />
          </span>
          <span>
            Poké<span className="brand-light">Bind</span>
            <small>UN HOGAR PARA TUS CARTAS</small>
          </span>
        </a>
        <div className="sidebar-label">TU RINCÓN DE COLECCIONISTA</div>
        <nav aria-label="Navegación principal">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`nav-link ${view === id ? 'active' : ''}`}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => {
                setView(id);
                setArranging(false);
              }}
            >
              <Icon size={21} />
              <span>{label}</span>
              {id === 'wishlist' && workspace.wishlist.length > 0 && (
                <small>{workspace.wishlist.length}</small>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-albums">
          <div className="sidebar-label">
            MIS BINDERS
            <button
              className="icon-button"
              aria-label="Crear binder"
              disabled={!ready || workspace.binders.length >= 30}
              onClick={() => setEditor('new')}
            >
              <Plus size={16} />
            </button>
          </div>
          {workspace.binders.map((item) => (
            <button
              key={item.id}
              className={`album-link ${view === 'binders' && binder?.id === item.id ? 'current' : ''}`}
              onClick={() => {
                setActiveId(item.id);
                setView('binders');
              }}
            >
              <span className={`album-dot color-${item.color}`} />
              {item.name}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <button className="profile-button" onClick={() => setAccount(true)}>
            <span className="avatar">
              <UserRound size={20} />
            </span>
            <span>
              <strong>{user ? user.email?.split('@')[0] : 'Tu espacio personal'}</strong>
              <small>{user ? 'Gestionar mi cuenta' : 'Estás en modo local'}</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <BookOpen size={17} />
            <span>{currentNav.label}</span>
            {view === 'binders' && binder && (
              <>
                <ChevronRight size={14} />
                <strong>{binder.name}</strong>
              </>
            )}
          </div>
          <div className="topbar-actions">
            <span className="language">
              <span />
              ES
            </span>
            <button
              className="icon-button"
              aria-label="Acerca del catálogo"
              onClick={() => setAbout(true)}
            >
              <CircleHelp size={20} />
            </button>
            <button
              className="avatar small"
              aria-label="Mi cuenta"
              onClick={() => setAccount(true)}
            >
              <UserRound size={19} />
            </button>
          </div>
        </header>
        <main id="main-content">
          {error && (
            <div className="error-banner" role="alert">
              <span>{error}</span>
              <button onClick={exportCollection}>Exportar copia</button>
              <button onClick={() => void reload()}>Volver a cargar</button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                <span className="tiny-sparkle">✦</span> TU COLECCIÓN, A TU MANERA
              </div>
              <h1>{view === 'binders' ? 'Un lugar para tus favoritas.' : currentNav.label}</h1>
              <p>
                {view === 'binders'
                  ? 'Organiza, completa y disfruta. Carta a carta.'
                  : view === 'catalog'
                    ? 'Elige una serie y luego la expansión.'
                    : view === 'wishlist'
                      ? 'Esas cartas que algún día serán tuyas.'
                      : 'Cada carta conseguida, un pequeño tesoro.'}
              </p>
            </div>
            {view === 'binders' && (
              <button
                className="button primary"
                disabled={!ready || workspace.binders.length >= 30}
                onClick={() => setEditor('new')}
              >
                <Plus size={18} />
                Nuevo binder
              </button>
            )}
          </div>
          {view === 'binders' ? (
            binder ? (
              <>
                {workspace.binders.length > 1 && (
                  <label className="mobile-binder-select">
                    Abrir binder
                    <select value={binder.id} onChange={(event) => setActiveId(event.target.value)}>
                      {workspace.binders.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <div className="binder-header">
                  <div className="binder-title">
                    <span className={`binder-title-icon color-${binder.color}`}>
                      <BookOpen size={24} />
                    </span>
                    <div>
                      <div className="binder-name-row">
                        <h2>{binder.name}</h2>
                        <span className="pill mint">PERSONAL</span>
                      </div>
                      <p>
                        {binder.slots.length / binder.columns ** 2} páginas<span>·</span>
                        {binder.columns} × {binder.columns}
                        <span>·</span>
                        {placed} cartas colocadas
                      </p>
                    </div>
                  </div>
                  <div className="binder-tools">
                    <button
                      className={`button secondary ${arranging ? 'is-active' : ''}`}
                      disabled={!ready}
                      aria-pressed={arranging}
                      onClick={() => setArranging((value) => !value)}
                    >
                      {arranging ? <Check size={16} /> : <ArrowLeftRight size={16} />}
                      {arranging ? 'Listo' : 'Organizar'}
                    </button>
                    <button
                      className="button secondary"
                      disabled={!ready}
                      onClick={() => setEditor('edit')}
                    >
                      <Settings2 size={16} />
                      <span>Personalizar</span>
                    </button>
                  </div>
                </div>
                <div className="collection-strip">
                  <div>
                    <span className="collection-check">
                      <CheckCheck size={17} />
                    </span>
                    <strong>{collected}</strong>
                    <span>de {placed} conseguidas</span>
                  </div>
                  <div className="progress-track">
                    <span style={{ width: `${placed ? (collected / placed) * 100 : 0}%` }} />
                  </div>
                  <strong>{placed ? Math.round((collected / placed) * 100) : 0}%</strong>
                  <span className="strip-divider" />
                  <span className="free-pockets">{binder.slots.length - placed} huecos libres</span>
                </div>
                <BinderView
                  binder={binder}
                  cards={cache}
                  details={featured}
                  owned={workspace.owned}
                  editable={ready}
                  arranging={arranging}
                  onOpen={(card, slot) => setDetail({ card, slot })}
                  onAdd={setPicker}
                  onMove={(from, to) => changeBinder((item) => moveCard(item, from, to))}
                  onAddPage={() =>
                    changeBinder((item) => ({
                      ...item,
                      slots: [...item.slots, ...Array(item.columns ** 2).fill(null)],
                    }))
                  }
                />
              </>
            ) : (
              <div className="empty-state empty-binders">
                <BookOpen size={44} />
                <h2>Tu colección empieza aquí</h2>
                <p>Crea un binder vacío y dale tu propio orden.</p>
                <button
                  className="button primary"
                  disabled={!ready}
                  onClick={() => setEditor('new')}
                >
                  <Plus size={18} />
                  Crear mi primer binder
                </button>
              </div>
            )
          ) : (
            <>
              {view === 'catalog' ? (
                <ExpansionExplorer
                  sets={sets}
                  owned={workspace.owned}
                  wishlist={workspace.wishlist}
                  onSelect={(card) => setDetail({ card })}
                />
              ) : (
                <CatalogBrowser
                  key={view}
                  sets={sets}
                  owned={workspace.owned}
                  wishlist={workspace.wishlist}
                  ids={
                    view === 'collection'
                      ? workspace.owned
                      : view === 'wishlist'
                        ? workspace.wishlist
                        : undefined
                  }
                  onSelect={(card) => setDetail({ card })}
                />
              )}
              {view === 'catalog' && (
                <button className="catalog-coverage text-button" onClick={() => setAbout(true)}>
                  <CircleHelp size={15} />
                  Ver fuentes y cobertura del catálogo
                </button>
              )}
            </>
          )}
          <footer className="workspace-footer">
            <span>
              <Cloud size={14} />
              {saveText}
            </span>
            <div>
              <button onClick={exportCollection}>
                <Download size={14} />
                Exportar
              </button>
              <button disabled={!ready} onClick={() => fileInput.current?.click()}>
                <Upload size={14} />
                Importar
              </button>
            </div>
          </footer>
          <input
            type="file"
            accept="application/json,.json"
            ref={fileInput}
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              try {
                if (file.size > 8_000_000) throw new Error();
                const next = workspaceSchema.parse(JSON.parse(await file.text()));
                const response = await fetch('/api/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(next),
                });
                const validation = await response.json();
                if (!response.ok) {
                  setToast(validation.error);
                  return;
                }
                setImportData(next);
              } catch {
                setToast('El archivo no es una copia válida de PokeBind.');
              }
            }}
          />
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button
            className={view === id ? 'active' : ''}
            key={id}
            onClick={() => setView(id)}
            aria-current={view === id ? 'page' : undefined}
          >
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button onClick={() => setToast('')} aria-label="Cerrar aviso">
            <X size={16} />
          </button>
        </div>
      )}

      {editor && (
        <BinderEditor
          binder={editor === 'edit' ? binder : undefined}
          onClose={() => setEditor(null)}
          onDelete={() => {
            setEditor(null);
            setDeleteBinder(true);
          }}
          onSave={(name, columns, color) => {
            if (editor === 'edit' && binder)
              changeBinder((item) => ({ ...resizeBinder(item, columns), name, color }));
            else {
              const created: Binder = {
                id: crypto.randomUUID(),
                name,
                columns,
                color,
                slots: Array(columns ** 2 * 2).fill(null),
              };
              update((previous) => ({ ...previous, binders: [...previous.binders, created] }));
              setActiveId(created.id);
              setView('binders');
            }
            setEditor(null);
            setToast('Binder guardado. Dale tu toque.');
          }}
        />
      )}
      {picker !== null && (
        <Modal title="Un nuevo tesoro para tu binder" onClose={() => setPicker(null)} wide>
          <CatalogBrowser
            sets={sets}
            owned={workspace.owned}
            wishlist={workspace.wishlist}
            picking
            onSelect={(card) => {
              setCache((old) => ({ ...old, [card.id]: card }));
              changeBinder((item) => ({
                ...item,
                slots: item.slots.map((id, index) => (index === picker ? card.id : id)),
              }));
              setPicker(null);
              setToast(`${card.name} ya tiene su hueco.`);
            }}
          />
        </Modal>
      )}
      {detail && (
        <CardDetailModal
          key={detail.card.id}
          card={detail.card}
          initial={featured.find((card) => card.id === detail.card.id)}
          owned={workspace.owned.includes(detail.card.id)}
          wished={workspace.wishlist.includes(detail.card.id)}
          editable={ready}
          onClose={() => setDetail(null)}
          onOwned={() =>
            update((previous) => ({ ...previous, owned: toggleId(previous.owned, detail.card.id) }))
          }
          onWish={() =>
            update((previous) => ({
              ...previous,
              wishlist: toggleId(previous.wishlist, detail.card.id),
            }))
          }
          onAdd={() => {
            setAddToBinder(detail.card);
            setDetail(null);
          }}
          onRemove={
            detail.slot !== undefined
              ? () => {
                  changeBinder((item) => ({
                    ...item,
                    slots: item.slots.map((id, index) => (index === detail.slot ? null : id)),
                  }));
                  setDetail(null);
                }
              : undefined
          }
        />
      )}
      {addToBinder && (
        <Modal title={`Guardar ${addToBinder.name}`} onClose={() => setAddToBinder(null)}>
          <div className="choose-binder">
            <p>Elige un binder. La carta ocupará el primer hueco libre.</p>
            {workspace.binders.map((item) => (
              <button
                className="button secondary"
                key={item.id}
                disabled={!ready || !item.slots.includes(null)}
                onClick={() => {
                  const slot = item.slots.indexOf(null);
                  if (slot < 0) return;
                  setCache((old) => ({ ...old, [addToBinder.id]: addToBinder }));
                  update((previous) => ({
                    ...previous,
                    binders: previous.binders.map((b) =>
                      b.id === item.id
                        ? {
                            ...b,
                            slots: b.slots.map((id, index) =>
                              index === slot ? addToBinder.id : id,
                            ),
                          }
                        : b,
                    ),
                  }));
                  setActiveId(item.id);
                  setView('binders');
                  setAddToBinder(null);
                  setToast('Carta añadida al binder.');
                }}
              >
                <BookOpen size={18} />
                {item.name}
                <span className="muted">
                  {item.slots.filter((id) => id === null).length} libres
                </span>
              </button>
            ))}
            {!workspace.binders.length && <p>Crea primero un binder desde «Mis binders».</p>}
          </div>
        </Modal>
      )}
      {deleteBinder && binder && (
        <Modal title="¿Eliminar este binder?" onClose={() => setDeleteBinder(false)}>
          <div className="form-stack">
            <p>
              Se eliminará «{binder.name}» y la distribución de sus páginas. Tus cartas conseguidas
              y deseos se conservan.
            </p>
            <button
              className="button danger-button"
              onClick={() => {
                update((previous) => ({
                  ...previous,
                  binders: previous.binders.filter((item) => item.id !== binder.id),
                }));
                setDeleteBinder(false);
              }}
            >
              Eliminar binder
            </button>
            <button className="button secondary" onClick={() => setDeleteBinder(false)}>
              Conservar binder
            </button>
          </div>
        </Modal>
      )}
      {importData && (
        <Modal title="Importar tu colección" onClose={() => setImportData(null)}>
          <div className="form-stack">
            <p>
              La copia contiene {importData.binders.length} binders y {importData.owned.length}{' '}
              cartas conseguidas. Sustituirá la colección que tienes abierta.
            </p>
            <button className="button secondary" onClick={exportCollection}>
              Exportar la colección actual primero
            </button>
            <button
              className="button primary"
              onClick={() => {
                update(() => importData);
                setImportData(null);
                setActiveId('');
                setToast('Copia importada.');
              }}
            >
              Sustituir con esta copia
            </button>
          </div>
        </Modal>
      )}
      {account && (
        <AccountModal user={user} onClose={() => setAccount(false)} onExport={exportCollection} />
      )}
      {about && (
        <Modal title="Sobre el catálogo" onClose={() => setAbout(false)}>
          <div className="about-content">
            <span className="pill mint">
              <Leaf size={14} />
              Solo cartas físicas en español
            </span>
            <h3>
              {coverage.cards.toLocaleString('es-ES')} cartas · {coverage.sets} colecciones
            </h3>
            <p>
              Priorizamos las imágenes verificadas de Pokémon ({coverage.officialCards} por ahora).
              El índice de respaldo procede de{' '}
              <a href="https://tcgdex.dev" target="_blank" rel="noreferrer">
                TCGdex
              </a>
              . Se está contrastando con las{' '}
              <a
                href="https://tcg.pokemon.com/es-es/all-expansions/"
                target="_blank"
                rel="noreferrer"
              >
                expansiones oficiales de Pokémon
              </a>
              .
            </p>
            <p>
              {(coverage.cards - coverage.withImage).toLocaleString('es-ES')} cartas no tienen
              imagen. Los totales declarados por el proveedor no garantizan una edición española de
              cada carta. La cobertura histórica y de promos aún no está verificada por completo.
            </p>
            <p className="muted">
              Última importación:{' '}
              {new Date(coverage.syncedAt).toLocaleDateString('es-ES', { timeZone: 'UTC' })}.
            </p>
            <hr />
            <p className="source-note">
              PokeBind es un proyecto independiente, no afiliado a The Pokémon Company. Las cartas,
              ilustraciones y marcas pertenecen a sus respectivos titulares.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
