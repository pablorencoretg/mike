"use client";

import { Suspense } from "react";
import { AuthProvider } from "@/app/contexts/AuthContext";
import { UserProfileProvider } from "@/app/contexts/UserProfileContext";
import { MfaLoginGate } from "@/app/components/shared/MfaLoginGate";
import { FullScreenLoader } from "@/app/components/shared/FullScreenLoader";
import { OnboardingGate } from "@/app/components/auth/OnboardingGate";
import { useInputModality } from "@/app/hooks/useInputModality";
import { AppToasts } from "@/app/components/ui/toast";
import { I18nProvider } from "@/app/components/i18n/I18nProvider";
import { SOURCE_LOCALE, type Locale } from "@/shared/i18n/locales";

export function Providers({
    children,
    locale = SOURCE_LOCALE,
}: {
    children: React.ReactNode;
    locale?: Locale;
}) {
    useInputModality();
    return (
        <I18nProvider initialLocale={locale}>
            <AuthProvider>
                <UserProfileProvider>
                    <Suspense fallback={<FullScreenLoader />}>
                        <MfaLoginGate>
                            <OnboardingGate>{children}</OnboardingGate>
                        </MfaLoginGate>
                    </Suspense>
                    <AppToasts />
                </UserProfileProvider>
            </AuthProvider>
        </I18nProvider>
    );
}
