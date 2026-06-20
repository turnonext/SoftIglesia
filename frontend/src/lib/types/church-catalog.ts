export type ChurchCatalogItem = {
  id: string;
  name: string;
  code?: string | null;
  sort_order?: number;
};

export type ChurchCatalogResponse = {
  data: ChurchCatalogItem[];
};
