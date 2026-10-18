"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { ConfirmPopup } from "@/app/components/popups/ConfirmPopup";
import {
  MfaVerificationPopup,
  needsMfaVerification,
} from "@/app/components/popups/MfaVerificationPopup";
import { WarningPopup } from "@/app/components/popups/WarningPopup";
import { SettingsHeading } from "@/app/components/settings/SettingsHeading";
import { SettingsRow } from "@/app/components/settings/SettingsRow";
import {
  SettingsDescription,
  SettingsLabel,
} from "@/app/components/settings/SettingsText";
import { OrganizationSkeuoIcon } from "@/app/components/shared/AppSidebarSkeuoIcons";
import { EmptyState } from "@/app/components/ui/empty-state";
import { useChatHistoryContext } from "@/app/contexts/ChatHistoryContext";
import {
  deleteOrgData,
  isMfaRequiredError,
  type OrgDataKind,
} from "@/app/lib/mikeApi";
import { isOrgOwner } from "@/app/lib/permissions";
import { GlassCardUI } from "@/shared/ui/GlassCardUI";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import {
  organizationSettingsHref,
  useOrganizationSettings,
} from "./OrganizationSettingsShell";
import { tr } from "@/shared/i18n/runtime";

// The Privacy & Data section of an organization's settings: the
// organization-wide twin of a person's own Privacy & Data page. Each action
// reaches every member's work in the organization, so the section is its
// owners' alone; the server refuses anyone else.

const DELETE_ROWS: {
  kind: OrgDataKind;
  label: string;
  description: string;
  title: string;
  message: string;
}[] = [
  {
    kind: "chats",
    get label() {
        return tr("organizations.organizationPrivacyData.deleteAllChats");
    },
    get description() {
        return tr("organizations.organizationPrivacyData.permanentlyDeleteOrganizationSAssistant");
    },
    get title() {
        return tr("organizations.organizationPrivacyData.deleteAllOrganizationChats");
    },
    get message() {
        return tr("organizations.organizationPrivacyData.willPermanentlyDeleteAssistantProject");
    },
  },
  {
    kind: "tabular-reviews",
    get label() {
        return tr("organizations.organizationPrivacyData.deleteAllTabularReviews");
    },
    get description() {
        return tr("organizations.organizationPrivacyData.permanentlyDeleteEveryTabularReview");
    },
    get title() {
        return tr("organizations.organizationPrivacyData.deleteAllOrganizationTabularReviews");
    },
    get message() {
        return tr("organizations.organizationPrivacyData.willPermanentlyDeleteEveryTabular");
    },
  },
  {
    kind: "projects",
    get label() {
        return tr("organizations.organizationPrivacyData.deleteAllProjects");
    },
    get description() {
        return tr("organizations.organizationPrivacyData.permanentlyDeleteEveryProjectOrganizatio");
    },
    get title() {
        return tr("organizations.organizationPrivacyData.deleteAllOrganizationProjects");
    },
    get message() {
        return tr("organizations.organizationPrivacyData.willPermanentlyDeleteEveryProject");
    },
  },
  {
    kind: "memories",
    get label() {
        return tr("organizations.organizationPrivacyData.deleteAllMemory");
    },
    get description() {
        return tr("organizations.organizationPrivacyData.permanentlyDeleteMemoryEveryProject");
    },
    get title() {
        return tr("organizations.organizationPrivacyData.deleteAllOrganizationMemory");
    },
    get message() {
        return tr("organizations.organizationPrivacyData.permanentlyDeletesMemoryEveryProject");
    },
  },
];

