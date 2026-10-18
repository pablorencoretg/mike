import Link from "next/link";
import { pillButtonUIClassName } from "@/shared/ui/PillButtonUI.styles";
import { tr } from "@/shared/i18n/runtime";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
            <div className="text-center max-w-md">
                <h1 className="text-3xl font-eb-garamond font-light text-gray-900 mb-3">
                    {tr("app.notFound.pageNotFound")}
                </h1>
                <p className="text-[0.9375rem] text-gray-500 leading-relaxed mb-8">
                    {tr("app.notFound.pageReLookingDoesnT")}
                </p>

                <Link
                    href="/"
                    className={pillButtonUIClassName({
                        tone: "black",
                        size: "normal",
                    })}
                >
                    {tr("app.notFound.goHome")}
                </Link>
            </div>
        </div>
    );
}
