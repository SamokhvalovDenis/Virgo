import type { ServiceCategoryId } from "./categories";

export type PriceValue = number | { from: number; to: number } | null;

export type PriceRow = {
  id: string;
  groupId: string;
  label: string;
  women: PriceValue;
  men: PriceValue;
  note?: string | null;
};

export type PriceAudience = 'women' | 'men';

export type CatalogRowBase = {
  id: string;
  label: string;
  detail?: string;
  note?: string | null;
  sourceIds: string[];
};

export type SinglePriceRow = CatalogRowBase & { price: PriceValue };
export type GenderPriceRow = CatalogRowBase & {
  women: PriceValue;
  men: PriceValue;
  womenDetail?: string;
  menDetail?: string;
  womenNote?: string | null;
  menNote?: string | null;
};

export type CatalogPriceGroup<Row> = { id: string; title: string; note?: string | null; rows: Row[] };
export type PriceCatalog = {
  id: ServiceCategoryId;
  title: string;
  description: string;
  notes: string[];
} & (
  | { mode: 'single'; groups: CatalogPriceGroup<SinglePriceRow>[] }
  | { mode: 'gender'; groups: CatalogPriceGroup<GenderPriceRow>[] }
);

