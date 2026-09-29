'use client';

import { useState, type FormEvent } from 'react';
import { Check, Grid2X2, Trash2 } from 'lucide-react';
import type { Binder } from '@/lib/workspace';
import { Modal } from './modal';

export function BinderEditor({
  binder,
  onClose,
  onSave,
  onDelete,
}: {
  binder?: Binder;
  onClose: () => void;
  onSave: (name: string, columns: 2 | 3, color: Binder['color']) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(binder?.name ?? '');
  const [columns, setColumns] = useState<2 | 3>(binder?.columns ?? 3);
  const [color, setColor] = useState<Binder['color']>(binder?.color ?? 'mint');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (name.trim()) onSave(name.trim(), columns, color);
  }
  return (
    <Modal title={binder ? 'Hazlo tuyo' : 'Empieza una nueva historia'} onClose={onClose}>
      <form className="form-stack" onSubmit={submit}>
        <label>
          Nombre del binder
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={60}
            placeholder="Mis pequeñas joyas…"
          />
        </label>
        <fieldset>
          <legend>Formato de página</legend>
          <div className="format-options">
            {([2, 3] as const).map((value) => (
              <button
                type="button"
                className={`format-option ${columns === value ? 'selected' : ''}`}
                aria-pressed={columns === value}
                key={value}
                onClick={() => setColumns(value)}
              >
                <Grid2X2 size={24} />
                <strong>
                  {value} × {value}
                </strong>
                <span>{value ** 2} cartas por página</span>
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Color de la cubierta</legend>
          <div className="color-options">
            {(
              [
                { id: 'mint', name: 'Menta' },
                { id: 'blue', name: 'Azul' },
                { id: 'lilac', name: 'Lila' },
                { id: 'peach', name: 'Melocotón' },
              ] as const
            ).map((option) => (
              <button
                type="button"
                aria-label={option.name}
                aria-pressed={color === option.id}
                key={option.id}
                className={`color-choice color-${option.id} ${color === option.id ? 'selected' : ''}`}
                onClick={() => setColor(option.id)}
              >
                {color === option.id && <Check size={21} />}
              </button>
            ))}
          </div>
        </fieldset>
        {binder && (
          <p className="muted">
            Al cambiar el formato se conservarán todas las cartas y los huecos.
          </p>
        )}
        <button className="button primary" type="submit">
          <Check size={17} />
          {binder ? 'Guardar cambios' : 'Crear binder'}
        </button>
        {binder && (
          <button type="button" className="text-button danger" onClick={onDelete}>
            <Trash2 size={15} />
            Eliminar binder
          </button>
        )}
      </form>
    </Modal>
  );
}
