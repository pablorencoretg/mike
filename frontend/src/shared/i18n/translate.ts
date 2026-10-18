import type { Locale } from "./locales";
import { SOURCE_LOCALE } from "./locales";
import { en } from "./messages/en";
import { es } from "./messages/es";
import type { MessageKey, Messages } from "./messages/types";

export type { MessageKey, Messages } from "./messages/types";

const DICTIONARIES: Record<Locale, Messages> = { en, es };

export type TranslateValues = Record<string, string | number>;
export type Translate = (key: MessageKey, values?: TranslateValues) => string;

function lookup(dictionary: Messages, key: string): string | undefined {
    let node: unknown = dictionary;
    for (const segment of key.split(".")) {
        if (node === null || typeof node !== "object") return undefined;
        node = (node as Record<string, unknown>)[segment];
    }
    return typeof node === "string" ? node : undefined;
}

/** Replaces each `{name}` with `values.name`; unknown names are left as-is. */
export function interpolate(template: string, values?: TranslateValues): string {
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        Object.prototype.hasOwnProperty.call(values, name)
            ? String(values[name])
            : match,
    );
}

/**
 * Returns `t(key, values)` for a locale. A key missing from that locale falls
 * back to English, so a partially translated screen never shows a raw key.
 */
export function createTranslator(locale: Locale): Translate {
    const dictionary = DICTIONARIES[locale];
    const fallback = DICTIONARIES[SOURCE_LOCALE];
    return (key, values) =>
        interpolate(lookup(dictionary, key) ?? lookup(fallback, key) ?? key, values);
}
