import Link from "next/link";

function buildHref(targetPage: number, params: { lang?: string } = {}) {
  const query = new URLSearchParams();
  if (targetPage > 1) {
    query.set("page", String(targetPage));
  }
  if (params.lang) {
    query.set("lang", params.lang);
  }
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function Pagination({
  page,
  totalPages,
  language,
  defaultLanguage,
  langQueryParam,
}: {
  page: number;
  totalPages: number;
  language: string;
  defaultLanguage?: string;
  langQueryParam?: string;
}) {
  if (totalPages <= 1) return null;

  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const resolvedLang = langQueryParam ?? (defaultLanguage && language === defaultLanguage ? undefined : language);

  return (
    <nav className="mt-10 flex items-center justify-center gap-3" aria-label="Listado de tours">
      <Link
        href={prevPage ? buildHref(prevPage, { lang: resolvedLang }) : "#"}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-40"
        aria-disabled={!prevPage}
      >
        Anterior
      </Link>
      <span className="rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
        Página {page} de {totalPages}
      </span>
      <Link
        href={nextPage ? buildHref(nextPage, { lang: resolvedLang }) : "#"}
        className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-emerald-400 hover:text-emerald-600 disabled:pointer-events-none disabled:opacity-40"
        aria-disabled={!nextPage}
      >
        Siguiente
      </Link>
    </nav>
  );
}

