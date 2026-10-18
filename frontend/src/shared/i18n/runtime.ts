// Translator for code that has no React context at hand: helper functions,
// option lists and labels built outside a component body.
//
// The active locale is set by the app's I18nProvider while it renders, before
// any of its children. Changing the language reloads the page, so every
// string, memoized or not, is produced again in the new language. Without a
// provider (unit tests, the Word add-in) the active locale stays English.
//
// Import with a relative path from `src/shared/` so the Word add-in, which
// compiles some shared files, can resolve it.

import { SOURCE_LOCALE, type Locale } from "./locales";
import {
    createTranslator,
    type MessageKey,
    type Translate,
    type TranslateValues,
} from "./translate";

let activeLocale: Locale = SOURCE_LOCALE;
const translators = new Map<Locale, Translate>();

function translatorFor(locale: Locale): Translate {
    let translator = translators.get(locale);
    if (!translator) {
        translator = createTranslator(locale);
        translators.set(locale, translator);
    }
    return translator;
}

export function setActiveLocale(locale: Locale): void {
    activeLocale = locale;
}

export function getActiveLocale(): Locale {
    return activeLocale;
}

/** Translates `key` into the active interface language. */
export function tr(key: MessageKey, values?: TranslateValues): string {
    return translatorFor(activeLocale)(key, values);
}
