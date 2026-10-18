/**
 * One table of auth failure sentences.
 *
 * Every auth screen used to carry its own `code → sentence` map. Twenty-one
 * codes appeared in two or more of them, and three had drifted: the same
 * `user_not_found`, `same_password` and `signup_disabled` failure read
 * differently depending on which form the user was standing in front of.
 * Sentences are a product surface; they belong in one place.
 *
 * The codes are GoTrue's, normalised by `backend/src/modules/auth/
 * auth.messages.ts`, which also owns the sentence a non-browser client
 * (the Word add-in) receives as `detail`.
 *
 * A screen passes `authMessages({ ... })` when its wording genuinely has to
 * change with the context — "log in again before changing your email" is
 * not the same instruction as "before changing your password" — and the
 * override sits next to the call so the delta is visible.
 */

import {
    MAX_PASSWORD_LENGTH,
    MIN_PASSWORD_LENGTH,
} from "@/app/components/auth/passwordPolicy";
import { tr } from "@/shared/i18n/runtime";

export const TOO_MANY_ATTEMPTS_MESSAGE = tr("messages.tooManyAttempts");

const SESSION_EXPIRED_MESSAGE = tr("messages.sessionExpiredLogIn");

export const WEAK_PASSWORD_MESSAGE = tr("messages.weakPassword", {
    count: MIN_PASSWORD_LENGTH,
});

export const PASSWORD_LENGTH_MESSAGE = tr("messages.passwordLength", {
    min: MIN_PASSWORD_LENGTH,
    max: MAX_PASSWORD_LENGTH,
});

/** Wording for a link that has been used, tampered with, or has expired. */
export const LINK_SPENT_MESSAGE = tr("messages.linkSpent");

/** Wording for a six-digit authenticator code, shared by every MFA screen. */
export const MFA_CODE_INCORRECT_MESSAGE = tr("messages.mfaCodeIncorrect");
const MFA_CODE_EXPIRED_MESSAGE = tr("messages.mfaCodeExpired");

export const AUTH_ERROR_MESSAGES = {
    // Credentials
    invalid_credentials: tr("app.lib.authMessages.emailPasswordIncorrect"),
    // GoTrue reports a missing account as a dead session, not as "no such
    // user"; the login screen deliberately says something else (see there).
    user_not_found: SESSION_EXPIRED_MESSAGE,
    email_not_confirmed:
        tr("app.lib.authMessages.confirmEmailAddressBeforeLogging"),
    user_banned: tr("app.lib.authMessages.accountLockedContactSupportHave"),

    // Account creation
    user_already_exists:
        tr("app.lib.authMessages.accountEmailAlreadyExistsLog"),
    email_exists: tr("app.lib.authMessages.accountEmailAlreadyExistsLog"),
    signup_disabled: tr("app.lib.authMessages.newAccountsArenTOpen"),
    email_address_invalid: tr("app.lib.authMessages.enterValidEmailAddress"),
    email_address_not_authorized:
        tr("app.lib.authMessages.mikeCanTSendEmail"),

    // Passwords
    weak_password: WEAK_PASSWORD_MESSAGE,
    same_password: tr("app.lib.authMessages.choosePasswordHavenTUsed"),
    password_too_short: tr("app.lib.authMessages.passwordMustAtLeastCharacters", { MIN_PASSWORD_LENGTH }),
    password_too_long: tr("app.lib.authMessages.passwordMustAtMostUtf", { MAX_PASSWORD_LENGTH }),

    // Input this form can fix
    validation_failed: tr("app.lib.authMessages.someInformationProvidedIsnT"),
    invalid_request: tr("app.lib.authMessages.someInformationProvidedIsnT"),

    // Sessions and step-up
    session_expired: SESSION_EXPIRED_MESSAGE,
    session_not_found: SESSION_EXPIRED_MESSAGE,
    cookie_session_required: SESSION_EXPIRED_MESSAGE,
    bad_jwt: SESSION_EXPIRED_MESSAGE,
    no_authorization: SESSION_EXPIRED_MESSAGE,
    refresh_token_not_found: SESSION_EXPIRED_MESSAGE,
    refresh_token_already_used: SESSION_EXPIRED_MESSAGE,
    reauthentication_needed: tr("app.lib.authMessages.logAgainMakeChange"),
    reauthentication_not_valid: MFA_CODE_INCORRECT_MESSAGE,
    insufficient_aal: tr("app.lib.authMessages.finishTwoFactorVerificationContinue"),

    // Authenticator apps
    mfa_verification_failed: MFA_CODE_INCORRECT_MESSAGE,
    mfa_verification_rejected:
        tr("app.lib.authMessages.codeWasRejectedEnterCurrent"),
    mfa_challenge_expired: MFA_CODE_EXPIRED_MESSAGE,
    mfa_factor_not_found: tr("app.lib.authMessages.authenticatorNoLongerRegistered"),
    mfa_ip_address_mismatch:
        tr("app.lib.authMessages.networkChangedMidVerificationStart"),
    too_many_enrolled_mfa_factors:
        tr("app.lib.authMessages.alreadyHaveMaximumNumberAuthenticators"),
    mfa_totp_enroll_not_enabled:
        tr("app.lib.authMessages.authenticatorAppsTurnedOffWorkspace"),

    // Links and one-time codes
    otp_expired: tr("app.lib.authMessages.linkCodeHasExpiredRequest"),
    flow_state_expired: LINK_SPENT_MESSAGE,
    flow_state_not_found: LINK_SPENT_MESSAGE,
    bad_code_verifier:
        tr("app.lib.authMessages.linkWasOpenedDifferentBrowser"),
    bad_oauth_state:
        tr("app.lib.authMessages.signCouldnTCompletedStart"),
    bad_oauth_callback:
        tr("app.lib.authMessages.signCouldnTCompletedStart"),

    // Sign-in methods
    email_provider_disabled:
        tr("app.lib.authMessages.passwordLoginTurnedOffContinue"),
    provider_disabled:
        tr("app.lib.authMessages.signMethodTurnedOffWorkspace"),
    oauth_provider_not_supported:
        tr("app.lib.authMessages.signMethodTurnedOffWorkspace"),
    sso_disabled: tr("app.lib.authMessages.singleSignNotEnabled"),
    sso_domain_not_allowed:
        tr("app.lib.authMessages.singleSignNotAvailableEmail"),
    sso_unavailable: tr("app.lib.authMessages.unableStartSingleSignEmail"),
    sso_provider_not_found:
        tr("app.lib.authMessages.singleSignNotSetUp"),
    saml_provider_disabled:
        tr("app.lib.authMessages.singleSignNotEnabledEmail"),

    // Throttling and checks
    over_request_rate_limit: TOO_MANY_ATTEMPTS_MESSAGE,
    over_email_send_rate_limit:
        tr("app.lib.authMessages.tooManyEmailsHaveBeen"),
    captcha_failed:
        tr("app.lib.authMessages.securityCheckDidnTPass"),
    request_timeout: tr("app.lib.authMessages.requestTimedOutTryAgain"),
} as const satisfies Record<string, string>;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;

/**
 * The shared table with this screen's deltas applied. Overrides are typed
 * loosely on purpose: a screen may add a code only its own route emits.
 */
export function authMessages(
    overrides: Readonly<Record<string, string>> = {},
): Readonly<Record<string, string>> {
    return { ...AUTH_ERROR_MESSAGES, ...overrides };
}
