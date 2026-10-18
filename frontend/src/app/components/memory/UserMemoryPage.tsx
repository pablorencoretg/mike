"use client";

import { useCallback, useState } from "react";
import { useUserProfile } from "@/app/contexts/UserProfileContext";
import { useWorkspace } from "@/app/contexts/WorkspaceContext";
import { ConfirmPopup } from "@/app/components/popups/ConfirmPopup";
import { GlassCardUI } from "@/shared/ui/GlassCardUI";
import { SettingsHeading } from "@/app/components/settings/SettingsHeading";
import { SettingsRow } from "@/app/components/settings/SettingsRow";
import { MarkdownEditor } from "@/app/components/ui/markdown-editor";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import { ToggleSwitchUI } from "@/shared/ui/ToggleSwitchUI";
import {
  SettingsDescription,
  SettingsLabel,
} from "@/app/components/settings/SettingsText";
import {
  MemoryConflictNotice,
  MemorySaveStatus,
  memoryActivityLabel,
} from "@/app/components/memory/MemoryEditorState";
import { MemoryUpdateFailedPopup } from "@/app/components/memory/MemoryUpdateFailedPopup";
import { useMemoryFileController } from "@/app/components/memory/useMemoryFileController";
import {
  getUserMemory,
  setUserMemoryEnabled,
  updateUserMemory,
} from "@/app/lib/mikeApi";
import { userFacingApiError } from "@/app/lib/userFacingError";
import { tr } from "@/shared/i18n/runtime";

type ConfirmAction = "disable";

// A person has one memory per workspace: Personal, and one for each
// organization they belong to. Each is private to them, and a conversation
// reads and learns only the one for the workspace it is in. This page shows
// the memory for the active workspace.
//
// Keyed by workspace, so switching starts again from the other file: nothing
// loaded, drafted or pending for one workspace can be saved into another,
// and a draft still being saved is flushed to the workspace it was typed in.
export function UserMemoryPage() {
  const { workspaceId, activeOrganization } = useWorkspace();
  const workspace = workspaceId ?? undefined;
  return (
    <WorkspaceMemory
      key={workspace ?? "personal"}
      workspace={workspace}
      organizationName={activeOrganization?.name ?? null}
    />
  );
}

