import type { AuditEvent, OrgPrivateContentKind } from "@/app/lib/mikeApi";
import { tr } from "@/shared/i18n/runtime";
import { valueLabel } from "@/shared/i18n/values";

export interface AuditPrivateAccess {
  kind: OrgPrivateContentKind;
  item_id: string;
  has_access: boolean;
}

/** Only organization audit responses contain this server-derived descriptor. */
export function auditPrivateAccess(
  event: AuditEvent,
): AuditPrivateAccess | null {
  const value = event.detail?.private_content_access;
  if (!event.org_id || !value || typeof value !== "object") return null;
  const access = value as Record<string, unknown>;
  if (
    !["project", "workflow", "chat", "tabular_review", "document"].includes(
      String(access.kind),
    ) ||
    typeof access.item_id !== "string" ||
    !access.item_id ||
    typeof access.has_access !== "boolean"
  )
    return null;
  return access as unknown as AuditPrivateAccess;
}

// Labels are built while the module loads; the active language is already
// known then (see shared/i18n/runtime.ts), and a language change reloads.
export const ACTION_LABELS: Record<string, string> = {
  "org.private_content.permission_changed": tr("audit.actions.privatePermissionChanged"),
  "org.private_content.opened": tr("audit.actions.privateOpened"),
  "org.private_content.closed": tr("audit.actions.privateClosed"),
  "org.api_key.saved": tr("audit.actions.keySaved"),
  "org.api_key.removed": tr("audit.actions.keyRemoved"),
  "org.api_key.enabled": tr("audit.actions.keyEnabled"),
  "org.api_key.disabled": tr("audit.actions.keyDisabled"),
  "org.personal_api_keys.allowed": tr("audit.actions.personalKeysAllowed"),
  "org.personal_api_keys.blocked": tr("audit.actions.personalKeysBlocked"),
  "org.created": tr("audit.actions.orgCreated"),
  "org.deleted": tr("audit.actions.orgDeleted"),
  "org.restored": tr("audit.actions.orgRestored"),
  "org.purged": tr("audit.actions.orgPurged"),
  "org.invite.created": tr("audit.actions.inviteCreated"),
  "org.invite.accepted": tr("audit.actions.inviteAccepted"),
  "org.invite.declined": tr("audit.actions.inviteDeclined"),
  "org.invite.cancelled": tr("audit.actions.inviteCancelled"),
  "org.invite.resent": tr("audit.actions.inviteResent"),
  "org.member.role_changed": tr("audit.actions.memberRoleChanged"),
  "org.logo.updated": tr("audit.actions.logoUpdated"),
  "org.logo.removed": tr("audit.actions.logoRemoved"),
  "org.router_models.updated": tr("audit.actions.modelsUpdated"),
  "org.departure.item.transferred": tr("audit.actions.departedTransferred"),
  "org.departure.item.archived": tr("audit.actions.departedArchived"),
  "org.departure.item.recovered": tr("audit.actions.departedRecovered"),
  "org.departure.item.deleted": tr("audit.actions.departedDeleted"),
  "org.departure.item.expired": tr("audit.actions.departedExpired"),
  "org.departure.member.departed": tr("audit.actions.memberDeparted"),
  "org.member.removed": tr("audit.actions.memberRemoved"),
  "org.member.left": tr("audit.actions.memberLeft"),
  "org.data.deleted": tr("audit.actions.orgDataDeleted"),
  "chat.message": tr("history.auditPresentation.chatMessageSent"),
  "document.uploaded": tr("audit.actions.documentUploaded"),
  "document.generated": tr("audit.actions.documentGenerated"),
  "document.edited": tr("audit.actions.documentEdited"),
  "workflow.applied": tr("audit.actions.workflowApplied"),
  "tabular.created": tr("audit.actions.reviewCreated"),
  "tabular.generated": tr("audit.actions.reviewRunCompleted"),
  "export.chats": tr("audit.actions.chatsExported"),
  "export.account": tr("audit.actions.accountExported"),
  "export.tabular": tr("audit.actions.reviewExported"),
  "export.memory": tr("audit.actions.memoryExported"),
};

export const SURFACE_LABELS: Record<string, string> = {
  assistant: tr("audit.surfaces.assistant"),
  project: tr("audit.surfaces.project"),
  word: "Word",
  tabular: tr("audit.surfaces.tabular"),
  workflows: tr("audit.surfaces.workflows"),
  account: tr("audit.surfaces.account"),
  organization: tr("audit.surfaces.organization"),
};

