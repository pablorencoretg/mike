import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "@/shared/i18n/locales";

/**
 * Interface language for this request: the viewer's saved choice, then the
 * deployment default (`MIKE_DEFAULT_LOCALE`), then the browser's languages.
 */
export async function getRequestLocale(): Promise<Locale> {
    const [cookieStore, headerStore] = await Promise.all([cookies(), headers()]);
    return resolveLocale({
        cookie: cookieStore.get(LOCALE_COOKIE)?.value,
        deploymentDefault: process.env.MIKE_DEFAULT_LOCALE,
        acceptLanguage: headerStore.get("accept-language"),
    });
}
