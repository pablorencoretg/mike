import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppearancePage from "./page";
import { I18nContext } from "@/shared/i18n/I18nContext";
import { createTranslator } from "@/shared/i18n/translate";

const { updateDarkMode, profile } = vi.hoisted(() => ({
    updateDarkMode: vi.fn(),
    profile: { darkMode: false },
}));

vi.mock("@/app/contexts/UserProfileContext", () => ({
    useUserProfile: () => ({
        profile,
        updateDarkMode,
    }),
}));

describe("AppearancePage", () => {
    beforeEach(() => {
        updateDarkMode.mockReset();
        updateDarkMode.mockResolvedValue(undefined);
        profile.darkMode = false;
    });

    it("saves dark mode without rendering a decorative card icon", async () => {
        const user = userEvent.setup();
        const { container } = render(<AppearancePage />);

        expect(
            screen.getByRole("heading", { name: "Appearance" }),
        ).toBeVisible();
        expect(screen.getByText("Dark mode")).toBeVisible();
        // The only icon is the language picker's chevron, not card decoration.
        expect(
            container.querySelectorAll("svg:not(.lucide-chevron-down)"),
        ).toHaveLength(0);

        const toggle = screen.getByRole("switch", { name: "Dark mode" });
        expect(toggle).toHaveAttribute("aria-checked", "false");

        await user.click(toggle);
        expect(updateDarkMode).toHaveBeenCalledWith(true);
    });

    it("reports a failed change without leaking the raw error", async () => {
        const user = userEvent.setup();
        updateDarkMode.mockRejectedValue(new Error("pg: connection refused"));
        render(<AppearancePage />);

        await user.click(screen.getByRole("switch", { name: "Dark mode" }));
        await waitFor(() =>
            expect(screen.getByRole("alert")).toHaveTextContent(
                "Could not update the appearance setting.",
            ),
        );
        expect(screen.queryByText(/connection refused/i)).not.toBeInTheDocument();
    });

    it("switches the interface language from the picker", async () => {
        const setLocale = vi.fn();
        render(
            <I18nContext.Provider
                value={{ locale: "en", t: createTranslator("en"), setLocale }}
            >
                <AppearancePage />
            </I18nContext.Provider>,
        );

        const picker = screen.getByRole("button", { name: "Language" });
        expect(picker).toHaveTextContent("English");
        // Radix opens on pointerdown, not click.
        fireEvent.pointerDown(
            picker,
            new MouseEvent("pointerdown", { bubbles: true, cancelable: true }),
        );
        fireEvent.click(
            await screen.findByRole("menuitemradio", { name: "Español" }),
        );
        expect(setLocale).toHaveBeenCalledWith("es");
    });

    it("renders in Spanish when that is the interface language", () => {
        render(
            <I18nContext.Provider
                value={{ locale: "es", t: createTranslator("es"), setLocale: vi.fn() }}
            >
                <AppearancePage />
            </I18nContext.Provider>,
        );

        expect(
            screen.getByRole("heading", { name: "Apariencia" }),
        ).toBeVisible();
        expect(screen.getByRole("switch", { name: "Modo oscuro" })).toBeVisible();
        expect(screen.getByRole("button", { name: "Idioma" })).toHaveTextContent(
            "Español",
        );
    });

});
