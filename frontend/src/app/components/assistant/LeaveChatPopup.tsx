"use client";

import { useState } from "react";
import { ConfirmPopup } from "@/app/components/popups/ConfirmPopup";
import { WarningPopup } from "@/app/components/popups/WarningPopup";
import { useChatHistoryContext } from "@/app/contexts/ChatHistoryContext";
import { userFacingApiError } from "@/app/lib/userFacingError";
import { tr } from "@/shared/i18n/runtime";

export function LeaveChatPopup({
    chatId,
    onClose,
    onLeft,
}: {
    chatId: string;
    onClose: () => void;
    onLeft: () => void;
}) {
    const { leaveChat } = useChatHistoryContext();
    const [leaving, setLeaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function confirmLeave() {
        if (leaving) return;
        setLeaving(true);
        try {
            await leaveChat(chatId);
            onClose();
            onLeft();
        } catch (cause) {
            setError(userFacingApiError(
                cause,
                tr("assistant.leaveChatPopup.chatCouldNotLeftPlease"),
            ));
        } finally {
            setLeaving(false);
        }
    }

    return (
        <>
            <ConfirmPopup
                open={!error}
                title={tr("assistant.leaveChatPopup.leaveChat")}
                message={tr("assistant.leaveChatPopup.sharedAccessWillRemovedOwner")}
                confirmLabel={tr("assistant.leaveChatPopup.leave")}
                confirmStatus={leaving ? "loading" : "idle"}
                onConfirm={() => void confirmLeave()}
                onCancel={() => { if (!leaving) onClose(); }}
            />
            <WarningPopup
                open={!!error}
                title={tr("assistant.leaveChatPopup.chatNotLeft")}
                message={error}
                onClose={() => { setError(null); onClose(); }}
            />
        </>
    );
}
