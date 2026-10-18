"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useOrganizationInvitationCount } from "@/app/hooks/useOrganizationInvitationCount";
import {
    SettingsShell,
    type SettingsShellTab,
} from "@/app/components/settings/SettingsShell";
import { useT } from "@/shared/i18n/I18nContext";
import type { MessageKey } from "@/shared/i18n/translate";

type SettingsTabDefinition = Omit<SettingsShellTab, "label"> & {
    labelKey: MessageKey;
};

const TABS: SettingsTabDefinition[] = [
    { id: "account", labelKey: "settings.tabs.account", href: "/settings" },
    {
        id: "personalisation",
        labelKey: "settings.tabs.personalisation",
        href: "/settings/personalisation",
    },
    { id: "memory", labelKey: "settings.tabs.memory", href: "/settings/memory" },
    {
        id: "appearance",
        labelKey: "settings.tabs.appearance",
        href: "/settings/appearance",
    },
    {
        id: "features",
        labelKey: "settings.tabs.features",
        href: "/settings/features",
    },
    {
        id: "privacy-data",
        labelKey: "settings.tabs.privacyData",
        href: "/settings/privacy-data",
    },
    {
        id: "my-activity",
        labelKey: "settings.tabs.myActivity",
        href: "/settings/my-activity",
    },
    {
        id: "security",
        labelKey: "settings.tabs.security",
        href: "/settings/security",
    },
    { id: "models", labelKey: "settings.tabs.models", href: "/settings/models" },
    {
        id: "byok",
        labelKey: "settings.tabs.byok",
        href: "/settings/byok",
    },
    {
        id: "connectors",
        labelKey: "settings.tabs.connectors",
        href: "/settings/connectors",
    },
    // The organizations the person belongs to, and their invitations. Each
    // organization's own settings are a separate area, opened from here or
    // from the account menu.
    {
        id: "organizations",
        labelKey: "settings.tabs.organizations",
        href: "/settings/organizations",
    },
];

export default function SettingsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const t = useT();
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, authLoading } = useAuth();
    const invitationCount = useOrganizationInvitationCount(
        isAuthenticated && !authLoading ? user?.id : undefined,
    );

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.push("/");
        }
    }, [isAuthenticated, authLoading, router]);

    if (authLoading) {
        return (
            <div className="h-dvh flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // My Activity is linked from Settings but uses the full table-page layout.
    if (pathname === "/settings/my-activity") {
        return children;
    }

    return (
        <SettingsShell
            title={t("settings.title")}
            navLabel={t("settings.title")}
            tabs={TABS.map(({ labelKey, ...rest }) => {
                const tab: SettingsShellTab = { ...rest, label: t(labelKey) };
                return tab.id === "organizations" && invitationCount > 0
                    ? {
                          ...tab,
                          badge: (
                              <span className="ml-2 inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-semibold tabular-nums text-white">
                                  {invitationCount}{" "}
                                  <span className="sr-only">
                                      {invitationCount === 1
                                          ? t("settings.pendingInvitation")
                                          : t("settings.pendingInvitations")}
                                  </span>
                              </span>
                          ),
                      }
                    : tab;
            })}
            rootHref="/settings"
        >
            {children}
        </SettingsShell>
    );
}
