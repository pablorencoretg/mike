"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthApiError, login, signup } from "@/app/lib/authApi";
import { completeUserOnboarding, getUserProfile } from "@/app/lib/mikeApi";
import { InputUI } from "@/shared/ui/InputUI";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import Link from "next/link";
import { SiteLogo } from "@/app/components/site-logo";
import { useAuth } from "@/app/contexts/AuthContext";
import { cn } from "@/app/lib/utils";
import {
    authGlassCardUIClassName,
    authInputUIClassName,
} from "@/shared/ui/AuthStylesUI";
import { AuthDividerUI } from "@/shared/ui/AuthDividerUI";
import { SsoAuthButton } from "@/app/components/auth/SsoAuthButton";
import { GoogleAuthButton } from "@/app/components/auth/GoogleAuthButton";
import { FieldLabel } from "@/app/components/ui/form-field";
import { WarningPopup } from "@/app/components/popups/WarningPopup";
import { noticeActionClassName } from "@/shared/ui/NoticeCardUI";
import {
    describeError,
    supportMailtoFor,
    type UserFacingError,
} from "@/app/lib/userFacingError";
import {
    AUTH_ERROR_MESSAGES,
    TOO_MANY_ATTEMPTS_MESSAGE,
    authMessages,
} from "@/app/lib/authMessages";
import { useT } from "@/shared/i18n/I18nContext";
import { tr } from "@/shared/i18n/runtime";

/**
 * The shared auth table (`@/app/lib/authMessages`) with this screen's
 * deltas. Anything not listed falls through to `describeError`, which
 * classifies by status (429, 5xx) or by the failure itself (offline,
 * connection dropped), so no login failure can collapse into "please try
 * again" without saying what happened.
 */
const LOGIN_ERROR_MESSAGES = authMessages({
    // Same text as invalid_credentials: saying "no such account" would let
    // anyone test which addresses are registered.
    user_not_found: AUTH_ERROR_MESSAGES.invalid_credentials,
    // Here the account exists; it is this sign-in route that is closed.
    signup_disabled: tr("app.login.page.accountCanTUsedLog"),
    validation_failed: tr("app.login.page.enterEmailAddressPassword"),
    invalid_request: tr("app.login.page.enterEmailAddressPassword"),
    request_timeout: tr("app.login.page.loginRequestTimedOutTry"),
});

/** Classify a login failure into text a person can act on. */
function describeLoginError(error: unknown): UserFacingError {
    const described = describeError(error, {
        action: tr("app.login.page.log"),
        codeMessages: LOGIN_ERROR_MESSAGES,
        fallback: tr("app.login.page.unableLogRightNowTry"),
    });
    // A 429 without a GoTrue code still means "you tried too often".
    return described.kind === "rate_limited"
        ? { ...described, message: TOO_MANY_ATTEMPTS_MESSAGE }
        : described;
}

// The Mac desktop shell's preload bridge. Only its local ("everything on
// this Mac") mode answers guestCredentials with a value — in a browser the
// bridge doesn't exist, and against a hosted server it returns null — so
// gating the guest button on the answer keeps this page byte-identical in
// behavior everywhere else.
type GuestCredentials = { email: string; password: string };
declare global {
    interface Window {
        mikeDesktop?: {
            guestCredentials?: () => Promise<GuestCredentials | null>;
        };
    }
}