export function OrganizationPrivacyData() {
  const router = useRouter();
  const { orgId, org } = useOrganizationSettings();
  const { loadChats, setCurrentChatId } = useChatHistoryContext();
  const [pendingKind, setPendingKind] = useState<OrgDataKind | null>(null);
  const [deletingKind, setDeletingKind] = useState<OrgDataKind | null>(null);
  const [mfaKind, setMfaKind] = useState<OrgDataKind | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  if (org && !isOrgOwner(org.role))
    return (
      <EmptyState
        icon={<OrganizationSkeuoIcon />}
        title={tr("organizations.organizationPrivacyData.privacyData")}
        description={tr("organizations.organizationPrivacyData.onlyOrganizationSOwnersCan")}
        action={
          <PillButtonUI
            tone="white"
            size="sm"
            onClick={() => router.push(organizationSettingsHref(orgId))}
          >
            {tr("organizations.organizationPrivacyData.backGeneral")}
          </PillButtonUI>
        }
      />
    );

  const deleteData = async (kind: OrgDataKind) => {
    setDeletingKind(kind);
    try {
      if (await needsMfaVerification()) {
        setPendingKind(null);
        setMfaKind(kind);
        return;
      }
      await deleteOrgData(orgId, kind);
      if (kind === "chats" || kind === "projects") {
        // The chat this tab had open may be one of those just deleted.
        setCurrentChatId(null);
        await loadChats();
      }
      setPendingKind(null);
    } catch (error) {
      setPendingKind(null);
      if (isMfaRequiredError(error)) {
        setMfaKind(kind);
        return;
      }
      setWarningMessage(tr("organizations.organizationPrivacyData.failedDeleteDataPleaseTry"));
    } finally {
      setDeletingKind(null);
    }
  };

  const pendingRow = DELETE_ROWS.find((row) => row.kind === pendingKind);

  return (
    <div className="space-y-8">
      {/* The archive itself is a table of people and their work, so it
          lives with the roster; this is the way to it from here. */}
      {org && isOrgOwner(org.role) ? (
        <section aria-labelledby="org-privacy-departed" className="space-y-3">
          <SettingsHeading id="org-privacy-departed">
            {tr("organizations.organizationPrivacyData.departedMembers")}
          </SettingsHeading>
          <GlassCardUI>
            <SettingsRow>
              <div className="space-y-1">
                <SettingsLabel>{tr("organizations.organizationPrivacyData.workLeftByDepartedMembers")}</SettingsLabel>
                <SettingsDescription>
                  {tr("organizations.organizationPrivacyData.privateUnsharedWorkMemberLeaves")}
                </SettingsDescription>
              </div>
              <PillButtonUI
                tone="black"
                size="sm"
                aria-label={tr("organizations.organizationPrivacyData.reviewDepartedMembers")}
                onClick={() =>
                  router.push(
                    `${organizationSettingsHref(orgId, "members")}?view=departed`,
                  )
                }
                className="w-full shrink-0 sm:w-auto"
              >
                {tr("organizations.organizationPrivacyData.review")}
              </PillButtonUI>
            </SettingsRow>
          </GlassCardUI>
        </section>
      ) : null}
      <section aria-labelledby="org-privacy-delete" className="space-y-3">
        <SettingsHeading id="org-privacy-delete">{tr("organizations.organizationPrivacyData.deleteData")}</SettingsHeading>
        <GlassCardUI>
          {DELETE_ROWS.map((row) => (
            <SettingsRow key={row.kind}>
              <div className="space-y-1">
                <SettingsLabel>{row.label}</SettingsLabel>
                <SettingsDescription>{row.description}</SettingsDescription>
              </div>
              <PillButtonUI
                tone="danger"
                size="sm"
                aria-label={row.label}
                onClick={() => setPendingKind(row.kind)}
                // Not offered until the caller is known to be an owner.
                disabled={!org || deletingKind !== null}
                loading={deletingKind === row.kind}
                className="w-full shrink-0 sm:w-auto"
              >
                <Trash2 className="h-4 w-4 shrink-0" />
                {tr("organizations.organizationPrivacyData.delete")}
              </PillButtonUI>
            </SettingsRow>
          ))}
        </GlassCardUI>
      </section>
      <ConfirmPopup
        open={pendingKind !== null}
        title={pendingRow?.title}
        message={pendingRow?.message}
        confirmLabel={tr("organizations.organizationPrivacyData.delete")}
        confirmVariant="danger"
        confirmStatus={deletingKind ? "loading" : "idle"}
        cancelLabel={tr("organizations.organizationPrivacyData.cancel")}
        onCancel={() => {
          if (deletingKind) return;
          setPendingKind(null);
        }}
        onConfirm={() => {
          if (!pendingKind) return;
          void deleteData(pendingKind);
        }}
      />
      <MfaVerificationPopup
        open={mfaKind !== null}
        onCancel={() => setMfaKind(null)}
        onVerified={() => {
          const kind = mfaKind;
          setMfaKind(null);
          if (kind) void deleteData(kind);
        }}
        title={tr("organizations.organizationPrivacyData.twoFactorVerificationRequired")}
        message={tr("organizations.organizationPrivacyData.actionSensitiveEnterCodeFrom")}
      />
      <WarningPopup
        open={!!warningMessage}
        title={tr("organizations.organizationPrivacyData.actionFailed")}
        message={warningMessage}
        onClose={() => setWarningMessage(null)}
      />
    </div>
  );
}
