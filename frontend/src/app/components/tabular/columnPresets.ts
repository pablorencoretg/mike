import type { ColumnFormat } from "../shared/types";
import { tr } from "@/shared/i18n/runtime";

export interface ColumnPreset {
    name: string;
    matches: RegExp;
    prompt: string;
    format: ColumnFormat;
    tags?: string[];
}

export const PROMPT_PRESETS: ColumnPreset[] = [
    {
        name: "Parties",
        matches: /\bpart(y|ies)\b/i,
        format: "bulleted_list",
        get prompt() {
        return tr("tabular.columnPresets.listAllPartiesAgreementEach");
    },
    },
    {
        name: "Governing Law",
        matches: /\bgoverning law\b|\bjurisdiction\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.stateOnlyGoverningLawAgreement");
    },
    },
    {
        name: "Effective Date",
        matches: /\beffective date\b/i,
        format: "date",
        get prompt() {
        return tr("tabular.columnPresets.stateOnlyEffectiveDateAgreement");
    },
    },
    {
        name: "Term",
        matches: /\bterm\b|\bduration\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.stateOnlyDurationTermAgreement");
    },
    },
    {
        name: "Termination",
        matches: /\bterminat(e|ion|ing)\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.extractTerminationProvisionsStateWho");
    },
    },
    {
        name: "Change of Control",
        matches: /\bchange of control\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.identifyAnyChangeControlProvisions");
    },
    },
    {
        name: "Confidentiality",
        matches: /\bconfidential(ity)?\b|\bnon-?disclosure\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.summarizeConfidentialityObligationsScope");
    },
    },
    {
        name: "Assignment",
        matches: /\bassign(ment|ability)?\b/i,
        format: "yes_no",
        get prompt() {
        return tr("tabular.columnPresets.assignmentAgreementPermittedWithoutOther");
    },
    },
    {
        name: "Payment & Fees",
        matches: /\bpayment\b|\bfees?\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.stateKeyPaymentObligationsConcisely");
    },
    },
    {
        name: "Amendment",
        matches: /\bamendment\b|\bvariation\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.summarizeAmendmentProvisionsHowAmendment");
    },
    },
    {
        name: "Indemnity",
        matches: /\bindemni(ty|ties|fication)\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.summarizeIndemnityProvisionsWhoIndemnifi");
    },
    },
    {
        name: "Warranties",
        matches: /\bwarrant(y|ies|ing)\b|\brepresentations?\b/i,
        format: "text",
        get prompt() {
        return tr("tabular.columnPresets.identifyDescribeKeyRepresentationsWarran");
    },
    },
    {
        name: "Force Majeure",
        matches: /\bforce majeure\b/i,
        format: "yes_no",
        get prompt() {
        return tr("tabular.columnPresets.doesAgreementContainForceMajeure");
    },
    },
];

export function getPresetConfig(
    title: string,
): Pick<ColumnPreset, "prompt" | "format" | "tags"> | null {
    const trimmed = title.trim();
    if (!trimmed) return null;
    const preset = PROMPT_PRESETS.find(({ matches }) => matches.test(trimmed));
    if (!preset) return null;
    return { prompt: preset.prompt, format: preset.format, tags: preset.tags };
}
