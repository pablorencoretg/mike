"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { I18nContext } from "@/shared/i18n/I18nContext";
import { LOCALE_COOKIE, type Locale } from "@/shared/i18n/locales";
import { createTranslator } from "@/shared/i18n/translate";

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Supplies the interface language chosen on the server (see app/layout.tsx).
 * Changing it stores the choice in a cookie, re-renders client text at once,
 * and refreshes server-rendered parts such as the page title.
 */
export function I18nProvider({
    initialLocale,
    children,
}: {
    initialLocale: Locale;
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [locale, setLocaleState] = useState<Locale>(initialLocale);

    const setLocale = useCallback(
        (next: Locale) => {
            document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${ONE_YEAR_SECONDS}; samesite=lax`;
            document.documentElement.lang = next;
            setLocaleState(next);
            router.refresh();
        },
        [router],
    );

    const value = useMemo(
        () => ({ locale, t: createTranslator(locale), setLocale }),
        [locale, setLocale],
    );

    return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
