import type { AssetKey } from "./assets";

export type ServiceCategoryId =
  | "massage"
  | "depilation"
  | "hair-removal"
  | "brows-lashes";

export type ServiceCategory = {
  id: ServiceCategoryId;
  title: string;
  summary: string;
  imageKey: AssetKey;
  order: number;
};

export const categories: ServiceCategory[] = [
  {
    id: "massage",
    title: "Masáže",
    summary: "Klasické, relaxační a speciální masážní techniky.",
    imageKey: "massage",
    order: 1,
  },
  {
    id: "depilation",
    title: "Depilace",
    summary: "Cukrová pasta, vosk a speciální péče.",
    imageKey: "depilation",
    order: 2,
  },
  {
    id: "hair-removal",
    title: "Trvalé odstranění chloupků",
    summary: "Informace o možnostech přístrojového ošetření.",
    imageKey: "hairRemoval",
    order: 3,
  },
  {
    id: "brows-lashes",
    title: "Péče o obočí a řasy",
    summary: "Lash lifting, laminace a barvení.",
    imageKey: "browsLashes",
    order: 4,
  },
];
