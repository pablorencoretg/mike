"use client";

import { useState } from "react";
import { GoogleIconUI } from "@/shared/ui/GoogleIconUI";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import { startGoogleOAuth } from "@/app/lib/authApi";
import {
    describeError,
    type UserFacingError,
} from "@/app/lib/userFacingError";
import { useT } from "@/shared/i18n/I18nContext";
import { tr } from "@/shared/i18n/runtime";

const GOOGLE_ERROR_MESSAGES = {
    provider_disabled:
        tr("auth.googleAuthButton.googleSignTurnedOffWorkspace"),
    oauth_provider_not_supported:
        tr("auth.googleAuthButton.googleSignTurnedOffWorkspace"),
    over_request_rate_limit: tr("auth.googleAuthButton.tooManyAttemptsWaitMoment"),
} as const;

interface GoogleAuthButtonProps {
    /** Receives a classified failure, or `null` when the error is cleared. */
    onError: (error: UserFacingError | null) => void;
    disabled?: boolean;
    onLoadingChange?: (loading: boolean) => void;
}

export function GoogleAuthButton({
    onError,
    disabled = false,
    onLoadingChange,
}: GoogleAuthButtonProps) {
    const t = useT();
    const [loading, setLoading] = useState(false);

    const handleGoogleAuth = async () => {
        setLoading(true);
        onLoadingChange?.(true);
        onError(null);

        try {
            const { url } = await startGoogleOAuth("/onboarding/profile");
            window.location.assign(url);
        } catch (error: unknown) {
            // A provider error message ("invalid_client", a stack line) is
            // never shown; the caller renders the classified text instead.
            onError(
                describeError(error, {
                    action: tr("auth.googleAuthButton.continueGoogle"),
                    codeMessages: GOOGLE_ERROR_MESSAGES,
                    fallback:
                        tr("auth.googleAuthButton.unableContinueGoogleTryAgain"),
                }),
            );
            setLoading(false);
            onLoadingChange?.(false);
        }
    };

    return (
        <PillButtonUI
            type="button"
            tone="white"
            size="normal"
            className="w-full"
            disabled={disabled || loading}
            loading={loading}
            onClick={() => void handleGoogleAuth()}
        >
            <GoogleIconUI className="h-4 w-4" />
            {loading ? t("auth.google.continuing") : t("auth.google.continue")}
        </PillButtonUI>
    );
}
