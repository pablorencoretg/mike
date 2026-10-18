"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { Document } from "@/app/components/shared/types";
import { GlassCardUI } from "@/shared/ui/GlassCardUI";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import { tr } from "@/shared/i18n/runtime";

export type ReviewDocument = {
  id: string;
  name: string;
  status: "ready" | "reviewing" | "completed" | "failed";
  error?: string;
} & ({ kind: "upload"; file: File } | { kind: "saved"; document: Document });

export function PlaybookReviewDocuments({
  documents,
  disabled,
  onAdd,
  onBrowse,
  onRemove,
}: {
  documents: ReviewDocument[];
  disabled: boolean;
  onAdd: (files: File[]) => void;
  onBrowse: () => void;
  onRemove: (id: string) => void;
}) {
  const dragDepth = useRef(0);
  const [dragging, setDragging] = useState(false);

  return (
    <section
      aria-label={tr("playbooks.playbookReviewDocuments.documentsReview")}
      aria-busy={disabled}
      className={`rounded-xl bg-gray-100 p-4 transition-colors ${dragging && !disabled ? "ring-2 ring-inset ring-blue-500/40" : ""}`}
      onDragEnter={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        dragDepth.current += 1;
        if (!disabled) setDragging(true);
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = disabled ? "none" : "copy";
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        dragDepth.current = 0;
        setDragging(false);
        if (!disabled) onAdd(Array.from(event.dataTransfer.files));
      }}
    >
      {documents.length ? (
        <>
          <p className="mb-3 text-xs text-gray-500" aria-live="polite">
            {disabled
              ? tr("pb.reviewedOf", {
                  done: documents.filter(
                    (document) => document.status === "completed",
                  ).length,
                  total: documents.length,
                })
              : dragging
                ? tr("playbooks.playbookReviewDocuments.dropDocumentsAddThem")
                : tr("playbooks.playbookReviewDocuments.dropMoreDocumentsHereUse")}
          </p>
          <ul className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,14rem),1fr))] gap-2">
            {documents.map((document) => (
              <li key={document.id} className="min-w-0">
                <GlassCardUI>
                  <div className="flex items-start gap-2 p-3">
                    <div className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                      <p className="text-sm text-gray-800">{document.name}</p>
                      <p
                        className="mt-1 text-xs text-gray-500"
                        aria-live="polite"
                      >
                        {document.status === "reviewing"
                          ? tr("playbooks.playbookReviewDocuments.reviewing")
                          : document.status === "completed"
                            ? tr("playbooks.playbookReviewDocuments.reviewed")
                            : document.status === "failed"
                              ? tr("playbooks.playbookReviewDocuments.couldnTReview")
                              : document.kind === "saved"
                                ? tr("playbooks.playbookReviewDocuments.savedFile")
                                : tr("playbooks.playbookReviewDocuments.uploadedDocument")}
                      </p>
                      {document.error && (
                        <p role="alert" className="mt-2 text-xs text-red-600">
                          {document.error}
                        </p>
                      )}
                    </div>
                    <PillButtonUI
                      tone="white"
                      size="icon-xs"
                      aria-label={tr("playbooks.playbookReviewDocuments.remove", { name: document.name })}
                      disabled={disabled}
                      className="shrink-0"
                      onClick={() => onRemove(document.id)}
                    >
                      <X aria-hidden="true" className="h-3 w-3" />
                    </PillButtonUI>
                  </div>
                </GlassCardUI>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <button
          type="button"
          onClick={onBrowse}
          disabled={disabled}
          className="w-full rounded-lg py-4 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:cursor-not-allowed"
        >
          <span className="block text-sm text-gray-700">
            {dragging
              ? tr("playbooks.playbookReviewDocuments.dropDocumentsAddThem")
              : tr("playbooks.playbookReviewDocuments.addDocumentsReview")}
          </span>
          <span className="mt-1 block text-xs text-gray-500">
            {tr("playbooks.playbookReviewDocuments.dragDropPdfDocxTxt")}
          </span>
        </button>
      )}
    </section>
  );
}
