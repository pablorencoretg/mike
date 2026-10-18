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

    it("keeps every placeholder of the English string", () => {
        const t = createTranslator("es");
        for (const path of leafPaths(en)) {
            const english = createTranslator("en")(path as never);
            const placeholders = english.match(/\{\w+\}/g) ?? [];
            for (const placeholder of placeholders) {
                expect(t(path as never), path).toContain(placeholder);
            }
        }
    });
});
