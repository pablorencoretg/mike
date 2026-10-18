"use client";

import { useRouter } from "next/navigation";
import { OrganizationSkeuoIcon } from "@/app/components/shared/AppSidebarSkeuoIcons";
import { EmptyState } from "@/app/components/ui/empty-state";
import { isOrgAdmin } from "@/app/lib/permissions";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import { OrganizationProviderKeys } from "./OrganizationProviderKeys";
import {
  organizationSettingsHref,
  useOrganizationSettings,
} from "./OrganizationSettingsShell";
import { tr } from "@/shared/i18n/runtime";

/**
 * The Bring Your Own Keys section of an organization's settings: its owners'
 * and admins' alone. The section is not offered to a member, and one who
 * follows a link to it is told why rather than shown controls that the
 * server would refuse.
 */
export function OrganizationProvidersSettings() {
  const router = useRouter();
  const { orgId, org } = useOrganizationSettings();

  if (org && !isOrgAdmin(org.role))
    return (
      <EmptyState
        icon={<OrganizationSkeuoIcon />}
        title={tr("organizations.organizationProvidersSettings.bringOwnKeys")}
        description={tr("organizations.organizationProvidersSettings.onlyOrganizationSOwnersAdmins")}
        action={
          <PillButtonUI
            tone="white"
            size="sm"
            onClick={() => router.push(organizationSettingsHref(orgId))}
          >
            {tr("organizations.organizationProvidersSettings.backGeneral")}
          </PillButtonUI>
        }
      />
    );

  // Mounted before the role is known, so its cards load alongside the
  // organization rather than after it. It reads the caller's rights itself.
  return (
    <OrganizationProviderKeys
      orgId={orgId}
      orgName={org?.name ?? tr("acc.organization")}
    />
  );
}
