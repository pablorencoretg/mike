"use client";

import { useCallback, useMemo } from "react";
import { I18nContext } from "@/shared/i18n/I18nContext";
import { LOCALE_COOKIE, type Locale } from "@/shared/i18n/locales";
import { setActiveLocale } from "@/shared/i18n/runtime";
import { createTranslator } from "@/shared/i18n/translate";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Supplies the interface language chosen on the server (see app/layout.tsx)
 * to `useT()` and, through the shared runtime, to `tr()`.
 *
 * Changing the language stores the choice in a cookie and reloads the page:
 * labels computed outside React state (option lists, helper functions,
 * memoized values) are then all produced again in the new language.
 */
export function I18nProvider({
    initialLocale,
    children,
}: {
    initialLocale: Locale;
    children: React.ReactNode;
}) {
    // Set during render, before any child renders and calls tr().
    setActiveLocale(initialLocale);

    const setLocale = useCallback((next: Locale) => {
        document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
        window.location.reload();
    }, []);

    const value = useMemo(
        () => ({
            locale: initialLocale,
            t: createTranslator(initialLocale),
            setLocale,
        }),
        [initialLocale, setLocale],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
