import { describe, expect, it } from "vitest";
import {
    localeFromAcceptLanguage,
    normalizeLocale,
    resolveLocale,
} from "./locales";

describe("normalizeLocale", () => {
    it("maps regional tags to a supported base language", () => {
        expect(normalizeLocale("es-CL")).toBe("es");
        expect(normalizeLocale(" ES_cl ")).toBe("es");
        expect(normalizeLocale("en")).toBe("en");
    });

    it("rejects unsupported or empty values", () => {
        expect(normalizeLocale("fr")).toBeNull();
        expect(normalizeLocale("")).toBeNull();
        expect(normalizeLocale(undefined)).toBeNull();
    });
});

describe("localeFromAcceptLanguage", () => {
    it("picks the highest-weighted supported language", () => {
        expect(localeFromAcceptLanguage("fr-FR,es-CL;q=0.9,en;q=0.8")).toBe("es");
        expect(localeFromAcceptLanguage("en;q=0.5,es;q=0.9")).toBe("es");
    });

    it("ignores q=0 and returns null when nothing matches", () => {
        expect(localeFromAcceptLanguage("es;q=0,fr")).toBeNull();
        expect(localeFromAcceptLanguage(null)).toBeNull();
    });
});

describe("resolveLocale", () => {
    it("prefers the saved choice over the deployment default and browser", () => {
        expect(
            resolveLocale({
                cookie: "en",
                deploymentDefault: "es",
                acceptLanguage: "es",
            }),
        ).toBe("en");
    });

    it("uses the deployment default before the browser language", () => {
        expect(
            resolveLocale({ deploymentDefault: "es", acceptLanguage: "en" }),
        ).toBe("es");
    });

    it("ignores an invalid cookie and falls back to English", () => {
        expect(resolveLocale({ cookie: "xx" })).toBe("en");
    });
});
