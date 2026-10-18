import type { ResourceAccessScope } from "./types";
import { tr, trn } from "@/shared/i18n/runtime";

interface AccessScopeLabelProps {
  scope?: ResourceAccessScope;
  organizationName?: string | null;
  directGrantCount?: number;
}

// The Access column says one of three things, and the first word answers the
// question people scan it for: is this open to everyone, or not?
//
//   Public            every member of its organization can open it
//   Private           its creator only (and, in an organization, its owners)
//   Private (Shared)  not public, but shared with at least one other person
const ACCESS_SCOPE_LABELS: Record<ResourceAccessScope, string> = {
  organization: tr("shared.accessScopeLabel.public"),
  private: tr("shared.accessScopeLabel.private"),
  shared: tr("shared.accessScopeLabel.privateShared"),
};

export function AccessScopeLabel({
  scope = "private",
  organizationName,
  directGrantCount,
}: AccessScopeLabelProps) {
  const hasDirectGrantCount =
    scope === "shared" &&
    typeof directGrantCount === "number" &&
    Number.isInteger(directGrantCount) &&
    directGrantCount >= 0;
  const accessUserCount = hasDirectGrantCount ? directGrantCount + 1 : null;
  // The detail the label leaves out, for anyone who hovers: who "everyone"
  // is, or how many people a private item is shared with.
  const description =
    scope === "organization"
      ? organizationName
        ? tr("shared.accessScopeLabel.sharedEveryone", { organizationName })
        : tr("shared.accessScopeLabel.sharedEveryoneOrganisation")
      : hasDirectGrantCount
        ? trn(accessUserCount ?? 0, "sh.sharedWithUsersOne", "sh.sharedWithUsersOther")
        : scope === "shared"
          ? tr("shared.accessScopeLabel.sharedIndividuals")
          : tr("shared.accessScopeLabel.private");

  return (
    <span
      aria-label={description}
      className="inline-flex min-w-0 items-center text-xs text-gray-600"
      title={description}
    >
      <span className="truncate">{ACCESS_SCOPE_LABELS[scope]}</span>
    </span>
  );
}
