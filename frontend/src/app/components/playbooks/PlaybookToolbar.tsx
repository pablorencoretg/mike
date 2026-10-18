"use client";

import { Plus, Upload } from "lucide-react";
import { TableToolbar } from "@/app/components/shared/TableToolbar";
import { TabPillButtonUI } from "@/shared/ui/TabPillButtonUI";
import { tr } from "@/shared/i18n/runtime";

export const PLAYBOOK_VIEWS = [
  "overview",
  "rules",
  "references",
  "runs",
] as const;
export type PlaybookView = (typeof PLAYBOOK_VIEWS)[number];

const VIEWS: { id: PlaybookView; label: string; name?: string }[] = [
  // Named apart from the rule editor's own Overview tab.
  { id: "overview", get label() {
        return tr("playbooks.playbookToolbar.overview");
    }, get name() {
        return tr("pb.playbookOverview");
    } },
  { id: "rules", get label() {
        return tr("playbooks.playbookToolbar.rules");
    } },
  { id: "references", get label() {
        return tr("playbooks.playbookToolbar.references");
    } },
  { id: "runs", get label() {
        return tr("playbooks.playbookToolbar.runs");
    } },
];

export function PlaybookToolbar({
  disabled,
  canEdit,
  view,
  onViewChange,
  onAddRule,
  onUpload,
}: {
  disabled: boolean;
  canEdit: boolean;
  view: PlaybookView;
  onViewChange: (view: PlaybookView) => void;
  onAddRule: () => void;
  /** Adds a reference document; shown on References. */
  onUpload: () => void;
}) {
  return (
    <nav aria-label={tr("playbooks.playbookToolbar.playbookToolbar")} className="shrink-0">
      <TableToolbar
        leading={
          <div className="flex w-full flex-wrap items-center justify-between gap-1.5">
            <div
              role="group"
              aria-label={tr("playbooks.playbookToolbar.playbookView")}
              className="flex flex-wrap items-center gap-1.5"
            >
              {VIEWS.map((entry) => (
                <TabPillButtonUI
                  key={entry.id}
                  active={view === entry.id}
                  aria-label={entry.name}
                  onClick={() => onViewChange(entry.id)}
                >
                  {entry.label}
                </TabPillButtonUI>
              ))}
            </div>
            {view === "rules" && (
              <TabPillButtonUI
                disabled={disabled || !canEdit}
                onClick={onAddRule}
              >
                <Plus aria-hidden="true" className="h-3.5 w-3.5" />
                {tr("playbooks.playbookToolbar.newRule")}
              </TabPillButtonUI>
            )}
            {view === "references" && (
              <TabPillButtonUI
                disabled={disabled || !canEdit}
                onClick={onUpload}
              >
                <Upload aria-hidden="true" className="h-3.5 w-3.5" />
                {tr("playbooks.playbookToolbar.upload")}
              </TabPillButtonUI>
            )}
          </div>
        }
      />
    </nav>
  );
}
