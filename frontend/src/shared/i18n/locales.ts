// Interface languages. English is the source language: every string is
// written in `messages/en.ts` first, and each other locale must supply the
// same keys (TypeScript rejects a dictionary with a missing or extra key).
//
// This module is framework-light so the web app, its server components and,
// later, the Word add-in can share it. It must not import from `src/app/`.

export const LOCALES = ["en", "es"] as const;
export type Locale = (typeof LOCALES)[number];

export const SOURCE_LOCALE: Locale = "en";

/** Cookie holding the viewer's explicit choice from Settings > Appearance. */
export const LOCALE_COOKIE = "mike_locale";

/** Names shown in the language picker, each in its own language. */
export const LOCALE_LABELS: Record<Locale, string> = {
    en: "English",
    es: "Español",
};

export function isLocale(value: unknown): value is Locale {
    return (
        typeof value === "string" &&
        (LOCALES as readonly string[]).includes(value)
    );
}

/** Maps "es", "es-CL" or "ES_cl" to a supported locale, else null. */
export function normalizeLocale(value: string | null | undefined): Locale | null {
    if (!value) return null;
    const base = value.trim().toLowerCase().split(/[-_]/)[0];
    return isLocale(base) ? base : null;
}

/**
 * First supported language in an Accept-Language header, honoring q-values.
 * Returns null when the header names no supported language.
 */
export function localeFromAcceptLanguage(
    header: string | null | undefined,
): Locale | null {
    if (!header) return null;
    const ranked = header
        .split(",")
        .map((part, index) => {
            const [tag, ...params] = part.trim().split(";");
            const q = params
                .map((p) => p.trim())
                .find((p) => p.startsWith("q="));
            const weight = q ? Number(q.slice(2)) : 1;
            return {
                tag,
                weight: Number.isFinite(weight) ? weight : 0,
                index,
            };
        })
        .filter((entry) => entry.tag && entry.weight > 0)
        .sort((a, b) => b.weight - a.weight || a.index - b.index);
    for (const entry of ranked) {
        const locale = normalizeLocale(entry.tag);
        if (locale) return locale;
    }
    return null;
}

/**
 * Resolution order: the viewer's saved choice, then the deployment default
 * (`MIKE_DEFAULT_LOCALE`), then the browser's languages, then English.
 */
export function resolveLocale(input: {
    cookie?: string | null;
    deploymentDefault?: string | null;
    acceptLanguage?: string | null;
}): Locale {
    return (
        normalizeLocale(input.cookie) ??
        normalizeLocale(input.deploymentDefault) ??
        localeFromAcceptLanguage(input.acceptLanguage) ??
        SOURCE_LOCALE
    );
}
