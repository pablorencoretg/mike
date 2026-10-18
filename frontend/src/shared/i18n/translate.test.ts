import { describe, expect, it } from "vitest";
import { en } from "./messages/en";
import { es } from "./messages/es";
import { createTranslator, interpolate } from "./translate";

function leafPaths(node: object, prefix = ""): string[] {
    return Object.entries(node).flatMap(([key, value]) =>
        typeof value === "string"
            ? [`${prefix}${key}`]
            : leafPaths(value as object, `${prefix}${key}.`),
    );
}

describe("createTranslator", () => {
    it("returns the string for the requested locale", () => {
        expect(createTranslator("en")("auth.login.submit")).toBe("Log in");
        expect(createTranslator("es")("auth.login.submit")).toBe(
            "Iniciar sesión",
        );
    });
});

describe("interpolate", () => {
    it("fills named placeholders and leaves unknown ones untouched", () => {
        expect(interpolate("{count} of {total}", { count: 2, total: 5 })).toBe(
            "2 of 5",
        );
        expect(interpolate("Hi {name}", {})).toBe("Hi {name}");
        expect(interpolate("Hi {name}", { name: undefined })).toBe("Hi ");
    });
});

describe("dictionaries", () => {
    it("Spanish has exactly the English keys", () => {
        expect(leafPaths(es).sort()).toEqual(leafPaths(en).sort());
    });

    it("uses only placeholders that the English string provides", () => {
        // A translation may drop a value English grammar needs (an article,
        // a verb form), but must not invent one the caller never passes.
        const english = createTranslator("en");
        const spanish = createTranslator("es");
        for (const path of leafPaths(en)) {
            const provided = new Set(
                english(path as never).match(/\{\w+\}/g) ?? [],
            );
            for (const placeholder of spanish(path as never).match(/\{\w+\}/g) ?? []) {
                expect(provided.has(placeholder), `${path}: ${placeholder}`).toBe(true);
            }
        }
    });
});
