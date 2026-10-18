"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signup } from "@/app/lib/authApi";
import { InputUI } from "@/shared/ui/InputUI";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import { pillButtonUIClassName } from "@/shared/ui/PillButtonUI.styles";
import Link from "next/link";
import { SiteLogo } from "@/app/components/site-logo";
import { useAuth } from "@/app/contexts/AuthContext";
import { cn } from "@/app/lib/utils";
import { WarningPopup } from "@/app/components/popups/WarningPopup";
import { noticeActionClassName } from "@/shared/ui/NoticeCardUI";
import {
    authGlassCardUIClassName,
    authInputUIClassName,
} from "@/shared/ui/AuthStylesUI";
import {
    UserVisibleError,
    describeError,
    supportMailtoFor,
    type UserFacingError,
} from "@/app/lib/userFacingError";


/** A failure the form found itself, so the text is already user-facing. */
function localSignupError(message: string): UserFacingError {
    return describeError(
        new UserVisibleError(message, { kind: "validation" }),
        { action: tr("app.signup.page.createAccount") },
    );
}

/**
 * The shared auth table with this screen's deltas. Anything not listed
 * falls through to `describeError` so a 429, a 5xx, or a dropped connection
 * still says what actually happened.
 */
const SIGNUP_ERROR_MESSAGES = authMessages({
    validation_failed: tr("app.signup.page.checkEmailAddressPasswordTry"),
    invalid_request: tr("app.signup.page.checkEmailAddressPasswordTry"),
    over_email_send_rate_limit:
        tr("app.signup.page.tooManySignupEmailsHave"),
    request_timeout: tr("app.signup.page.signupRequestTimedOutTry"),
});

/** Classify a signup failure into text a person can act on. */
function describeSignupError(error: unknown): UserFacingError {
    const described = describeError(error, {
        action: tr("app.signup.page.createAccount"),
        codeMessages: SIGNUP_ERROR_MESSAGES,
        fallback: tr("app.signup.page.unableCreateAccountRightNow"),
    });
    return described.kind === "rate_limited"
        ? { ...described, message: TOO_MANY_ATTEMPTS_MESSAGE }
        : described;
}
import {
    MIN_PASSWORD_LENGTH,
    isPasswordTooLong,
    maximumPasswordMessage,
    minimumPasswordMessage,
} from "@/app/components/auth/passwordPolicy";
import { TOO_MANY_ATTEMPTS_MESSAGE, authMessages } from "@/app/lib/authMessages";
import { AuthDividerUI } from "@/shared/ui/AuthDividerUI";
import { GoogleAuthButton } from "@/app/components/auth/GoogleAuthButton";
import { FieldLabel } from "@/app/components/ui/form-field";
import { useT } from "@/shared/i18n/I18nContext";
import { tr } from "@/shared/i18n/runtime";

