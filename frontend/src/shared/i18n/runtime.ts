// Translator for code that has no React context at hand: helper functions,
// option lists and labels built outside a component body.
//
// The active locale comes from <html lang> when this module loads in the
// browser, and the app's I18nProvider sets it again while it renders, before
// any of its children. Changing the language reloads the page, so every
// string, memoized or module-level, is produced again in the new language.
// Without either (unit tests, the Word add-in) the active locale is English.
//
// Import with a relative path from `src/shared/` so the Word add-in, which
// compiles some shared files, can resolve it.

import { SOURCE_LOCALE, normalizeLocale, type Locale } from "./locales";
import {
    createTranslator,
    type MessageKey,
    type Translate,
    type TranslateValues,
} from "./translate";

// In the browser the server has already written the request's language into
// <html lang>, so strings built while modules load (constants, option
// lists) are in the right language before the provider renders.
let activeLocale: Locale =
    (typeof document !== "undefined" &&
        normalizeLocale(document.documentElement.lang)) ||
    SOURCE_LOCALE;
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

/**
 * Picks the singular or plural message for `count` and passes `count` in as
 * a value, e.g. trn(n, "x.fileOne", "x.fileOther") with "{count} files".
 */
export function trn(
    count: number,
    one: MessageKey,
    other: MessageKey,
    values?: TranslateValues,
): string {
    return tr(count === 1 ? one : other, { count, ...values });
}
