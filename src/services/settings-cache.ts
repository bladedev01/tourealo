import { cache } from "react";
import { fetchSettings } from "./settings";

export const getCachedSettings = cache(async () => {
  try {
    return await fetchSettings();
  } catch (error) {
    throw error;
  }
});
