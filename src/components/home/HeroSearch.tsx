"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import { useLanguage } from "@/hooks/useLanguage";
import { useLanguagePrefix } from "@/hooks/useLanguagePrefix";
import {
  fetchSearchSuggestions,
  type SearchSuggestResponse,
  type SuggestAttraction,
  type SuggestCategory,
  type SuggestLocation,
  type SuggestTour,
} from "@/services/search";

const RECENT_KEY = "tourealo:recentSearches";
const MIN_QUERY_LENGTH = 2;
const SUGGESTION_LIMIT = 8;
const DEBOUNCE_MS = 200;

type LocationSelection = {
  title: string;
  slug?: string | null;
  publicCode?: string | null;
};

type BaseSuggestion = {
  id: string;
  title: string;
  subtitle?: string;
  count?: number;
  image?: string | null;
};

type LocationSuggestion = BaseSuggestion & {
  type: "location";
  slug?: string | null;
  publicCode?: string | null;
};

type CategorySuggestion = BaseSuggestion & {
  type: "category";
};

type TourSuggestion = BaseSuggestion & {
  type: "tour";
  locationSlug?: string | null;
  locationCode?: string | null;
  titleSlug?: string | null;
  tourCode?: string | null;
  locationName?: string | null;
};

type AttractionSuggestion = BaseSuggestion & {
  type: "attraction";
  slug?: string | null;
  publicCode?: string | null;
  locationName?: string | null;
};

type SuggestionItem = LocationSuggestion | CategorySuggestion | TourSuggestion | AttractionSuggestion;

type ActiveField = "location" | "activity";

type RecentSearch = LocationSelection;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function buildLocationPath(location: LocationSelection | null, fallbackLabel: string) {
  if (!location) {
    const fallbackSlug = slugify(fallbackLabel);
    return fallbackSlug ? `/${fallbackSlug}` : "/";
  }
  const baseSlug = location.slug && location.slug.length > 0 ? location.slug : slugify(location.title);
  const slugWithCode = location.publicCode ? `${baseSlug}-l${location.publicCode}` : baseSlug;
  return `/${slugWithCode}`;
}

function buildTourPath(tour: TourSuggestion) {
  const locationSlug = tour.locationSlug ? String(tour.locationSlug) : undefined;
  const locationCode = tour.locationCode ? String(tour.locationCode) : undefined;
  const titleSlug = tour.titleSlug ? String(tour.titleSlug) : undefined;
  const tourCode = tour.tourCode ? String(tour.tourCode) : undefined;
  if (locationSlug && locationCode && titleSlug && tourCode) {
    return `/tours/${locationSlug}-l${locationCode}/${titleSlug}-t${tourCode}`;
  }
  return "/tours";
}

function mapLocations(locations: SuggestLocation[]): LocationSuggestion[] {
  return locations.map((loc) => ({
    id: String(loc.id ?? loc.slug ?? loc.name ?? Math.random()),
    type: "location",
    title: String(loc.name ?? ""),
    subtitle: loc.country ?? undefined,
    count: typeof loc.countActivities === "number" ? loc.countActivities : undefined,
    image: loc.image ?? null,
    slug: loc.slug ?? null,
    publicCode: loc.publicCode ?? null,
  }));
}

function mapCategories(categories: SuggestCategory[]): CategorySuggestion[] {
  return categories.map((category) => ({
    id: String(category.id ?? category.slug ?? category.name ?? Math.random()),
    type: "category",
    title: String(category.name ?? ""),
    subtitle: undefined,
    count: typeof category.countActivities === "number" ? category.countActivities : undefined,
  }));
}

function mapTours(tours: SuggestTour[]): TourSuggestion[] {
  return tours.map((tour) => ({
    id: String(tour.id ?? tour.title ?? Math.random()),
    type: "tour",
    title: String(tour.title ?? ""),
    subtitle: tour.locationName ?? undefined,
    image: tour.image ?? null,
    locationSlug: tour.locationSlug ?? null,
    locationCode: tour.locationCode ?? null,
    titleSlug: tour.titleSlug ?? null,
    tourCode: tour.tourCode ?? null,
    locationName: tour.locationName ?? null,
  }));
}

