"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./locales";
import { SOURCE_LOCALE } from "./locales";
import { createTranslator, type Translate } from "./translate";

export type I18nValue = {
    locale: Locale;
    t: Translate;
    setLocale: (locale: Locale) => void;
};

// Without a provider (unit tests, isolated renders) the interface is English.
const ENGLISH: I18nValue = {
    locale: SOURCE_LOCALE,
    t: createTranslator(SOURCE_LOCALE),
    setLocale: () => {},
};

export const I18nContext = createContext<I18nValue>(ENGLISH);

export function useI18n(): I18nValue {
    return useContext(I18nContext);
}

/** The translator for the current interface language. */
export function useT(): Translate {
    return useContext(I18nContext).t;
}
