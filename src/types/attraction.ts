export type AttractionTranslation = {
  lang?: string;
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
};

export type AttractionMetadata = {
  image?: string;
  heroImage?: string;
  [key: string]: unknown;
};

export type Attraction = {
  id: number | string;
  slug?: string;
  publicCode?: string;
  translations?: AttractionTranslation[];
  metadata?: AttractionMetadata | null;
  parentLocation?: {
    id?: number | string;
    name?: string;
    slug?: string;
    type?: string;
  } | null;
  [key: string]: unknown;
};
