import { tr, trn } from "@/shared/i18n/runtime";
/**
 * Warning for a PDF whose pages carry no text layer (scanned without OCR). The
 * assistant reads PDFs through their text layer only, so those pages are
 * invisible to it even though the viewer shows them. Null when there is
 * nothing to warn about, including versions that were never measured.
 */
export function textLayerWarning(
    pageCount: number | null | undefined,
    textlessPageCount: number | null | undefined,
): string | null {
    if (!textlessPageCount || textlessPageCount < 1) return null;
    if (pageCount != null && textlessPageCount >= pageCount) {
        return tr("app.lib.textLayerWarning.noTextLayerPdfLooks");
    }
    const pages =
        pageCount != null
            ? tr("tb.pagesOf", { count: textlessPageCount, total: pageCount })
            : trn(textlessPageCount, "tb.pageOne", "tb.pageOther");
    const verb = textlessPageCount === 1 ? "has" : "have";
    const pronoun = textlessPageCount === 1 ? "it" : "them";
    return tr("app.lib.textLayerWarning.noTextLayerLikelyScanned", { pages, verb, pronoun });
}
