export type Location = {
  id: number | string;
  name?: string;
  slug?: string;
  type?: string;
  publicCode?: string;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
};
