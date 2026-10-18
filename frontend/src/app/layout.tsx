import type { Metadata } from "next";
// Self-hosted Inter and EB Garamond; sets --font-inter and --font-eb-garamond.
import "./fonts/fonts.css";
import "./globals.css";
import { Providers } from "@/app/components/providers";
import { getRequestLocale } from "@/app/lib/serverLocale";
import { createTranslator } from "@/shared/i18n/translate";

export async function generateMetadata(): Promise<Metadata> {
    const t = createTranslator(await getRequestLocale());
    const title = t("meta.title");
    const description = t("meta.description");
    return {
        metadataBase: new URL("https://app.mikeoss.com"),
        title,
        description,
        icons: {
            icon: [
                { url: "/icon.svg", type: "image/svg+xml" },
                { url: "/favicon.ico" },
            ],
            apple: "/apple-touch-icon.png",
        },
        openGraph: {
            type: "website",
            url: "https://app.mikeoss.com",
            siteName: "Mike",
            title,
            description,
            images: [
                {
                    url: "/link-image.jpg",
                    width: 1200,
                    height: 651,
                    alt: "Mike",
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: ["/link-image.jpg"],
        },
    };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const locale = await getRequestLocale();
    return (
        <html lang={locale}>
            <body
                className="font-sans antialiased"
            >
                <Providers locale={locale}>{children}</Providers>
            </body>
        </html>
    );
}
