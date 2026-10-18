"use client";

import { useEffect, useState } from "react";
import { Loader2, RotateCw, X } from "lucide-react";
import { AddUserInput } from "@/app/components/shared/AddUserInput";
import { Modal } from "@/app/components/modals/Modal";
import { ModalSelect } from "@/app/components/modals/ModalSelect";
import { WarningPopup } from "@/app/components/popups/WarningPopup";
import { FieldLabel, FormTextInput } from "@/app/components/ui/form-field";
import {
  cancelOrgInvitation,
  createOrg,
  createOrgInvitation,
  resendOrgInvitation,
  type Org,
  type OrgInvitation,
} from "@/app/lib/mikeApi";
import {
  INVITABLE_ORG_ROLES,
  ORG_ROLE_DESCRIPTIONS,
  ORG_ROLE_LABELS,
  canManageOrgRole,
  type InvitableOrgRole,
} from "@/app/lib/permissions";
import { userFacingApiError } from "@/app/lib/userFacingError";
import { tr } from "@/shared/i18n/runtime";

function friendlyError(error: unknown, fallback: string) {
  return userFacingApiError(error, fallback);
}

const OWNER_ONLY_INVITATION = tr("messages.ownerOnlyInvitation");

/**
 * A refresh runs *after* its mutation has already succeeded, so a failing
 * refresh must never be reported as a failed mutation. Callers await this
 * outside their mutation's try block.
 *
 * Quiet is not the same as invisible, though: it returns whether the refresh
 * worked, because the list on screen is now a claim about the server that the
 * page cannot back up. "Invitation sent" beside an unchanged list reads as
 * "…and nothing happened", which is precisely wrong.
 */
async function refreshQuietly(
  onChanged: () => Promise<void> | void,
): Promise<boolean> {
  try {
    await onChanged();
    return true;
  } catch (error) {
    console.error("Failed to refresh organization data", error);
    return false;
  }
}

/** Appended to a success notice whose follow-up refresh did not land. */
const STALE_LIST_NOTICE = tr("messages.staleListNotice");

