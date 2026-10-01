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
  tilt = false,
}: {
  image?: string;
  name: string;
  holo?: boolean;
  foilStyle?: FoilStyle;
  large?: boolean;
  tilt?: boolean;
}) {
  const [failedSource, setFailedSource] = useState<string>();
  const source =
    image &&
    (/\.(png|webp|jpe?g)$/i.test(image) ? image : `${image}/${large ? 'high' : 'low'}.webp`);
  const failed = !!source && failedSource === source;
  return (
    <div
      className={`card-art ${holo ? `holo foil-${foilStyle}` : ''} ${tilt ? 'tilt-card' : ''}`}
      style={{ '--card-image': source ? `url("${source}")` : undefined } as CSSProperties}
      onPointerMove={(event) => {
        if (!holo && !tilt) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width;
        const y = (event.clientY - rect.top) / rect.height;
        // Update only the light, avoiding a React render for every pointer movement.
        if (holo) {
          event.currentTarget.style.setProperty('--pointer-x', `${x * 100}%`);
          event.currentTarget.style.setProperty('--pointer-y', `${y * 100}%`);
        }
        if (tilt) {
          event.currentTarget.style.setProperty('--tilt-x', `${(0.5 - y) * 13}deg`);
          event.currentTarget.style.setProperty('--tilt-y', `${(x - 0.5) * 13}deg`);
        }
      }}
      onPointerLeave={(event) => {
        event.currentTarget.style.removeProperty('--pointer-x');
        event.currentTarget.style.removeProperty('--pointer-y');
        event.currentTarget.style.removeProperty('--tilt-x');
        event.currentTarget.style.removeProperty('--tilt-y');
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