function mapAttractions(attractions: SuggestAttraction[]): AttractionSuggestion[] {
  return attractions.map((attraction) => ({
    id: String(attraction.id ?? attraction.slug ?? attraction.name ?? Math.random()),
    type: "attraction",
    title: String(attraction.name ?? ""),
    subtitle: attraction.locationName ?? undefined,
    image: attraction.image ?? null,
    slug: attraction.slug ?? null,
    publicCode: attraction.publicCode ?? null,
    count: typeof attraction.countTours === "number" ? attraction.countTours : undefined,
    locationName: attraction.locationName ?? null,
  }));
}

function Highlighter({ text, query }: { text?: string; query: string }) {
  if (!text) return null;
  const lowerQuery = query.toLowerCase();
  const lowerText = text.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);
  if (index === -1 || query.length === 0) {
    return <>{text}</>;
  }
  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);
  return (
    <>
      {before}
      <mark className="rounded-sm bg-emerald-100 px-0.5 text-emerald-800">{match}</mark>
      {after}
    </>
  );
}

export function HeroSearch() {
  const { language } = useLanguage();
  const { t } = useTranslation("frontend-home");
  const router = useRouter();
  const prefix = useLanguagePrefix();

  const [locationQuery, setLocationQuery] = useState("");
  const [activityQuery, setActivityQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<LocationSelection | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [recent, setRecent] = useState<RecentSearch[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = window.localStorage.getItem(RECENT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as RecentSearch[];
        if (Array.isArray(parsed)) {
          return parsed.slice(0, 1);
        }
      }
    } catch {
      // ignore storage access issues
    }
    return [];
  });
  const [activeField, setActiveField] = useState<ActiveField>("location");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [travelDate, setTravelDate] = useState("");

  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const locationInputRef = useRef<HTMLInputElement | null>(null);
  const activityInputRef = useRef<HTMLInputElement | null>(null);

  const normalizedLang = useMemo(() => {
    if (!language) return "en";
    return language.includes("-") ? language.split("-")[0] : language;
  }, [language]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      if (abortRef.current) {
        abortRef.current.abort();
      }
    };
  }, []);

  const persistRecent = (next: RecentSearch[]) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(next.slice(0, 1)));
    } catch {
      // ignore storage errors
    }
  };

  const pushRecent = (item: RecentSearch) => {
    setRecent(() => {
      const next = [item];
      persistRecent(next);
      return next;
    });
  };

  const handleSuggestions = async (query: string, field: ActiveField) => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    const params: {
      query: string;
      lang: string;
      limit: number;
      locationSlug?: string;
      locationCode?: string;
      signal: AbortSignal;
    } = {
      query,
      lang: normalizedLang,
      limit: SUGGESTION_LIMIT,
      signal: controller.signal,
    };

    if (field === "activity" && selectedLocation) {
      if (selectedLocation.slug) params.locationSlug = selectedLocation.slug;
      if (selectedLocation.publicCode) params.locationCode = selectedLocation.publicCode;
    }

    let response: SearchSuggestResponse = { locations: [], categories: [], tours: [], attractions: [] };
    try {
      response = await fetchSearchSuggestions(params);
    } catch (error) {
      console.error("Search suggestions failed", error);
    }

    if (controller.signal.aborted) {
      return;
    }

    // Always include tours in both location and activity suggestions
    let nextSuggestions: SuggestionItem[] = [];
    if (field === "location") {
      nextSuggestions = [
        ...mapLocations(response.locations),
        ...mapTours(response.tours),
      ];
    } else {
      nextSuggestions = [
        ...mapCategories(response.categories),
        ...mapAttractions(response.attractions),
        ...mapTours(response.tours),
      ];
    }
    setSuggestions(nextSuggestions);
    setLoading(false);
  };

  const scheduleSuggestions = (value: string, field: ActiveField) => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    debounceRef.current = window.setTimeout(() => {
      handleSuggestions(value, field);
    }, DEBOUNCE_MS);
  };

  const handleLocationChange = (value: string) => {
    setLocationQuery(value);
    setActiveField("location");
    setHighlightIndex(-1);
    setShowSuggestions(value.trim().length >= MIN_QUERY_LENGTH || recent.length > 0);
    if (!selectedLocation || selectedLocation.title !== value) {
      setSelectedLocation(null);
    }
    scheduleSuggestions(value, "location");
  };

  const handleActivityChange = (value: string) => {
    setActivityQuery(value);
    setActiveField("activity");
    setHighlightIndex(-1);
    setShowSuggestions(value.trim().length >= MIN_QUERY_LENGTH);
    scheduleSuggestions(value, "activity");
  };

  const handleSuggestionClick = (suggestion: SuggestionItem) => {
    setHighlightIndex(-1);
    setShowSuggestions(false);

    if (suggestion.type === "location") {
      const selection: LocationSelection = {
        title: suggestion.title,
        slug: suggestion.slug,
        publicCode: suggestion.publicCode,
      };
      setSelectedLocation(selection);
      setLocationQuery(suggestion.title);
      pushRecent(selection);
      window.setTimeout(() => {
        activityInputRef.current?.focus();
      }, 0);
      return;
    }

    if (suggestion.type === "category") {
      setActivityQuery(suggestion.title);
      return;
    }

    if (suggestion.type === "tour") {
      router.push(applyPrefix(buildTourPath(suggestion)));
      return;
    }

    if (suggestion.type === "attraction") {
      const slug = suggestion.slug ? String(suggestion.slug) : slugify(suggestion.title);
      const withCode = suggestion.publicCode ? `${slug}-a${suggestion.publicCode}` : slug;
      router.push(applyPrefix(`/attractions/${withCode}`));
    }
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter" && highlightIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[highlightIndex];
      handleSuggestionClick(suggestion);
    } else if (event.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const ensureLocationSelection = async (): Promise<LocationSelection | null> => {
    if (selectedLocation) return selectedLocation;
    if (locationQuery.trim().length < MIN_QUERY_LENGTH) return null;
    try {
      const response = await fetchSearchSuggestions({
        query: locationQuery,
        lang: normalizedLang,
        limit: 1,
      });
      const first = response.locations?.[0];
      if (first) {
        const selection: LocationSelection = {
          title: first.name ?? locationQuery,
          slug: first.slug,
          publicCode: first.publicCode,
        };
        setSelectedLocation(selection);
        pushRecent(selection);
        return selection;
      }
    } catch (error) {
      console.error("Failed to auto-select location", error);
    }
    return null;
  };

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault();
    const resolvedLocation = await ensureLocationSelection();
    const targetLocation = resolvedLocation ?? (locationQuery ? { title: locationQuery } : null);

    const basePath = buildLocationPath(targetLocation, locationQuery);
    const params = new URLSearchParams();
    if (activityQuery.trim().length > 0) {
      params.set("activity", slugify(activityQuery));
    }
    if (travelDate) {
      params.set("date", travelDate);
    }
    const search = params.toString();
    const nextUrl = search ? `${basePath}?${search}` : basePath;
    router.push(applyPrefix(nextUrl));
  };

  const hideSuggestions = () => {
    window.setTimeout(() => {
      setShowSuggestions(false);
    }, 150);
  };

  const activitiesLabel = t("search.activitiesLabel", "activities");
  const loadingLabel = t("search.loading", "Loading...");
  const applyPrefix = useCallback(
    (path: string) => {
      if (!path) return path;
      const [basePart, queryPart] = path.split("?", 2);
      const normalizedBase = basePart.startsWith("/") ? basePart : `/${basePart}`;
      const localizedBase = (() => {
        if (!prefix || prefix.length === 0) {
          return normalizedBase || "/";
        }
        if (normalizedBase === "/") {
          return prefix;
        }
        return `${prefix}${normalizedBase}`;
      })();
      return queryPart ? `${localizedBase}?${queryPart}` : localizedBase;
    },
    [prefix],
  );

  return (
    <div className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-3 shadow-xl backdrop-blur md:flex-row md:items-center md:gap-0 md:p-2"
      >
        <div className="flex-1">
          <label className="sr-only" htmlFor="hero-search-location">
            {t("search.locationLabel", "Search location")}
          </label>
          <input
            id="hero-search-location"
            ref={locationInputRef}
            type="text"
            autoComplete="off"
            placeholder={t("search.locationPlaceholder", "Where do you want to go? (city, region, etc.)")}
            value={locationQuery}
            onChange={(event) => handleLocationChange(event.target.value)}
            onFocus={() => {
              setActiveField("location");
              setShowSuggestions(true);
            }}
            onBlur={hideSuggestions}
            onKeyDown={onKeyDown}
            className="w-full rounded-2xl border border-transparent bg-transparent px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-300 focus:bg-emerald-50/30 focus:ring-0 md:rounded-2xl"
          />
        </div>
        <span className="hidden h-10 w-px bg-slate-200 md:block" aria-hidden />
        <div className="flex-1">
          <label className="sr-only" htmlFor="hero-search-activity">
            {t("search.activityLabel", "Search activity")}
          </label>
          <input
            id="hero-search-activity"
            ref={activityInputRef}
            type="text"
            autoComplete="off"
            placeholder={t("search.activityPlaceholder", "Activity (e.g. boat tour, adventure, museum)")}
            value={activityQuery}
            disabled={!selectedLocation && locationQuery.trim().length === 0}
            onChange={(event) => handleActivityChange(event.target.value)}
            onFocus={() => {
              setActiveField("activity");
              setShowSuggestions(true);
            }}
            onBlur={hideSuggestions}
            onKeyDown={onKeyDown}
            className="w-full rounded-2xl border border-transparent bg-transparent px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-300 focus:bg-emerald-50/30 focus:ring-0 md:rounded-2xl"
          />
        </div>
        <span className="hidden h-10 w-px bg-slate-200 md:block" aria-hidden />
        <div className="flex-1 md:max-w-xs">
          <label className="sr-only" htmlFor="hero-search-date">
            {t("search.dateLabel", "Choose date")}
          </label>
          <input
            id="hero-search-date"
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={travelDate}
            onChange={(event) => setTravelDate(event.target.value)}
            className="w-full rounded-2xl border border-transparent bg-transparent px-4 py-3 text-base text-slate-800 placeholder-slate-400 outline-none focus:border-emerald-300 focus:bg-emerald-50/30 focus:ring-0 md:rounded-2xl"
          />
        </div>
        <div className="md:pl-2">
          <button
            type="submit"
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-emerald-500 px-6 text-base font-semibold text-white transition hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 md:w-auto md:rounded-full"
          >
            {t("search.submit", "Search")}
          </button>
        </div>
      </form>

      {showSuggestions && (
        <div className="absolute left-0 right-0 z-50 top-full mt-2 w-full overflow-visible rounded-3xl border border-slate-200 bg-white shadow-2xl">
          <div className="max-h-80 overflow-y-auto">
            {activeField === "location" ? (
              <div>
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("search.recent", "Recent searches")}
                </div>
                <ul className="divide-y divide-slate-100">
                  {(recent.length > 0 ? recent : [{ title: locationQuery }]).slice(0, 1).map((item) => (
                    <li key={`recent-${item.title}`}>
                      <button
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() =>
                          handleSuggestionClick({
                            id: item.title,
                            title: item.title,
                            type: "location",
                            slug: item.slug ?? null,
                            publicCode: item.publicCode ?? null,
                          } as LocationSuggestion)
                        }
                        className="flex w-full items-center gap-3 px-5 py-3 text-left text-sm text-slate-700 transition hover:bg-emerald-50"
                      >
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                          {item.title.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-semibold text-slate-900">{item.title}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("search.suggestions", "Suggestions")}
                </div>
                <SuggestionsList
                  suggestions={suggestions}
                  highlightIndex={highlightIndex}
                  query={locationQuery}
                  onSuggestionHover={setHighlightIndex}
                  onSuggestionClick={handleSuggestionClick}
                  loading={loading}
                  loadingLabel={loadingLabel}
                  emptyLabel={t("search.noSuggestions", "No suggestions")}
                  activitiesLabel={activitiesLabel}
                />
              </div>
            ) : (
              <div>
                <div className="border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {t("search.suggestions", "Suggestions")}
                </div>
                <SuggestionsList
                  suggestions={suggestions}
                  highlightIndex={highlightIndex}
                  query={activityQuery}
                  onSuggestionHover={setHighlightIndex}
                  onSuggestionClick={handleSuggestionClick}
                  loading={loading}
                  loadingLabel={loadingLabel}
                  emptyLabel={t("search.noSuggestions", "No suggestions")}
                  activitiesLabel={activitiesLabel}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

type SuggestionsListProps = {
  suggestions: SuggestionItem[];
  highlightIndex: number;
  query: string;
  loading: boolean;
  loadingLabel: string;
  emptyLabel: string;
  activitiesLabel: string;
  onSuggestionHover: (index: number) => void;
  onSuggestionClick: (suggestion: SuggestionItem) => void;
};

function SuggestionsList({
  suggestions,
  highlightIndex,
  query,
  loading,
  loadingLabel,
  emptyLabel,
  activitiesLabel,
  onSuggestionHover,
  onSuggestionClick,
}: SuggestionsListProps) {
  if (loading) {
    return <div className="px-5 py-5 text-center text-sm text-slate-400">{loadingLabel}</div>;
  }

  if (suggestions.length === 0) {
    return <div className="px-5 py-5 text-center text-sm text-slate-400">{emptyLabel}</div>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {suggestions.map((suggestion, index) => (
        <li key={`${suggestion.type}-${suggestion.id}`}>
          <button
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onSuggestionClick(suggestion)}
            onMouseEnter={() => onSuggestionHover(index)}
            className={`flex w-full items-center gap-3 px-5 py-3 text-left text-sm transition ${
              highlightIndex === index ? "bg-emerald-50" : "hover:bg-emerald-50"
            }`}
          >
            <SuggestionIcon suggestion={suggestion} />
            <div className="flex flex-col">
              <span className="font-semibold text-slate-900">
                <Highlighter text={suggestion.title} query={query} />
              </span>
              {suggestion.subtitle && (
                <span className="text-xs text-slate-500">
                  <Highlighter text={suggestion.subtitle} query={query} />
                </span>
              )}
            </div>
            {typeof suggestion.count === "number" && suggestion.count > 0 && (
              <span className="ml-auto text-xs font-medium text-slate-500">
                {suggestion.count} {activitiesLabel}
              </span>
            )}
            {suggestion.type === "tour" && (suggestion as TourSuggestion).locationName && (
              <span className="ml-auto text-xs text-slate-500">{(suggestion as TourSuggestion).locationName}</span>
            )}
          </button>
        </li>
      ))}
    </ul>
  );
}

function SuggestionIcon({ suggestion }: { suggestion: SuggestionItem }) {
  if (suggestion.image) {
    return (
      <Image
        src={suggestion.image}
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 rounded-xl object-cover"
        unoptimized
      />
    );
  }

  if (suggestion.type === "location") {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path
            fillRule="evenodd"
            d="M12 2.25c-3.728 0-6.75 3.022-6.75 6.75 0 4.286 3.855 8.776 5.801 10.535a1.5 1.5 0 001.898 0C14.895 17.776 18.75 13.286 18.75 9c0-3.728-3.022-6.75-6.75-6.75zm0 9a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
            clipRule="evenodd"
          />
        </svg>
      </span>
    );
  }

  if (suggestion.type === "category") {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M20.59 13.41l-7.18 7.18a2 2 0 01-2.83 0L2 12V4a2 2 0 012-2h8l8.59 8.59a2 2 0 010 2.82zM7 7a2 2 0 104 0 2 2 0 00-4 0z" />
        </svg>
      </span>
    );
  }

  if (suggestion.type === "tour") {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-600">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
          <path d="M3.75 4.5a.75.75 0 01.75-.75h4.5a.75.75 0 01.53.22l2.47 2.47h7.5a.75.75 0 01.75.75v9.75a.75.75 0 01-.75.75H4.5a.75.75 0 01-.75-.75V4.5z" />
        </svg>
      </span>
    );
  }

  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M4 5a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V7a2 2 0 00-2-2H4zm0 2h16v10H4V7zm3 9l3.5-4.5 2.5 3 3.5-4.5L20 16H7zm2-7a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    </span>
  );
}
