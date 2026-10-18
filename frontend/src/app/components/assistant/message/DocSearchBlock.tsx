import { useState } from "react";
import type { DocumentSearchEvent } from "@mike/contracts";
import { EventBlock } from "./EventBlocks";
import { EventDisclosureButton } from "./EventDisclosure";
import { tr, trn } from "@/shared/i18n/runtime";

/** A document search uses the timeline's disclosure and reveals only its match count. */
export function DocSearchBlock({ event, isStreaming, showConnector }: {
    event: DocumentSearchEvent;
    isStreaming?: boolean;
    showConnector?: boolean;
}) {
    const [open, setOpen] = useState(false);
    const scope = new Map([
        ["project", tr("x.scopeProject")], ["library", tr("x.scopeLibrary")],
        ["templates", tr("x.scopeTemplates")], ["document", tr("x.scopeDocument")],
    ]).get(event.scope) ?? tr("x.scopeDocuments");
    const count = event.match_count ?? 0;

    return (
        <EventBlock showConnector={showConnector} isStreaming={isStreaming}
            dotColor={event.error ? "red" : count === 0 ? "gray" : "green"}>
            <EventDisclosureButton
                open={open}
                onToggle={() => setOpen(value => !value)}
                label={<span className="[overflow-wrap:anywhere]">
                    {isStreaming ? tr("assistant.message.docSearchBlock.searching") : event.error ? tr("assistant.message.docSearchBlock.searchFailed") : tr("assistant.message.docSearchBlock.searched")}{" "}{tr("assistant.message.docSearchBlock.text", { scope, query: event.query })}
                </span>}
                isStreaming={isStreaming}
            />
            {open && !isStreaming && (
                <div className="mt-2">
                    {event.error ?? trn(count, "x.matchOne", "x.matchOther")}
                </div>
            )}
        </EventBlock>
    );
}
