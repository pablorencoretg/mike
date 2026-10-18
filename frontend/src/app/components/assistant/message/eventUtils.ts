import type { AssistantEvent } from "../../shared/types";
import { tr } from "@/shared/i18n/runtime";

export function eventErrorMessage(event: AssistantEvent): string | null {
    if (event.type === "error") {
        return event.safe_to_display
            ? event.message
            : tr("assistant.message.eventUtils.sorrySomethingWentWrong");
    }
    if ("error" in event && typeof event.error === "string" && event.error) {
        return tr("assistant.message.eventUtils.sorrySomethingWentWrong");
    }
    return null;
}

/**
 * Label for a connector tool: the connector's own title when it sent one,
 * otherwise its identifier made readable ("get_workspace_teams" becomes
 * "Get workspace teams").
 */
export function connectorToolLabel(
    toolName: string,
    toolTitle?: string | null,
): string {
    const title = toolTitle?.trim();
    if (title) return title;
    const words = toolName.replace(/[_-]+/g, " ").trim();
    return words ? words.charAt(0).toUpperCase() + words.slice(1) : toolName;
}

export function toolCallLabel(name: string): string {
    if (name === "ask_inputs") return tr("assistant.message.eventUtils.askingInput");
    if (name === "generate_docx") return tr("assistant.message.eventUtils.creatingDocument");
    if (name === "generate_excel") return tr("assistant.message.eventUtils.creatingSpreadsheet");
    if (name === "generate_ppt") return tr("assistant.message.eventUtils.creatingPresentation");
    if (name === "edit_document") return tr("assistant.message.eventUtils.editingDocument");
    if (name === "read_document") return tr("assistant.message.eventUtils.readingDocument");
    if (name === "fetch_documents") return tr("assistant.message.eventUtils.readingDocuments");
    if (name === "find_in_document") return tr("assistant.message.eventUtils.searchingDocument");
    if (name === "find_documents") return tr("assistant.message.eventUtils.searchingDocuments");
    if (name === "replicate_document") return tr("assistant.message.eventUtils.copyingDocument");
    if (name === "read_workflow") return tr("assistant.message.eventUtils.readingWorkflow");
    if (name === "list_workflows") return tr("assistant.message.eventUtils.loadingWorkflows");
    if (name === "list_documents") return tr("assistant.message.eventUtils.loadingDocuments");
    if (name === "courtlistener_search_case_law")
        return tr("assistant.message.eventUtils.searchingCaseLaw");
    if (name === "courtlistener_get_cases") return tr("assistant.message.eventUtils.fetchingCases");
    if (name === "courtlistener_find_in_case") return tr("assistant.message.eventUtils.searchingCase");
    if (name === "courtlistener_read_case") return tr("assistant.message.eventUtils.readingCase");
    if (name === "courtlistener_verify_citations")
        return tr("assistant.message.eventUtils.verifyingCitations");
    if (name.startsWith("mcp_")) return tr("assistant.message.eventUtils.usingConnector");
    return name ? tr("assistant.message.eventUtils.running", { name }) : tr("assistant.message.eventUtils.working");
}
