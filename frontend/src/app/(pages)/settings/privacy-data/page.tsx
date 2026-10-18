"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import {
  SettingsDescription,
  SettingsLabel,
} from "@/app/components/settings/SettingsText";
import { GlassCardUI } from "@/shared/ui/GlassCardUI";
import { SettingsHeading } from "@/app/components/settings/SettingsHeading";
import { SettingsRow } from "@/app/components/settings/SettingsRow";
import { useChatHistoryContext } from "@/app/contexts/ChatHistoryContext";
import { ConfirmPopup } from "@/app/components/popups/ConfirmPopup";
import {
  MfaVerificationPopup,
  needsMfaVerification,
} from "@/app/components/popups/MfaVerificationPopup";
import {
  deleteAllChats,
  deleteAllMemories,
  deleteAllProjects,
  deleteAllTabularReviews,
  downloadUserExport,
  getUserExportStatus,
  isMfaRequiredError,
  startUserExport,
  type UserExportType,
} from "@/app/lib/mikeApi";
import { UserVisibleError, notifyError } from "@/app/lib/userFacingError";
import { tr } from "@/shared/i18n/runtime";

type DeleteDataAction = "chats" | "tabular-reviews" | "projects" | "memory";
type ExportDataAction =
  | "export-chats"
  | "export-tabular-reviews"
  | "export-account"
  | "export-memory";
type MfaRetryAction = DeleteDataAction | ExportDataAction;

const isDev = process.env.NODE_ENV !== "production";
const devLog = (...args: Parameters<typeof console.log>) => {
  if (isDev) console.log(...args);
};

const DELETE_DATA_COPY: Record<
  DeleteDataAction,
  {
    title: string;
    message: string;
  }
> = {
  chats: {
    get title() {
        return tr("pages.settings.privacyData.page.deleteAllChats");
    },
    get message() {
        return tr("pages.settings.privacyData.page.willPermanentlyDeleteAssistantTabular");
    },
  },
  "tabular-reviews": {
    get title() {
        return tr("pages.settings.privacyData.page.deleteAllTabularReviews");
    },
    get message() {
        return tr("pages.settings.privacyData.page.willPermanentlyDeleteAllTabular");
    },
  },
  projects: {
    get title() {
        return tr("pages.settings.privacyData.page.deleteAllProjects");
    },
    get message() {
        return tr("pages.settings.privacyData.page.willPermanentlyDeleteAllProjects");
    },
  },
  memory: {
    get title() {
        return tr("pages.settings.privacyData.page.deleteAllMemory");
    },
    get message() {
        return tr("pages.settings.privacyData.page.permanentlyDeletesAppMemoryMemories");
    },
  },
};

/** Imperative, lower case: "Couldn't delete your chats". */
const DELETE_ACTION_LABELS: Record<DeleteDataAction, string> = {
  chats: "delete your chats",
  "tabular-reviews": "delete your tabular reviews",
  projects: "delete your projects",
  memory: "delete your memory",
};