function WorkspaceMemory({
  workspace,
  organizationName,
}: {
  /** "personal", an organization id, or undefined outside a workspace. */
  workspace: string | undefined;
  /** The active organization's name, or null in Personal. */
  organizationName: string | null;
}) {
  // What this memory is called, wherever the page names it.
  const memoryName = organizationName
    ? `Memory in ${organizationName}`
    : "Personal memory";
  const [settingsMutation, setSettingsMutation] = useState<
    "enable" | "disable" | null
  >(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(
    null,
  );
  const loadMemory = useCallback(
    (signal?: AbortSignal) => getUserMemory(signal, workspace),
    [workspace],
  );
  const saveMemory = useCallback(
    (content: string, revision: number) =>
      updateUserMemory(content, revision, workspace),
    [workspace],
  );
  const {
    memory,
    draft,
    loading,
    loadError,
    conflict,
    error,
    autosaveError,
    dirty,
    autosave,
    load,
    syncCurrent,
    changeDraft,
    setError,
    setAutosaveError,
    reloadLatest,
    keepDraftAfterConflict,
  } = useMemoryFileController({
    canEdit: true,
    mutationBlocked: !!confirmAction || settingsMutation !== null,
    flushOnUnmount: settingsMutation === null,
    loadMemory,
    saveMemory,
    conflictLoadError:
      tr("memory.userMemoryPage.memoryChangedWhileWereEditing"),
    saveError: tr("memory.userMemoryPage.memoryCouldNotSavedDraft"),
    disabledError:
      tr("memory.userMemoryPage.memoryWasTurnedOffWhile"),
  });

  const interactionLocked =
    autosave.inFlight || settingsMutation !== null || confirmAction !== null;
  const editorLocked = settingsMutation !== null || confirmAction !== null;

  async function enableMemory() {
    if (interactionLocked) return;
    setSettingsMutation("enable");
    setError(null);
    // A refusal from the disabled period ("your changes were not saved") is
    // over once memory is on again; leaving it up next to the fresh file
    // reads as if the new file were already failing.
    setAutosaveError(null);
    try {
      syncCurrent(await setUserMemoryEnabled(true, workspace));
    } catch (cause) {
      setError(
        userFacingApiError(
          cause,
          tr("memory.userMemoryPage.memoryCouldNotTurnedPlease"),
        ),
      );
    } finally {
      setSettingsMutation(null);
    }
  }

  async function confirmSettingsMutation() {
    if (!confirmAction || settingsMutation || autosave.inFlight) return;
    setSettingsMutation("disable");
    setError(null);
    try {
      const current = await setUserMemoryEnabled(false, workspace);
      syncCurrent(current);
      setConfirmAction(null);
    } catch (cause) {
      setError(
        userFacingApiError(
          cause,
          tr("memory.userMemoryPage.memoryCouldNotTurnedOff"),
        ),
      );
      setConfirmAction(null);
    } finally {
      setSettingsMutation(null);
    }
  }

  return (
    <div className="space-y-8">
      <section
        className="space-y-3"
        aria-labelledby="app-memory-settings-heading"
      >
        <SettingsHeading id="app-memory-settings-heading">
          {tr("memory.userMemoryPage.memory")}
        </SettingsHeading>

        <GlassCardUI>
          {loading ? (
            <div
              className="flex items-center justify-between gap-3 p-4"
              aria-label={tr("memory.userMemoryPage.loadingMemorySettings")}
            >
              <div className="space-y-2">
                <div className="h-4 w-36 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-72 max-w-full animate-pulse rounded bg-gray-100" />
              </div>
              <div className="h-5 w-9 animate-pulse rounded-full bg-gray-200" />
            </div>
          ) : loadError || !memory ? (
            <SettingsRow>
              <div className="space-y-1">
                <SettingsLabel>{tr("memory.userMemoryPage.memorySettingsUnavailable")}</SettingsLabel>
                <p className="text-sm text-red-600" role="alert">
                  {tr("memory.userMemoryPage.couldNotLoadMemorySettings")}
                </p>
              </div>
              <PillButtonUI tone="white" size="sm" onClick={() => void load()}>
                {tr("memory.userMemoryPage.retry")}
              </PillButtonUI>
            </SettingsRow>
          ) : (
            <SettingsRow>
              <div className="space-y-1">
                <SettingsLabel>{memoryName}</SettingsLabel>
                <SettingsDescription>
                  {organizationName
                    ? tr("memory.userMemoryPage.letMikeCurateUsefulDetails", { organizationName })
                    : tr("memory.userMemoryPage.letMikeCurateUsefulDetails2")}
                </SettingsDescription>
              </div>
              <div className="flex items-center gap-3">
                <ToggleSwitchUI
                  checked={memory.enabled}
                  disabled={interactionLocked}
                  aria-busy={settingsMutation === "enable"}
                  aria-label={memoryName}
                  onCheckedChange={(enabled) => {
                    if (enabled) void enableMemory();
                    else {
                      autosave.cancelPending();
                      setConfirmAction("disable");
                    }
                  }}
                />
              </div>
            </SettingsRow>
          )}

          <ProjectMemoryDefaultRow />
        </GlassCardUI>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}
        {!loading && memory && !memory.enabled && autosaveError ? (
          // The editor (and its status line) is gone once memory is off, but
          // the reason a draft was refused must still be visible.
          <p className="text-sm text-red-600" role="alert">
            {autosaveError}
          </p>
        ) : null}
      </section>

      {loading ? (
        <MemoryEditorSkeleton />
      ) : memory?.enabled ? (
        <section
          className="space-y-3"
          aria-labelledby="app-memory-file-heading"
        >
          <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <SettingsHeading id="app-memory-file-heading">
              {tr("memory.userMemoryPage.memoryFile")}
            </SettingsHeading>
            <div className="flex flex-wrap items-center gap-3">
              <MemorySaveStatus
                error={autosaveError}
                status={autosave.status}
                compact
                onRetry={() => {
                  setAutosaveError(null);
                  autosave.retry();
                }}
              />
              {memoryActivityLabel(memory) ? (
                <p className="text-xs text-gray-400" role="status">
                  {memoryActivityLabel(memory)}
                </p>
              ) : null}
            </div>
          </div>

          {conflict ? (
            <MemoryConflictNotice
              onReload={reloadLatest}
              onKeepDraft={keepDraftAfterConflict}
            />
          ) : null}

          <div className="min-h-[24rem]">
            <MarkdownEditor
              value={draft}
              onChange={(value) => {
                changeDraft(value);
              }}
              ariaLabel={memoryName}
              className="min-h-[24rem]"
              suspended={editorLocked}
              allowTables={false}
            />
          </div>
        </section>
      ) : null}

      <ConfirmPopup
        open={confirmAction !== null}
        title={
          organizationName
            ? tr("memory.userMemoryPage.turnOffDeleteMemory", { organizationName })
            : tr("memory.userMemoryPage.turnOffDeletePersonalMemory")
        }
        message={`This will delete the existing memory.md file for ${organizationName ?? "Personal"}${dirty ? " and your unsaved draft" : ""}, cancel pending memory updates, and stop future memory updates here until you turn it on again. Your memory in other workspaces is not affected.`}
        confirmLabel={tr("memory.userMemoryPage.disable")}
        confirmVariant="danger"
        confirmStatus={settingsMutation ? "loading" : "idle"}
        onConfirm={() => void confirmSettingsMutation()}
        onCancel={() => {
          if (!settingsMutation) setConfirmAction(null);
        }}
      />
      <MemoryUpdateFailedPopup
        memory={memory}
        scopeKey={
          workspace && workspace !== "personal" ? `app:${workspace}` : "app"
        }
      />
    </div>
  );
}

