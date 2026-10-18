"use client";

import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import type { MemoryAutosaveStatus } from "./useMemoryAutosave";
import type { MemoryCurrent } from "@/app/lib/mikeApi";
import { tr } from "@/shared/i18n/runtime";

export function memoryActivityLabel(memory: MemoryCurrent) {
  if (memory.status === "scheduled") return tr("memory.memoryEditorState.memoryReviewScheduled");
  if (memory.status === "processing") return tr("memory.memoryEditorState.updatingMemory");
  return null;
}

export function MemoryConflictNotice({
  project = false,
  onReload,
  onKeepDraft,
}: {
  project?: boolean;
  onReload: () => void;
  onKeepDraft: () => void;
}) {
  return (
    <div
      className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900"
      role="alert"
    >
      <p className="font-medium">
        {project ? tr("memory.memoryEditorState.projectMemory") : tr("memory.memoryEditorState.memory")} {" "}{tr("memory.memoryEditorState.changedWhileWereEditing")}
      </p>
      <p className="mt-1 text-xs text-amber-800">
        {tr("memory.memoryEditorState.reloadWhatSavedNowKeep")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <PillButtonUI tone="white" size="sm" onClick={onReload}>
          {tr("memory.memoryEditorState.reloadLatest")}
        </PillButtonUI>
        <PillButtonUI tone="black" size="sm" onClick={onKeepDraft}>
          {tr("memory.memoryEditorState.keepMyDraft")}
        </PillButtonUI>
      </div>
    </div>
  );
}

export function MemorySaveStatus({
  error,
  status,
  onRetry,
  compact = false,
}: {
  error: string | null;
  status: MemoryAutosaveStatus;
  onRetry: () => void;
  compact?: boolean;
}) {
  if (error) {
    return (
      <span
        className={`inline-flex items-center gap-2 ${compact ? "text-xs" : "text-sm"}`}
      >
        <span className="text-red-600" role="alert">
          {error}
        </span>
        <button
          type="button"
          className="font-medium text-gray-700 hover:text-gray-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 focus-visible:ring-offset-2"
          onClick={onRetry}
        >
          {tr("memory.memoryEditorState.retry")}
        </button>
      </span>
    );
  }
  if (status === "idle") return null;
  return (
    <span className="text-xs text-gray-500" role="status" aria-live="polite">
      {status === "saving" ? tr("memory.memoryEditorState.saving") : tr("memory.memoryEditorState.saved")}
    </span>
  );
}
