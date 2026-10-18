"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useUserProfile } from "@/app/contexts/UserProfileContext";
import { userFacingApiError } from "@/app/lib/userFacingError";
import {
  SettingsDescription,
  SettingsLabel,
} from "@/app/components/settings/SettingsText";
import { GlassCardUI } from "@/shared/ui/GlassCardUI";
import { SettingsHeading } from "@/app/components/settings/SettingsHeading";
import { SettingsRow } from "@/app/components/settings/SettingsRow";
import { ToggleSwitchUI } from "@/shared/ui/ToggleSwitchUI";
import { authInputUIClassName } from "@/shared/ui/AuthStylesUI";
import {
  Dropdown,
  DropdownContent,
  DropdownRadioGroup,
  DropdownRadioItem,
  DropdownTrigger,
} from "@/shared/ui/dropdown";
import { cn } from "@/app/lib/utils";
import { useI18n } from "@/shared/i18n/I18nContext";
import { LOCALES, LOCALE_LABELS, isLocale } from "@/shared/i18n/locales";

export default function AppearancePage() {
  const { locale, setLocale, t } = useI18n();
  const { profile, updateDarkMode } = useUserProfile();
  const [savingDarkMode, setSavingDarkMode] = useState(false);
  const [darkModeError, setDarkModeError] = useState<string | null>(null);

  if (!profile) return null;

  const handleDarkModeToggle = async (enabled: boolean) => {
    if (savingDarkMode) return;
    setSavingDarkMode(true);
    setDarkModeError(null);
    try {
      await updateDarkMode(enabled);
    } catch (toggleError) {
      setDarkModeError(
        userFacingApiError(
          toggleError,
          t("settings.appearance.darkModeError"),
        ),
      );
    } finally {
      setSavingDarkMode(false);
    }
  };

  return (
    <section className="space-y-3">
      <SettingsHeading>{t("settings.appearance.title")}</SettingsHeading>
      <GlassCardUI>
        <SettingsRow>
          <div className="min-w-0 space-y-1">
            <SettingsLabel>{t("settings.appearance.darkMode")}</SettingsLabel>
            <SettingsDescription>
              {t("settings.appearance.darkModeDescription")}
            </SettingsDescription>
            {darkModeError && (
              <p role="alert" className="text-xs text-red-600">
                {darkModeError}
              </p>
            )}
          </div>
          <ToggleSwitchUI
            checked={profile.darkMode === true}
            disabled={savingDarkMode}
            aria-busy={savingDarkMode}
            aria-label={t("settings.appearance.darkMode")}
            onCheckedChange={(checked) => void handleDarkModeToggle(checked)}
          />
        </SettingsRow>
        <SettingsRow>
          <div className="min-w-0 space-y-1">
            <SettingsLabel>{t("settings.appearance.language")}</SettingsLabel>
            <SettingsDescription>
              {t("settings.appearance.languageDescription")}
            </SettingsDescription>
          </div>
          <Dropdown>
            <DropdownTrigger asChild>
              <button
                type="button"
                aria-label={t("settings.appearance.language")}
                className={cn(
                  "flex h-9 w-full shrink-0 items-center justify-between gap-2 text-left text-sm outline-none sm:w-56",
                  authInputUIClassName,
                )}
              >
                <span className="truncate">{LOCALE_LABELS[locale]}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
              </button>
            </DropdownTrigger>
            <DropdownContent
              align="end"
              sideOffset={6}
              className="w-[var(--radix-dropdown-menu-trigger-width)]"
            >
              <DropdownRadioGroup
                value={locale}
                onValueChange={(value) => {
                  if (isLocale(value) && value !== locale) setLocale(value);
                }}
              >
                {LOCALES.map((option) => (
                  <DropdownRadioItem key={option} value={option}>
                    <span lang={option}>{LOCALE_LABELS[option]}</span>
                  </DropdownRadioItem>
                ))}
              </DropdownRadioGroup>
            </DropdownContent>
          </Dropdown>
        </SettingsRow>
      </GlassCardUI>
    </section>
  );
}
