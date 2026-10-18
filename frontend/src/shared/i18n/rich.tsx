import { Fragment, type ReactNode } from "react";
import { tr, trn } from "./runtime";
import type { MessageKey } from "./translate";

function fill(template: string, values: Record<string, ReactNode>): ReactNode {
    const parts = template.split(/\{(\w+)\}/);
    return parts.map((part, index) =>
        index % 2 === 0 ? (
            part
        ) : (
            <Fragment key={index}>
                {Object.prototype.hasOwnProperty.call(values, part)
                    ? values[part]
                    : `{${part}}`}
            </Fragment>
        ),
    );
}

/**
 * Like tr(), but placeholders may be React nodes, so a translated sentence
 * can keep emphasis (<strong>) or links around the values it names.
 */
export function trRich(
    key: MessageKey,
    values: Record<string, ReactNode>,
): ReactNode {
    return fill(tr(key), values);
}

/** trRich() with singular/plural selection; `count` is passed as text. */
export function trnRich(
    count: number,
    one: MessageKey,
    other: MessageKey,
    values: Record<string, ReactNode>,
): ReactNode {
    return fill(trn(count, one, other), values);
}
