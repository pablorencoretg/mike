"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingInvitations } from "@/app/components/auth/OnboardingInvitations";
import { OnboardingShell } from "@/app/components/auth/OnboardingShell";
import { WarningPopup } from "@/app/components/popups/WarningPopup";
import { FullScreenLoader } from "@/app/components/shared/FullScreenLoader";
import { useAuth } from "@/app/contexts/AuthContext";
import { useUserProfile } from "@/app/contexts/UserProfileContext";
import { PillButtonUI } from "@/shared/ui/PillButtonUI";
import { tr } from "@/shared/i18n/runtime";

export default function OnboardingInvitationsPage() {
    const router = useRouter();
    const { user, authLoading } = useAuth();
    const { profile, loading } = useUserProfile();

    useEffect(() => {
        if (!authLoading && !user) router.replace("/login");
    }, [authLoading, router, user]);

    if (authLoading || loading || !user || !profile) {
        return <FullScreenLoader />;
    }

    return <InvitationStep key={user.id} userId={user.id} />;
}

function InvitationStep({ userId }: { userId: string }) {
    const router = useRouter();
    const { completeOnboarding } = useUserProfile();
    const [invitationsBusy, setInvitationsBusy] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(false);

    async function finish() {
        if (invitationsBusy || submitting) return;
        setSubmitting(true);
        setError(false);
        const saved = await completeOnboarding();
        if (saved) {
            router.replace("/assistant");
        } else {
            setError(true);
            setSubmitting(false);
        }
    }

    return (
        <OnboardingShell
            step="Step 3 of 3"
            title={tr("app.onboarding.invitations.page.organizationInvitations")}
        >
            <OnboardingInvitations
                userId={userId}
                disabled={submitting}
                onBusyChange={setInvitationsBusy}
            />
            <WarningPopup
                open={error}
                onClose={() => setError(false)}
                title={tr("app.onboarding.invitations.page.unableFinishSetup")}
                message={tr("app.onboarding.invitations.page.pleaseTryAgain")}
            />
            <div className="flex items-center justify-between gap-3 pt-6">
                <PillButtonUI
                    type="button"
                    tone="white"
                    size="normal"
                    disabled={invitationsBusy || submitting}
                    onClick={() => router.push("/onboarding/practice")}
                >
                    {tr("app.onboarding.invitations.page.back")}
                </PillButtonUI>
                <PillButtonUI
                    type="button"
                    tone="black"
                    size="normal"
                    disabled={invitationsBusy || submitting}
                    onClick={() => void finish()}
                >
                    {submitting ? tr("app.onboarding.invitations.page.finishing") : tr("app.onboarding.invitations.page.finish")}
                </PillButtonUI>
            </div>
        </OnboardingShell>
    );
}
