// English interface strings: the source dictionary. Add a key here first,
// then the same key to every other locale (TypeScript enforces it).
// Use {name} placeholders for values filled in at runtime.

export const en = {
    meta: {
        title: "Mike - Legal AI Platform",
        description: "AI-powered legal document analysis and contract review platform.",
    },
    common: {
        retry: "Retry",
        retrying: "Retrying...",
        contactSupport: "Contact support",
        or: "or",
    },
    auth: {
        login: {
            title: "Log In",
            guestTitle: "Your workspace on this Mac",
            guestIntro: "Start without an account. Your work is saved on this Mac. You can add your practice details later in Settings.",
            guestOpening: "Opening workspace…",
            guestContinue: "Continue on this Mac",
            separateAccount: "Use a separate local account",
            email: "Email",
            password: "Password",
            forgotPassword: "Forgot password?",
            submitting: "Logging in...",
            submit: "Log in",
            noAccount: "Don't have an account?",
            signUp: "Sign up",
            sessionWarningTitle: "Couldn't check your session",
        },
        google: {
            continue: "Continue with Google",
            continuing: "Continuing…",
        },
        sso: {
            continue: "Continue with SSO",
        },
    },
    settings: {
        appearance: {
            title: "Appearance",
            darkMode: "Dark mode",
            darkModeDescription: "Use a darker color palette throughout Mike.",
            darkModeError: "Could not update the appearance setting.",
            language: "Language",
            languageDescription: "Language of menus, buttons and messages. The assistant's answers follow Personalisation > Response style.",
        },
    },
};