export function auditLabel(value: string): string {
  return value
    .replace(/[_.]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function auditAction(event: AuditEvent): string {
  const label = ACTION_LABELS[event.action] ?? auditLabel(event.action);
  // Failed or cancelled operations must not read as successful changes.
  if (event.status === "completed") return label;
  const operations: Record<string, string> = {
    "chat.message": tr("history.auditPresentation.chatMessage"),
    "document.uploaded": tr("audit.operations.documentUpload"),
    "document.generated": tr("audit.operations.documentGeneration"),
    "document.edited": tr("audit.operations.documentEdit"),
    "workflow.applied": tr("audit.operations.workflowApplication"),
    "tabular.created": tr("audit.operations.reviewCreation"),
    "tabular.generated": tr("audit.operations.reviewRun"),
    "export.chats": tr("audit.operations.chatExport"),
    "export.account": tr("audit.operations.accountExport"),
    "export.tabular": tr("audit.operations.reviewExport"),
    "export.memory": tr("audit.operations.memoryExport"),
  };
  return operations[event.action] ?? label;
}

function detailText(event: AuditEvent, key: string): string | null {
  const value = event.detail?.[key];
  return typeof value === "string" && value.trim() ? value : null;
}

export function auditActor(event: AuditEvent): string {
  return (
    event.user_display_name ||
    event.user_email ||
    (event.action === "org.purged" ||
    event.action === "org.departure.item.expired"
      ? "System"
      : "Unknown user")
  );
}

export function auditSubject(event: AuditEvent) {
  const action = event.action;
  let type = "Item";
  if (action.startsWith("org.invite.")) type = "Recipient";
  else if (action === "org.private_content.permission_changed") type = "Member";
  else if (action.startsWith("org.private_content."))
    type = auditLabel(detailText(event, "kind") ?? "item");
  else if (
    action.startsWith("org.member.") ||
    action === "org.departure.member.departed"
  )
    type = "Member";
  else if (
    action.startsWith("org.api_key.") ||
    action === "org.router_models.updated"
  )
    type = "Provider";
  else if (action.startsWith("org.departure.item."))
    type = auditLabel(detailText(event, "kind") ?? "item");
  else if (action.startsWith("org.")) type = "Organization";
  else if (action.startsWith("document.")) type = "Document";
  else if (action.startsWith("chat.")) type = "Chat";
  else if (action.startsWith("workflow.")) type = "Workflow";
  else if (action.startsWith("tabular.") || action === "export.tabular")
    type = "Review";
  else if (action === "export.chats") type = "Chats";
  else if (action === "export.account") type = "Account";
  else if (action === "export.memory") type = "Memory";

  const title = event.title?.trim();
  // Some older member events stored a UUID in title. Keep identifiers in
  // technical details, not where a person's name or email is expected.
  const isId =
    title && /^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(title);
  const recordedName =
    title && !isId
      ? title
      : (detailText(event, "target_email") ??
        (type === "Provider" ? detailText(event, "provider") : null));
  const name = ["Member", "Recipient"].includes(type)
    ? event.affected_user_display_name?.trim() || recordedName
    : recordedName;
  const context = [
    detailText(event, "organization_name") ?? detailText(event, "org_name"),
    detailText(event, "project_name"),
  ].filter((value): value is string => Boolean(value));
  if (!context.length && event.surface)
    context.push(SURFACE_LABELS[event.surface] ?? auditLabel(event.surface));
  return {
    type,
    name: name ?? "-",
    context: [...new Set(context)].join(" · "),
  };
}

/** Retain the recorded email for identity tooltips and stable monogram colors. */
export function auditSubjectEmail(event: AuditEvent): string | null {
  if (!["Member", "Recipient"].includes(auditSubject(event).type)) return null;
  const email = (detailText(event, "target_email") ?? event.title)?.trim();
  return email && /^[^\s@]+@[^\s@]+$/.test(email) ? email : null;
}

export function auditTimestamp(value: string, exact = false): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return tr("audit.dateUnavailable");
  return date.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    ...(exact ? ({ second: "2-digit", timeZoneName: "short" } as const) : {}),
  });
}

export type AuditDetailField = { label: string; value: string };

