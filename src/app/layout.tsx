import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PokeBind · Tu colección, a tu manera',
  description:
    'Crea tus álbumes de cartas Pokémon en español, organiza tu colección y guarda tus deseos.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