/**
 * The per-user default applied to projects this account creates. It is a
 * profile preference rather than a memory-file setting, so it stays usable
 * even when the memory file itself cannot be loaded, and it never overrides
 * another owner's choice on an existing project.
 */
function ProjectMemoryDefaultRow() {
  const { profile, updateProjectMemoryDefault } = useUserProfile();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleToggle(enabled: boolean) {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await updateProjectMemoryDefault(enabled);
    } catch (cause) {
      setError(
        userFacingApiError(
          cause,
          tr("memory.userMemoryPage.preferenceCouldNotSavedPlease"),
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SettingsRow>
      <div className="space-y-1">
        <SettingsLabel>{tr("memory.userMemoryPage.projectMemoryNewProjects")}</SettingsLabel>
        <SettingsDescription>
          {tr("memory.userMemoryPage.chooseWhetherMemoryEnabledBy")}
        </SettingsDescription>
        {error ? (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <ToggleSwitchUI
        checked={profile?.projectMemoryDefault !== false}
        disabled={!profile || saving}
        aria-busy={saving}
        aria-label={tr("memory.userMemoryPage.projectMemoryNewProjects")}
        onCheckedChange={(enabled) => void handleToggle(enabled)}
      />
    </SettingsRow>
  );
}

function MemoryEditorSkeleton() {
  return (
    <div className="space-y-3" aria-label={tr("memory.userMemoryPage.loadingMemoryEditor")}>
      <div className="space-y-2">
        <div className="h-7 w-36 animate-pulse rounded bg-gray-200" />
        <div className="h-3 w-full max-w-xl animate-pulse rounded bg-gray-100" />
      </div>
      <div className="h-96 animate-pulse rounded-2xl bg-app-surface" />
    </div>
  );
}
