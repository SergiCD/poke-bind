'use client';
import { useState, type CSSProperties } from 'react';
import { ImageOff } from 'lucide-react';
import type { FoilStyle } from '@/lib/foil';

export function CardArt({
  image,
  name,
  holo = false,
  foilStyle = 'standard',
  large = false,
}: {
  image?: string;
  name: string;
  holo?: boolean;
  foilStyle?: FoilStyle;
  large?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string>();
  const source =
    image &&
    (/\.(png|webp|jpe?g)$/i.test(image) ? image : `${image}/${large ? 'high' : 'low'}.webp`);
  const failed = !!source && failedSource === source;
  return (
    <div
      className={`card-art ${holo ? `holo foil-${foilStyle}` : ''}`}
      style={{ '--card-image': source ? `url("${source}")` : undefined } as CSSProperties}
      onPointerMove={(event) => {
        if (!holo) return;
        const rect = event.currentTarget.getBoundingClientRect();
        // Update only the light, avoiding a React render for every pointer movement.
        event.currentTarget.style.setProperty(
          '--pointer-x',
          `${((event.clientX - rect.left) / rect.width) * 100}%`,
        );
        event.currentTarget.style.setProperty(
          '--pointer-y',
          `${((event.clientY - rect.top) / rect.height) * 100}%`,
        );
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.removeProperty('--pointer-x');
        event.currentTarget.style.removeProperty('--pointer-y');
      }}
    >
      {image && !failed ? (
        <img
          src={source}
          alt={name}
          loading={large ? 'eager' : 'lazy'}
          width={600}
          height={825}
          onError={() => setFailedSource(source)}
          draggable={false}
        />
      ) : (
        <div className="missing-art">
          <ImageOff size={24} />
          <strong>{name}</strong>
          <span>Imagen no disponible</span>
        </div>
      )}
      {holo && image && !failed && <span className="holo-shine" aria-hidden="true" />}
    </div>
  );
}