export default function LoginPage() {
    const t = useT();
    const router = useRouter();
    const {
        isAuthenticated,
        authLoading,
        authError,
        refreshSession,
        retrySession,
    } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<UserFacingError | null>(null);
    const [retryingSession, setRetryingSession] = useState(false);
    // The session warning is not about the form: a failed Retry is reported
    // in its place rather than as a sign-in error.
    const [sessionError, setSessionError] = useState<UserFacingError | null>(null);
    const [sessionWarningDismissed, setSessionWarningDismissed] = useState(false);
    const [shownAuthError, setShownAuthError] = useState(authError);
    if (shownAuthError !== authError) {
        // A new failure is a new warning, even after the last was dismissed.
        setShownAuthError(authError);
        setSessionError(null);
        setSessionWarningDismissed(false);
    }
    const [loginMode, setLoginMode] = useState<"account" | "guest" | null>(null);
    const [guest, setGuest] = useState<GuestCredentials | null>(null);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            router.replace("/onboarding/profile");
        }
    }, [authLoading, isAuthenticated, router]);

    useEffect(() => {
        let cancelled = false;
        window.mikeDesktop
            ?.guestCredentials?.()
            .then((creds) => {
                if (!cancelled && creds?.email && creds?.password) {
                    setGuest(creds);
                }
            })
            .catch(() => {});
        return () => {
            cancelled = true;
        };
    }, []);

    const submitLogin = async () => {
        setLoginMode("account");
        setLoading(true);
        setError(null);
        try {
            await login(email, password);
            await refreshSession();
            router.push("/onboarding/profile");
        } catch (caught: unknown) {
            setError(describeLoginError(caught));
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitLogin();
    };

    const handleRetrySession = async () => {
        setRetryingSession(true);
        setSessionError(null);
        try {
            await retrySession();
        } catch (caught: unknown) {
            // The Retry button failing silently is what made the original
            // session error look permanent; say so instead.
            setSessionError(
                describeError(caught, {
                    action: tr("app.login.page.restoreSession"),
                    fallback: tr("app.login.page.unableRestoreSessionTryAgain"),
                }),
            );
            setSessionWarningDismissed(false);
        } finally {
            setRetryingSession(false);
        }
    };

    const handleGuestLogin = async () => {
        if (!guest) return;
        setLoginMode("guest");
        setLoading(true);
        setError(null);

        try {
            try {
                await login(guest.email, guest.password);
            } catch (loginError) {
                if (
                    !(loginError instanceof AuthApiError) ||
                    loginError.code !== "invalid_credentials"
                ) {
                    throw loginError;
                }
                // First use: the guest account doesn't exist yet. Local mode
                // autoconfirms signups, so /signup returns a session directly
                // and requiresEmailConfirmation is false; if a deployment ever
                // did require confirmation there is no inbox to confirm from,
                // so surface that as an error rather than a dead end.
                const result = await signup(
                    guest.email,
                    guest.password,
                    "/onboarding/profile",
                );
                if (result.requiresEmailConfirmation) {
                    throw new Error(
                        "Guest sign-in needs an auto-confirming local stack.",
                    );
                }
            }
            // A local workspace needs no cloud account or practice questionnaire.
            // These optional details remain editable in Settings.
            const profile = await getUserProfile();
            if (!profile.onboardingComplete) await completeUserOnboarding();
            // Session lives in the httpOnly cookie the auth routes set, so the
            // context has to re-read it before any gated route will let us in.
            await refreshSession();
            router.push("/assistant");
        } catch (error: unknown) {
            setError(
                describeError(error, {
                    action: tr("app.login.page.openLocalWorkspace"),
                    codeMessages: LOGIN_ERROR_MESSAGES,
                    fallback: tr("app.login.page.unableContinueAsGuestRight"),
                }),
            );
        } finally {
            setLoading(false);
        }
    };

    // One warning at a time: the form's own failure first, then the session's.
    const sessionWarningOpen =
        !error && !!authError && !sessionWarningDismissed;
    const shownError = error ?? (sessionWarningOpen ? sessionError : null);
    const retryAction = error
        ? error.retryable && loginMode
            ? {
                  label: t("common.retry"),
                  onClick: () =>
                      void (loginMode === "guest"
                          ? handleGuestLogin()
                          : submitLogin()),
                  disabled: loading,
              }
            : undefined
        : sessionWarningOpen
          ? {
                label: retryingSession
                    ? t("common.retrying")
                    : t("common.retry"),
                onClick: () => void handleRetrySession(),
                disabled: retryingSession,
            }
          : undefined;

    return (
        <div className="relative flex min-h-dvh items-center justify-center bg-gray-50/80 px-6 py-10">
            <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2">
                <SiteLogo size="lg" asLink />
            </div>
            <div className="w-full max-w-md">
                {/* Login Form */}
                <div className={cn(authGlassCardUIClassName, "mb-4")}>
                    <h2 className="mb-6 text-left text-2xl font-medium font-serif text-gray-950">
                        {guest ? t("auth.login.guestTitle") : t("auth.login.title")}
                    </h2>
                    {guest && (
                        <div className="mb-6 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {t("auth.login.guestIntro")}
                            </p>
                            <PillButtonUI
                                type="button"
                                tone="black"
                                size="normal"
                                className="w-full"
                                onClick={handleGuestLogin}
                                disabled={loading}
                            >
                                {loading
                                    ? t("auth.login.guestOpening")
                                    : t("auth.login.guestContinue")}
                            </PillButtonUI>
                        </div>
                    )}
                    <details open={!guest}>
                        <summary
                            hidden={!guest}
                            className="mb-4 cursor-pointer text-sm text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring"
                        >
                            {t("auth.login.separateAccount")}
                        </summary>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <FieldLabel htmlFor="email">
                                    {t("auth.login.email")}
                                </FieldLabel>
                                <InputUI
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className={`w-full ${authInputUIClassName}`}
                                />
                            </div>

                            <div>
                                <div className="flex items-start justify-between gap-3">
                                    <FieldLabel htmlFor="password">
                                        {t("auth.login.password")}
                                    </FieldLabel>
                                    <Link
                                        href="/forgot-password"
                                        className="text-xs font-medium text-gray-500 transition-colors hover:text-gray-950"
                                    >
                                        {t("auth.login.forgotPassword")}
                                    </Link>
                                </div>
                                <InputUI
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                    required
                                    className={`w-full ${authInputUIClassName}`}
                                />
                            </div>

                            <div className="pt-2">
                                <PillButtonUI
                                    type="submit"
                                    tone="black"
                                    size="normal"
                                    disabled={loading}
                                    className="w-full"
                                >
                                    {loading
                                        ? t("auth.login.submitting")
                                        : t("auth.login.submit")}
                                </PillButtonUI>
                            </div>
                            {!guest && (
                                <>
                                    <AuthDividerUI label={t("common.or")} />
                                    <GoogleAuthButton
                                        onError={(nextError) => {
                                            setLoginMode(null);
                                            setError(nextError);
                                        }}
                                        disabled={loading}
                                        onLoadingChange={setLoading}
                                    />
                                    <SsoAuthButton disabled={loading} />
                                </>
                            )}
                        </form>
                    </details>
                </div>
                <div className="text-center text-sm text-gray-500">
                    {t("auth.login.noAccount")}{" "}
                    <Link
                        href="/signup"
                        className="font-medium transition-colors hover:text-gray-950"
                    >
                        {t("auth.login.signUp")}
                    </Link>
                </div>
            </div>
            <WarningPopup
                open={!!error || sessionWarningOpen}
                onClose={() => {
                    if (error) setError(null);
                    else setSessionWarningDismissed(true);
                }}
                title={
                    shownError
                        ? shownError.title
                        : t("auth.login.sessionWarningTitle")
                }
                message={shownError ? shownError.message : authError}
                actions={
                    shownError?.supportable ? (
                        <a
                            href={supportMailtoFor(
                                shownError,
                                "Failed to log in.",
                            )}
                            className={noticeActionClassName(
                                retryAction ? "secondary" : "primary",
                            )}
                        >
                            {t("common.contactSupport")}
                        </a>
                    ) : undefined
                }
                primaryAction={retryAction}
            />
        </div>
    );
}
