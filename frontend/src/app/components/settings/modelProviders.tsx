import Image from "next/image";
import { Plug, type LucideIcon } from "lucide-react";
import type { ApiKeyProvider } from "@/app/lib/mikeApi";
import { tr } from "@/shared/i18n/runtime";

// The model providers a key can be saved for, in the order they are listed.
// Shared by a person's Bring Your Own Keys page and an organization's Model
// Providers tab, so the two always offer the same providers under the same
// names.

export type ModelApiKeyField = {
    provider: ApiKeyProvider;
    name: string;
    /** A vendored provider logo, or a Lucide icon where there is no brand. */
    logo?: string;
    icon?: LucideIcon;
    label: string;
    keyLabel?: string;
};

export const MODEL_API_KEY_FIELDS: readonly ModelApiKeyField[] = [
    {
        provider: "claude",
        name: "Anthropic (Claude)",
        logo: "anthropic",
        get label() {
        return tr("settings.modelProviders.anthropicClaudeApiKey");
    },
    },
    {
        provider: "gemini",
        name: "Google (Gemini)",
        logo: "gemini-color",
        get label() {
        return tr("settings.modelProviders.googleGeminiApiKey");
    },
    },
    {
        provider: "openai",
        name: "OpenAI",
        logo: "openai",
        get label() {
        return tr("settings.modelProviders.openaiApiKey");
    },
    },
    {
        provider: "mistral",
        name: "Mistral AI",
        logo: "mistral-color",
        get label() {
        return tr("settings.modelProviders.mistralAiApiKey");
    },
    },
    {
        provider: "xai",
        name: "xAI",
        logo: "xai",
        get label() {
        return tr("settings.modelProviders.xaiApiKey");
    },
    },
    {
        provider: "bedrock",
        name: "Amazon Bedrock",
        logo: "bedrock-color",
        get label() {
        return tr("settings.modelProviders.amazonBedrockApiKey");
    },
    },
    {
        provider: "azure",
        name: "Azure OpenAI",
        logo: "azure-color",
        get label() {
        return tr("settings.modelProviders.azureOpenaiApiKey");
    },
    },
    {
        provider: "azure-foundry",
        name: "Azure AI Foundry",
        logo: "azureai-color",
        get label() {
        return tr("settings.modelProviders.azureAiFoundryApiKey");
    },
    },
    {
        provider: "vertex",
        name: "Google Vertex AI",
        logo: "vertexai-color",
        get label() {
        return tr("settings.modelProviders.googleVertexAiServiceAccount");
    },
        get keyLabel() {
        return tr("settings.modelProviders.serviceAccountKeyJson");
    },
    },
    {
        provider: "openrouter",
        name: "OpenRouter",
        logo: "openrouter-color",
        get label() {
        return tr("settings.modelProviders.openrouterApiKey");
    },
    },
    {
        provider: "vercel",
        name: "Vercel AI Gateway",
        logo: "vercel",
        get label() {
        return tr("settings.modelProviders.vercelAiGatewayApiKey");
    },
    },
    {
        provider: "opencode-go",
        name: "OpenCode Go",
        logo: "opencode",
        get label() {
        return tr("settings.modelProviders.opencodeGoApiKey");
    },
    },
    {
        provider: "custom",
        name: "OpenAI-compatible endpoint",
        icon: Plug,
        get label() {
        return tr("settings.modelProviders.openaiCompatibleEndpointApiKey");
    },
    },
];

/** A provider's logo, or a pulsing stand-in while its state is loading. */
export function ModelProviderIcon({
    field,
    loading = false,
}: {
    field: ModelApiKeyField;
    loading?: boolean;
}) {
    if (loading)
        return <span className="h-7 w-7 animate-pulse rounded-lg bg-gray-200" />;
    const Icon = field.icon;
    if (Icon)
        return <Icon aria-hidden="true" className="h-6 w-6 text-gray-500" />;
    return (
        <Image
            src={`/icons/providers/${field.logo}.svg`}
            alt=""
            width={28}
            height={28}
            className={field.logo?.endsWith("-color") ? "" : "dark:invert"}
        />
    );
}
