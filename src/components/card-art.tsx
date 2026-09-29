'use client';
import { useState, type CSSProperties } from 'react';
import { ImageOff } from 'lucide-react';

export function CardArt({
  image,
  name,
  holo = false,
  large = false,
}: {
  image?: string;
  name: string;
  holo?: boolean;
  large?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  return (
    <div
      className={`card-art ${holo ? 'holo' : ''}`}
      style={{ '--pointer-x': `${position.x}%`, '--pointer-y': `${position.y}%` } as CSSProperties}
      onPointerMove={(event) => {
        if (!holo) return;
        const rect = event.currentTarget.getBoundingClientRect();
        setPosition({
          x: ((event.clientX - rect.left) / rect.width) * 100,
          y: ((event.clientY - rect.top) / rect.height) * 100,
        });
      }}
    >
      {image && !failed ? (
        <img
          src={
            /\.(png|webp|jpe?g)$/i.test(image) ? image : `${image}/${large ? 'high' : 'low'}.webp`
          }
          alt={name}
          loading={large ? 'eager' : 'lazy'}
          width={600}
          height={825}
          onError={() => setFailed(true)}
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
