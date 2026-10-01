import type { CardDetail } from './types';

export type FinishFamily = 'plain' | 'classic' | 'diagonal' | 'illustration' | 'special' | 'gold' | 'prismatic' | 'silver';

export interface CardFinish {
  family: FinishFamily;
  hueA: number;
  hueB: number;
  angle: number;
  pitch: number;
  holo: boolean;
}

type Profile = Omit<CardFinish, 'holo'> & { inherentHolo: boolean };

// Each rarity has its own palette, beam angle and texture pitch. Families only
// share the rendering method; the resulting finish is unique to the rarity.
const profiles: Record<string, Profile> = {
  'Común':                       { family: 'plain',        hueA: 195, hueB: 214, angle: 112, pitch: 48, inherentHolo: false },
  'Uncommon':                    { family: 'plain',        hueA: 85,  hueB: 163, angle: 125, pitch: 39, inherentHolo: false },
  'Ninguno':                     { family: 'plain',        hueA: 220, hueB: 38,  angle: 102, pitch: 51, inherentHolo: false },
  'Rara':                        { family: 'classic',      hueA: 205, hueB: 52,  angle: 93,  pitch: 32, inherentHolo: false },
  'Holo Rara':                   { family: 'classic',      hueA: 189, hueB: 270, angle: 89,  pitch: 25, inherentHolo: true },
  'Holo Rara V':                 { family: 'diagonal',     hueA: 184, hueB: 329, angle: 119, pitch: 31, inherentHolo: true },
  'Holo Rara VMAX':              { family: 'diagonal',     hueA: 286, hueB: 183, angle: 133, pitch: 18, inherentHolo: true },
  'Holo Rara VSTAR':             { family: 'diagonal',     hueA: 42,  hueB: 205, angle: 102, pitch: 23, inherentHolo: true },
  'Rara Doble':                  { family: 'classic',      hueA: 276, hueB: 181, angle: 78,  pitch: 21, inherentHolo: true },
  'Ultra Rara':                  { family: 'illustration', hueA: 32,  hueB: 204, angle: 124, pitch: 22, inherentHolo: true },
  'Entrenador de arte completo': { family: 'illustration', hueA: 315, hueB: 168, angle: 109, pitch: 28, inherentHolo: true },
  'Rara Ilustración':            { family: 'illustration', hueA: 171, hueB: 286, angle: 137, pitch: 34, inherentHolo: true },
  'Rara Ilustración Especial':   { family: 'special',      hueA: 305, hueB: 167, angle: 121, pitch: 16, inherentHolo: true },
  'Rara Secreta':                { family: 'special',      hueA: 263, hueB: 42,  angle: 148, pitch: 24, inherentHolo: true },
  'Rara Híper':                  { family: 'gold',         hueA: 42,  hueB: 29,  angle: 116, pitch: 13, inherentHolo: true },
  'Mega Hiper Rara':             { family: 'gold',         hueA: 54,  hueB: 18,  angle: 139, pitch: 9,  inherentHolo: true },
  'Rara AS TÁCTICO':             { family: 'prismatic',    hueA: 243, hueB: 22,  angle: 97,  pitch: 12, inherentHolo: true },
  'Rara Radiante':               { family: 'prismatic',    hueA: 194, hueB: 318, angle: 143, pitch: 7,  inherentHolo: true },
  'Increíbles':                  { family: 'prismatic',    hueA: 36,  hueB: 281, angle: 64,  pitch: 11, inherentHolo: true },
  'Shiny rare':                  { family: 'silver',       hueA: 198, hueB: 267, angle: 104, pitch: 17, inherentHolo: true },
  'Shiny rare V':                { family: 'silver',       hueA: 235, hueB: 303, angle: 125, pitch: 12, inherentHolo: true },
  'Shiny rare VMAX':             { family: 'silver',       hueA: 177, hueB: 292, angle: 151, pitch: 8,  inherentHolo: true },
  'Rara Ultra Variocolor':       { family: 'silver',       hueA: 285, hueB: 144, angle: 74,  pitch: 14, inherentHolo: true },
  'Rara Blanca y Negra':         { family: 'silver',       hueA: 213, hueB: 35,  angle: 86,  pitch: 26, inherentHolo: true },
  'Futuristic Rare':             { family: 'prismatic',    hueA: 174, hueB: 241, angle: 132, pitch: 19, inherentHolo: true },
  'Mega Attack Rare':            { family: 'prismatic',    hueA: 19,  hueB: 271, angle: 107, pitch: 15, inherentHolo: true },
  'Pikachu Rare':                { family: 'prismatic',    hueA: 53,  hueB: 207, angle: 81,  pitch: 10, inherentHolo: true },
  'RGB Rare':                    { family: 'prismatic',    hueA: 352, hueB: 193, angle: 123, pitch: 6,  inherentHolo: true },
  'Promo':                       { family: 'classic',      hueA: 192, hueB: 47,  angle: 101, pitch: 37, inherentHolo: false },
};

export const supportedRarities = Object.keys(profiles);

/** Explicit non-holo metadata wins; rarity supplies the finish when flags are absent. */
export function cardFinishFor(card?: Pick<CardDetail, 'rarity' | 'variants'>): CardFinish {
  const profile = (card?.rarity && profiles[card.rarity]) || profiles['Ninguno'];
  return {
    family: profile.family,
    hueA: profile.hueA,
    hueB: profile.hueB,
    angle: profile.angle,
    pitch: profile.pitch,
    holo: card?.variants?.holo ?? profile.inherentHolo,
  };
}