export function auditDetailFields(event: AuditEvent): AuditDetailField[] {
  const fields: AuditDetailField[] = [];
  const detail = event.detail ?? {};
  const add = (label: string, value: unknown) => {
    if (typeof value === "string" && value.trim())
      fields.push({ label, value });
    else if (typeof value === "number" && Number.isFinite(value))
      fields.push({ label, value: String(value) });
    else if (typeof value === "boolean")
      fields.push({ label, value: value ? tr("audit.yes") : tr("audit.no") });
  };
  const role = detailText(event, "role");
  const previous = detailText(event, "previous_role");
  if (event.action === "org.member.role_changed") {
    if (previous && role)
      add(
        event.status === "completed" ? tr("history.auditPresentation.role") : tr("history.auditPresentation.requestedRoleChange"),
        `${valueLabel(auditLabel(previous))} → ${valueLabel(auditLabel(role))}`,
      );
    else if (role)
      add(tr("history.auditPresentation.role"), valueLabel(auditLabel(role)));
    else if (previous)
      add(
        tr("history.auditPresentation.previousRole"),
        valueLabel(auditLabel(previous)),
      );
  } else if (event.action.startsWith("org.invite.") && role)
    add(tr("history.auditPresentation.invitedRole"), valueLabel(auditLabel(role)));
  else if (previous)
    add(
      tr("history.auditPresentation.previousRole"),
      valueLabel(auditLabel(previous)),
    );
  if (
    event.action.startsWith("org.departure.") ||
    event.action.startsWith("org.member.")
  ) {
    add(tr("history.auditPresentation.itemsTransferred"), detail.transferred);
    add(tr("history.auditPresentation.itemsArchived"), detail.archived);
  }
  if (event.action === "org.router_models.updated")
    add(tr("history.auditPresentation.modelsAvailable"), detail.model_count);
  if (
    event.action.startsWith("org.api_key.") ||
    event.action === "org.private_content.permission_changed"
  )
    add(tr("history.auditPresentation.enabled"), detail.enabled);
  if (event.action === "org.private_content.opened") add(tr("history.auditPresentation.access"), tr("history.auditPresentation.readOnly"));
  const purgeAfter = detailText(event, "purge_after");
  if (purgeAfter && !Number.isNaN(new Date(purgeAfter).getTime()))
    add(tr("history.auditPresentation.scheduledDeletion"), auditTimestamp(purgeAfter, true));
  if (event.action.startsWith("export.")) {
    add(tr("history.auditPresentation.format"), detail.format);
    add(tr("history.auditPresentation.documentsExported"), detail.document_count);
    add(tr("history.auditPresentation.chatsExported"), detail.chat_count);
  }
  return fields;
}

export function auditSummary(event: AuditEvent, personal: boolean): string {
  const actor = valueLabel(auditActor(event));
  const subject = auditSubject(event);
  const action = auditAction(event);
  if (event.status !== "completed")
    return event.status === "failed"
      ? tr("audit.summary.failed", { action })
      : event.status === "cancelled"
        ? tr("audit.summary.cancelled", { action })
        : tr("audit.summary.otherStatus", { action, status: event.status });
  const name =
    subject.name === "-"
      ? tr("audit.summary.unnamed", {
          type: valueLabel(subject.type).toLowerCase(),
        })
      : subject.name;
  if (event.action === "org.member.role_changed")
    return personal
      ? tr("audit.summary.roleChangedYou", { name })
      : tr("history.auditPresentation.changedOrganizationRole", { actor, name });
  if (event.action === "org.invite.created")
    return personal
      ? tr("audit.summary.invitedYou", { name })
      : tr("audit.summary.invited", { actor, name });
  if (event.action === "org.invite.resent")
    return personal
      ? tr("audit.summary.resentYou", { name })
      : tr("audit.summary.resent", { actor, name });
  if (event.action === "document.uploaded")
    return personal
      ? tr("audit.summary.uploadedYou", { name })
      : tr("history.auditPresentation.uploaded", { actor, name });
  if (event.action === "document.edited")
    return personal
      ? tr("audit.summary.editedYou", { name })
      : tr("history.auditPresentation.edited", { actor, name });
  if (event.action === "document.generated")
    return personal
      ? tr("audit.summary.generatedYou", { name })
      : tr("history.auditPresentation.generated", { actor, name });
  return personal
    ? tr("audit.summary.byYou", { action })
    : tr("audit.summary.byActor", { action, actor });
}

export function auditDestination(
  event: AuditEvent,
): { href: string; label: string } | null {
  if (event.review_id)
    return {
      href: `/tabular-reviews/${encodeURIComponent(event.review_id)}`,
      label: tr("history.auditPresentation.openReview"),
    };
  if (event.chat_id && event.surface !== "word")
    return {
      href: event.project_id
        ? `/projects/${encodeURIComponent(event.project_id)}/assistant/chat/${encodeURIComponent(event.chat_id)}`
        : `/assistant/chat/${encodeURIComponent(event.chat_id)}`,
      label: tr("history.auditPresentation.openChat"),
    };
  if (event.project_id)
    return {
      href: `/projects/${encodeURIComponent(event.project_id)}`,
      label: tr("history.auditPresentation.openProject"),
    };
  const access = auditPrivateAccess(event);
  if (access && ["project", "chat", "tabular_review"].includes(access.kind)) {
    const target = {
      project: { path: "/projects/", label: tr("history.auditPresentation.openProject") },
      chat: { path: "/assistant/chat/", label: tr("history.auditPresentation.openChat") },
      tabular_review: { path: "/tabular-reviews/", label: tr("history.auditPresentation.openReview") },
    }[access.kind as "project" | "chat" | "tabular_review"];
    return {
      href: `${target.path}${encodeURIComponent(access.item_id)}`,
      label: target.label,
    };
  }
  return null;
}