function SignupContent() {
    const t = useT();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, authLoading, refreshSession } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<UserFacingError | null>(null);
    const [success, setSuccess] = useState(false);
    const isAccountCreatedPreview =
        process.env.NODE_ENV !== "production" &&
        searchParams.get("preview") === "account-created";

    useEffect(() => {
        if (isAccountCreatedPreview) return;
        if (!authLoading && isAuthenticated && !loading && !success) {
            router.replace("/onboarding/profile");
        }
    }, [
        authLoading,
        isAccountCreatedPreview,
        isAuthenticated,
        loading,
        router,
        success,
    ]);

    useEffect(() => {
        if (!success) return;
        const timer = setTimeout(() => {
            router.push("/onboarding/profile");
        }, 2000);
        return () => clearTimeout(timer);
    }, [router, success]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validate passwords match
        if (password !== confirmPassword) {
            setError(localSignupError(t("auth.signup.passwordsMismatch")));
            setLoading(false);
            return;
        }

        // Validate password length. The upper bound is bcrypt's 72 BYTES:
        // GoTrue rejects anything longer, so say so before the round trip.
        if (password.length < MIN_PASSWORD_LENGTH) {
            setError(localSignupError(`${minimumPasswordMessage}.`));
            setLoading(false);
            return;
        }
        if (isPasswordTooLong(password)) {
            setError(localSignupError(maximumPasswordMessage));
            setLoading(false);
            return;
        }

        try {
            const trimmedEmail = email.trim();
            const result = await signup(
                trimmedEmail,
                password,
                "/onboarding/profile",
            );

            if (!result.requiresEmailConfirmation) {
                await refreshSession();
                setSuccess(true);
            } else {
                router.push("/signup/check-email");
            }
        } catch (caught: unknown) {
            setError(describeSignupError(caught));
        } finally {
            setLoading(false);
        }
    };

    // Success View
    if (success || isAccountCreatedPreview) {
        return (
            <div className="relative flex min-h-dvh items-center justify-center bg-gray-50/80 px-6 py-10">
                <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2">
                    <SiteLogo size="lg" asLink />
                </div>
                <div className="w-full max-w-md">
                    <div className={authGlassCardUIClassName}>
                        <h1 className="font-serif text-2xl font-medium text-gray-950">
                            {t("auth.signup.createdTitle")}
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-gray-600">
                            {t("auth.signup.createdRedirect")}
                        </p>
                        <Link
                            href="/onboarding/profile"
                            className={pillButtonUIClassName({
                                tone: "black",
                                size: "normal",
                                className: "mt-6",
                            })}
                        >
                            {t("common.continue")}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Default Signup Form View
    return (
        <div className="relative flex min-h-dvh items-center justify-center bg-gray-50/80 px-6 py-24">
            <div className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2">
                <SiteLogo size="lg" asLink />
            </div>
            <div className="w-full max-w-md">
                <div className={cn(authGlassCardUIClassName, "mb-4")}>
                    <h2 className="mb-6 text-left text-2xl font-medium font-serif text-gray-950">
                        {t("auth.signup.title")}
                    </h2>

                    <form onSubmit={handleSignup} className="space-y-4">
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
                            <FieldLabel htmlFor="password">
                                {t("auth.login.password")}
                            </FieldLabel>
                            <InputUI
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t("auth.signup.passwordPlaceholder", {
                                    count: MIN_PASSWORD_LENGTH,
                                })}
                                required
                                className={`w-full ${authInputUIClassName}`}
                            />
                        </div>

                        <div>
                            <FieldLabel htmlFor="confirmPassword">
                                {t("auth.signup.confirmPassword")}
                            </FieldLabel>
                            <InputUI
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                                required
                                className={`w-full ${authInputUIClassName}`}
                            />
                        </div>

                        <div className="space-y-3 pt-2">
                            <div className="text-center text-xs text-gray-500">
                                {t("auth.signup.agreePrefix")}{" "}
                                <Link
                                    href="https://mikeoss.com/terms"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {t("auth.signup.terms")}
                                </Link>{" "}
                                {t("auth.signup.and")}{" "}
                                <Link
                                    href="https://mikeoss.com/privacy"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                >
                                    {t("auth.signup.privacy")}
                                </Link>
                            </div>
                            <PillButtonUI
                                type="submit"
                                tone="black"
                                size="normal"
                                disabled={loading}
                                className="w-full"
                            >
                                {loading
                                    ? t("auth.signup.submitting")
                                    : t("auth.signup.submit")}
                            </PillButtonUI>
                            <AuthDividerUI label={t("common.or")} />
                            <GoogleAuthButton
                                onError={setError}
                                disabled={loading}
                                onLoadingChange={setLoading}
                            />
                        </div>
                    </form>
                </div>
                <div className="text-center text-sm text-gray-500">
                    {t("auth.signup.haveAccount")}{" "}
                    <Link
                        href="/login"
                        className="font-medium transition-colors hover:text-gray-950"
                    >
                        {t("auth.signup.logIn")}
                    </Link>
                </div>
            </div>
            <WarningPopup
                open={!!error}
                onClose={() => setError(null)}
                title={error?.title}
                message={error?.message}
                actions={
                    error?.supportable ? (
                        <a
                            href={supportMailtoFor(
                                error,
                                "Failed to create an account.",
                            )}
                            className={noticeActionClassName()}
                        >
                            {t("common.contactSupport")}
                        </a>
                    ) : undefined
                }
            />
        </div>
    );
}

export default function SignupPage() {
    return (
        <Suspense fallback={null}>
            <SignupContent />
        </Suspense>
    );
}