export default function PrivacyDataPage() {
  const { loadChats, setCurrentChatId } = useChatHistoryContext();
  const [pendingDeleteAction, setPendingDeleteAction] =
    useState<DeleteDataAction | null>(null);
  const [deletingAction, setDeletingAction] = useState<DeleteDataAction | null>(
    null,
  );
  const [pendingMfaAction, setPendingMfaAction] =
    useState<MfaRetryAction | null>(null);
  const [isExportingAccount, setIsExportingAccount] = useState(false);
  const [isExportingChats, setIsExportingChats] = useState(false);
  const [isExportingTabularReviews, setIsExportingTabularReviews] =
    useState(false);
  const [isExportingMemory, setIsExportingMemory] = useState(false);

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // Exports run as durable backend jobs: schedule, poll until built, then
  // download the artifact. A double click dedupes onto the running job
  // server-side, and a build that outlives this tab can be re-downloaded by
  // clicking the button again (the poll finds the finished job).
  const EXPORT_POLL_MS = process.env.NODE_ENV === "test" ? 10 : 2000;
  const EXPORT_POLL_LIMIT = 150; // ~5 minutes
  const runAsyncExport = async (
    type: UserExportType,
    fallbackFilename: string,
  ) => {
    const { export_id } = await startUserExport(type);
    for (let i = 0; i < EXPORT_POLL_LIMIT; i++) {
      await new Promise((resolve) => setTimeout(resolve, EXPORT_POLL_MS));
      const status = await getUserExportStatus(export_id);
      if (status.status === "failed") {
        throw new UserVisibleError(
          "Mike couldn't build the export. Try again, and contact support if it keeps happening.",
          { retryable: true },
        );
      }
      if (status.status === "done") {
        const { blob, filename } = await downloadUserExport(export_id);
        downloadBlob(blob, filename ?? status.filename ?? fallbackFilename);
        return;
      }
    }
    throw new UserVisibleError(
      "The export is taking longer than expected. It may still be building, so try again in a few minutes.",
      { retryable: true },
    );
  };

  const handleExportAccountData = async () => {
    devLog("[privacy-data/mfa] export account requested");
    setIsExportingAccount(true);
    try {
      if (await needsMfaVerification()) {
        setPendingMfaAction("export-account");
        return;
      }
      await runAsyncExport("account", "mike-account-export.json");
    } catch (error) {
      devLog("[privacy-data/mfa] export account failed", {
        isMfaRequired: isMfaRequiredError(error),
        error,
      });
      if (isMfaRequiredError(error)) {
        setPendingMfaAction("export-account");
        return;
      }
      notifyError(error, {
        action: tr("pages.settings.privacyData.page.exportAccountData"),
        onRetry: () => void handleExportAccountData(),
      });
    } finally {
      setIsExportingAccount(false);
    }
  };

  const handleExportChatData = async () => {
    devLog("[privacy-data/mfa] export chats requested");
    setIsExportingChats(true);
    try {
      if (await needsMfaVerification()) {
        setPendingMfaAction("export-chats");
        return;
      }
      await runAsyncExport("chats", "mike-chat-export.json");
    } catch (error) {
      devLog("[privacy-data/mfa] export chats failed", {
        isMfaRequired: isMfaRequiredError(error),
        error,
      });
      if (isMfaRequiredError(error)) {
        setPendingMfaAction("export-chats");
        return;
      }
      notifyError(error, {
        action: tr("pages.settings.privacyData.page.exportChats"),
        onRetry: () => void handleExportChatData(),
      });
    } finally {
      setIsExportingChats(false);
    }
  };

  const handleExportTabularReviewsData = async () => {
    devLog("[privacy-data/mfa] export tabular reviews requested");
    setIsExportingTabularReviews(true);
    try {
      if (await needsMfaVerification()) {
        setPendingMfaAction("export-tabular-reviews");
        return;
      }
      await runAsyncExport(
        "tabular-reviews",
        "mike-tabular-reviews-export.json",
      );
    } catch (error) {
      devLog("[privacy-data/mfa] export tabular reviews failed", {
        isMfaRequired: isMfaRequiredError(error),
        error,
      });
      if (isMfaRequiredError(error)) {
        setPendingMfaAction("export-tabular-reviews");
        return;
      }
      notifyError(error, {
        action: tr("pages.settings.privacyData.page.exportTabularReviews"),
        onRetry: () => void handleExportTabularReviewsData(),
      });
    } finally {
      setIsExportingTabularReviews(false);
    }
  };

  const handleExportMemoryData = async () => {
    devLog("[privacy-data/mfa] export memory requested");
    setIsExportingMemory(true);
    try {
      if (await needsMfaVerification()) {
        setPendingMfaAction("export-memory");
        return;
      }
      await runAsyncExport("memory-zip", "mike-memory-export.zip");
    } catch (error) {
      devLog("[privacy-data/mfa] export memory failed", {
        isMfaRequired: isMfaRequiredError(error),
        error,
      });
      if (isMfaRequiredError(error)) {
        setPendingMfaAction("export-memory");
        return;
      }
      notifyError(error, {
        action: tr("pages.settings.privacyData.page.exportMemory"),
        onRetry: () => void handleExportMemoryData(),
      });
    } finally {
      setIsExportingMemory(false);
    }
  };

  const handleDeleteData = async (action: DeleteDataAction) => {
    devLog("[privacy-data/mfa] delete requested", { action });
    setDeletingAction(action);
    try {
      if (await needsMfaVerification()) {
        setPendingDeleteAction(null);
        setPendingMfaAction(action);
        return;
      }
      if (action === "chats") {
        await deleteAllChats();
        setCurrentChatId(null);
        await loadChats();
      } else if (action === "tabular-reviews") {
        await deleteAllTabularReviews();
      } else if (action === "memory") {
        await deleteAllMemories();
      } else {
        await deleteAllProjects();
        setCurrentChatId(null);
        await loadChats();
      }
      setPendingDeleteAction(null);
    } catch (error) {
      devLog("[privacy-data/mfa] delete failed", {
        action,
        isMfaRequired: isMfaRequiredError(error),
        error,
      });
      if (isMfaRequiredError(error)) {
        setPendingDeleteAction(null);
        setPendingMfaAction(action);
        return;
      }
      notifyError(error, {
        action: DELETE_ACTION_LABELS[action],
        // Re-open the confirmation rather than deleting again from the
        // notice: this erases data permanently, so it is always the dialog
        // that starts it.
        onRetry: () => setPendingDeleteAction(action),
      });
    } finally {
      setDeletingAction(null);
    }
  };

  const handleMfaVerified = async () => {
    const action = pendingMfaAction;
    devLog("[privacy-data/mfa] verification callback", { action });
    setPendingMfaAction(null);
    if (!action) return;

    if (action === "export-account") {
      await handleExportAccountData();
    } else if (action === "export-chats") {
      await handleExportChatData();
    } else if (action === "export-tabular-reviews") {
      await handleExportTabularReviewsData();
    } else if (action === "export-memory") {
      await handleExportMemoryData();
    } else {
      await handleDeleteData(action);
    }
  };

  const pendingDeleteCopy = pendingDeleteAction
    ? DELETE_DATA_COPY[pendingDeleteAction]
    : null;

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <SettingsHeading>{tr("pages.settings.privacyData.page.exportData")}</SettingsHeading>
        <GlassCardUI>
          <SettingsRow>
            <div className="space-y-1">
              <SettingsLabel>{tr("pages.settings.privacyData.page.exportChats2")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.privacyData.page.downloadAssistantTabularReviewChat")}
              </SettingsDescription>
            </div>
            <PillButtonUI
              tone="black"
              size="sm"
              onClick={handleExportChatData}
              disabled={isExportingChats}
              loading={isExportingChats}
              className="shrink-0"
            >
              <Download className="h-4 w-4 shrink-0" />
              {isExportingChats ? tr("pages.settings.privacyData.page.exporting") : tr("pages.settings.privacyData.page.export")}
            </PillButtonUI>
          </SettingsRow>
          <SettingsRow>
            <div className="space-y-1">
              <SettingsLabel>{tr("pages.settings.privacyData.page.exportTabularReviews2")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.privacyData.page.downloadAllOwnedTabularReviews")}
              </SettingsDescription>
            </div>
            <PillButtonUI
              tone="black"
              size="sm"
              onClick={handleExportTabularReviewsData}
              disabled={isExportingTabularReviews}
              loading={isExportingTabularReviews}
              className="shrink-0"
            >
              <Download className="h-4 w-4 shrink-0" />
              {isExportingTabularReviews ? tr("pages.settings.privacyData.page.exporting") : tr("pages.settings.privacyData.page.export")}
            </PillButtonUI>
          </SettingsRow>
          <SettingsRow>
            <div className="space-y-1">
              <SettingsLabel>{tr("pages.settings.privacyData.page.exportAccountJson")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.privacyData.page.downloadAccountMetadataProjectsDocument")}
              </SettingsDescription>
            </div>
            <PillButtonUI
              tone="black"
              size="sm"
              onClick={handleExportAccountData}
              disabled={isExportingAccount}
              loading={isExportingAccount}
              className="shrink-0"
            >
              <Download className="h-4 w-4 shrink-0" />
              {isExportingAccount ? tr("pages.settings.privacyData.page.exporting") : tr("pages.settings.privacyData.page.export")}
            </PillButtonUI>
          </SettingsRow>
          <SettingsRow>
            <div className="space-y-1">
              <SettingsLabel>{tr("pages.settings.privacyData.page.exportMemory2")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.privacyData.page.downloadAppMemoryEveryProject")}
              </SettingsDescription>
            </div>
            <PillButtonUI
              tone="black"
              size="sm"
              aria-label={tr("pages.settings.privacyData.page.exportMemory2")}
              onClick={handleExportMemoryData}
              disabled={isExportingMemory}
              loading={isExportingMemory}
              className="shrink-0"
            >
              <Download className="h-4 w-4 shrink-0" />
              {isExportingMemory ? tr("pages.settings.privacyData.page.exporting") : tr("pages.settings.privacyData.page.export")}
            </PillButtonUI>
          </SettingsRow>
        </GlassCardUI>
      </section>

      <section className="space-y-3">
        <SettingsHeading>{tr("pages.settings.privacyData.page.deleteData")}</SettingsHeading>
        <GlassCardUI>
          <SettingsRow>
            <div className="space-y-1">
              <SettingsLabel>{tr("pages.settings.privacyData.page.deleteAllChats2")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.privacyData.page.permanentlyDeleteAssistantTabularReview")}
              </SettingsDescription>
            </div>
            <PillButtonUI
              tone="danger"
              size="sm"
              onClick={() => setPendingDeleteAction("chats")}
              disabled={!!deletingAction}
              loading={deletingAction === "chats"}
              className="w-full shrink-0 sm:w-auto"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {tr("pages.settings.privacyData.page.delete")}
            </PillButtonUI>
          </SettingsRow>
          <SettingsRow>
            <div className="space-y-1">
              <SettingsLabel>{tr("pages.settings.privacyData.page.deleteAllTabularReviews2")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.privacyData.page.permanentlyDeleteAllTabularReviews")}
              </SettingsDescription>
            </div>
            <PillButtonUI
              tone="danger"
              size="sm"
              onClick={() => setPendingDeleteAction("tabular-reviews")}
              disabled={!!deletingAction}
              loading={deletingAction === "tabular-reviews"}
              className="w-full shrink-0 sm:w-auto"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {tr("pages.settings.privacyData.page.delete")}
            </PillButtonUI>
          </SettingsRow>
          <SettingsRow>
            <div className="space-y-1">
              <SettingsLabel>{tr("pages.settings.privacyData.page.deleteAllProjects2")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.privacyData.page.permanentlyDeleteAllProjectsOwn")}
              </SettingsDescription>
            </div>
            <PillButtonUI
              tone="danger"
              size="sm"
              onClick={() => setPendingDeleteAction("projects")}
              disabled={!!deletingAction}
              loading={deletingAction === "projects"}
              className="w-full shrink-0 sm:w-auto"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {tr("pages.settings.privacyData.page.delete")}
            </PillButtonUI>
          </SettingsRow>
          <SettingsRow>
            <div className="space-y-1">
              <SettingsLabel>{tr("pages.settings.privacyData.page.deleteAllMemory2")}</SettingsLabel>
              <SettingsDescription>
                {tr("pages.settings.privacyData.page.permanentlyDeleteAppMemoryMemories")}
              </SettingsDescription>
            </div>
            <PillButtonUI
              tone="danger"
              size="sm"
              aria-label={tr("pages.settings.privacyData.page.deleteAllMemory2")}
              onClick={() => setPendingDeleteAction("memory")}
              disabled={!!deletingAction}
              loading={deletingAction === "memory"}
              className="w-full shrink-0 sm:w-auto"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              {tr("pages.settings.privacyData.page.delete")}
            </PillButtonUI>
          </SettingsRow>
        </GlassCardUI>
      </section>
      <ConfirmPopup
        open={!!pendingDeleteAction}
        title={pendingDeleteCopy?.title}
        message={pendingDeleteCopy?.message}
        confirmLabel={tr("pages.settings.privacyData.page.delete")}
        confirmVariant="danger"
        confirmStatus={deletingAction ? "loading" : "idle"}
        cancelLabel={tr("pages.settings.privacyData.page.cancel")}
        onCancel={() => {
          if (deletingAction) return;
          setPendingDeleteAction(null);
        }}
        onConfirm={() => {
          if (!pendingDeleteAction) return;
          void handleDeleteData(pendingDeleteAction);
        }}
      />
      <MfaVerificationPopup
        open={!!pendingMfaAction}
        onCancel={() => setPendingMfaAction(null)}
        onVerified={() => void handleMfaVerified()}
        title={tr("pages.settings.privacyData.page.twoFactorVerificationRequired")}
        message={tr("pages.settings.privacyData.page.actionSensitiveEnterCodeFrom")}
      />
    </div>
  );
}