export function CreateOrganizationModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (org: Org) => void;
}) {
  const [name, setName] = useState("");
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [createdOrg, setCreatedOrg] = useState<Org | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setMemberEmails([]);
    setCreatedOrg(null);
    setError(null);
  }, [open]);

  const trimmedName = name.trim();
  async function submit() {
    if (creating) return;
    if (createdOrg) {
      onCreated(createdOrg);
      return;
    }
    if (!trimmedName) return;
    setCreating(true);
    setError(null);
    try {
      const org = await createOrg(trimmedName);
      if (memberEmails.length === 0) {
        onCreated(org);
        return;
      }
      const results = await Promise.allSettled(
        memberEmails.map((email) =>
          createOrgInvitation(org.id, email, "member"),
        ),
      );
      if (results.some((result) => result.status === "rejected")) {
        setCreatedOrg(org);
        setError(
          tr("organizations.organizationModals.organizationCreatedButSomeInvitations"),
        );
        return;
      }
      onCreated(org);
    } catch (err) {
      setError(friendlyError(err, tr("organizations.organizationModals.couldNotCreateOrganization")));
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <Modal
        open={open}
        // A create in flight owns the organization's fate: dismissing the
        // modal (Escape, backdrop, close button) mid-request would strand the
        // result with nowhere to report it.
        onClose={() => {
          if (creating) return;
          onClose();
        }}
        breadcrumbs={[tr("organizations.organizationModals.organizations"), tr("organizations.organizationModals.newOrganization")]}
        primaryAction={{
          label: createdOrg
            ? tr("organizations.organizationModals.openOrganization")
            : creating
              ? tr("organizations.organizationModals.creating")
              : tr("organizations.organizationModals.create"),
          icon: creating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : undefined,
          onClick: () => void submit(),
          disabled: (!trimmedName && !createdOrg) || creating,
        }}
      >
        <div className="space-y-5 py-1">
          <div>
            <FieldLabel htmlFor="new-organization-name">
              {tr("organizations.organizationModals.organizationName")}
            </FieldLabel>
            <FormTextInput
              id="new-organization-name"
              autoFocus
              value={name}
              placeholder={tr("organizations.organizationModals.eGEliteLawLlp")}
              disabled={creating || createdOrg !== null}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            <p className="mt-2 text-xs text-gray-400">
              {tr("organizations.organizationModals.willBecomeFirstAdministrator")}
            </p>
          </div>

          <div>
            <FieldLabel as="p">{tr("organizations.organizationModals.inviteMembers")}</FieldLabel>
            <AddUserInput
              requireExistingUser={false}
              busy={creating || createdOrg !== null}
              placeholder={tr("organizations.organizationModals.addMemberByEmail")}
              submitLabel={tr("organizations.organizationModals.addMember")}
              validateEmail={(email) =>
                memberEmails.includes(email)
                  ? tr("organizations.organizationModals.emailHasAlreadyBeenAdded")
                  : null
              }
              onAdd={(user) => {
                setMemberEmails((current) => [...current, user.email]);
                setError(null);
                return true;
              }}
            />
            {memberEmails.length > 0 ? (
              <div className="mt-2 space-y-1">
                {memberEmails.map((email) => (
                  <div
                    key={email}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-gray-600 hover:bg-app-surface-hover"
                  >
                    <span className="min-w-0 flex-1 truncate">{email}</span>
                    <button
                      type="button"
                      aria-label={tr("organizations.organizationModals.remove", { email })}
                      disabled={creating || createdOrg !== null}
                      onClick={() =>
                        setMemberEmails((current) =>
                          current.filter((value) => value !== email),
                        )
                      }
                      className="rounded-full p-1 text-gray-400 hover:bg-app-surface-active hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-40"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-gray-400">
              {tr("organizations.organizationModals.membersReceiveInvitationCanAlso")}
            </p>
          </div>
        </div>
      </Modal>
      <WarningPopup
        open={open && error !== null}
        title={
          createdOrg
            ? tr("organizations.organizationModals.someInvitationsWereNotSent")
            : tr("organizations.organizationModals.organizationNotCreated")
        }
        message={error}
        onClose={() => setError(null)}
      />
    </>
  );
}

export function InviteOrganizationMemberModal({
  open,
  org,
  invitations,
  onClose,
  onChanged,
}: {
  open: boolean;
  org: Org;
  invitations: OrgInvitation[];
  onClose: () => void;
  onChanged: () => Promise<void> | void;
}) {
  const [role, setRole] = useState<InvitableOrgRole>("member");
  // Inviting somebody as an admin is appointing one, which only an owner may
  // do, so an admin is offered Member alone and the picker has nothing to ask.
  const invitableRoles = INVITABLE_ORG_ROLES.filter((candidate) =>
    canManageOrgRole(org.role, candidate),
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const pending = invitations.filter(
    (invitation) =>
      invitation.status === "pending" || invitation.status === "expired",
  );

  useEffect(() => {
    if (!open) return;
    setRole("member");
    setNotice(null);
    setError(null);
  }, [open]);

  async function invite(email: string) {
    setError(null);
    setNotice(null);
    try {
      await createOrgInvitation(org.id, email, role);
    } catch (err) {
      setError(friendlyError(err, tr("organizations.organizationModals.couldNotSendInvitation")));
      return false;
    }
    setNotice(tr("organizations.organizationModals.invitationSent", { email }));
    // The invitation really was sent, so the notice stands — but if the list
    // behind this modal could not be re-read, say that rather than let the
    // unchanged list quietly contradict the notice.
    if (!(await refreshQuietly(onChanged)))
      setNotice(tr("organizations.organizationModals.invitationSent2", { email, STALE_LIST_NOTICE }));
    return true;
  }

  async function runInvitationAction(
    invitation: OrgInvitation,
    action: "resend" | "cancel",
  ) {
    setBusyId(invitation.id);
    setError(null);
    setNotice(null);
    let changed = false;
    let successNotice: string | null = null;
    try {
      if (action === "resend") {
        await resendOrgInvitation(org.id, invitation.id);
        successNotice = `Invitation resent to ${invitation.email}.`;
      } else {
        await cancelOrgInvitation(org.id, invitation.id);
        successNotice = `Invitation to ${invitation.email} cancelled.`;
      }
      setNotice(successNotice);
      changed = true;
    } catch (err) {
      setError(friendlyError(err, tr("organizations.organizationModals.couldNotInvitation", { action })));
    } finally {
      setBusyId(null);
    }
    if (changed && !(await refreshQuietly(onChanged)) && successNotice)
      setNotice(`${successNotice} ${STALE_LIST_NOTICE}`);
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        breadcrumbs={[tr("organizations.organizationModals.organizations"), org.name, tr("organizations.organizationModals.addMember")]}
        size="md"
        footerStatus={
          notice ? (
            <span className="text-sm text-gray-400">{notice}</span>
          ) : null
        }
        cancelAction={false}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-5 py-1">
          <div>
            {invitableRoles.length > 1 ? (
              <>
                <FieldLabel htmlFor="organization-invite-role">{tr("organizations.organizationModals.role")}</FieldLabel>
                <ModalSelect
                  id="organization-invite-role"
                  value={role}
                  options={invitableRoles.map((candidate) => ({
                    value: candidate,
                    label: ORG_ROLE_LABELS[candidate],
                  }))}
                  onChange={(value) => setRole(value as InvitableOrgRole)}
                />
              </>
            ) : (
              <>
                <FieldLabel as="p">{tr("organizations.organizationModals.role")}</FieldLabel>
                <p className="text-sm text-gray-700">
                  {ORG_ROLE_LABELS[role]}
                </p>
              </>
            )}
            <p className="mt-2 text-xs text-gray-400">
              {ORG_ROLE_DESCRIPTIONS[role]}
              {invitableRoles.length > 1
                ? null
                : tr("organizations.organizationModals.onlyOrganizationOwnerCanInvite")}
            </p>
          </div>

          <div>
            <FieldLabel as="p">{tr("organizations.organizationModals.emailAddress")}</FieldLabel>
            <AddUserInput
              autoFocus
              requireExistingUser={false}
              placeholder={tr("organizations.organizationModals.inviteByEmail")}
              submitLabel={tr("organizations.organizationModals.sendInvitation")}
              onAdd={(user) => invite(user.email)}
            />
          </div>

          {pending.length > 0 ? (
            <div className="min-h-0 border-t border-white/60 pt-4">
              <p className="mb-2 text-xs font-medium text-gray-600">
                {tr("organizations.organizationModals.pendingInvitations")}
              </p>
              <div className="max-h-48 space-y-1 overflow-y-auto">
                {pending.map((invitation) => {
                  // An admin invitation is an owner's appointment in
                  // progress, so an admin can see it but not act on it.
                  const canManage = canManageOrgRole(
                    org.role,
                    invitation.role,
                  );
                  return (
                    <div
                      key={invitation.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-app-surface-hover"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-gray-700">
                          {invitation.email}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {ORG_ROLE_LABELS[invitation.role]} ·{" "}
                          {invitation.status === "expired"
                            ? tr("organizations.organizationModals.expired")
                            : tr("organizations.organizationModals.pending")}
                        </p>
                      </div>
                      <button
                        type="button"
                        aria-label={tr("organizations.organizationModals.resendInvitation", { email: invitation.email })}
                        title={canManage ? undefined : OWNER_ONLY_INVITATION}
                        disabled={!canManage || busyId === invitation.id}
                        onClick={() =>
                          void runInvitationAction(invitation, "resend")
                        }
                        className="rounded-full p-1.5 text-gray-400 hover:bg-app-surface-active hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-40"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={tr("organizations.organizationModals.cancelInvitation", { email: invitation.email })}
                        title={canManage ? undefined : OWNER_ONLY_INVITATION}
                        disabled={!canManage || busyId === invitation.id}
                        onClick={() =>
                          void runInvitationAction(invitation, "cancel")
                        }
                        className="rounded-full p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:opacity-40"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </Modal>
      <WarningPopup
        open={open && error !== null}
        title={tr("organizations.organizationModals.invitationActionFailed")}
        message={error}
        onClose={() => setError(null)}
      />
    </>
  );
}
