import type { en } from "./en";

type Widen<T> = {
    readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

/** Shape every locale's dictionary must match: the English one, as strings. */
export type Messages = Widen<typeof en>;

type Paths<T, Prefix extends string = ""> = {
    [K in keyof T & string]: T[K] extends string
        ? `${Prefix}${K}`
        : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

/** Dotted path to one string, e.g. "auth.login.submit". */
export type MessageKey = Paths<Messages>;
