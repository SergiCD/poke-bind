export interface CardBrief {
  id: string;
  name: string;
  localId: string;
  image?: string;
  setId: string;
  setName: string;
  sourceUrl?: string;
}

export interface CardDetail {
  id: string;
  name: string;
  sourceUrl?: string;
  localId: string;
  image?: string;
  category?: string;
  rarity?: string;
  illustrator?: string;
  hp?: number;
  types?: string[];
  stage?: string;
  attacks?: { name: string; effect?: string; damage?: string | number; cost?: string[] }[];
  variants?: { holo?: boolean; reverse?: boolean; normal?: boolean };
  set: { id: string; name: string; cardCount: { official: number; total: number } };
}

export interface Expansion {
  id: string;
  name: string;
  logo?: string;
  series: string;
  releaseDate?: string;
  total: number;
  official: number;
  available: number;
  withImage: number;
  promo: boolean;
}
