// Spanish interface strings. Must have exactly the keys of `en.ts`.
// Register: informal "tú", neutral Latin American Spanish.

import type { Messages } from "./types";

export const es: Messages = {
    meta: {
        title: "Mike - Plataforma de IA legal",
        description: "Plataforma de análisis de documentos legales y revisión de contratos con IA.",
    },
    common: {
        retry: "Reintentar",
        retrying: "Reintentando...",
        contactSupport: "Contactar a soporte",
        or: "o",
    },
    auth: {
        login: {
            title: "Iniciar sesión",
            guestTitle: "Tu espacio de trabajo en este Mac",
            guestIntro: "Empieza sin cuenta. Tu trabajo se guarda en este Mac. Puedes agregar los datos de tu ejercicio profesional más tarde en Configuración.",
            guestOpening: "Abriendo espacio de trabajo…",
            guestContinue: "Continuar en este Mac",
            separateAccount: "Usar una cuenta local aparte",
            email: "Correo electrónico",
            password: "Contraseña",
            forgotPassword: "¿Olvidaste tu contraseña?",
            submitting: "Iniciando sesión...",
            submit: "Iniciar sesión",
            noAccount: "¿No tienes cuenta?",
            signUp: "Crear cuenta",
            sessionWarningTitle: "No se pudo verificar tu sesión",
        },
        google: {
            continue: "Continuar con Google",
            continuing: "Continuando…",
        },
        sso: {
            continue: "Continuar con SSO",
        },
    },
    settings: {
        appearance: {
            title: "Apariencia",
            darkMode: "Modo oscuro",
            darkModeDescription: "Usa una paleta de colores oscura en todo Mike.",
            darkModeError: "No se pudo actualizar la apariencia.",
            language: "Idioma",
            languageDescription: "Idioma de los menús, botones y mensajes. El idioma de las respuestas del asistente se elige en Personalización > Estilo de respuesta.",
        },
    },
};
