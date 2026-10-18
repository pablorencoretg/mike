"use client";

import { useState } from "react";
import { ApiKeyField } from "@/app/components/settings/ApiKeyField";
import {
  SettingsDescription,
  SettingsLabel,
} from "@/app/components/settings/SettingsText";
import { GlassCardUI } from "@/shared/ui/GlassCardUI";
import { SettingsHeading } from "@/app/components/settings/SettingsHeading";
import { SettingsRow } from "@/app/components/settings/SettingsRow";
import { ToggleSwitchUI } from "@/shared/ui/ToggleSwitchUI";
import { useUserProfile } from "@/app/contexts/UserProfileContext";
import { tr } from "@/shared/i18n/runtime";

export default function FeaturesPage() {
  const {
    profile,
    updateApiKey,
    updateLegalResearchUs,
    updateQuickActionsVisible,
  } = useUserProfile();
  const [saving, setSaving] = useState(false);
  const [savingQuickActions, setSavingQuickActions] = useState(false);
  const [optimisticLegalResearchUs, setOptimisticLegalResearchUs] = useState<
    boolean | null
  >(null);

  const persistedLegalResearchUs = profile?.legalResearchUs ?? true;
  const courtListenerEnabled =
    optimisticLegalResearchUs ?? persistedLegalResearchUs;
  const quickActionsVisible = profile?.quickActionsVisible ?? true;

  const setQuickActionsVisible = async (visible: boolean) => {
    setSavingQuickActions(true);
    // A failure is reported by the profile context's notice (with Retry);
    // the toggle reads the profile, so it is already back where it was.
    await updateQuickActionsVisible(visible);
    setSavingQuickActions(false);
  };

  const handleCourtListenerChange = async (enabled: boolean) => {
    if (saving) return;
    setOptimisticLegalResearchUs(enabled);
    setSaving(true);
    // A failure is reported by the profile context's notice (with Retry);
    // dropping the optimistic value puts the toggle back.
    await updateLegalResearchUs(enabled);
    setSaving(false);
    setOptimisticLegalResearchUs(null);
  };

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SettingsHeading>{tr("pages.settings.features.page.assistant")}</SettingsHeading>
        <GlassCardUI>
          <SettingsRow>
            <div className="min-w-0 space-y-1">
              <SettingsLabel>{tr("pages.settings.features.page.quickActions")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.features.page.showQuickActionsRowAssistant")}
              </SettingsDescription>
            </div>
            <ToggleSwitchUI
              checked={quickActionsVisible}
              disabled={savingQuickActions}
              aria-busy={savingQuickActions}
              aria-label={tr("pages.settings.features.page.quickActions")}
              onCheckedChange={(checked) => {
                void setQuickActionsVisible(checked);
              }}
            />
          </SettingsRow>
        </GlassCardUI>
      </section>

      <section className="space-y-3">
        <SettingsHeading>{tr("pages.settings.features.page.legalResearch")}</SettingsHeading>
        <GlassCardUI>
          <SettingsRow>
            <div className="min-w-0 space-y-1">
              <SettingsLabel>{tr("pages.settings.features.page.enableCourtlistener")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.features.page.courtlistenerProvidesAccessUsCase")}
              </SettingsDescription>
            </div>
            <ToggleSwitchUI
              checked={courtListenerEnabled}
              disabled={saving}
              aria-busy={saving}
              aria-label={tr("pages.settings.features.page.enableCourtlistener")}
              onCheckedChange={(enabled) =>
                void handleCourtListenerChange(enabled)
              }
            />
          </SettingsRow>
          {courtListenerEnabled && (
            <ApiKeyField
              label={tr("pages.settings.features.page.courtlistenerApiKey")}
              hasSavedKey={profile?.apiKeys.courtlistener.source === "user"}
              onSave={(value) =>
                updateApiKey("courtlistener", value.trim() || null)
              }
              onRemove={() => updateApiKey("courtlistener", null)}
            />
          )}
        </GlassCardUI>
      </section>
    </div>
  );
}
